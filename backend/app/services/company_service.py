"""Сценарии работы с компанией: список, поиск по ИНН, дашборд Экрана 1."""
from __future__ import annotations

from sqlalchemy.orm import Session

from app.core.exceptions import EntityNotFound
from app.domain.types import CompanyProfile
from app.infra.demo_content import SEARCH_CHIPS_BY_CLUSTER, SEARCH_CHIPS_BY_DEMO_KEY
from app.infra.demo_profiles import DEMO_COMPANIES
from app.infra.models import Application, ApplicationCheck, ApplicationEvent, Company, Transaction
from app.infra.registry_simulator import simulate_company, validate_inn
from app.repositories.catalog_repository import CatalogRepository
from app.repositories.company_repository import CompanyRepository
from app.repositories.transaction_repository import TransactionRepository
from app.services.presenters import company_brief, company_detail, dashboard_payload


def cluster_key(profile: CompanyProfile) -> str:
    code = profile.okved_code.split(".")[0]
    if code == "56":
        return "HORECA"
    if code in {"41", "42", "43"}:
        return "CONSTRUCTION"
    if code in {"45", "46", "47"}:
        return "RETAIL"
    if code in {"69", "70", "71", "72", "73", "74", "75"}:
        return "SERVICES"
    return "PRODUCTION"


class CompanyService:
    def __init__(self, session: Session) -> None:
        self.session = session
        self.companies = CompanyRepository(session)
        self.transactions = TransactionRepository(session)
        self.catalog = CatalogRepository(session)

    def list_companies(self) -> dict:
        profiles = self.companies.list_demo()
        return {"companies": [company_brief(profile) for profile in profiles]}

    def lookup_inn(self, inn: str) -> dict:
        existing = self.companies.get_by_inn(inn)
        if existing is not None:
            return {"company": company_detail(existing), "source": "DEMO_SEED" if existing.demo_key else "DATABASE"}

        validate_inn(inn)
        profile = simulate_company(inn)
        profile = self.companies.persist(profile)
        self.session.commit()
        return {"company": company_detail(profile), "source": "REGISTRY_SIMULATOR"}

    def get_profile(self, company_id: str) -> CompanyProfile:
        profile = self.companies.get_by_id(company_id)
        if profile is None:
            raise EntityNotFound(f"Компания {company_id} не найдена")
        return profile

    def dashboard(self, company_id: str) -> dict:
        profile = self.get_profile(company_id)
        transactions = self.transactions.list_by_company(company_id)
        news = self.catalog.list_news(company_id)
        chips = SEARCH_CHIPS_BY_DEMO_KEY.get(profile.demo_key or "") or SEARCH_CHIPS_BY_CLUSTER.get(
            cluster_key(profile),
            SEARCH_CHIPS_BY_CLUSTER["HORECA"],
        )
        return dashboard_payload(profile, transactions, news, chips)

    def reset_demo(self) -> dict:
        """Сброс всех сценариев к исходному состоянию (заявки, события, балансы, проверки)."""
        self.session.query(ApplicationEvent).delete()
        self.session.query(ApplicationCheck).delete()
        self.session.query(Application).delete()

        self.session.query(Transaction).update({"installment_taken": False})

        for key, profile in DEMO_COMPANIES.items():
            comp = self.session.query(Company).filter(Company.inn == profile.inn).first()
            if comp:
                comp.account_balance = profile.account_balance
                comp.monthly_revenue_multibank = 0.0
                comp.is_multibank_verified = False
                comp.declared_monthly_revenue = profile.declared_monthly_revenue
                self.companies.save_dna(comp.id, profile)

        self.session.commit()
        return {"ok": True, "message": "Все демо-сценарии успешно сброшены к исходному состоянию"}

