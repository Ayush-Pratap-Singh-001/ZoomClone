from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "Zoom Clone API"
    secret_key: str = "change-this-secret-key"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    class Config:
        env_file = ".env"


settings = Settings()