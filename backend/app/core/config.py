from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    openai_api_key: str = ""
    openai_base_url: str | None = None
    model_name: str = "gpt-4o-mini"
    model_temperature: float = Field(default=0.7, ge=0, le=2)
    judge_temperature: float = Field(default=0.2, ge=0, le=2)
    model_timeout_seconds: float = Field(default=60, gt=0)
    moderation_model: str = "omni-moderation-latest"
    enable_moderation: bool = True
    enable_topic_review: bool = True
    topic_review_model: str = "gpt-4o-mini"
    frontend_url: str = "http://localhost:5173"
    cors_origins: str = ""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    @property
    def allowed_origins(self) -> list[str]:
        local_origins = (
            "http://localhost:8787",
            "http://127.0.0.1:8787",
            "http://localhost:3000",
            "http://127.0.0.1:3000",
        )
        configured_origins = (
            origin.strip() for origin in self.cors_origins.split(",") if origin.strip()
        )
        return list(dict.fromkeys((self.frontend_url, *local_origins, *configured_origins)))


@lru_cache
def get_settings() -> Settings:
    return Settings()
