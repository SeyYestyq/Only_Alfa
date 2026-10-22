"""
Единственное место для всех числовых констант проекта.

Источник: ТЗ v3.2, раздел «Дискретная таблица правил расчёта RiskScore».
Менять пороги и баллы можно только здесь — код домена читает их отсюда.
"""
from __future__ import annotations

# ── Базовая ставка ЦБ и продуктовые спреды (ТЗ-03, п. 2) ─────────────────────
DEFAULT_CBR_KEY_RATE: float = 14.0

SPREAD_INVEST_LEASING: float = 1.5
SPREAD_VKL: float = 2.5
SPREAD_VKL_SEC: float = 4.5  # ВКЛ с залогом: ~18,5% при КС 14% и защите бизнеса
SPREAD_OVERDRAFT: float = 3.5

# Минимальное покрытие залогом для полной суммы (доля от requested)
COLLATERAL_COVERAGE_RATIO: float = 0.5

# ── Корректировка ставки по RiskScore ────────────────────────────────────────
RATE_ADJUSTMENT_HIGH: float = -1.0   # RiskScore >= 750
RATE_ADJUSTMENT_MID: float = 0.0     # 650..749
RATE_ADJUSTMENT_LOW: float = 2.5     # 520..649 и ниже

RATE_ADJUSTMENT_HIGH_MIN_SCORE: int = 750
RATE_ADJUSTMENT_MID_MIN_SCORE: int = 650

# ── Границы коридоров решений ────────────────────────────────────────────────
SCORE_APPROVED_MIN: int = 650
SCORE_COUNTER_OFFER_MIN: int = 520
SCORE_MANUAL_REVIEW_MIN: int = 450

SCORE_BASE: int = 500
SCORE_MIN: int = 0
SCORE_MAX: int = 1000

# ── Формула MaxPayment ───────────────────────────────────────────────────────
MAX_PAYMENT_FCF_RATIO: float = 0.5
K_SECTOR_HIGH: float = 1.15
K_SECTOR_MID: float = 1.00
K_SECTOR_LOW: float = 0.85

GEO_SCORE_HIGH_THRESHOLD: int = 75
GEO_SCORE_LOW_THRESHOLD: int = 45
BUYER_SCORE_HIGH_THRESHOLD: int = 75

# ── Дискретные баллы факторов (без диапазонов, ТЗ §2) ────────────────────────
FACTOR_POINTS: dict[str, int] = {
    # Группа 1. Платёжная дисциплина БКИ (вес 25%)
    "BKI_CLEAN_HIGH": 130,
    "BKI_CLEAN_STD": 80,
    "BKI_NO_HISTORY": 0,
    "BKI_TECH_OVERDUE": -85,
    "BKI_STOP_OVERDUE": -180,
    # Группа 2. Финансовый поток и Мультибанк (вес 30%)
    "CF_MULTIBANK_VERIFIED": 90,
    "CF_GROWTH_HIGH": 65,
    "CF_STABLE_POSITIVE": 50,
    "CF_CRITICAL_DROP": -200,
    # Группа 3. Долговая нагрузка ПДН / DSCR (вес 20%)
    "DSCR_LOW_LOAD": 25,
    "DSCR_MED_LOAD": 0,
    "DSCR_CRITICAL_LOAD": -150,
    # Группа 4. Профиль бизнеса ФНС и ОПФ (вес 10%)
    "PROF_CORP_GIRBO": 40,
    "PROF_ESTABLISHED": 20,
    "PROF_YOUNG_12_24M": 10,
    "PROF_NEUTRAL": 0,
    "PROF_RISK_CLAIMS": -100,
    # Группа 5. Отраслевой потенциал Geo / Buyer (вес 15%)
    "SEC_HIGH_GEO": 75,
    "SEC_HIGH_BUYER": 25,
    "SEC_MID_GEO": 20,
    "SEC_NEUTRAL": 0,
    "SEC_LOW_COMPETITION": -90,
}

FACTOR_GROUP_TITLES: dict[str, str] = {
    "G1": "Платёжная дисциплина БКИ",
    "G2": "Финансовый поток и Мультибанк",
    "G3": "Долговая нагрузка ПДН / DSCR",
    "G4": "Профиль бизнеса ФНС и ОПФ",
    "G5": "Отраслевой потенциал Geo / Buyer",
    "G0": "Базовый уровень модели",
}

# ── Правила выбора дискретного уровня ────────────────────────────────────────
BKI_HARD_STOP_OVERDUE_DAYS: int = 30
BKI_TECH_OVERDUE_MIN_DAYS: int = 5
BKI_TECH_OVERDUE_MAX_DAYS: int = 25
BKI_CLEAN_HIGH_MIN_HISTORY_MONTHS: int = 24

CF_GROWTH_HIGH_MIN_PCT: float = 15.0
CF_CRITICAL_DROP_PCT: float = -30.0

DSCR_LOW_LOAD_MAX_RATIO: float = 0.25
DSCR_MED_LOAD_MAX_RATIO: float = 0.50

MIN_COMPANY_AGE_MONTHS: int = 3
CORP_GIRBO_MIN_AGE_MONTHS: int = 36
ESTABLISHED_MIN_AGE_MONTHS: int = 24
YOUNG_MIN_AGE_MONTHS: int = 12
YOUNG_MAX_AGE_MONTHS: int = 24
PROFILE_POSITIVE_MIN_GROWTH_PCT: float = -30.0

FSSP_HARD_STOP_SHARE: float = 0.20

# ── Аномалия выручки и Мультибанк ────────────────────────────────────────────
ANOMALY_REVENUE_DEVIATION_THRESHOLD: float = 0.50
MULTIBANK_LIMIT_BOOST: float = 0.25
MULTIBANK_DEFAULT_SHARE_OF_ALFA: float = 0.35
MULTIBANK_REVENUE_TEKHNOSTROY: float = 4_200_000.0

# ── Прогноз кассы ────────────────────────────────────────────────────────────
CASH_FORECAST_DAYS: int = 60
CASH_FORECAST_RENT_DAYS: tuple[int, ...] = (14, 44)
DAYS_IN_MONTH: int = 30
DAYS_IN_YEAR: int = 365

# ── Валидация ИНН ────────────────────────────────────────────────────────────
INN_LENGTH_LEGAL_ENTITY: int = 10
INN_LENGTH_INDIVIDUAL: int = 12

# ── Пост-транзакционная рассрочка ────────────────────────────────────────────
INSTALLMENT_MIN_MONTHS: int = 3
INSTALLMENT_MAX_MONTHS: int = 6
INSTALLMENT_RATE_PCT: float = 0.0

# ── Лестница лимитов для ручного разбора ─────────────────────────────────────
MANUAL_REVIEW_STARTER_LIMIT: float = 300_000.0
MANUAL_REVIEW_MAX_LIMIT: float = 750_000.0

# ── Банковская экономика для Экрana 3 (P&L) ─────────────────────────────────
BANK_OPEX_SHARE: float = 0.005
BANK_LTV_MULTIPLIER: float = 1.4
BANK_MAX_PD: float = 0.15
BANK_FUNDING_AVERAGE_BALANCE_SHARE: float = 0.55
# Доля закупок в обороте, выше которой радар показывает CAPEX-сигнал.
CAPEX_HIGH_SHARE_THRESHOLD: float = 0.45

# ── Умный поиск ──────────────────────────────────────────────────────────────
SEARCH_DEFAULT_TERM_MONTHS: dict[str, int] = {
    "CAPEX": 24,
    "WORKING_CAPITAL": 12,
    "OVERDRAFT": 6,
}
SEARCH_DEFAULT_AMOUNT_RUB: dict[str, float] = {
    "CAPEX": 900_000.0,
    "WORKING_CAPITAL": 3_200_000.0,
    "OVERDRAFT": 500_000.0,
}
SEARCH_SUPPLIERS_LIMIT: int = 3
SEARCH_BALANCE_SILENCE_RATIO: float = 1.2

# ── ИИ-адаптер ───────────────────────────────────────────────────────────────
OPENAI_DEFAULT_TIMEOUT_MS: int = 1500
AI_MODE_DETERMINISTIC: str = "DETERMINISTIC"
AI_MODE_OPENAI_COMPATIBLE: str = "OPENAI_COMPATIBLE"

# ── Демо-ключи 5 эталонных профилей ──────────────────────────────────────────
DEMO_KEYS: tuple[str, ...] = (
    "smirnov",
    "rosters",
    "tekhnostroy",
    "kovalev",
    "bodrost_plus",
)

# ── Аудит ────────────────────────────────────────────────────────────────────
EVENT_TYPE_STATUS_CHANGE: str = "STATUS_CHANGE"
ACTOR_SYSTEM: str = "SYSTEM"
