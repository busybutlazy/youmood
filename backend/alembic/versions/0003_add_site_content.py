"""add site_content table

Revision ID: 0003
Revises: 0002
Create Date: 2026-06-02
"""
from alembic import op

revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE IF NOT EXISTS site_content (
            page  TEXT NOT NULL,
            key   TEXT NOT NULL,
            type  TEXT NOT NULL CHECK(type IN ('text', 'image')),
            value TEXT NOT NULL DEFAULT '',
            PRIMARY KEY (page, key)
        )
    """)


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS site_content")
