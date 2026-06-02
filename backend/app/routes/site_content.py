import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, status
from pydantic import BaseModel

from app import db
from app.deps import get_current_admin

router = APIRouter(tags=["site_content"])

# Allowed (page, key, type) combinations — prevents arbitrary key injection
CONTENT_SCHEMA: dict[tuple[str, str], str] = {
    # Home — brand intro
    ("home", "hero_image"): "image",
    ("home", "tagline"): "text",
    ("home", "subtitle"): "text",
    # Home — hero carousel (3 slides)
    ("home", "hero_0_title"): "text",
    ("home", "hero_0_subtitle"): "text",
    ("home", "hero_0_description"): "text",
    ("home", "hero_0_image"): "image",
    ("home", "hero_1_title"): "text",
    ("home", "hero_1_subtitle"): "text",
    ("home", "hero_1_description"): "text",
    ("home", "hero_1_image"): "image",
    ("home", "hero_2_title"): "text",
    ("home", "hero_2_subtitle"): "text",
    ("home", "hero_2_description"): "text",
    ("home", "hero_2_image"): "image",
    # Products page
    ("products", "subtitle"): "text",
    # About
    ("about", "story"): "text",
    ("about", "photo"): "image",
    # About — 我們的理念（pipe-delimited: "標題|說明\n..."）
    ("about", "values"): "text",
    # About — 製作過程（pipe-delimited: "標題|說明\n..."）
    ("about", "process"): "text",
    # Contact
    ("contact", "email"): "text",
    ("contact", "instagram"): "text",
    ("contact", "hours"): "text",
    ("contact", "location"): "text",
}


def _get_value(page: str, key: str) -> str | None:
    with db.get_conn() as conn:
        row = conn.execute(
            "SELECT value FROM site_content WHERE page = ? AND key = ?", (page, key)
        ).fetchone()
    return row["value"] if row else None


# ── Public: read one field ───────────────────────────────────────────────────

@router.get("/api/site-content/{page}/{key}")
def get_content(page: str, key: str, request: Request):
    if (page, key) not in CONTENT_SCHEMA:
        raise HTTPException(status_code=404, detail="Content key not found")

    value = _get_value(page, key)
    content_type = CONTENT_SCHEMA[(page, key)]

    if value and content_type == "image":
        base = str(request.base_url).rstrip("/")
        value = f"{base}/api/images/{value}"

    return {"page": page, "key": key, "type": content_type, "value": value}


# ── Public: read all fields for a page ──────────────────────────────────────

@router.get("/api/site-content/{page}")
def get_page_content(page: str, request: Request):
    keys = [k for (p, k) in CONTENT_SCHEMA if p == page]
    if not keys:
        raise HTTPException(status_code=404, detail="Page not found")

    base = str(request.base_url).rstrip("/")
    result = {}
    with db.get_conn() as conn:
        for key in keys:
            row = conn.execute(
                "SELECT value, type FROM site_content WHERE page = ? AND key = ?",
                (page, key),
            ).fetchone()
            content_type = CONTENT_SCHEMA[(page, key)]
            if row and row["value"]:
                value = row["value"]
                if content_type == "image":
                    value = f"{base}/api/images/{value}"
                result[key] = {"type": content_type, "value": value}
            else:
                result[key] = {"type": content_type, "value": None}

    return result


# ── Admin: update text field ─────────────────────────────────────────────────

class ContentUpdate(BaseModel):
    page: str
    key: str
    value: str


@router.put("/api/admin/site-content", status_code=status.HTTP_200_OK)
def update_content(body: ContentUpdate, _: str = Depends(get_current_admin)):
    if (body.page, body.key) not in CONTENT_SCHEMA:
        raise HTTPException(status_code=404, detail="Content key not found")
    if CONTENT_SCHEMA[(body.page, body.key)] != "text":
        raise HTTPException(status_code=400, detail="Use image upload endpoint for image fields")

    with db.get_conn() as conn:
        conn.execute(
            "INSERT INTO site_content (page, key, type, value) VALUES (?, ?, 'text', ?)"
            " ON CONFLICT(page, key) DO UPDATE SET value = excluded.value",
            (body.page, body.key, body.value),
        )
    return {"page": body.page, "key": body.key, "value": body.value}


# ── Admin: upload image field ────────────────────────────────────────────────

SITE_IMAGES_DIR = db.DATA_DIR / "images" / "site"


@router.post("/api/admin/site-content/image", status_code=status.HTTP_200_OK)
async def upload_site_image(
    page: str,
    key: str,
    file: UploadFile,
    request: Request,
    _: str = Depends(get_current_admin),
):
    if (page, key) not in CONTENT_SCHEMA:
        raise HTTPException(status_code=404, detail="Content key not found")
    if CONTENT_SCHEMA[(page, key)] != "image":
        raise HTTPException(status_code=400, detail="This field is not an image field")

    SITE_IMAGES_DIR.mkdir(parents=True, exist_ok=True)

    # Remove old file if exists
    old_value = _get_value(page, key)
    if old_value:
        old_path = db.DATA_DIR / "images" / old_value
        if old_path.exists():
            old_path.unlink()

    suffix = Path(file.filename or "image").suffix or ".jpg"
    filename = f"site/{uuid.uuid4().hex}{suffix}"
    (db.DATA_DIR / "images" / filename).write_bytes(await file.read())

    with db.get_conn() as conn:
        conn.execute(
            "INSERT INTO site_content (page, key, type, value) VALUES (?, ?, 'image', ?)"
            " ON CONFLICT(page, key) DO UPDATE SET value = excluded.value",
            (page, key, filename),
        )

    base = str(request.base_url).rstrip("/")
    return {"page": page, "key": key, "url": f"{base}/api/images/{filename}"}
