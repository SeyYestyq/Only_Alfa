"""Эндпоинты компаний: список, lookup по ИНН, дашборд Экрана 1."""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.schemas import (
    ApplicationListResponse,
    CompanyListResponse,
    DashboardResponse,
    LookupInnRequest,
    LookupInnResponse,
)
from app.infra.database import get_session
from app.services.application_service import ApplicationService
from app.services.company_service import CompanyService

router = APIRouter(tags=["companies"])


@router.get("/companies", response_model=CompanyListResponse)
def list_companies(session: Session = Depends(get_session)) -> dict:
    """5 демо-компаний и их пользователи для Demo Control Bar."""
    return CompanyService(session).list_companies()


@router.post("/companies/lookup-inn", response_model=LookupInnResponse)
def lookup_inn(body: LookupInnRequest, session: Session = Depends(get_session)) -> dict:
    """360°-портрет по любому валидному ИНН (симулятор, seed=hash(INN))."""
    return CompanyService(session).lookup_inn(body.inn)


@router.get("/companies/{company_id}/dashboard", response_model=DashboardResponse)
def company_dashboard(company_id: str, session: Session = Depends(get_session)) -> dict:
    """Данные Экрана 1: ДНК, прогноз кассы, радар, новости, выписка, чипсы."""
    return CompanyService(session).dashboard(company_id)


@router.get("/companies/{company_id}/applications", response_model=ApplicationListResponse)
def company_applications(company_id: str, session: Session = Depends(get_session)) -> dict:
    """История заявок компании (дополнительный эндпоинт для навигации SPA)."""
    return ApplicationService(session).list_for_company(company_id)
