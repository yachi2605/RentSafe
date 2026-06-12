import logging
import traceback

from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

load_dotenv()

from routers import lease, scam, rights, match

logger = logging.getLogger("rentsafe")

import os

# In production set FRONTEND_ORIGIN to the deployed frontend URL
# (e.g. https://rentsafe.vercel.app); localhost stays allowed for dev.
ALLOWED_ORIGINS = ["http://localhost:3000", "http://127.0.0.1:3000"]
if os.getenv("FRONTEND_ORIGIN"):
    ALLOWED_ORIGINS.append(os.getenv("FRONTEND_ORIGIN").rstrip("/"))

app = FastAPI(title="RentSafe API", version="2.0.0")


@app.middleware("http")
async def catch_unhandled_exceptions(request: Request, call_next):
    """Return unhandled errors as JSON with CORS headers.

    Without this, a crash produces a 500 with no CORS headers and the
    browser reports it as an opaque "Failed to fetch".
    """
    try:
        return await call_next(request)
    except Exception as exc:  # noqa: BLE001
        logger.error("Unhandled error on %s %s\n%s", request.method, request.url.path, traceback.format_exc())
        headers = {}
        origin = request.headers.get("origin", "")
        if origin in ALLOWED_ORIGINS:
            headers = {
                "Access-Control-Allow-Origin": origin,
                "Access-Control-Allow-Credentials": "true",
            }
        return JSONResponse(
            status_code=500,
            content={"detail": f"{type(exc).__name__}: {exc}"},
            headers=headers,
        )


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
