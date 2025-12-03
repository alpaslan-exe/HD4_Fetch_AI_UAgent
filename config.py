import os
from typing import Optional

class Config:
    """Configuration class for the AI Agent Backend"""
    
    # Database configuration
    DB_NAME: str = os.getenv("DB_NAME", "ai_agents_db")
    DB_USER: str = os.getenv("DB_USER", "chronosadmin")
    DB_PASSWORD: str = os.getenv("DB_PASSWORD", "Chronos@69420")
    DB_HOST: str = os.getenv("DB_HOST", "localhost")
    DB_PORT: str = os.getenv("DB_PORT", "5432")
    
    # JWT Configuration
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-this")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
    
    # UAgent Configuration
    BACKEND_AGENT_SEED: str = os.getenv("BACKEND_AGENT_SEED", "backend agent secret phrase")
    
    # Application settings
    APP_NAME: str = os.getenv("APP_NAME", "AI Agent Backend")
    DEBUG: bool = os.getenv("DEBUG", "False").lower() == "true"
    API_V1_STR: str = "/api/v1"
    
    # CORS settings
    BACKEND_CORS_ORIGINS: list = []
    
    # Database URL construction
    @property
    def DATABASE_URL(self) -> str:
        return f"postgresql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"

# Create a config instance
config = Config()