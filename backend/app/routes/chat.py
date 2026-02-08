from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Case, ChatMessage
from app.schemas import ChatRequest, ChatResponse
from app.services.rag_service import rag_service
import json

router = APIRouter()

@router.post("/", response_model=ChatResponse)
def chat(request: ChatRequest, db: Session = Depends(get_db)):
    # Check if case exists
    case = db.query(Case).filter(Case.id == request.case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    # Query RAG service
    try:
        result = rag_service.query(request.case_id, request.message)
        
        # Save chat message
        chat_message = ChatMessage(
            case_id=request.case_id,
            message=request.message,
            response=result["response"],
            sources=json.dumps(result["sources"])
        )
        db.add(chat_message)
        db.commit()
        
        return ChatResponse(
            response=result["response"],
            sources=result["sources"]
        )
    except ValueError as e:
        # No documents indexed
        return ChatResponse(
            response=str(e),
            sources=[]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing chat: {str(e)}")

@router.get("/case/{case_id}")
def get_chat_history(case_id: int, db: Session = Depends(get_db)):
    messages = db.query(ChatMessage).filter(ChatMessage.case_id == case_id).order_by(ChatMessage.created_at).all()
    return [
        {
            "id": msg.id,
            "message": msg.message,
            "response": msg.response,
            "sources": json.loads(msg.sources) if msg.sources else [],
            "created_at": msg.created_at.isoformat()
        }
        for msg in messages
    ]
