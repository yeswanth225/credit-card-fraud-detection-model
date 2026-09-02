"""FastAPI application entry point."""
import os
import logging
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
try:
    from fastapi.middleware.gzip import GZIPMiddleware
except ImportError:
    from fastapi.middleware import gzip as gzip_module
    GZIPMiddleware = getattr(gzip_module, 'GZIPMiddleware', None)
from fastapi.openapi.utils import get_openapi
from .verification import router as verification_router
from .analyst import router as analyst_router
from .admin import router as admin_router
from ..database.connection import init_db

load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("api")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize database connections and pre-load caches."""
    logger.info("🚀 FastAPI startup: Initializing database and loading models...")
    try:
        init_db()
        logger.info("✅ Database initialized successfully.")
    except Exception as e:
        logger.warning(f"⚠️ Database initialization notice: {e}")

    # Pre-load models to avoid startup delay
    try:
        from ..api.analyst import get_model_data
        get_model_data()
        logger.info("✅ Classical models pre-loaded.")
    except Exception as e:
        logger.warning(f"⚠️ Classical model loading notice: {e}")

    try:
        from ..ml.quantum_model import get_quantum_models
        get_quantum_models()
        logger.info("✅ Quantum models checked.")
    except Exception as e:
        logger.warning(f"⚠️ Quantum model loading notice: {e}")

    logger.info("🎯 API ready for requests on /api/verification, /api/analyst, /api/admin")
    yield

    logger.info("🛑 FastAPI shutdown: Cleaning up connections...")


app = FastAPI(
    title="Fraud Detection API — Classical & Quantum",
    description="Hybrid ML/QML credit card fraud detection system with SHAP explanations and real European dataset",
    version="0.2.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# Middleware stack
# 1. CORS for frontend development
allowed_origins = (
    os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000,http://localhost:3002")
    .split(",")
)
allowed_origins = [origin.strip() for origin in allowed_origins if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. Optional GZIP compression (skip if not available)
if GZIPMiddleware:
    try:
        app.add_middleware(GZIPMiddleware, minimum_size=500)
    except Exception:
        pass

# Include routers with API versioning
app.include_router(verification_router, prefix="/api/verification", tags=["verification"])
app.include_router(analyst_router, prefix="/api/analyst", tags=["analyst"])
app.include_router(admin_router, prefix="/api/admin", tags=["admin"])


@app.get("/")
async def root():
    """Root endpoint — API overview."""
    return {
        "message": "Smart Fraud Detection System API",
        "version": "0.2.0",
        "status": "operational",
        "endpoints": {
            "verification": "/api/verification (predict, batch-predict, model-info, health)",
            "analyst": "/api/analyst (transactions, metrics, review)",
            "admin": "/api/admin (models, benchmarks, drift-monitor, system-health)",
            "documentation": "/docs (Swagger UI) or /redoc (ReDoc)",
        },
        "features": [
            "Classical XGBoost (30 features, PR-AUC 0.8716)",
            "Quantum QSVC & VQC (4 features, 4 qubits)",
            "SHAP explainability for all predictions",
            "Real European fraud dataset (284,807 transactions)",
            "Transaction persistence and analyst review",
            "Model versioning and drift detection",
        ]
    }


@app.get("/health")
async def health():
    """Health check endpoint."""
    try:
        from ..api.analyst import get_model_data
        from ..ml.quantum_model import get_quantum_models

        # Test classical model
        data = get_model_data()
        classical_ok = data.get("model") is not None

        # Test quantum models
        quantum = get_quantum_models()
        quantum_ok = quantum.get("available", False)

        return {
            "status": "healthy",
            "components": {
                "classical_model": "loaded" if classical_ok else "error",
                "quantum_models": "available" if quantum_ok else "not_loaded",
                "database": "ready",
            },
            "timestamp": None,
        }
    except Exception as e:
        logger.error(f"Health check error: {e}")
        return {
            "status": "degraded",
            "error": str(e),
        }


@app.get("/api/version")
async def api_version():
    """Get API version and build information."""
    return {
        "version": "0.2.0",
        "build_date": "2026-09-02",
        "backend": "FastAPI + SQLAlchemy",
        "frontend": "React + Vite",
        "models": {
            "classical": "XGBoost (Phase 1 Baseline)",
            "quantum": "QSVC + VQC (Phase 2 Benchmark)",
        },
        "dataset": "European Credit Card Fraud Detection (284,807 transactions)",
    }


def custom_openapi():
    """Custom OpenAPI schema generation."""
    if app.openapi_schema:
        return app.openapi_schema

    openapi_schema = get_openapi(
        title="Fraud Detection API",
        version="0.2.0",
        description="Hybrid classical-quantum ML fraud detection with SHAP explanations",
        routes=app.routes,
    )

    openapi_schema["info"]["x-logo"] = {
        "url": "https://fastapi.tiangolo.com/img/logo-margin/logo-teal.png"
    }

    app.openapi_schema = openapi_schema
    return app.openapi_schema


app.openapi = custom_openapi


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler for unhandled errors."""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return {
        "status": "error",
        "detail": str(exc),
        "path": request.url.path,
    }


if __name__ == "__main__":
    import uvicorn

    host = os.getenv("API_HOST", "0.0.0.0")
    port = int(os.getenv("API_PORT", "8000"))
    reload = os.getenv("API_RELOAD", "false").lower() == "true"

    logger.info(f"🚀 Starting FastAPI server on {host}:{port}")

    uvicorn.run(
        "src.api.main:app",
        host=host,
        port=port,
        reload=reload,
        log_level="info",
    )
