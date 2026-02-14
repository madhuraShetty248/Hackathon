from pydantic_settings import BaseSettings
import os

class Settings(BaseSettings):
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./careops.db")
    SECRET_KEY: str = "careops-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    SENDGRID_API_KEY: str = ""
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_PHONE_NUMBER: str = ""
    FROM_EMAIL: str = "noreply@careops.app"
    FRONTEND_URL: str = "http://localhost:5173"
    UPLOADS_DIR: str = "uploads"
    
    class Config:
        env_file = ".env"

settings = Settings()
