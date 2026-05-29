import pytest
from app import db
from app.deps import pwd_context


@pytest.fixture(autouse=True)
def isolated_db(tmp_path, monkeypatch):
    monkeypatch.setattr(db, "DB_PATH", tmp_path / "db" / "youmood.db")
    monkeypatch.setattr(db, "IMAGES_DIR", tmp_path / "images" / "products")
    db.init()
    with db.get_conn() as conn:
        conn.execute(
            "INSERT INTO admin_users (username, password_hash) VALUES (?, ?)",
            ("testadmin", pwd_context.hash("testpass123")),
        )
