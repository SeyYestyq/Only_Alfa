"""LEGACY / НЕ ПОДКЛЮЧЁН.

Старый черновик контракта (demo-profiles, transition, …).
Канон ТЗ v3.2 — роутеры companies / search / applications + openapi.yaml.
Файл оставлен только как архив; не импортировать.
"""

from fastapi import APIRouter, HTTPException, Path, Query
from typing import Optional

from app.api.schemas import (
    CompanyLookupRequest, CompanyProfileResponse,
    ApplicationCreateRequest, ApplicationResponse,
    TransitionRequest, TransitionResponse,
    MultibankVerifyResponse,
    SearchRequest, SearchResponse,
    AuditEventSchema,
    DemoProfileResponse,
)
from app.core.exceptions import (
    InvalidINN, InvalidTransition, RoleViolation, AnomalyDetected
)
from app.services.application_service import ApplicationService
from app.services.company_service import CompanyService
from app.services.search_service import SearchService

router = APIRouter()
_app_svc = ApplicationService()
_company_svc = CompanyService()
_search_svc = SearchService()


# ── 1. POST /companies/lookup-inn ─────────────────────────────────────────────
@router.post("/companies/lookup-inn", response_model=CompanyProfileResponse, tags=["company"])
def lookup_inn(body: CompanyLookupRequest):
    """Получить профиль компании по ИНН (симулятор реестров, детерминированный)."""
    try:
        return _company_svc.lookup(body.inn)
    except InvalidINN as exc:
        raise HTTPException(status_code=422, detail=str(exc))


# ── 2. GET /companies/demo-profiles ──────────────────────────────────────────
@router.get("/companies/demo-profiles", response_model=list[DemoProfileResponse], tags=["company"])
def get_demo_profiles():
    """Вернуть 5 эталонных демо-профилей BRD."""
    return _company_svc.get_demo_profiles()


# ── 3. POST /applications ─────────────────────────────────────────────────────
@router.post("/applications", response_model=ApplicationResponse, tags=["application"])
def create_application(body: ApplicationCreateRequest):
    """Создать заявку: валидация → скоринг → решение → прогноз кассы."""
    try:
        return _app_svc.create(body)
    except InvalidINN as exc:
        raise HTTPException(status_code=422, detail=str(exc))


# ── 4. GET /applications/{id} ─────────────────────────────────────────────────
@router.get("/applications/{application_id}", response_model=ApplicationResponse, tags=["application"])
def get_application(application_id: str = Path(...)):
    """Получить текущее состояние заявки."""
    result = _app_svc.get(application_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Заявка не найдена")
    return result


# ── 5. POST /applications/{id}/transition ─────────────────────────────────────
@router.post("/applications/{application_id}/transition",
             response_model=TransitionResponse, tags=["application"])
def transition_status(application_id: str, body: TransitionRequest):
    """Сменить статус заявки через State Machine."""
    try:
        return _app_svc.transition(application_id, body)
    except InvalidTransition as exc:
        raise HTTPException(status_code=409, detail=str(exc))
    except RoleViolation as exc:
        raise HTTPException(status_code=403, detail=str(exc))
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


# ── 6. POST /applications/{id}/ceo-approve ────────────────────────────────────
@router.post("/applications/{application_id}/ceo-approve",
             response_model=TransitionResponse, tags=["application"])
def ceo_approve(application_id: str, body: TransitionRequest):
    """ПЭП-подписание. Для ООО — только OWNER/CEO. Для ИП — сам предприниматель."""
    try:
        return _app_svc.ceo_approve(application_id, body)
    except RoleViolation as exc:
        raise HTTPException(status_code=403, detail=str(exc))
    except InvalidTransition as exc:
        raise HTTPException(status_code=409, detail=str(exc))
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


# ── 7. POST /applications/{id}/verify-multibank ───────────────────────────────
@router.post("/applications/{application_id}/verify-multibank",
             response_model=MultibankVerifyResponse, tags=["application"])
def verify_multibank(application_id: str):
    """Верифицировать выручку через Мультибанк (+90 баллов, лимит +25%)."""
    result = _app_svc.verify_multibank(application_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Заявка не найдена")
    return result


# ── 8. GET /applications/{id}/audit ───────────────────────────────────────────
@router.get("/applications/{application_id}/audit",
            response_model=list[AuditEventSchema], tags=["audit"])
def get_audit(application_id: str):
    """Аудит-лог всех событий по заявке."""
    return _app_svc.get_audit(application_id)


# ── 9. POST /search ───────────────────────────────────────────────────────────
@router.post("/search", response_model=SearchResponse, tags=["search"])
def smart_search(body: SearchRequest):
    """Умный бизнес-поиск: Intent Parser → каталог → режим тишины."""
    return _search_svc.search(body)


# ── 10. GET /demo/score/{profile_key} ─────────────────────────────────────────
@router.get("/demo/score/{profile_key}", response_model=ApplicationResponse, tags=["demo"])
def demo_score(profile_key: str = Path(..., description="smirnov|rosters|tekhnostroy|kovalev|bodrost_plus")):
    """Быстрый прогон скоринга по демо-профилю без создания заявки в БД."""
    result = _app_svc.demo_score(profile_key)
    if result is None:
        raise HTTPException(status_code=404, detail=f"Демо-профиль '{profile_key}' не найден")
    return result


# ── 11. POST /applications/{id}/inspector-action ──────────────────────────────
@router.post("/applications/{application_id}/inspector-action",
             response_model=TransitionResponse, tags=["application"])
def inspector_action(application_id: str, body: TransitionRequest):
    """Действие инспектора: NEED_MORE_INFO для ИП Ковалева."""
    try:
        return _app_svc.inspector_action(application_id, body)
    except (InvalidTransition, RoleViolation) as exc:
        status = 409 if isinstance(exc, InvalidTransition) else 403
        raise HTTPException(status_code=status, detail=str(exc))
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
