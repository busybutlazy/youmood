from fastapi import FastAPI, APIRouter
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pathlib import Path
import uvicorn

BASE_DIR = Path(__file__).resolve().parent
DIST_DIR = BASE_DIR / "dist"

app = FastAPI()

# 1) API 先註冊（避免被前端路由吃掉）
api = APIRouter(prefix="/api")

@api.get("/health")
def health():
    return {"ok": True}

app.include_router(api)

# 2) 靜態 assets（可選，但推薦：讓 /assets 直接走靜態檔）
assets_dir = DIST_DIR / "assets"
if assets_dir.exists():
    app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")


# 3) SPA fallback：任何非 /api、非實際檔案路徑 -> 回 index.html
@app.get("/{full_path:path}")
def spa(full_path: str):
    # 若 dist 裡真的有這個檔案，就直接回檔案（例如 favicon.ico）
    candidate = DIST_DIR / full_path
    if candidate.is_file():
        return FileResponse(str(candidate))

    # 否則一律回 React 的 index.html（交給前端 router 處理）
    return FileResponse(str(DIST_DIR / "index.html"))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)