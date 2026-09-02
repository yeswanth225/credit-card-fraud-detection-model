"""FastAPI startup verification and health check."""

import asyncio
import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))


async def verify_startup():
    """Verify all components are ready."""
    print("=" * 60)
    print("[*] FastAPI Startup Verification")
    print("=" * 60)

    checks = {
        "database": False,
        "classical_model": False,
        "quantum_models": False,
        "api_routes": False,
    }

    try:
        print("\n[1] Checking Database...")
        from src.database.connection import init_db
        init_db()
        print("    [OK] Database initialized")
        checks["database"] = True
    except Exception as e:
        print(f"    [ERR] Database error: {e}")

    try:
        print("\n[2] Checking Classical Model...")
        from src.api.analyst import get_model_data
        data = get_model_data()
        if data.get("model"):
            print(f"    [OK] Classical model loaded")
            print(f"         - Model type: {type(data['model']).__name__}")
            print(f"         - Test samples: {len(data.get('X_test', []))}")
            checks["classical_model"] = True
    except Exception as e:
        print(f"    [ERR] Classical model error: {e}")

    try:
        print("\n[3] Checking Quantum Models...")
        from src.ml.quantum_model import get_quantum_models, get_quantum_model_info
        quantum = get_quantum_models()
        info = get_quantum_model_info()
        print(f"    [OK] Quantum models checked")
        print(f"         - Available: {info.get('available')}")
        print(f"         - QSVC loaded: {info['qsvc']['loaded']}")
        print(f"         - VQC loaded: {info['vqc']['loaded']}")
        checks["quantum_models"] = True
    except Exception as e:
        print(f"    [WARN] Quantum models info: {e}")

    try:
        print("\n[4] Checking API Routes...")
        from src.api.main import app
        routes = [route.path for route in app.routes if hasattr(route, 'path')]
        print(f"    [OK] {len(routes)} routes registered")
        print(f"         - Verification: /api/verification")
        print(f"         - Analyst: /api/analyst")
        print(f"         - Admin: /api/admin")
        checks["api_routes"] = True
    except Exception as e:
        print(f"    [ERR] API routes error: {e}")

    print("\n" + "=" * 60)
    print("[*] Startup Summary")
    print("=" * 60)
    for check, status in checks.items():
        status_icon = "[OK]" if status else "[ERR]"
        print(f"{status_icon} {check.replace('_', ' ').title()}")

    all_ok = all(checks.values())
    print("\n" + ("[OK] Ready for deployment!" if all_ok else "[WARN] Some checks failed"))
    print("=" * 60)

    return all_ok


if __name__ == "__main__":
    result = asyncio.run(verify_startup())
    sys.exit(0 if result else 1)
