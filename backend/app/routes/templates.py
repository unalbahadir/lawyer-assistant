from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Case
from app.schemas import TemplateRequest, TemplateResponse
from app.services.rag_service import rag_service

router = APIRouter()

@router.post("/", response_model=TemplateResponse)
def generate_template(request: TemplateRequest, db: Session = Depends(get_db)):
    # Check if case exists
    case = db.query(Case).filter(Case.id == request.case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    # Validate template type
    valid_types = ["dilekce", "sozlesme", "tutanak"]
    if request.template_type.lower() not in valid_types:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid template type. Must be one of: {', '.join(valid_types)}"
        )
    
    try:
        result = rag_service.generate_template(
            request.case_id,
            request.template_type,
            db,
            request.context
        )
        return TemplateResponse(
            draft=result["draft"],
            sources=result["sources"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating template: {str(e)}")
