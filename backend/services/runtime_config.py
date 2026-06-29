from __future__ import annotations

import os
from typing import Any

REQUIRED_ENV_VARS = ("SUPABASE_URL", "SUPABASE_SERVICE_KEY", "OPENAI_API_KEY")


def _environment_name() -> str:
    return (
        os.getenv("APP_ENV")
        or os.getenv("ENVIRONMENT")
        or os.getenv("NODE_ENV")
        or "development"
    ).lower()


def validate_runtime_environment() -> dict[str, Any]:
    missing = [name for name in REQUIRED_ENV_VARS if not (os.getenv(name) or "").strip()]
    if missing:
        missing_list = ", ".join(missing)
        raise RuntimeError(f"Missing required environment variables: {missing_list}")

    environment = _environment_name()
    warnings: list[str] = []
    frontend_origin = (os.getenv("FRONTEND_ORIGIN") or "").strip()

    if environment in {"production", "staging"} and not frontend_origin:
        warnings.append(
            "FRONTEND_ORIGIN is not set. Browser requests may fail CORS checks outside localhost."
        )

    return {
        "environment": environment,
        "frontend_origin": frontend_origin or None,
        "warnings": warnings,
    }
