from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import db, seed
from app.config import ALLOWED_ORIGINS
from app.routes import auth, categories, images, orders, products, site_content, stats


@asynccontextmanager
async def lifespan(app: FastAPI):
    db.init()
    seed.seed_admin()
    yield


app = FastAPI(title="游木工坊 API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(categories.router)
app.include_router(products.router)
app.include_router(images.router)
app.include_router(orders.router)
app.include_router(stats.router)
app.include_router(site_content.router)


@app.get("/api/health")
def health():
    return {"ok": True}
