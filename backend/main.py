from __future__ import annotations

import os
import time
from contextlib import asynccontextmanager
from uuid import uuid4

from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

load_dotenv()

from routers import lease, scam, rights, match
from services.logging_service import bind_request_id, configure_logging, log_event, reset_request_id
from services.runtime_config import validate_runtime_environment

logger = configure_logging()

# In production set FRONTEND_ORIGIN to the deployed frontend URL
# (e.g. https://rentpilot.vercel.app); localhost stays allowed for dev.
ALLOWED_ORIGINS = ["http://localhost:3000", "http://127.0.0.1:3000"]
if os.getenv("FRONTEND_ORIGIN"):
    ALLOWED_ORIGINS.append(os.getenv("FRONTEND_ORIGIN").rstrip("/"))


@asynccontextmanager
async def lifespan(_: FastAPI):
    config = validate_runtime_environment()
    log_event(
        logger,
        "api_startup_completed",
        environment=config["environment"],
        frontend_origin=config["frontend_origin"],
        allowed_origins=ALLOWED_ORIGINS,
    )
    for warning in config["warnings"]:
        logger.warning(
            warning,
            extra={
                "event": "runtime_configuration_warning",
                "fields": {"environment": config["environment"], "warning": warning},
            },
        )
    yield


app = FastAPI(title="RentPilot API", version="2.0.0", lifespan=lifespan)


@app.middleware("http")
async def instrument_requests(request: Request, call_next):
    """Attach a request id and return unhandled errors as JSON."""
    request_id = request.headers.get("x-request-id") or str(uuid4())
    request.state.request_id = request_id
    token = bind_request_id(request_id)
    started_at = time.perf_counter()
    try:
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        return response
    except Exception as exc:  # noqa: BLE001
        logger.exception(
            "Unhandled error",
            extra={
                "event": "unhandled_exception",
                "fields": {
                    "method": request.method,
                    "path": request.url.path,
                    "duration_ms": round((time.perf_counter() - started_at) * 1000, 2),
                },
            },
        )
        headers = {}
        origin = request.headers.get("origin", "")
        if origin in ALLOWED_ORIGINS:
            headers = {
                "Access-Control-Allow-Origin": origin,
                "Access-Control-Allow-Credentials": "true",
                "X-Request-ID": request_id,
            }
        return JSONResponse(
            status_code=500,
            content={"detail": f"{type(exc).__name__}: {exc}"},
            headers=headers,
        )
    finally:
        reset_request_id(token)


app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(lease.router, prefix="/lease", tags=["Lease"])
app.include_router(scam.router, prefix="/scam", tags=["Scam"])
app.include_router(rights.router, prefix="/rights", tags=["Rights"])
app.include_router(match.router, prefix="/match", tags=["Match"])


@app.get("/health")
async def health_check():
    return {"status": "ok"}
