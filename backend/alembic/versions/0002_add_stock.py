"""add stock column to products

Revision ID: 0002
Revises: 0001
Create Date: 2026-05-29
"""
from alembic import op

revision = '0002'
down_revision = '0001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # NULL = 不追蹤庫存（不顯示售完）; 0 = 售完; >0 = 有庫存
    op.execute("ALTER TABLE products ADD COLUMN stock INTEGER DEFAULT NULL")


def downgrade() -> None:
    # SQLite 不支援 DROP COLUMN（3.35 之前），降版只能重建表；先略過
    pass
