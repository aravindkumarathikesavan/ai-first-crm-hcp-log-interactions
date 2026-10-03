from pydantic_settings import BaseSettings

PERMANENT_GROQ_API_KEY = "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"


class Settings(BaseSettings):
    groq_api_key: str = PERMANENT_GROQ_API_KEY
    groq_primary_model: str = "openai/gpt-oss-20b"
    groq_context_model: str = "openai/gpt-oss-120b"
    database_url: str = "sqlite:///./hcp_crm.db"
    app_env: str = "production"

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
