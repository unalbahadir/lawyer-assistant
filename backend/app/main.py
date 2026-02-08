from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import List, Optional
import os
from datetime import datetime
from pathlib import Path

# Ensure database file exists BEFORE importing database module
from app.config import settings

db_path = settings.DATABASE_URL.replace("sqlite:///", "")
if db_path.startswith("/"):
    # Absolute path (sqlite:////path)
    pass
elif db_path.startswith("./"):
    # Relative path starting with ./
    db_path = os.path.join(os.getcwd(), db_path[2:])
else:
    # Relative path - make it absolute
    db_path = os.path.join(os.getcwd(), db_path)

db_path = os.path.normpath(db_path)
db_dir = os.path.dirname(db_path) if os.path.dirname(db_path) else os.getcwd()

# Create directory if needed
if db_dir and not os.path.exists(db_dir):
    try:
        os.makedirs(db_dir, exist_ok=True)
    except Exception as e:
        print(f"Warning: Could not create db directory: {e}")

# Create database file if it doesn't exist
if not os.path.exists(db_path):
    try:
        Path(db_path).touch()
        os.chmod(db_path, 0o666)
        print(f"Created database file: {db_path}")
    except Exception as e:
        print(f"Warning: Could not create database file {db_path}: {e}")

# Now import database module (engine will be created with existing file)
from app.database import SessionLocal, engine, Base
from app.models import Case, Document, Task, ChatMessage
from app.routes import cases, documents, chat, templates, tasks

# Create tables
try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"Warning: Could not create tables: {e}")

app = FastAPI(title="Avukat AI Assistant", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(cases.router, prefix="/api/cases", tags=["cases"])
app.include_router(documents.router, prefix="/api/documents", tags=["documents"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(templates.router, prefix="/api/templates", tags=["templates"])
app.include_router(tasks.router, prefix="/api/tasks", tags=["tasks"])

@app.get("/")
async def root():
    return {"message": "Avukat AI Assistant API", "version": "1.0.0"}

@app.get("/api/health")
async def health():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
