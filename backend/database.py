import os
from sqlmodel import SQLModel, create_engine, Session

# Using SQLite for local development to avoid Docker dependency issues
sqlite_file_name = "database.db"
sqlite_url = f"sqlite:///{sqlite_file_name}"

DATABASE_URL = os.getenv("DATABASE_URL", sqlite_url)

# check_same_thread=False is needed only for SQLite
connect_args = {"check_same_thread": False} if "sqlite" in DATABASE_URL else {}

engine = create_engine(DATABASE_URL, echo=True, connect_args=connect_args)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session
