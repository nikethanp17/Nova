"""Configuration management module.

Dynamically loads configurations for development, testing, and production environments
using Pydantic Settings v2.
"""

import os
from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class BaseAppConfig(BaseSettings):
    """Base application settings.

    Contains configurations shared across all environment classes.
    """

    APP_NAME: str = "NOVA"
    APP_VERSION: str = "1.0.0"
    APP_ENV: Literal["development", "testing", "production"] = "development"
    DEBUG: bool = False

    HOST: str = "0.0.0.0"
    PORT: int = 8000

    LOG_LEVEL: Literal["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"] = "INFO"
    LOG_FORMAT: Literal["json", "text"] = "json"

    # Default allowed origins (parsed as JSON list or loaded as raw string list)
    CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:5173"]

    RATE_LIMIT_PER_MINUTE: int = 100

    MONGODB_URI: str = "mongodb://localhost:27017"
    MONGODB_DATABASE: str = "nova_dev"

    # Pydantic v2 settings configuration
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=True,
    )


class DevelopmentConfig(BaseAppConfig):
    """Development environment specific settings."""

    APP_ENV: Literal["development", "testing", "production"] = "development"
    DEBUG: bool = True
    LOG_LEVEL: Literal["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"] = "DEBUG"
    LOG_FORMAT: Literal["json", "text"] = "text"


class TestingConfig(BaseAppConfig):
    """Testing environment specific settings."""

    APP_ENV: Literal["development", "testing", "production"] = "testing"
    DEBUG: bool = True
    LOG_LEVEL: Literal["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"] = "DEBUG"
    LOG_FORMAT: Literal["json", "text"] = "text"
    CORS_ORIGINS: list[str] = ["*"]
    RATE_LIMIT_PER_MINUTE: int = (
        10000  # High limit to allow uninterrupted test execution
    )
    MONGODB_DATABASE: str = "nova_test"


class ProductionConfig(BaseAppConfig):
    """Production environment specific settings."""

    APP_ENV: Literal["development", "testing", "production"] = "production"
    DEBUG: bool = False
    LOG_LEVEL: Literal["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"] = "INFO"
    LOG_FORMAT: Literal["json", "text"] = "json"


@lru_cache
def get_settings() -> BaseAppConfig:
    """Load settings based on the APP_ENV environment variable.

    Uses LRU cache to avoid reloading from file on subsequent calls.

    Returns:
        BaseAppConfig: The active environment config instance.
    """
    # Quick probe of APP_ENV from system environment without loading full settings file
    env = os.getenv("APP_ENV", "development").lower()

    if env == "production":
        return ProductionConfig()
    elif env == "testing":
        return TestingConfig()
    else:
        return DevelopmentConfig()
