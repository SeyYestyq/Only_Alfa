"""Преобразование доменных сущностей в контрактные dict-структуры API."""
from __future__ import annotations

from datetime import date, datetime, timedelta, timezone

from app.domain.cash_forecast import build_cash_forecast, detect_radar_triggers, find_cash_gap
from app.domain.dna import build_dna_payload
from app.domain.finances import calculate_credit_limit
from app.domain.types import ApplicationStatus, CompanyProfile
from app.infra.models import Application, ApplicationCheck, ApplicationEvent, NewsFeedItem, Transaction

STATUS_LABELS = {
    ApplicationStatus.DRAFT_BY_EMPLOYEE.value: "Черновик от сотрудника",
    ApplicationStatus.ANOMALY_VERIFICATION.value: "Требуется подтверждение выручки",
    ApplicationStatus.APPROVED.value: "Одобрено",
    ApplicationStatus.COUNTER_OFFER.value: "Есть встречные предложения",
    ApplicationStatus.AWAITING_CEO_APPROVAL.value: "Ожидает подписания ПЭП",
    ApplicationStatus.MANUAL_REVIEW.value: "На ручном разборе",
    ApplicationStatus.NEED_MORE_INFO.value: "Нужны документы",
    ApplicationStatus.REJECTED.value: "Отказ",
    ApplicationStatus.FUNDED.value: "Профинансировано",
}

OUTCOME_LABELS = {
    "APPROVED": "Одобрено",
    "COUNTER_OFFER": "Встречное предложение",
    "MANUAL_REVIEW": "Ручной разбор",
    "REJECTED": "Отказ",
}

PRODUCT_LABELS = {
    "INVEST_LEASING": "Инвест-кредит / лизинг",
    "VKL": "Возобновляемая кредитная линия",
    "OVERDRAFT": "Овердрафт",
}


def money(value: float) -> float:
    return round(float(value or 0), 2)


def iso(value: datetime | None) -> str | None:
    if value is None:
        return None
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    return value.isoformat()


def user_row(user) -> dict:
    return {
        "id": user.id,
        "full_name": user.full_name,
        "role": user.role.value,
        "role_label": user.role_label,
    }


def company_brief(profile: CompanyProfile) -> dict:
    return {
        "id": profile.id,
        "inn": profile.inn,
        "name": profile.name,
        "legal_form": profile.legal_form.value,
        "okved_code": profile.okved_code,
        "okved_cluster": profile.okved_cluster,
        "account_balance": money(profile.account_balance),
        "demo_key": profile.demo_key,
        "users": [user_row(user) for user in profile.users],
    }


def company_detail(profile: CompanyProfile) -> dict:
    return {
        **company_brief(profile),
        "director_name": profile.director_name,
        "city": profile.city,
        "address": profile.address,
        "latitude": profile.latitude,
        "longitude": profile.longitude,
        "age_months": profile.age_months,
        "is_egrul_active": profile.is_egrul_active,
        "business_model": profile.business_model.value,
        "annual_revenue": money(profile.annual_revenue),
        "monthly_revenue_alfa": money(profile.monthly_revenue_alfa),
        "monthly_revenue_multibank": money(profile.monthly_revenue_multibank),
        "declared_monthly_revenue": money(profile.declared_monthly_revenue),
        "revenue_growth_pct": profile.revenue_growth_pct,
        "geo_score": profile.geo_score,
        "buyer_score": profile.buyer_score,
        "competitors_count": profile.competitors_count,
        "anchor_buyer": profile.anchor_buyer,
        "bki_overdue_days": profile.bki_overdue_days,
        "bki_history_months": profile.bki_history_months,
        "fssp_amount": money(profile.fssp_amount),
        "is_multibank_verified": profile.is_multibank_verified,
    }


def transaction_row(transaction: Transaction) -> dict:
    return {
        "id": transaction.id,
        "occurred_at": iso(transaction.occurred_at),
        "description": transaction.description,
        "amount_rub": money(transaction.amount_rub),
        "direction": transaction.direction,
        "category": transaction.category,
        "can_installment": transaction.can_installment and not transaction.installment_taken,
        "installment_taken": transaction.installment_taken,
    }


def news_row(item: NewsFeedItem) -> dict:
    return {
        "id": item.id,
        "title": item.title,
        "text": item.text,
        "cta": item.cta,
        "cluster": item.cluster,
        "source": item.source,
        "created_at": iso(item.created_at),
    }


def forecast_payload(profile: CompanyProfile, days: int = 60) -> dict:
    forecast = build_cash_forecast(profile, days=days)
    min_day, min_balance, days_negative = find_cash_gap(forecast)
    start = date.today()
    return {
        "days": [
            {
                "day": point.day,
                "date": (start + timedelta(days=point.day)).isoformat(),
                "balance_rub": money(point.balance_rub),
                "trigger": point.trigger,
            }
            for point in forecast
        ],
        "min_balance_rub": money(min_balance),
        "min_day": min_day,
        "days_negative": days_negative,
        "has_gap": min_balance < 0,
    }


def triggers_payload(profile: CompanyProfile) -> list[dict]:
    forecast = build_cash_forecast(profile)
    return [
        {
            "code": trigger.code,
            "title": trigger.title,
            "value": trigger.value,
            "action_label": trigger.action_label,
            "severity": trigger.severity,
        }
        for trigger in detect_radar_triggers(profile, forecast)
    ]


def factor_row(factor: dict) -> dict:
    return {
        "group": factor.get("group", ""),
        "code": factor.get("code", ""),
        "label": factor.get("label", ""),
        "score_delta": int(factor.get("score_delta", 0)),
        "condition": factor.get("condition", ""),
    }


def check_row(check: ApplicationCheck) -> dict:
    return {
        "id": check.id,
        "code": check.check_code,
        "status": check.status,
        "message": check.message,
        "details": check.details_json,
        "created_at": iso(check.created_at),
    }


def event_row(event: ApplicationEvent) -> dict:
    return {
        "id": event.id,
        "event_type": event.event_type,
        "actor_role": event.actor_role,
        "previous_status": event.previous_status,
        "new_status": event.new_status,
        "details": event.details,
        "created_at": iso(event.created_at),
    }


def counter_offer_rows(offers: list[dict]) -> list[dict]:
    return [
        {
            "index": index,
            "product_type": offer["product_type"],
            "product_label": offer["product_label"],
            "amount_rub": money(offer["amount_rub"]),
            "term_months": offer["term_months"],
            "rate_pct": offer["rate_pct"],
            "monthly_payment_rub": money(offer["monthly_payment_rub"]),
            "label": offer["label"],
            "features": offer.get("features", []),
        }
        for index, offer in enumerate(offers, start=1)
    ]


def application_detail(
    application: Application,
    profile: CompanyProfile,
    checks: list[ApplicationCheck],
) -> dict:
    anomaly_check = next((check for check in checks if check.check_code == "REVENUE_ANOMALY"), None)
    credit_limit = (
        calculate_credit_limit(
            profile,
            application.max_payment_rub,
            application.final_rate_pct,
            application.term_months,
        )
        if application.final_rate_pct > 0
        else 0.0
    )
    return {
        "application_id": application.id,
        "company": company_brief(profile),
        "status": application.status,
        "status_label": STATUS_LABELS.get(application.status, application.status),
        "outcome": application.outcome,
        "outcome_label": OUTCOME_LABELS.get(application.outcome, application.outcome),
        "product_type": application.product_type,
        "product_label": PRODUCT_LABELS.get(application.product_type, application.product_type),
        "risk_score": application.risk_score,
        "raw_score": application.raw_score,
        "is_hard_stop": application.is_hard_stop,
        "hard_stop_reason": application.hard_stop_reason,
        "requested_amount_rub": money(application.requested_amount_rub),
        "approved_amount_rub": money(application.approved_amount_rub),
        "term_months": application.term_months,
        "final_rate_pct": application.final_rate_pct,
        "monthly_payment_rub": money(application.monthly_payment_rub),
        "declared_monthly_revenue": money(application.declared_monthly_revenue),
        "monthly_revenue_alfa": money(profile.monthly_revenue_alfa),
        "monthly_revenue_multibank": money(profile.monthly_revenue_multibank),
        "fcf_rub": money(application.fcf_rub),
        "max_payment_rub": money(application.max_payment_rub),
        "limit_rub": money(credit_limit),
        "k_sector": application.k_sector,
        "factors_breakdown": [factor_row(factor) for factor in application.factors_breakdown_json],
        "counter_offers": counter_offer_rows(application.counter_offers_json),
        "rejection_checklist": application.rejection_checklist_json,
        "selected_offer_index": application.selected_offer_index,
        "anomaly": (
            {
                "detected": True,
                "declared_monthly_revenue": money(anomaly_check.details_json.get("declared", 0)),
                "alfa_monthly_revenue": money(anomaly_check.details_json.get("alfa", 0)),
                "deviation_pct": anomaly_check.details_json.get("deviation_pct", 0),
                "message": anomaly_check.message,
            }
            if anomaly_check and anomaly_check.status == "ANOMALY"
            else None
        ),
        "checks": [check_row(check) for check in checks],
        "multibank": {
            "available": bool(anomaly_check) and anomaly_check.status == "ANOMALY",
            "verified": profile.is_multibank_verified,
            "external_revenue_rub": money(profile.monthly_revenue_multibank),
        },
        "invoice": application.invoice_json,
        "account_balance": money(profile.account_balance),
        "created_at": iso(application.created_at),
        "updated_at": iso(application.updated_at),
    }


def dashboard_payload(
    profile: CompanyProfile,
    transactions: list[Transaction],
    news: list[NewsFeedItem],
    search_chips: list[str],
) -> dict:
    return {
        "company": company_detail(profile),
        "business_dna": build_dna_payload(profile),
        "cash_forecast": forecast_payload(profile),
        "radar_triggers": triggers_payload(profile),
        "news_feed": [news_row(item) for item in news],
        "transactions": [transaction_row(row) for row in transactions],
        "search_chips": search_chips,
        "account_balance": money(profile.account_balance),
        "okved_cluster": profile.okved_cluster,
    }
