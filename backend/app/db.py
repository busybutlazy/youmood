import sqlite3
from contextlib import contextmanager
from pathlib import Path
import os

from alembic.config import Config
from alembic.command import upgrade as alembic_upgrade

DATA_DIR = Path(os.environ.get("DATA_DIR", "./data"))
DB_PATH = DATA_DIR / "db" / "youmood.db"
IMAGES_DIR = DATA_DIR / "images" / "products"

ALEMBIC_INI = Path(__file__).parent.parent / "alembic.ini"


def run_migrations() -> None:
    cfg = Config(str(ALEMBIC_INI))
    cfg.set_main_option("sqlalchemy.url", f"sqlite:///{DB_PATH}")
    alembic_upgrade(cfg, "head")


def init() -> None:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    IMAGES_DIR.mkdir(parents=True, exist_ok=True)
    run_migrations()


@contextmanager
def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()
