"""FastAPI application entry point."""
import os
import logging
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .verification import router as verification_router
from .analyst import router as analyst_router
from .admin import router as admin_router
from ..database.connection import init_db

load_dotenv()
logger = logging.getLogger("api")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize database connections and pre-load caches."""
    try:
        init_db()
        logger.info("Database initialized successfully.")
    except Exception as e:
        logger.warning(f"Database initialization notice: {e}")
    yield


app = FastAPI(
    title="Smart Fraud Detection System",
    description="Hybrid classical-quantum fraud detection API",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS middleware for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://localhost:8001",
        "*",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(verification_router, prefix="/api/verification", tags=["verification"])
app.include_router(analyst_router, prefix="/api/analyst", tags=["analyst"])
app.include_router(admin_router, prefix="/api/admin", tags=["admin"])


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Smart Fraud Detection System API",
        "version": "0.1.0",
        "status": "operational",
    }


@app.get("/health")
async def health():
    """Health check."""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn

    host = os.getenv("API_HOST", "0.0.0.0")
    port = int(os.getenv("API_PORT", "8000"))
    uvicorn.run("src.api.main:app", host=host, port=port, reload=False)