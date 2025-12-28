"""
Idea Stock Exchange - Database Initialization and Session Management
"""

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from dotenv import load_dotenv
from models import Base

# Load environment variables
load_dotenv()

# Database configuration
DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite:///./ideastockexchange.db')

# Create engine
engine = create_engine(
    DATABASE_URL,
    echo=False,  # Set to True for SQL query logging
    connect_args={'check_same_thread': False} if 'sqlite' in DATABASE_URL else {}
)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db():
    """
    Initialize the database by creating all tables.
    """
    print("Initializing database...")
    Base.metadata.create_all(bind=engine)
    print("Database initialized successfully!")


def get_db() -> Session:
    """
    Dependency injection for FastAPI to get database sessions.
    Yields a database session and ensures it's closed after use.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def drop_db():
    """
    Drop all tables. Use with caution!
    """
    print("WARNING: Dropping all database tables...")
    Base.metadata.drop_all(bind=engine)
    print("All tables dropped!")


if __name__ == '__main__':
    # Initialize database when run as a script
    init_db()
