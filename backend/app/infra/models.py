"""9 таблиц БД. JSONB используется в PostgreSQL, JSON — в SQLite для локального прогона."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship

JSONType = JSON().with_variant(JSONB, "postgresql")


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Base(DeclarativeBase):
    pass


class Company(Base):
    __tablename__ = "companies"

    id: Mapped[str] = mapped_column(String(48), primary_key=True)
    inn: Mapped[str] = mapped_column(String(12), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(255))
    legal_form: Mapped[str] = mapped_column(String(8))
    okved_code: Mapped[str] = mapped_column(String(12))
    okved_cluster: Mapped[str] = mapped_column(String(64))
    business_model: Mapped[str] = mapped_column(String(24))
    director_name: Mapped[str] = mapped_column(String(255))
    city: Mapped[str] = mapped_column(String(128))
    address: Mapped[str] = mapped_column(String(255))
    latitude: Mapped[float] = mapped_column(Float)
    longitude: Mapped[float] = mapped_column(Float)
    age_months: Mapped[int] = mapped_column(Integer)
    is_egrul_active: Mapped[bool] = mapped_column(Boolean, default=True)
    has_girbo: Mapped[bool] = mapped_column(Boolean, default=False)
    arbitration_claims: Mapped[int] = mapped_column(Integer, default=0)
    monthly_revenue_alfa: Mapped[float] = mapped_column(Float)
    monthly_revenue_multibank: Mapped[float] = mapped_column(Float, default=0.0)
    declared_monthly_revenue: Mapped[float] = mapped_column(Float)
    annual_revenue: Mapped[float] = mapped_column(Float)
    purchases_monthly: Mapped[float] = mapped_column(Float)
    rent_fot_monthly: Mapped[float] = mapped_column(Float)
    taxes_monthly: Mapped[float] = mapped_column(Float)
    bki_monthly_payment: Mapped[float] = mapped_column(Float)
    bki_overdue_days: Mapped[int] = mapped_column(Integer, default=0)
    bki_history_months: Mapped[int] = mapped_column(Integer, default=0)
    bki_active_contracts: Mapped[int] = mapped_column(Integer, default=0)
    fssp_amount: Mapped[float] = mapped_column(Float, default=0.0)
    revenue_growth_pct: Mapped[float] = mapped_column(Float, default=0.0)
    geo_score: Mapped[int] = mapped_column(Integer, default=50)
    buyer_score: Mapped[int] = mapped_column(Integer, default=50)
    competitors_count: Mapped[int] = mapped_column(Integer, default=0)
    anchor_buyer: Mapped[str] = mapped_column(String(255), default="")
    alfa_tenure_months: Mapped[int] = mapped_column(Integer, default=0)
    alfa_revenue_share: Mapped[float] = mapped_column(Float, default=0.0)
    account_balance: Mapped[float] = mapped_column(Float, default=0.0)
    is_multibank_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    verified_supplements_json: Mapped[list[str]] = mapped_column(JSONType, default=list)
    demo_key: Mapped[str | None] = mapped_column(String(32), unique=True, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    users: Mapped[list["CompanyUser"]] = relationship(back_populates="company", cascade="all, delete-orphan")
    transactions: Mapped[list["Transaction"]] = relationship(back_populates="company", cascade="all, delete-orphan")
    news: Mapped[list["NewsFeedItem"]] = relationship(back_populates="company", cascade="all, delete-orphan")


class CompanyUser(Base):
    __tablename__ = "company_users"

    id: Mapped[str] = mapped_column(String(48), primary_key=True)
    company_id: Mapped[str] = mapped_column(ForeignKey("companies.id", ondelete="CASCADE"), index=True)
    full_name: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(24))
    role_label: Mapped[str] = mapped_column(String(64))

    company: Mapped[Company] = relationship(back_populates="users")


class CompanyProfileSnapshot(Base):
    __tablename__ = "company_profiles"

    id: Mapped[str] = mapped_column(String(48), primary_key=True)
    company_id: Mapped[str] = mapped_column(ForeignKey("companies.id", ondelete="CASCADE"), unique=True)
    dna_json: Mapped[dict[str, Any]] = mapped_column(JSONType)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[str] = mapped_column(String(48), primary_key=True)
    company_id: Mapped[str] = mapped_column(ForeignKey("companies.id", ondelete="CASCADE"), index=True)
    occurred_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    description: Mapped[str] = mapped_column(String(255))
    amount_rub: Mapped[float] = mapped_column(Float)
    direction: Mapped[str] = mapped_column(String(8))
    category: Mapped[str] = mapped_column(String(64))
    can_installment: Mapped[bool] = mapped_column(Boolean, default=False)
    installment_taken: Mapped[bool] = mapped_column(Boolean, default=False)

    company: Mapped[Company] = relationship(back_populates="transactions")


class Application(Base):
    __tablename__ = "applications"

    id: Mapped[str] = mapped_column(String(48), primary_key=True)
    company_id: Mapped[str] = mapped_column(ForeignKey("companies.id", ondelete="CASCADE"), index=True)
    status: Mapped[str] = mapped_column(String(32), index=True)
    product_type: Mapped[str] = mapped_column(String(24))
    requested_amount_rub: Mapped[float] = mapped_column(Float)
    term_months: Mapped[int] = mapped_column(Integer)
    declared_monthly_revenue: Mapped[float] = mapped_column(Float)
    collateral_type: Mapped[str] = mapped_column(String(24), default="NONE")
    collateral_value_rub: Mapped[float] = mapped_column(Float, default=0.0)
    collateral_status: Mapped[str] = mapped_column(String(24), default="NONE")
    initiator_role: Mapped[str] = mapped_column(String(24))
    risk_score: Mapped[int] = mapped_column(Integer, default=0)
    raw_score: Mapped[int] = mapped_column(Integer, default=0)
    is_hard_stop: Mapped[bool] = mapped_column(Boolean, default=False)
    hard_stop_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    outcome: Mapped[str] = mapped_column(String(24))
    approved_amount_rub: Mapped[float] = mapped_column(Float, default=0.0)
    final_rate_pct: Mapped[float] = mapped_column(Float, default=0.0)
    monthly_payment_rub: Mapped[float] = mapped_column(Float, default=0.0)
    fcf_rub: Mapped[float] = mapped_column(Float, default=0.0)
    max_payment_rub: Mapped[float] = mapped_column(Float, default=0.0)
    k_sector: Mapped[float] = mapped_column(Float, default=1.0)
    factors_breakdown_json: Mapped[list[dict[str, Any]]] = mapped_column(JSONType, default=list)
    counter_offers_json: Mapped[list[dict[str, Any]]] = mapped_column(JSONType, default=list)
    rejection_checklist_json: Mapped[list[str]] = mapped_column(JSONType, default=list)
    invoice_json: Mapped[dict[str, Any] | None] = mapped_column(JSONType, nullable=True)
    selected_offer_index: Mapped[int | None] = mapped_column(Integer, nullable=True)
    context_json: Mapped[dict[str, Any]] = mapped_column(JSONType, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)


class ApplicationCheck(Base):
    __tablename__ = "application_checks"

    id: Mapped[str] = mapped_column(String(48), primary_key=True)
    application_id: Mapped[str] = mapped_column(ForeignKey("applications.id", ondelete="CASCADE"), index=True)
    check_code: Mapped[str] = mapped_column(String(32))
    status: Mapped[str] = mapped_column(String(16))
    message: Mapped[str] = mapped_column(Text)
    details_json: Mapped[dict[str, Any]] = mapped_column(JSONType, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class ApplicationEvent(Base):
    __tablename__ = "application_events"

    id: Mapped[str] = mapped_column(String(48), primary_key=True)
    application_id: Mapped[str | None] = mapped_column(
        ForeignKey("applications.id", ondelete="CASCADE"), index=True, nullable=True
    )
    company_id: Mapped[str | None] = mapped_column(String(48), index=True, nullable=True)
    event_type: Mapped[str] = mapped_column(String(48))
    actor_role: Mapped[str] = mapped_column(String(24))
    previous_status: Mapped[str | None] = mapped_column(String(32), nullable=True)
    new_status: Mapped[str | None] = mapped_column(String(32), nullable=True)
    details: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class SystemAction(Base):
    """Исходящие проактивные действия для ленты «система решила» (пилот)."""

    __tablename__ = "system_actions"

    id: Mapped[str] = mapped_column(String(48), primary_key=True)
    company_id: Mapped[str] = mapped_column(ForeignKey("companies.id", ondelete="CASCADE"), index=True)
    application_id: Mapped[str | None] = mapped_column(
        ForeignKey("applications.id", ondelete="SET NULL"), index=True, nullable=True
    )
    rule_code: Mapped[str] = mapped_column(String(48))
    title: Mapped[str] = mapped_column(String(255))
    explanation: Mapped[str] = mapped_column(Text)
    client_text: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(24), default="PENDING")
    target_screen: Mapped[str] = mapped_column(String(32), default="home")
    payload_json: Mapped[dict[str, Any]] = mapped_column(JSONType, default=dict)
    visible_to_client_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    client_opened_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    client_response: Mapped[str | None] = mapped_column(String(64), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class SearchCatalogItem(Base):
    __tablename__ = "search_catalog"

    id: Mapped[str] = mapped_column(String(48), primary_key=True)
    okved_cluster: Mapped[str] = mapped_column(String(64), index=True)
    cluster_code: Mapped[str] = mapped_column(String(8))
    item_name: Mapped[str] = mapped_column(String(255))
    amount_rub: Mapped[float] = mapped_column(Float)
    price_label: Mapped[str] = mapped_column(String(128))
    unit: Mapped[str] = mapped_column(String(32))
    supplier_name: Mapped[str] = mapped_column(String(255))
    supplier_inn: Mapped[str] = mapped_column(String(12))
    fssp_clean: Mapped[bool] = mapped_column(Boolean, default=True)
    delivery_days: Mapped[int] = mapped_column(Integer, default=3)
    keywords: Mapped[str] = mapped_column(Text, default="")
    news_insight: Mapped[str] = mapped_column(Text, default="")


class NewsFeedItem(Base):
    __tablename__ = "news_feed"

    id: Mapped[str] = mapped_column(String(48), primary_key=True)
    company_id: Mapped[str] = mapped_column(ForeignKey("companies.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(255))
    text: Mapped[str] = mapped_column(Text)
    cta: Mapped[str] = mapped_column(String(128), default="")
    cluster: Mapped[str] = mapped_column(String(64), default="")
    source: Mapped[str] = mapped_column(String(32), default="NEWS")
    meta_json: Mapped[dict[str, Any]] = mapped_column(JSONType, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    company: Mapped[Company] = relationship(back_populates="news")
