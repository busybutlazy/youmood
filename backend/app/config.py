import os

SECRET_KEY: str = os.environ.get("SECRET_KEY", "dev-secret-change-in-prod")
ALGORITHM: str = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.environ.get("ACCESS_TOKEN_EXPIRE_MINUTES", str(60 * 24 * 7)))  # 7 天

ADMIN_USERNAME: str = os.environ.get("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD: str = os.environ.get("ADMIN_PASSWORD", "changeme")

# 允許的跨來源清單，逗號分隔。本機開發預設允許 localhost。
_raw = os.environ.get(
    "ALLOWED_ORIGINS",
    "http://localhost:3456,http://localhost:5173",
)
ALLOWED_ORIGINS: list[str] = [o.strip() for o in _raw.split(",") if o.strip()]
