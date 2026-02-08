from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
import os
import shutil
from pathlib import Path
from app.database import get_db, SessionLocal
from app.models import Document, Case
from app.schemas import DocumentResponse
from app.config import settings
from app.services.rag_service import rag_service

router = APIRouter()

# Ensure upload directory exists
upload_dir = Path(settings.UPLOAD_DIR)
upload_dir.mkdir(exist_ok=True)

@router.post("/{case_id}", response_model=DocumentResponse)
async def upload_document(
    case_id: int,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    # Check if case exists
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    # Create case-specific directory
    case_dir = upload_dir / f"case_{case_id}"
    case_dir.mkdir(exist_ok=True)
    
    # Save file
    file_path = case_dir / file.filename
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Get file size
    file_size = file_path.stat().st_size
    
    # Create document record
    db_document = Document(
        case_id=case_id,
        filename=file.filename,
        file_path=str(file_path),
        file_type=file.content_type,
        file_size=file_size,
        is_indexed=False
    )
    db.add(db_document)
    db.commit()
    db.refresh(db_document)
    
    # Index document in background
    background_tasks.add_task(
        index_document_background,
        case_id,
        db_document.id,
        str(file_path),
        file.filename
    )
    
    return db_document

def index_document_background(case_id: int, document_id: int, file_path: str, filename: str):
    """Background task to index document"""
    try:
        rag_service.index_document(case_id, document_id, file_path, filename)
        # Update document status
        db = SessionLocal()
        try:
            doc = db.query(Document).filter(Document.id == document_id).first()
            if doc:
                doc.is_indexed = True
                db.commit()
        finally:
            db.close()
    except Exception as e:
        print(f"Error indexing document {document_id}: {e}")

@router.get("/case/{case_id}", response_model=List[DocumentResponse])
def list_documents(case_id: int, db: Session = Depends(get_db)):
    documents = db.query(Document).filter(Document.case_id == case_id).all()
    return documents

@router.get("/{document_id}", response_model=DocumentResponse)
def get_document(document_id: int, db: Session = Depends(get_db)):
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    return document

@router.delete("/{document_id}")
def delete_document(document_id: int, db: Session = Depends(get_db)):
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Delete file
    if os.path.exists(document.file_path):
        os.remove(document.file_path)
    
    db.delete(document)
    db.commit()
    return {"message": "Document deleted successfully"}
