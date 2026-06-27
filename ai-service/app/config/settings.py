import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # OpenAI / LLM API
    openai_api_key: str = os.getenv("OPENAI_API_KEY", "")
    openai_model: str = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    
    # Alternative: OpenRouter (supports multiple providers)
    openrouter_api_key: str = os.getenv("OPENROUTER_API_KEY", "")
    openrouter_base_url: str = "https://openrouter.ai/api/v1"
    
    # Database (for saving estimates)
    database_url: str = os.getenv(
        "DATABASE_URL",
        "postgresql+asyncpg://postgres:postgres@localhost:5432/construction_mvp"
    )
    
    # Service config
    max_tokens: int = 2048
    temperature: float = 1.0  # Slightly creative for estimates
    
    class Config:
        env_file = ".env"

settings = Settings()