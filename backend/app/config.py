from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str
    redis_url: str = "redis://localhost:6379"
    jwt_secret: str
    journal_encryption_key: str
    allowed_origins: str = "http://localhost:5173,http://localhost:3000"
    allowed_origin_regex: str = r"https?://(localhost|127\.0\.0\.1)(:\d+)?"
    gemini_api_key: str | None = None
    gemini_model: str = "gemini-2.5-flash"
    gemini_timeout_seconds: int = 45
    accuweather_api_key: str | None = None
    accuweather_location_key: str | None = None
    accuweather_location_query: str = "IIT Delhi, New Delhi, India"
    accuweather_geoposition: str | None = None
    accuweather_language: str = "en-us"
    environment_cache_minutes: int = 30

    model_config = {"env_file": ".env"}

    def get_origins(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",")]


settings = Settings()
