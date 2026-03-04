from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv
import os
import sqlite3
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}  # required for SQLite
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


conn = sqlite3.connect("emotion_learning.db")
cursor = conn.cursor()

cursor.execute("ALTER TABLE users ADD COLUMN preferred_subject TEXT;")

conn.commit()
conn.close()

print("Column added successfully!")