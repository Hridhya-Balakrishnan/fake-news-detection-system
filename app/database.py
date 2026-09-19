"""
Database connection and session handling for SQLite.
"""

import sqlite3
from typing import Generator
from app.config import DATABASE_PATH

def init_db(conn: sqlite3.Connection = None):
    """
    Initializes database tables if they do not exist.
    """
    should_close = False
    if conn is None:
        conn = sqlite3.connect(DATABASE_PATH)
        conn.row_factory = sqlite3.Row
        should_close = True

    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS prediction_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            text_snippet TEXT NOT NULL,
            prediction TEXT NOT NULL,
            confidence REAL NOT NULL,
            prob_fake REAL NOT NULL,
            prob_genuine REAL NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    if should_close:
        conn.close()

def get_db_connection() -> sqlite3.Connection:
    """
    Creates and returns a SQLite database connection, ensuring tables are initialized.
    """
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    init_db(conn)
    return conn

def get_db() -> Generator[sqlite3.Connection, None, None]:
    """
    FastAPI dependency yielding a database connection.
    """
    conn = get_db_connection()
    try:
        yield conn
    finally:
        conn.close()
