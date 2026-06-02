#!/usr/bin/env python3
"""
Backup youmood.db to /data/backups/, retaining the last 7 days.

Usage (inside container):
  python /app/scripts/backup.py

Via docker compose:
  docker compose run --rm backup
"""
import os
import sqlite3
import time
from datetime import datetime
from pathlib import Path

DATA_DIR = Path(os.environ.get("DATA_DIR", "/data"))
DB_PATH = DATA_DIR / "db" / "youmood.db"
BACKUP_DIR = DATA_DIR / "backups"
RETAIN_DAYS = int(os.environ.get("BACKUP_RETAIN_DAYS", "7"))


def main() -> None:
    if not DB_PATH.exists():
        raise FileNotFoundError(f"Database not found: {DB_PATH}")

    BACKUP_DIR.mkdir(parents=True, exist_ok=True)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    dest = BACKUP_DIR / f"youmood_{timestamp}.db"

    src = sqlite3.connect(DB_PATH)
    dst = sqlite3.connect(dest)
    with dst:
        src.backup(dst)
    src.close()
    dst.close()

    print(f"[backup] saved → {dest}")

    cutoff = time.time() - RETAIN_DAYS * 86400
    removed = 0
    for f in BACKUP_DIR.glob("youmood_*.db"):
        if f.stat().st_mtime < cutoff:
            f.unlink()
            removed += 1

    if removed:
        print(f"[backup] removed {removed} backup(s) older than {RETAIN_DAYS} days")


if __name__ == "__main__":
    main()
