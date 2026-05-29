from contextlib import asynccontextmanager
from fastapi import FastAPI

from app import db, seed
from app.routes import auth


@asynccontextmanager
async def lifespan(app: FastAPI):
    db.init()
    seed.seed_admin()
    yield


app = FastAPI(title="游木工坊 API", version="0.1.0", lifespan=lifespan)

app.include_router(auth.router)


@app.get("/api/health")
def health():
    return {"ok": True}
