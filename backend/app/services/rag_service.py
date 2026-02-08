import os
import json
from typing import List, Dict, Optional
from pathlib import Path
import chromadb
from chromadb.config import Settings
import google.generativeai as genai
from sentence_transformers import SentenceTransformer
from app.config import settings
from app.models import Document, Case
from sqlalchemy.orm import Session
import PyPDF2
import docx

class RAGService:
    def __init__(self):
        # Initialize Gemini
        if settings.GOOGLE_API_KEY:
            genai.configure(api_key=settings.GOOGLE_API_KEY)
            # Use gemini-2.5-flash (fast and available)
            self.gemini_model = genai.GenerativeModel('gemini-2.5-flash')
        else:
            self.gemini_model = None
        
        # Initialize sentence transformer for embeddings
        self.embedding_model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')
        
        self.vector_db_path = Path(settings.VECTOR_DB_PATH)
        self.vector_db_path.mkdir(exist_ok=True)
        
        # Initialize ChromaDB
        self.chroma_client = chromadb.PersistentClient(
            path=str(self.vector_db_path),
            settings=Settings(anonymized_telemetry=False)
        )
    
    def get_collection_name(self, case_id: int) -> str:
        """Get collection name for a specific case"""
        return f"case_{case_id}"
    
    def extract_text_from_file(self, file_path: str) -> str:
        """Extract text from various file types"""
        file_ext = Path(file_path).suffix.lower()
        text = ""
        
        try:
            if file_ext == ".pdf":
                with open(file_path, "rb") as f:
                    pdf_reader = PyPDF2.PdfReader(f)
                    for page in pdf_reader.pages:
                        text += page.extract_text() + "\n"
            elif file_ext in [".docx", ".doc"]:
                doc = docx.Document(file_path)
                for para in doc.paragraphs:
                    text += para.text + "\n"
            elif file_ext == ".txt":
                with open(file_path, "r", encoding="utf-8") as f:
                    text = f.read()
        except Exception as e:
            print(f"Error extracting text from {file_path}: {e}")
        
        return text
    
    def chunk_text(self, text: str, chunk_size: int = 1000, overlap: int = 200) -> List[str]:
        """Split text into chunks with overlap"""
        chunks = []
        start = 0
        while start < len(text):
            end = start + chunk_size
            chunk = text[start:end]
            chunks.append(chunk)
            start = end - overlap
        return chunks
    
    def index_document(self, case_id: int, document_id: int, file_path: str, filename: str):
        """Index a document for a specific case"""
        # Extract text
        text = self.extract_text_from_file(file_path)
        if not text.strip():
            return
        
        # Get or create collection for this case
        collection_name = self.get_collection_name(case_id)
        try:
            collection = self.chroma_client.get_collection(name=collection_name)
        except:
            collection = self.chroma_client.create_collection(name=collection_name)
        
        # Chunk text
        chunks = self.chunk_text(text)
        
        # Create metadata
        ids = [f"doc_{document_id}_chunk_{i}" for i in range(len(chunks))]
        metadatas = [
            {
                "document_id": document_id,
                "filename": filename,
                "case_id": case_id,
                "chunk_index": i
            }
            for i in range(len(chunks))
        ]
        
        # Generate embeddings using sentence transformer
        embeddings = self.embedding_model.encode(chunks, show_progress_bar=False).tolist()
        
        # Add to collection
        collection.add(
            ids=ids,
            embeddings=embeddings,
            documents=chunks,
            metadatas=metadatas
        )
    
    def query(self, case_id: int, query: str, top_k: int = 5) -> Dict:
        """Query documents for a specific case"""
        if not self.gemini_model:
            raise ValueError("Google API key not configured")
        
        collection_name = self.get_collection_name(case_id)
        try:
            collection = self.chroma_client.get_collection(name=collection_name)
        except:
            # No documents indexed for this case
            return {
                "response": "Bu dava için henüz doküman yüklenmemiş veya indekslenmemiş. Lütfen önce doküman yükleyin.",
                "sources": [],
                "relevant_chunks": []
            }
        
        # Generate query embedding
        query_embedding = self.embedding_model.encode([query], show_progress_bar=False)[0].tolist()
        
        # Search
        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=top_k
        )
        
        # Get relevant chunks and sources
        relevant_chunks = results["documents"][0] if results["documents"] else []
        metadatas = results["metadatas"][0] if results["metadatas"] else []
        
        # Get unique source filenames
        sources = list(set([meta.get("filename", "Unknown") for meta in metadatas]))
        
        # Generate response using Gemini
        context = "\n\n".join(relevant_chunks)
        prompt = f"""Aşağıdaki yasal dokümanlardan sadece verilen bilgilere dayanarak soruyu yanıtla. 
Eğer sorunun cevabı dokümanlarda yoksa, "Bu bilgi yüklenen dokümanlarda bulunmamaktadır" de.

Dokümanlar:
{context}

Soru: {query}

Yanıt:"""
        
        system_prompt = "Sen bir yasal asistanısın. Sadece verilen dokümanlardaki bilgilere dayanarak yanıt ver."
        full_prompt = f"{system_prompt}\n\n{prompt}"
        
        generation_config = genai.types.GenerationConfig(
            temperature=0.3,
        )
        
        response = self.gemini_model.generate_content(
            full_prompt,
            generation_config=generation_config
        )
        
        return {
            "response": response.text,
            "sources": sources,
            "relevant_chunks": relevant_chunks
        }
    
    def generate_template(self, case_id: int, template_type: str, db: Session, context: Optional[str] = None) -> Dict:
        """Generate a template (dilekçe, sözleşme, tutanak) based on case documents"""
        if not self.gemini_model:
            raise ValueError("Google API key not configured")
        
        # Get case information
        case = db.query(Case).filter(Case.id == case_id).first()
        if not case:
            raise ValueError(f"Case {case_id} not found")
        
        # Get relevant context from documents
        case_context = ""
        if context:
            # Query documents for relevant information
            query_result = self.query(case_id, context, top_k=3)
            case_context = "\n\n".join(query_result["relevant_chunks"][:2])
        
        # Generate template based on type
        template_prompts = {
            "dilekce": f"""Aşağıdaki dava bilgilerine göre bir dilekçe taslağı hazırla:

Dava Bilgileri:
- Dava No: {case.case_number or 'Belirtilmemiş'}
- Müvekkil: {case.client_name or 'Belirtilmemiş'}
- Konu: {case.title}
- Açıklama: {case.description or ''}

İlgili Doküman Bilgileri:
{case_context}

Dilekçe taslağını Türk hukuk sistemine uygun, profesyonel bir dille hazırla.""",
            "sozlesme": f"""Aşağıdaki bilgilere göre bir sözleşme taslağı hazırla:

Dava/Müşteri Bilgileri:
- Müşteri: {case.client_name or 'Belirtilmemiş'}
- Konu: {case.title}
- Açıklama: {case.description or ''}

İlgili Doküman Bilgileri:
{case_context}

Sözleşme taslağını Türk hukuk sistemine uygun, detaylı ve profesyonel bir dille hazırla.""",
            "tutanak": f"""Aşağıdaki bilgilere göre bir tutanak taslağı hazırla:

Dava Bilgileri:
- Dava No: {case.case_number or 'Belirtilmemiş'}
- Müvekkil: {case.client_name or 'Belirtilmemiş'}
- Konu: {case.title}
- Açıklama: {case.description or ''}

İlgili Doküman Bilgileri:
{case_context}

Tutanak taslağını Türk hukuk sistemine uygun, detaylı ve profesyonel bir dille hazırla."""
        }
        
        prompt = template_prompts.get(template_type.lower(), template_prompts["dilekce"])
        
        full_prompt = f"Sen bir yasal doküman hazırlama uzmanısın. Türk hukuk sistemine uygun, profesyonel dokümanlar hazırlarsın.\n\n{prompt}"
        
        generation_config = genai.types.GenerationConfig(
            temperature=0.5,
        )
        
        response = self.gemini_model.generate_content(
            full_prompt,
            generation_config=generation_config
        )
        
        # Get sources from case documents
        documents = db.query(Document).filter(Document.case_id == case_id).all()
        sources = [doc.filename for doc in documents]
        
        return {
            "draft": response.text,
            "sources": sources
        }

# Singleton instance
rag_service = RAGService()
