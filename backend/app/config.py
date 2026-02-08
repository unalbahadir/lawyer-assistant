from pydantic_settings import BaseSettings
from typing import List
import os

class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:////app/avukat.db"
    GOOGLE_API_KEY: str = os.getenv("GOOGLE_API_KEY", "")
    UPLOAD_DIR: str = "./uploads"
    VECTOR_DB_PATH: str = "./vector_db"
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:5173", "http://localhost"]
    
    class Config:
        env_file = ".env"
        case_sensitive = False

settings = Settings()
