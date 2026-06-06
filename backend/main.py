from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from routers import lease, scam, rights, match

load_dotenv()

app = FastAPI(title="RentSafe API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://yourdomain.com"],
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
