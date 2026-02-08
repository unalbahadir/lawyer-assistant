from pydantic import BaseModel, field_validator
from typing import Optional, List, Union
from datetime import datetime

class CaseBase(BaseModel):
    title: str
    description: Optional[str] = None
    client_name: Optional[str] = None
    case_number: Optional[str] = None
    status: str = "active"

class CaseCreate(CaseBase):
    pass

class CaseResponse(CaseBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class DocumentBase(BaseModel):
    filename: str
    file_type: Optional[str] = None

class DocumentResponse(DocumentBase):
    id: int
    case_id: int
    file_path: str
    file_size: Optional[int] = None
    uploaded_at: datetime
    is_indexed: bool
    
    class Config:
        from_attributes = True

class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    case_id: Optional[int] = None
    due_date: Optional[Union[datetime, str]] = None
    
    @field_validator('due_date', mode='before')
    @classmethod
    def parse_due_date(cls, v):
        if v is None or v == '':
            return None
        if isinstance(v, str):
            # Try to parse as date string (YYYY-MM-DD) and convert to datetime
            try:
                # If it's just a date (YYYY-MM-DD), add time
                if len(v) == 10:  # Date format YYYY-MM-DD
                    return datetime.fromisoformat(f"{v}T00:00:00")
                # Otherwise try to parse as full datetime
                return datetime.fromisoformat(v.replace('Z', '+00:00'))
            except (ValueError, AttributeError):
                return None
        return v

class TaskCreate(TaskBase):
    pass

class TaskResponse(TaskBase):
    id: int
    completed: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class ChatRequest(BaseModel):
    case_id: int
    message: str

class ChatResponse(BaseModel):
    response: str
    sources: List[str]
    kvkk_warning: str = "Bu yanıt yalnızca yüklenen dokümanlara dayanmaktadır. Kişisel verilerin korunmasına ilişkin KVKK mevzuatına uygun hareket edilmesi gerekmektedir."

class TemplateRequest(BaseModel):
    case_id: int
    template_type: str  # dilekce, sozlesme, tutanak
    context: Optional[str] = None

class TemplateResponse(BaseModel):
    draft: str
    sources: List[str]
