import os
from typing import Optional, Tuple
import psycopg


def get_database_url() -> str:
    """Get DATABASE_URL from environment, evaluated at runtime."""
    url = os.environ.get("DATABASE_URL")
    if not url:
        raise RuntimeError("DATABASE_URL environment variable is not configured")
    return url


def get_connection() -> psycopg.Connection:
    """Get a new database connection."""
    print("Attempting to connect to the database...")
    database_url = get_database_url()
    
    print(f"DATABASE_URL is set.")
    try:
        conn = psycopg.connect(database_url)
        print("Database connection successful.")
        return conn
    except psycopg.Error as e:
        print(f"ERROR: Database connection failed: {e}")
        raise


def init_schema_if_needed() -> None:
    """Crea tablas básicas si no existen (idempotente)."""
    ddl_statements = [
        'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";',
        (
            """
            CREATE TABLE IF NOT EXISTS activation_keys (
              id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
              key text UNIQUE NOT NULL,
              is_used boolean NOT NULL DEFAULT false,
              user_id uuid NULL,
              created_at timestamptz NOT NULL DEFAULT now()
            );
            """
        ),
        (
            """
            CREATE TABLE IF NOT EXISTS users (
              id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
              email text,
              username text,
              activation_key text,
              created_at timestamptz NOT NULL DEFAULT now()
            );
            """
        ),
        (
            """
            CREATE TABLE IF NOT EXISTS user_libraries (
              id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
              user_id uuid NOT NULL,
              song_data jsonb NOT NULL,
              created_at timestamptz NOT NULL DEFAULT now()
            );
            """
        ),
        (
            """
            CREATE TABLE IF NOT EXISTS user_downloads (
              id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
              user_id uuid NOT NULL,
              url text NOT NULL,
              filename text NOT NULL,
              file_size bigint NOT NULL DEFAULT 0,
              status text NOT NULL DEFAULT 'completed',
              created_at timestamptz NOT NULL DEFAULT now()
            );
            """
        ),
        (
            """
            CREATE TABLE IF NOT EXISTS user_play_counts (
              id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
              user_id uuid NOT NULL,
              song_id text NOT NULL,
              play_count int NOT NULL DEFAULT 0,
              last_played_at timestamptz
            );
            """
        ),
        "CREATE INDEX IF NOT EXISTS idx_activation_keys_key ON activation_keys (key);",
        "CREATE INDEX IF NOT EXISTS idx_user_libraries_user_id ON user_libraries (user_id);",
        "CREATE INDEX IF NOT EXISTS idx_user_downloads_user_id ON user_downloads (user_id);",
        "CREATE UNIQUE INDEX IF NOT EXISTS ux_user_play_counts_user_song ON user_play_counts (user_id, song_id);",
    ]

    with get_connection() as conn:
        with conn.cursor() as cur:
            for ddl in ddl_statements:
                cur.execute(ddl)
        conn.commit()


