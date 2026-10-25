"""
Доменные типы. Чистый Python: без FastAPI, SQLAlchemy и HTTP.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Optional


class ApplicationStatus(str, Enum):
    DRAFT_BY_EMPLOYEE = "DRAFT_BY_EMPLOYEE"
    ANOMALY_VERIFICATION = "ANOMALY_VERIFICATION"
    APPROVED = "APPROVED"
    COUNTER_OFFER = "COUNTER_OFFER"
    AWAITING_CEO_APPROVAL = "AWAITING_CEO_APPROVAL"
    MANUAL_REVIEW = "MANUAL_REVIEW"
    NEED_MORE_INFO = "NEED_MORE_INFO"
    REJECTED = "REJECTED"
    FUNDED = "FUNDED"


class LegalForm(str, Enum):
    IP = "IP"
    OOO = "OOO"


class UserRole(str, Enum):
    CEO_OWNER = "CEO_OWNER"
    IP_OWNER = "IP_OWNER"
    ACCOUNTANT = "ACCOUNTANT"
    UNDERWRITER = "UNDERWRITER"

    @property
    def is_signing_authority(self) -> bool:
        return self in (UserRole.CEO_OWNER, UserRole.IP_OWNER)


class ProductType(str, Enum):
    INVEST_LEASING = "INVEST_LEASING"
    VKL = "VKL"
    VKL_SEC = "VKL_SEC"
    OVERDRAFT = "OVERDRAFT"


class CollateralType(str, Enum):
    NONE = "NONE"
    REAL_ESTATE = "REAL_ESTATE"
    VEHICLE = "VEHICLE"
    EQUIPMENT = "EQUIPMENT"


class CollateralStatus(str, Enum):
    NONE = "NONE"
    DRAFT = "DRAFT"
    UNDER_REVIEW = "UNDER_REVIEW"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class DecisionOutcome(str, Enum):
    APPROVED = "APPROVED"
    COUNTER_OFFER = "COUNTER_OFFER"
    MANUAL_REVIEW = "MANUAL_REVIEW"
    REJECTED = "REJECTED"


class BusinessModel(str, Enum):
    B2C_OFFLINE = "B2C_OFFLINE"
    B2B_CONTRACTOR = "B2B_CONTRACTOR"
    WHOLESALE = "WHOLESALE"


class FactorGroup(str, Enum):
    G1_BKI = "G1"
    G2_CASHFLOW = "G2"
    G3_DEBT = "G3"
    G4_PROFILE = "G4"
    G5_SECTOR = "G5"


class StatusTone(str, Enum):
    GOOD = "GOOD"
    WARN = "WARN"
    RISK = "RISK"


@dataclass
class FactorBreakdown:
    group: str
    code: str
    label: str
    score_delta: int
    condition: str = ""


@dataclass
class ScoreResult:
    final_score: int
    raw_score: int
    is_hard_stop: bool
    hard_stop_reasons: list[str]
    factors_breakdown: list[FactorBreakdown]

    @property
    def hard_stop_reason(self) -> Optional[str]:
        return "; ".join(self.hard_stop_reasons) if self.hard_stop_reasons else None


@dataclass
class CounterOffer:
    product_type: str
    product_label: str
    amount_rub: float
    term_months: int
    rate_pct: float
    monthly_payment_rub: float
    label: str
    features: list[str] = field(default_factory=list)


@dataclass
class DecisionResult:
    outcome: DecisionOutcome
    approved_amount_rub: float
    final_rate_pct: float
    monthly_payment_rub: float
    fcf_rub: float
    max_payment_rub: float
    k_sector: float
    counter_offers: list[CounterOffer] = field(default_factory=list)
    rejection_checklist: list[str] = field(default_factory=list)


@dataclass
class CashForecastDay:
    day: int
    balance_rub: float
    trigger: Optional[str] = None


@dataclass
class RadarTrigger:
    code: str
    title: str
    value: str
    action_label: str
    severity: str = "WARN"


@dataclass
class DnaBlock:
    code: str
    title: str
    value: str
    description: str
    status: StatusTone


@dataclass
class CompanyUser:
    id: str
    full_name: str
    role: UserRole
    role_label: str


@dataclass
class CompanyProfile:
    id: str
    inn: str
    name: str
    legal_form: LegalForm
    okved_code: str
    okved_cluster: str
    business_model: BusinessModel
    director_name: str
    city: str
    address: str
    latitude: float
    longitude: float
    age_months: int
    monthly_revenue_alfa: float
    monthly_revenue_multibank: float
    declared_monthly_revenue: float
    annual_revenue: float
    purchases_monthly: float
    rent_fot_monthly: float
    taxes_monthly: float
    bki_monthly_payment: float
    bki_overdue_days: int
    bki_history_months: int
    bki_active_contracts: int
    fssp_amount: float
    revenue_growth_pct: float
    geo_score: int
    buyer_score: int
    competitors_count: int
    alfa_tenure_months: int
    alfa_revenue_share: float
    account_balance: float
    anchor_buyer: str = ""
    arbitration_claims: int = 0
    has_girbo: bool = False
    is_egrul_active: bool = True
    is_multibank_verified: bool = False
    demo_key: Optional[str] = None
    verified_supplement_codes: frozenset[str] = field(default_factory=frozenset)
    users: list[CompanyUser] = field(default_factory=list)

    @property
    def monthly_revenue_total(self) -> float:
        return self.monthly_revenue_alfa + self.monthly_revenue_multibank

    @property
    def is_individual(self) -> bool:
        return self.legal_form == LegalForm.IP
