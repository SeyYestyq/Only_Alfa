"""Экран 3: P&L банка, Waterfall скоринга, карта OSM, аудит заявки."""
from __future__ import annotations

from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.constants import (
    BANK_FUNDING_AVERAGE_BALANCE_SHARE,
    BANK_LTV_MULTIPLIER,
    BANK_MAX_PD,
    BANK_OPEX_SHARE,
    SCORE_BASE,
)
from app.core.exceptions import EntityNotFound
from app.domain.cash_forecast import build_cash_forecast, find_cash_gap
from app.domain.decision.decision_engine import calculate_rate
from app.domain.types import ProductType
from app.repositories.application_repository import ApplicationRepository
from app.repositories.company_repository import CompanyRepository
from app.services.application_service import ApplicationService
from app.services.presenters import event_row, money


def _fmt_money(value: float) -> str:
    return f"{value:,.0f} ₽".replace(",", " ")


class XrayService:
    def __init__(self, session: Session) -> None:
        self.session = session
        self.applications = ApplicationRepository(session)
        self.companies = CompanyRepository(session)
        self.application_service = ApplicationService(session)

    def build(self, application_id: str) -> dict:
        application = self.applications.get(application_id)
        if application is None:
            raise EntityNotFound(f"Заявка {application_id} не найдена")
        profile = self.companies.get_by_id(application.company_id)
        if profile is None:
            raise EntityNotFound("Компания заявки не найдена")

        detail = self.application_service.detail(application_id)
        events = [event_row(event) for event in self.applications.list_events(application_id)]
        forecast = build_cash_forecast(profile)
        min_day, min_balance, days_negative = find_cash_gap(forecast)
        amount = application.approved_amount_rub or application.requested_amount_rub
        rate = application.final_rate_pct or calculate_rate(
            application.risk_score, ProductType(application.product_type), key_rate_pct=settings.cbr_key_rate
        )
        months = application.term_months or 12
        score = application.risk_score

        expected_income = amount * rate / 100 * months / 12
        # Аннуитет гасится равными платежами: фондирование считаем на средний остаток.
        funding_cost = (
            amount
            * settings.cbr_key_rate
            / 100
            * months
            / 12
            * BANK_FUNDING_AVERAGE_BALANCE_SHARE
        )
        probability_of_default = min(
            BANK_MAX_PD,
            max(0.01, (1000 - score) / 1000 * BANK_MAX_PD),
        )
        if application.is_hard_stop:
            probability_of_default = BANK_MAX_PD
        risk_cost = amount * probability_of_default
        opex = amount * BANK_OPEX_SHARE
        margin = expected_income - funding_cost - risk_cost - opex

        bbox = (
            f"{profile.longitude - 0.012:.4f},{profile.latitude - 0.006:.4f},"
            f"{profile.longitude + 0.012:.4f},{profile.latitude + 0.006:.4f}"
        )
        map_url = (
            "https://www.openstreetmap.org/export/embed.html"
            f"?bbox={bbox}&layer=mapnik&marker={profile.latitude:.4f},{profile.longitude:.4f}"
        )

        return {
            "application": detail,
            "bank_pnl": {
                "requested_amount_rub": money(amount),
                "approved_amount_rub": money(application.approved_amount_rub),
                "expected_interest_income_rub": money(expected_income),
                "funding_cost_rub": money(funding_cost),
                "risk_cost_rub": money(risk_cost),
                "opex_rub": money(opex),
                "expected_margin_rub": money(margin),
                "margin_pct": round((margin / amount * 100) if amount else 0.0, 2),
                "ltv_rub": money(expected_income * BANK_LTV_MULTIPLIER),
                "approval_probability_pct": max(2, min(99, int(score / 10))),
                "probability_of_default_pct": round(probability_of_default * 100, 2),
            },
            "waterfall": {
                "base_score": SCORE_BASE,
                "factors": detail["factors_breakdown"],
                "final_score": application.risk_score,
                "raw_score": application.raw_score,
            },
            "geo": {
                "map_url": map_url,
                "latitude": profile.latitude,
                "longitude": profile.longitude,
                "geo_score": profile.geo_score,
                "buyer_score": profile.buyer_score,
                "competitors_count": profile.competitors_count,
                "business_model": profile.business_model.value,
                "anchor_buyer": profile.anchor_buyer,
                "city": profile.city,
                "address": profile.address,
            },
            "bank_value": {
                "title": "Почему это выгодно банку",
                "points": [
                    "PDF-счёт превращается в черновик заявки автоматически: ИНН, сумма и НДС извлечены и проверены по ЕГРЮЛ/ФССП.",
                    "60-дневный прогноз кассы показывает разрыв до выдачи кредита — банк видит целевое назначение, а не «деньги на всё».",
                    "Мультибанк-верификация снимает аномалию выручки и снижает стоимость риска за счёт подтверждённых оборотов.",
                    f"Расчётный LTV по сделке — {_fmt_money(expected_income * BANK_LTV_MULTIPLIER)} "
                    f"при ожидаемой марже {_fmt_money(margin)}.",
                ],
                "pdf_value": [
                    "Автоматическое распознавание ИНН и суммы сокращает ввод заявки с 12 минут до 40 секунд.",
                    "Проверка контрагента до оплаты снижает риск мошенничества и невозврата целевого кредита.",
                ],
                "cash_forecast_value": [
                    f"Минимальный остаток на счёте за 60 дней: {_fmt_money(min_balance)} (день {min_day}).",
                    f"Дней в минусе: {days_negative}. Это основание для овердрафта или корректировки лимита.",
                ],
            },
            "events": events,
            "checks": detail["checks"],
            "cash_forecast_summary": {
                "min_balance_rub": money(min_balance),
                "min_day": min_day,
                "days_negative": days_negative,
                "has_gap": min_balance < 0,
            },
        }
