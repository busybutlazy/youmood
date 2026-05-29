from contextlib import asynccontextmanager
from fastapi import FastAPI
from app import db


@asynccontextmanager
async def lifespan(app: FastAPI):
    db.init()
    yield


app = FastAPI(title="游木工坊 API", version="0.1.0", lifespan=lifespan)


@app.get("/api/health")
def health():
    return {"ok": True}
