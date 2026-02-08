from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import settings
import os
from pathlib import Path

# Ensure database directory exists for SQLite
if "sqlite" in settings.DATABASE_URL:
    db_path = settings.DATABASE_URL.replace("sqlite:///", "")
    # Handle relative paths - SQLite uses 3 slashes for absolute, 4 for relative
    if db_path.startswith("/"):
        # Absolute path (sqlite:////path)
        pass
    else:
        # Relative path - make it absolute
        db_path = os.path.join(os.getcwd(), db_path)
    
    # Normalize path
    db_path = os.path.normpath(db_path)
    db_dir = os.path.dirname(db_path) if os.path.dirname(db_path) else os.getcwd()
    
    # Create directory if needed
    if db_dir and not os.path.exists(db_dir):
        try:
            os.makedirs(db_dir, exist_ok=True)
        except Exception as e:
            print(f"Warning: Could not create db directory: {e}")
    
    # Create empty database file if it doesn't exist - MUST happen before engine creation
    if db_path:
        if not os.path.exists(db_path):
            try:
                Path(db_path).touch()
                os.chmod(db_path, 0o666)
                print(f"Created database file: {db_path}")
            except Exception as e:
                print(f"Error: Could not create database file {db_path}: {e}")
                raise
        else:
            # Ensure file is writable
            try:
                os.chmod(db_path, 0o666)
            except Exception:
                pass
    
    # Update DATABASE_URL to use absolute path
    settings.DATABASE_URL = f"sqlite:///{db_path}"

engine = create_engine(
    settings.DATABASE_URL, connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
