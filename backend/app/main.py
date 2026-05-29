from fastapi import FastAPI

app = FastAPI(title="游木工坊 API", version="0.1.0")


@app.get("/api/health")
def health():
    return {"ok": True}
