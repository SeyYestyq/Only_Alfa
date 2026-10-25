"""Сборка всех роутеров под /api/v1."""
from fastapi import APIRouter

from app.api import applications, companies, search, suppliers

api_router = APIRouter()
api_router.include_router(companies.router)
api_router.include_router(search.router)
api_router.include_router(applications.router)
api_router.include_router(suppliers.router)
