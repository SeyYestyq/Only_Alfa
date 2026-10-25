"""Доступ к таблицам companies / company_users / company_profiles."""
from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.constants import DEMO_KEYS
from app.domain.dna import build_dna_payload
from app.domain.types import BusinessModel, CompanyProfile, CompanyUser, LegalForm, UserRole
from app.infra.demo_content import DEMO_NEWS, DEMO_TRANSACTIONS
from app.infra.models import Company, CompanyProfileSnapshot, CompanyUser as CompanyUserModel, NewsFeedItem, Transaction


def _to_domain(company: Company) -> CompanyProfile:
    return CompanyProfile(
        id=company.id,
        inn=company.inn,
        name=company.name,
        legal_form=LegalForm(company.legal_form),
        okved_code=company.okved_code,
        okved_cluster=company.okved_cluster,
        business_model=BusinessModel(company.business_model),
        director_name=company.director_name,
        city=company.city,
        address=company.address,
        latitude=company.latitude,
        longitude=company.longitude,
        age_months=company.age_months,
        monthly_revenue_alfa=company.monthly_revenue_alfa,
        monthly_revenue_multibank=company.monthly_revenue_multibank,
        declared_monthly_revenue=company.declared_monthly_revenue,
        annual_revenue=company.annual_revenue,
        purchases_monthly=company.purchases_monthly,
        rent_fot_monthly=company.rent_fot_monthly,
        taxes_monthly=company.taxes_monthly,
        bki_monthly_payment=company.bki_monthly_payment,
        bki_overdue_days=company.bki_overdue_days,
        bki_history_months=company.bki_history_months,
        bki_active_contracts=company.bki_active_contracts,
        fssp_amount=company.fssp_amount,
        revenue_growth_pct=company.revenue_growth_pct,
        geo_score=company.geo_score,
        buyer_score=company.buyer_score,
        competitors_count=company.competitors_count,
        alfa_tenure_months=company.alfa_tenure_months,
        alfa_revenue_share=company.alfa_revenue_share,
        account_balance=company.account_balance,
        anchor_buyer=company.anchor_buyer,
        arbitration_claims=company.arbitration_claims,
        has_girbo=company.has_girbo,
        is_egrul_active=company.is_egrul_active,
        is_multibank_verified=company.is_multibank_verified,
        demo_key=company.demo_key,
        users=[
            CompanyUser(
                id=user.id,
                full_name=user.full_name,
                role=UserRole(user.role),
                role_label=user.role_label,
            )
            for user in company.users
        ],
    )


class CompanyRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def get_by_id(self, company_id: str) -> CompanyProfile | None:
        company = self.session.scalar(
            select(Company).where(Company.id == company_id).options(selectinload(Company.users))
        )
        return _to_domain(company) if company else None

    def get_by_inn(self, inn: str) -> CompanyProfile | None:
        company = self.session.scalar(
            select(Company).where(Company.inn == inn).options(selectinload(Company.users))
        )
        return _to_domain(company) if company else None

    def list_demo(self) -> list[CompanyProfile]:
        companies = self.session.scalars(
            select(Company).where(Company.demo_key.is_not(None)).options(selectinload(Company.users))
        ).all()
        order = {key: index for index, key in enumerate(DEMO_KEYS)}
        profiles = [_to_domain(company) for company in companies]
        return sorted(profiles, key=lambda profile: order.get(profile.demo_key or "", 99))

    def list_all(self) -> list[CompanyProfile]:
        companies = self.session.scalars(
            select(Company).order_by(Company.created_at).options(selectinload(Company.users))
        ).all()
        return [_to_domain(company) for company in companies]

    def persist(self, profile: CompanyProfile) -> CompanyProfile:
        """Создаёт компанию со связанными пользователями, выпиской и лентой новостей."""
        company = Company(
            id=profile.id or f"cmp_{uuid.uuid4().hex[:12]}",
            inn=profile.inn,
            name=profile.name,
            legal_form=profile.legal_form.value,
            okved_code=profile.okved_code,
            okved_cluster=profile.okved_cluster,
            business_model=profile.business_model.value,
            director_name=profile.director_name,
            city=profile.city,
            address=profile.address,
            latitude=profile.latitude,
            longitude=profile.longitude,
            age_months=profile.age_months,
            is_egrul_active=profile.is_egrul_active,
            has_girbo=profile.has_girbo,
            arbitration_claims=profile.arbitration_claims,
            monthly_revenue_alfa=profile.monthly_revenue_alfa,
            monthly_revenue_multibank=profile.monthly_revenue_multibank,
            declared_monthly_revenue=profile.declared_monthly_revenue,
            annual_revenue=profile.annual_revenue,
            purchases_monthly=profile.purchases_monthly,
            rent_fot_monthly=profile.rent_fot_monthly,
            taxes_monthly=profile.taxes_monthly,
            bki_monthly_payment=profile.bki_monthly_payment,
            bki_overdue_days=profile.bki_overdue_days,
            bki_history_months=profile.bki_history_months,
            bki_active_contracts=profile.bki_active_contracts,
            fssp_amount=profile.fssp_amount,
            revenue_growth_pct=profile.revenue_growth_pct,
            geo_score=profile.geo_score,
            buyer_score=profile.buyer_score,
            competitors_count=profile.competitors_count,
            anchor_buyer=profile.anchor_buyer,
            alfa_tenure_months=profile.alfa_tenure_months,
            alfa_revenue_share=profile.alfa_revenue_share,
            account_balance=profile.account_balance,
            is_multibank_verified=profile.is_multibank_verified,
            demo_key=profile.demo_key,
        )
        self.session.add(company)
        for user in profile.users:
            self.session.add(CompanyUserModel(
                id=user.id,
                company_id=company.id,
                full_name=user.full_name,
                role=user.role.value,
                role_label=user.role_label,
            ))
        self._seed_transactions(company.id, profile.demo_key)
        self._seed_news(company.id, profile.okved_cluster, profile.demo_key)
        self.session.add(CompanyProfileSnapshot(
            id=f"dna_{company.id}",
            company_id=company.id,
            dna_json=build_dna_payload(profile),
        ))
        self.session.flush()
        profile.id = company.id
        return profile

    def _seed_transactions(self, company_id: str, demo_key: str | None) -> None:
        rows = DEMO_TRANSACTIONS.get(demo_key or "")
        if not rows:
            rows = [
                {"id": f"trn_{uuid.uuid4().hex[:10]}", "days_ago": 3, "description": "Поступление выручки",
                 "amount_rub": 750_000, "direction": "IN", "category": "Выручка", "can_installment": False},
                {"id": f"trn_{uuid.uuid4().hex[:10]}", "days_ago": 6, "description": "Оплата поставщику",
                 "amount_rub": 260_000, "direction": "OUT", "category": "Закупки", "can_installment": True},
            ]
        now = datetime.now(timezone.utc)
        for row in rows:
            self.session.add(Transaction(
                id=row["id"],
                company_id=company_id,
                occurred_at=now - timedelta(days=row["days_ago"]),
                description=row["description"],
                amount_rub=row["amount_rub"],
                direction=row["direction"],
                category=row["category"],
                can_installment=row["can_installment"],
            ))

    def _seed_news(self, company_id: str, cluster: str, demo_key: str | None) -> None:
        rows = DEMO_NEWS.get(demo_key or "")
        if not rows:
            rows = [{"id": f"news_{uuid.uuid4().hex[:10]}", "title": "Ставка ЦБ 14% — время фиксировать лимит",
                     "text": f"Для кластера «{cluster}» доступны инвест-кредит и ВКЛ по ставке от 14.5%.",
                     "cta": "Рассчитать платёж", "cluster": "MARKET"}]
        now = datetime.now(timezone.utc)
        for index, row in enumerate(rows):
            self.session.add(NewsFeedItem(
                id=row["id"],
                company_id=company_id,
                title=row["title"],
                text=row["text"],
                cta=row["cta"],
                cluster=row["cluster"],
                source=row.get("source", "NEWS"),
                created_at=now - timedelta(hours=index * 3),
            ))

    def save_dna(self, company_id: str, profile: CompanyProfile) -> None:
        snapshot = self.session.scalar(
            select(CompanyProfileSnapshot).where(CompanyProfileSnapshot.company_id == company_id)
        )
        payload = build_dna_payload(profile)
        if snapshot is None:
            self.session.add(CompanyProfileSnapshot(
                id=f"dna_{company_id}", company_id=company_id, dna_json=payload
            ))
        else:
            snapshot.dna_json = payload
            snapshot.updated_at = datetime.now(timezone.utc)

    def sync_financial_state(
        self,
        company_id: str,
        *,
        account_balance: float,
        monthly_revenue_multibank: float,
        is_multibank_verified: bool,
        declared_monthly_revenue: float,
    ) -> None:
        company = self.session.get(Company, company_id)
        if company is None:
            return
        company.account_balance = account_balance
        company.monthly_revenue_multibank = monthly_revenue_multibank
        company.is_multibank_verified = is_multibank_verified
        company.declared_monthly_revenue = declared_monthly_revenue
