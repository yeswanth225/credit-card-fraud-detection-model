"""Database connection and session management."""
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

# Database URL - designed to be Postgres-portable, using SQLite for development
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "sqlite:///./data/fraud_detection.db",  # SQLite for dev
)

# Create engine
engine = create_engine(DATABASE_URL, echo=False)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()


# Dependency for getting DB session
def get_db():
    """Dependency that yields database sessions."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Initialize database - create tables."""
    from . import models  # noqa: F401
    Base.metadata.create_all(bind=engine)


def drop_db():
    """Drop all tables - for development only."""
    import warnings
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        Base.metadata.drop_all(bind=engine)