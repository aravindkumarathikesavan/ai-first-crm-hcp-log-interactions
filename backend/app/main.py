from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app.database import Base, engine
from app import models  # noqa: F401 ensures models are registered before create_all
from app.routers import interactions, chat

Base.metadata.create_all(bind=engine)

app = FastAPI(title="AI-First CRM - HCP Log Interaction API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_origin_regex=r".*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(interactions.router)
app.include_router(chat.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}


# Detect frontend build directory for unified deployment (Render, Docker, etc.)
candidate_paths = [
    Path(__file__).resolve().parent.parent.parent / "frontend" / "build",
    Path(__file__).resolve().parent.parent / "frontend" / "build",
    Path("frontend/build").resolve(),
    Path("../frontend/build").resolve(),
    Path("/app/frontend/build").resolve(),
    Path("build").resolve(),
]

frontend_build_path = next(
    (p for p in candidate_paths if (p / "index.html").exists()), None
)

if frontend_build_path:
    static_dir = frontend_build_path / "static"
    if static_dir.exists():
        app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")

    @app.get("/")
    def serve_root():
        return FileResponse(frontend_build_path / "index.html")

    @app.get("/{full_path:path}")
    def serve_spa(full_path: str):
        # Do not catch API endpoints, docs, or openapi.json
        if (
            full_path.startswith("api/")
            or full_path.startswith("docs")
            or full_path.startswith("redoc")
            or full_path == "openapi.json"
        ):
            raise HTTPException(status_code=404, detail="Not Found")

        file_path = frontend_build_path / full_path
        if file_path.is_file():
            return FileResponse(file_path)

        # SPA fallback to index.html
        return FileResponse(frontend_build_path / "index.html")
else:
    @app.get("/")
    def root():
        return {
            "message": "AI-First CRM HCP Log Interactions API is live! Frontend build not found.",
            "status": "healthy",
            "docs": "/docs",
            "health": "/api/health",
        }

