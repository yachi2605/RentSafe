from .lease import router as lease_router
from .scam import router as scam_router
from .rights import router as rights_router
from .match import router as match_router

__all__ = ["lease_router", "scam_router", "rights_router", "match_router"]
