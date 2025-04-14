import os
from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import SecretStr

load_dotenv()

class Settings(BaseSettings):
    DATABASE_URL: str 
    SECRET_KEY: SecretStr
    ALGORITHM: str 
    ACCESS_TOKEN_EXPIRE_MINUTES: int 

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

# Create a single instance of Settings
settings = Settings()
