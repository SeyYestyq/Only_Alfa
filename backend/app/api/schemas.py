"""Pydantic-схемы API. Только контракт входа/выхода, без бизнес-логики."""
from __future__ import annotations

from typing import Any, Literal, Optional

from pydantic import BaseModel, Field

ProductTypeLiteral = Literal["INVEST_LEASING", "VKL", "OVERDRAFT"]
ActorRoleLiteral = Literal["CEO_OWNER", "IP_OWNER", "ACCOUNTANT", "UNDERWRITER"]
UnderwriterActionLiteral = Literal["APPROVE", "COUNTER_OFFER", "NEED_MORE_INFO", "REJECT"]


# ── Компании ────────────────────────────────────────────────────────────────
class CompanyUserSchema(BaseModel):
    id: str
    full_name: str
    role: str
    role_label: str


class CompanyBriefSchema(BaseModel):
    id: str
    inn: str
    name: str
    legal_form: str
    okved_code: str
    okved_cluster: str
    account_balance: float
    demo_key: Optional[str] = None
    users: list[CompanyUserSchema]


class CompanyDetailSchema(CompanyBriefSchema):
    director_name: str
    city: str
    address: str
    latitude: float
    longitude: float
    age_months: int
    is_egrul_active: bool
    business_model: str
    annual_revenue: float
    monthly_revenue_alfa: float
    monthly_revenue_multibank: float
    declared_monthly_revenue: float
    revenue_growth_pct: float
    geo_score: int
    buyer_score: int
    competitors_count: int
    anchor_buyer: str
    bki_overdue_days: int
    bki_history_months: int
    fssp_amount: float
    is_multibank_verified: bool


class CompanyListResponse(BaseModel):
    companies: list[CompanyBriefSchema]


class LookupInnRequest(BaseModel):
    inn: str = Field(..., min_length=10, max_length=12, pattern=r"^\d{10,12}$")


class LookupInnResponse(BaseModel):
    company: CompanyDetailSchema
    source: str


# ── Дашборд ─────────────────────────────────────────────────────────────────
class DnaBlockSchema(BaseModel):
    code: str
    title: str
    value: str
    description: str
    status: str


class BusinessDnaSchema(BaseModel):
    blocks: list[DnaBlockSchema]
    completeness_pct: int


class ForecastDaySchema(BaseModel):
    day: int
    date: str
    balance_rub: float
    trigger: Optional[str] = None


class CashForecastSchema(BaseModel):
    days: list[ForecastDaySchema]
    min_balance_rub: float
    min_day: int
    days_negative: int
    has_gap: bool


class RadarTriggerSchema(BaseModel):
    code: str
    title: str
    value: str
    action_label: str
    severity: str


class NewsItemSchema(BaseModel):
    id: str
    title: str
    text: str
    cta: str
    cluster: str
    source: str
    created_at: str


class TransactionSchema(BaseModel):
    id: str
    occurred_at: str
    description: str
    amount_rub: float
    direction: str
    category: str
    can_installment: bool
    installment_taken: bool


class DashboardResponse(BaseModel):
    company: CompanyDetailSchema
    business_dna: BusinessDnaSchema
    cash_forecast: CashForecastSchema
    radar_triggers: list[RadarTriggerSchema]
    news_feed: list[NewsItemSchema]
    transactions: list[TransactionSchema]
    search_chips: list[str]
    account_balance: float
    okved_cluster: str


# ── Умный поиск ─────────────────────────────────────────────────────────────
class SmartSearchRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=500)


class MarketPriceSchema(BaseModel):
    item: str
    price_rub: float
    price_label: str
    unit: str
    supplier_name: str


class SupplierSchema(BaseModel):
    name: str
    inn: str
    fssp_amount_rub: float
    fssp_label: str
    is_verified: bool
    price_label: str
    delivery_days: int


class CreditBadgeSchema(BaseModel):
    product_type: str
    product_label: str
    amount_rub: float
    term_months: int
    rate_pct: float
    monthly_payment_rub: float
    max_payment_rub: float
    limit_rub: float
    is_preapproved: bool
    query: str
    disclaimer: str


class AiEnrichmentSchema(BaseModel):
    text: str
    model: str
    latency_ms: float


class SmartSearchResponse(BaseModel):
    query: str
    intent: str
    intent_label: str
    silence_mode: bool
    silence_reason: Optional[str] = None
    amount_estimate_rub: float
    amount_source: str
    market_prices: list[MarketPriceSchema]
    suppliers: list[SupplierSchema]
    credit_badge: Optional[CreditBadgeSchema] = None
    news_item: Optional[NewsItemSchema] = None
    classification_ms: float
    ai_provider_mode: str
    ai_enrichment: Optional[AiEnrichmentSchema] = None
    total_ms: float


# ── Заявка ──────────────────────────────────────────────────────────────────
class ApplicationCreateRequest(BaseModel):
    company_id: str
    product_type: ProductTypeLiteral
    requested_amount_rub: float = Field(..., gt=0)
    term_months: int = Field(..., ge=1, le=120)
    declared_monthly_revenue: float = Field(..., gt=0)
    actor_role: ActorRoleLiteral = "ACCOUNTANT"
    draft_application_id: Optional[str] = None


class FactorSchema(BaseModel):
    group: str
    code: str
    label: str
    score_delta: int
    condition: str


class CounterOfferSchema(BaseModel):
    index: int
    product_type: str
    product_label: str
    amount_rub: float
    term_months: int
    rate_pct: float
    monthly_payment_rub: float
    label: str
    features: list[str]


class CheckSchema(BaseModel):
    id: str
    code: str
    status: str
    message: str
    details: dict[str, Any]
    created_at: Optional[str] = None


class AnomalySchema(BaseModel):
    detected: bool
    declared_monthly_revenue: float
    alfa_monthly_revenue: float
    deviation_pct: float
    message: str


class MultibankInfoSchema(BaseModel):
    available: bool
    verified: bool
    external_revenue_rub: float


class ApplicationSchema(BaseModel):
    application_id: str
    company: CompanyBriefSchema
    status: str
    status_label: str
    outcome: str
    outcome_label: str
    product_type: str
    product_label: str
    risk_score: int
    raw_score: int
    is_hard_stop: bool
    hard_stop_reason: Optional[str] = None
    requested_amount_rub: float
    approved_amount_rub: float
    term_months: int
    final_rate_pct: float
    monthly_payment_rub: float
    declared_monthly_revenue: float
    monthly_revenue_alfa: float
    monthly_revenue_multibank: float
    fcf_rub: float
    max_payment_rub: float
    k_sector: float
    factors_breakdown: list[FactorSchema]
    counter_offers: list[CounterOfferSchema]
    rejection_checklist: list[str]
    selected_offer_index: Optional[int] = None
    anomaly: Optional[AnomalySchema] = None
    checks: list[CheckSchema]
    multibank: MultibankInfoSchema
    invoice: Optional[dict[str, Any]] = None
    account_balance: float
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class MultibankVerifyResponse(BaseModel):
    application: ApplicationSchema
    previous_score: int
    new_score: int
    score_delta: int
    previous_limit: float
    new_limit: float
    external_revenue_rub: float


class AcceptOfferRequest(BaseModel):
    offer_index: int = Field(..., ge=1, le=4)
    actor_role: ActorRoleLiteral = "ACCOUNTANT"


class CeoApproveRequest(BaseModel):
    actor_role: ActorRoleLiteral


class UnderwriterActionRequest(BaseModel):
    action: UnderwriterActionLiteral
    actor_role: ActorRoleLiteral = "UNDERWRITER"
    comment: Optional[str] = None
    document_name: Optional[str] = None


class DraftSummarySchema(BaseModel):
    application_id: str
    status: str
    risk_score: int
    requested_amount_rub: float
    created_at: Optional[str] = None


class ApplicationListResponse(BaseModel):
    applications: list[DraftSummarySchema]


# ── Счёт ────────────────────────────────────────────────────────────────────
class InvoiceSchema(BaseModel):
    source: str
    supplier_name: str
    supplier_inn: str
    amount_rub: float
    vat_rub: float
    purpose: str
    template_code: Optional[str] = None


class AntifraudSchema(BaseModel):
    is_verified: bool
    egrul_status: str
    fssp_amount_rub: float
    message: str


class ParseInvoiceResponse(BaseModel):
    invoice: InvoiceSchema
    antifraud: AntifraudSchema
    draft: ApplicationSchema
    parsing_ms: float


class InvoiceTemplateSchema(BaseModel):
    code: str
    file_name: str
    supplier_name: str
    supplier_inn: str
    amount_rub: float
    vat_rub: float
    purpose: str
    company_demo_key: str


class InstallmentRequest(BaseModel):
    months: int = Field(..., ge=3, le=6)


class InstallmentResponse(BaseModel):
    transaction_id: str
    months: int
    monthly_payment_rub: float
    restored_amount_rub: float
    account_balance: float


# ── Xray ────────────────────────────────────────────────────────────────────
class BankPnlSchema(BaseModel):
    requested_amount_rub: float
    approved_amount_rub: float
    expected_interest_income_rub: float
    funding_cost_rub: float
    risk_cost_rub: float
    opex_rub: float
    expected_margin_rub: float
    margin_pct: float
    ltv_rub: float
    approval_probability_pct: int
    probability_of_default_pct: float


class GeoSchema(BaseModel):
    map_url: str
    latitude: float
    longitude: float
    geo_score: int
    buyer_score: int
    competitors_count: int
    business_model: str
    anchor_buyer: str
    city: str
    address: str


class BankValueSchema(BaseModel):
    title: str
    points: list[str]
    pdf_value: list[str]
    cash_forecast_value: list[str]


class EventSchema(BaseModel):
    id: str
    event_type: str
    actor_role: str
    previous_status: Optional[str] = None
    new_status: Optional[str] = None
    details: str
    created_at: Optional[str] = None


class CashGapSummarySchema(BaseModel):
    min_balance_rub: float
    min_day: int
    days_negative: int
    has_gap: bool


class WaterfallSchema(BaseModel):
    base_score: int
    factors: list[FactorSchema]
    final_score: int
    raw_score: int


class XrayResponse(BaseModel):
    application: ApplicationSchema
    bank_pnl: BankPnlSchema
    waterfall: WaterfallSchema
    geo: GeoSchema
    bank_value: BankValueSchema
    events: list[EventSchema]
    checks: list[CheckSchema]
    cash_forecast_summary: CashGapSummarySchema
