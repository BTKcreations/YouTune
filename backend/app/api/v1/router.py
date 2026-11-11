from fastapi import APIRouter
from app.api.v1.endpoints import auth, playlists, library, settings, tracks, discovery

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(playlists.router)
api_router.include_router(library.router)
api_router.include_router(settings.router)
api_router.include_router(tracks.router)
api_router.include_router(discovery.router, prefix="/explore", tags=["explore"])
api_router.include_router(discovery.router, prefix="/discovery", tags=["discovery"])
