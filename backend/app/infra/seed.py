"""Идемпотентный сидер: 5 демо-компаний и каталог поставщиков."""
from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.infra.demo_content import CATALOG_SEED
from app.infra.demo_profiles import DEMO_COMPANIES
from app.infra.models import Company, SearchCatalogItem
from app.repositories.company_repository import CompanyRepository


def seed_companies(session: Session) -> int:
    repository = CompanyRepository(session)
    created = 0
    for profile in DEMO_COMPANIES.values():
        if repository.get_by_inn(profile.inn) is not None:
            continue
        repository.persist(profile)
        created += 1
    session.commit()
    return created


def seed_catalog(session: Session) -> int:
    created = 0
    for row in CATALOG_SEED:
        if session.get(SearchCatalogItem, row.id) is not None:
            continue
        session.add(SearchCatalogItem(
            id=row.id,
            okved_cluster=row.cluster,
            cluster_code=row.cluster_code,
            item_name=row.item_name,
            amount_rub=row.amount_rub,
            price_label=row.price_label,
            unit=row.unit,
            supplier_name=row.supplier_name,
            supplier_inn=row.supplier_inn,
            fssp_clean=row.fssp_clean,
            delivery_days=row.delivery_days,
            keywords=row.keywords,
            news_insight=row.news_insight,
        ))
        created += 1
    session.commit()
    return created


def seed_database(session: Session) -> dict[str, int]:
    """Возвращает счётчики созданного — используется в тестах на идемпотентность."""
    return {
        "companies": seed_companies(session),
        "catalog_items": seed_catalog(session),
    }
