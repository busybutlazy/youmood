import sqlite3
import pytest
import os

os.environ.setdefault("DATA_DIR", "/tmp/test_youmood")

from app import db

TABLES = {"categories", "products", "product_images", "admin_users", "orders", "order_items"}


@pytest.fixture(autouse=True)
def isolated_db(tmp_path, monkeypatch):
    monkeypatch.setattr(db, "DB_PATH", tmp_path / "db" / "youmood.db")
    monkeypatch.setattr(db, "IMAGES_DIR", tmp_path / "images" / "products")


def test_init_creates_tables():
    db.init()
    with sqlite3.connect(db.DB_PATH) as conn:
        rows = conn.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()
    found = {r[0] for r in rows}
    assert TABLES <= found


def test_init_creates_images_dir():
    db.init()
    assert db.IMAGES_DIR.is_dir()


def test_init_idempotent():
    db.init()
    db.init()
    with sqlite3.connect(db.DB_PATH) as conn:
        rows = conn.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()
    assert len({r[0] for r in rows} & TABLES) == len(TABLES)


def test_get_conn_foreign_keys():
    db.init()
    with db.get_conn() as conn:
        result = conn.execute("PRAGMA foreign_keys").fetchone()
    assert result[0] == 1


def test_alembic_version_recorded():
    db.init()
    with sqlite3.connect(db.DB_PATH) as conn:
        row = conn.execute("SELECT version_num FROM alembic_version").fetchone()
    assert row is not None
    assert row[0] == "0001"
