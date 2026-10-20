"""Точка входа FastAPI-монолита."""
from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.router import api_router
from app.core.config import settings
from app.core.exceptions import DomainError
from app.infra.database import SessionLocal, create_schema
from app.infra.seed import seed_database


@asynccontextmanager
async def lifespan(_: FastAPI):
    create_schema()
    with SessionLocal() as session:
        seed_database(session)
    yield


app = FastAPI(
    title="Умный кредитный кабинет предпринимателя",
    description=(
        "Only_Alfa · хакатон «Альфа-Будущее». 11 эндпоинтов ТЗ v3.2: "
        "360°-ДНК, дискретный RiskScore, Decision Engine, Мультибанк, ПЭП, Xray."
    ),
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(DomainError)
async def domain_error_handler(_: Request, exc: DomainError) -> JSONResponse:
    return JSONResponse(status_code=exc.http_status, content={"detail": exc.message})


app.include_router(api_router, prefix="/api/v1")


@app.get("/health", tags=["system"])
def health() -> dict:
    return {
        "status": "ok",
        "service": "only-alfa-backend",
        "cbr_key_rate": settings.cbr_key_rate,
        "ai_provider_mode": settings.ai_provider_mode,
        "database": settings.database_url.split("://", 1)[0],
    }
