import os

from fastapi import FastAPI
from fastapi.middleware.cors import (
    CORSMiddleware,
)

from app.core.database import (
    Base,
    engine,
)

from app.models.user import User
from app.models.meeting import Meeting
from app.models.message import Message

from app.models.participant import (
    MeetingParticipant,
)

from app.routers.auth import (
    router as auth_router,
)

from app.routers.meetings import (
    router as meetings_router,
)

from app.websocket.meeting_ws import (
    router as websocket_router,
)


app = FastAPI(
    title="ZoomClone API",
    version="1.0.0",
)


FRONTEND_URL = os.getenv(
    "FRONTEND_URL",
    "http://localhost:3000",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        FRONTEND_URL
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


Base.metadata.create_all(
    bind=engine
)


app.include_router(
    auth_router
)

app.include_router(
    meetings_router
)

app.include_router(
    websocket_router
)


@app.get("/")
def root():
    return {
        "message":
            "ZoomClone API is running"
    }


@app.get("/health")
def health():
    return {
        "status": "ok"
    }