from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import settings
from app.database import get_pool, close_connections
from app.routers import auth, warden, mess, dean, student, environment, chat


@asynccontextmanager
async def lifespan(app: FastAPI):
    await get_pool()
    yield
    await close_connections()


app = FastAPI(title="UniVitals API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_origins(),
    allow_origin_regex=settings.allowed_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/admin/auth", tags=["auth"])
app.include_router(warden.router, prefix="/api/admin/warden", tags=["warden"])
app.include_router(mess.router, prefix="/api/admin/mess", tags=["mess"])
app.include_router(dean.router, prefix="/api/admin/dean", tags=["dean"])
app.include_router(student.router, prefix="/api/student", tags=["student"])
app.include_router(environment.router, prefix="/api/environment", tags=["environment"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])


@app.get("/health")
async def health():
    return {"status": "ok"}
