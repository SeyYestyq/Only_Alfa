"""Умный поиск Search-to-Credit."""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.schemas import SmartSearchRequest, SmartSearchResponse
from app.infra.database import get_session
from app.services.search_service import SearchService

router = APIRouter(tags=["smart-search"])


@router.post("/companies/{company_id}/smart-search", response_model=SmartSearchResponse)
async def smart_search(
    company_id: str,
    body: SmartSearchRequest,
    session: Session = Depends(get_session),
) -> dict:
    """Intent Parser (4 класса) → поставщики → плашка или Режим тишины."""
    return await SearchService(session).search(company_id, body.query)
