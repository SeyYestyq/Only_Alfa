"""
Человекочитаемые пояснения статуса заявки и письма к решению банка.
Чистый Python — только факты из скоринга и Decision Engine.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Optional

from app.core.constants import (
    SCORE_APPROVED_MIN,
    SCORE_COUNTER_OFFER_MIN,
    SCORE_MANUAL_REVIEW_MIN,
)
from app.domain.finances import calculate_annuity_payment
from app.domain.types import ApplicationStatus, CompanyProfile, ProductType

_PRODUCT_WHY: dict[str, str] = {
    ProductType.INVEST_LEASING.value: (
        "Инвест-кредит подходит для разовой закупки оборудования или ремонта с фиксированным графиком."
    ),
    ProductType.VKL.value: (
        "Возобновляемая линия удобна, когда нужен запас на закупки и зарплату без новой заявки каждый раз."
    ),
    ProductType.VKL_SEC.value: (
        "ВКЛ с залогом даёт больший лимит, если есть обеспечение с понятной оценкой."
    ),
    ProductType.OVERDRAFT.value: (
        "Овердрафт закрывает краткие кассовые разрывы — платите проценты только за дни использования."
    ),
}

_STATUS_WHERE: dict[str, str] = {
    ApplicationStatus.DRAFT_BY_EMPLOYEE.value: "Заявка сохранена как черновик и ещё не ушла в банк.",
    ApplicationStatus.ANOMALY_VERIFICATION.value: "Банк сверяет заявленную выручку с оборотом по счёту в Альфе.",
    ApplicationStatus.MANUAL_REVIEW.value: "Заявка на ручной проверке — кредитный аналитик смотрит детали.",
    ApplicationStatus.NEED_MORE_INFO.value: "Банк ждёт документы, без которых нельзя завершить проверку.",
    ApplicationStatus.COUNTER_OFFER.value: "Банк предложил другие условия — нужно выбрать вариант или обсудить запрос.",
    ApplicationStatus.APPROVED.value: "Кредит одобрен — осталось подписать договор и получить деньги.",
    ApplicationStatus.AWAITING_CEO_APPROVAL.value: "Условия согласованы — ждём подпись руководителя.",
    ApplicationStatus.REJECTED.value: "По этой заявке отказ — ниже план, что можно сделать дальше.",
    ApplicationStatus.FUNDED.value: "Договор подписан, деньги зачислены на расчётный счёт.",
}

_STATUS_NEXT: dict[str, str] = {
    ApplicationStatus.ANOMALY_VERIFICATION.value: "Подтвердите выручку через Мультибанк или приложите выписки других банков.",
    ApplicationStatus.MANUAL_REVIEW.value: "Дождитесь решения банка — обычно в течение рабочего дня в демо.",
    ApplicationStatus.NEED_MORE_INFO.value: "Загрузите запрошенные файлы в кабинете — проверка продолжится автоматически.",
    ApplicationStatus.COUNTER_OFFER.value: "Выберите один из вариантов банка или отправьте встречный запрос на другой продукт.",
    ApplicationStatus.APPROVED.value: "Перейдите к подписанию договора — уведомление уже у подписанта.",
    ApplicationStatus.AWAITING_CEO_APPROVAL.value: "Руководитель подписывает договор в разделе «Подпись».",
    ApplicationStatus.REJECTED.value: "Выполните шаги из плана ниже и подайте заявку снова, когда профиль усилится.",
    ApplicationStatus.FUNDED.value: "Следите за графиком платежей в разделе «Выручка и платежи».",
}


def _corridor_label(score: int) -> str:
    if score >= SCORE_APPROVED_MIN:
        return f"зелёный коридор (от {SCORE_APPROVED_MIN} баллов)"
    if score >= SCORE_COUNTER_OFFER_MIN:
        return f"жёлтый коридор ({SCORE_COUNTER_OFFER_MIN}–{SCORE_APPROVED_MIN - 1} баллов)"
    if score >= SCORE_MANUAL_REVIEW_MIN:
        return f"серый коридор ({SCORE_MANUAL_REVIEW_MIN}–{SCORE_COUNTER_OFFER_MIN - 1} баллов)"
    return f"красный коридор (ниже {SCORE_MANUAL_REVIEW_MIN} баллов)"


def _top_factors(factors: list[dict[str, Any]], limit: int = 5) -> list[dict[str, Any]]:
    ranked = sorted(factors, key=lambda item: abs(int(item.get("score_delta", 0))), reverse=True)
    return ranked[:limit]


def _payment_load_label(monthly_payment: float, declared_revenue: float) -> str:
    if declared_revenue <= 0:
        return "нагрузка платежа к выручке не рассчитана"
    share = monthly_payment / declared_revenue * 100
    return f"платёж к выручке ≈ {share:.0f}% (комфортный ориентир — до 25%)"


@dataclass(frozen=True)
class DecisionLetter:
    title: str
    paragraphs: list[str]
    next_steps: list[str]
    tone: str

    def as_dict(self) -> dict[str, Any]:
        return {
            "title": self.title,
            "paragraphs": self.paragraphs,
            "next_steps": self.next_steps,
            "tone": self.tone,
        }


def build_pre_decision_warnings(
    profile: CompanyProfile,
    score: int,
    outcome: str,
    is_hard_stop: bool,
    monthly_payment: float,
    max_payment: float,
) -> list[str]:
    warnings: list[str] = []
    if is_hard_stop:
        warnings.append("Есть стоп-фактор — заявку могут отклонить без дозапроса.")
    if outcome in ("MANUAL_REVIEW", "COUNTER_OFFER", "REJECTED"):
        warnings.append(
            f"При текущем балле {score} ({_corridor_label(score)}) банк может предложить меньшую сумму или отказ."
        )
    if monthly_payment > max_payment > 0:
        warnings.append(
            "Запрошенный платёж выше свободного потока — вероятен встречный оффер или дозапрос."
        )
    if profile.bki_overdue_days > 0:
        warnings.append("В кредитной истории есть просрочки — это усиливает проверку.")
    if not profile.is_multibank_verified and profile.monthly_revenue_multibank <= 0:
        warnings.append(
            "Оборот виден только по счёту в Альфе — без выписок других банков балл может быть ниже."
        )
    return warnings


def build_decision_letter(
    status: str,
    profile: CompanyProfile,
    product_type: str,
    product_label: str,
    score: int,
    factors: list[dict[str, Any]],
    approved_amount: float,
    rate_pct: float,
    term_months: int,
    monthly_payment: float,
    rejection_checklist: list[str],
    hard_stop_reason: Optional[str],
) -> Optional[DecisionLetter]:
    top = _top_factors(factors)
    factor_lines = [
        f"{item.get('label', 'Фактор')}: {'+' if int(item.get('score_delta', 0)) >= 0 else ''}"
        f"{int(item.get('score_delta', 0))} баллов"
        for item in top
    ]

    if status == ApplicationStatus.APPROVED.value or status == ApplicationStatus.FUNDED.value:
        paragraphs = [
            f"Одобрили {product_label} на {approved_amount:,.0f} ₽ сроком {term_months} мес. "
            f"под ставку {rate_pct:.1f}% годовых.",
            _PRODUCT_WHY.get(product_type, ""),
            f"Кредитная оценка {score} — {_corridor_label(score)}. "
            f"{_payment_load_label(monthly_payment, profile.declared_monthly_revenue)}.",
        ]
        if factor_lines:
            paragraphs.append("Сильнее всего на решение повлияли: " + "; ".join(factor_lines) + ".")
        return DecisionLetter(
            title="Почему банк одобрил эти условия",
            paragraphs=[p for p in paragraphs if p],
            next_steps=[
                "Подпишите договор в разделе «Подпись» — деньги поступят на расчётный счёт.",
                "Если условия не подходят, можно отправить встречный запрос на другой продукт до подписи.",
            ],
            tone="good",
        )

    if status == ApplicationStatus.REJECTED.value:
        steps = rejection_checklist or [
            "Снизьте долговую нагрузку и обновите данные через 90 дней.",
            "Подключите Мультибанк, чтобы подтвердить реальный оборот.",
        ]
        readable_steps = []
        for raw in steps:
            readable_steps.append(
                raw.replace("CF_", "поток: ")
                .replace("BKI_", "кредитная история: ")
                .replace("_", " ")
            )
        paragraphs = [
            hard_stop_reason or f"Балл {score} — {_corridor_label(score)}, запрошенные условия не проходят.",
        ]
        if factor_lines:
            paragraphs.append("Отрицательно сработали: " + "; ".join(factor_lines) + ".")
        return DecisionLetter(
            title="Почему отказ и что делать",
            paragraphs=paragraphs,
            next_steps=readable_steps[:5],
            tone="risk",
        )

    if status in (
        ApplicationStatus.COUNTER_OFFER.value,
        ApplicationStatus.MANUAL_REVIEW.value,
        ApplicationStatus.NEED_MORE_INFO.value,
        ApplicationStatus.ANOMALY_VERIFICATION.value,
        ApplicationStatus.AWAITING_CEO_APPROVAL.value,
    ):
        paragraphs = [
            _STATUS_WHERE.get(status, ""),
            f"Балл {score}, {_corridor_label(score)}. {_payment_load_label(monthly_payment, profile.declared_monthly_revenue)}.",
        ]
        if factor_lines:
            paragraphs.append("На решение влияют: " + "; ".join(factor_lines) + ".")
        return DecisionLetter(
            title="Что происходит с заявкой",
            paragraphs=[p for p in paragraphs if p],
            next_steps=[_STATUS_NEXT.get(status, "Следуйте подсказкам на экране.")],
            tone="warn",
        )
    return None


def build_offer_letter(
    profile: CompanyProfile,
    product_type: str,
    product_label: str,
    amount_rub: float,
    term_months: int,
    rate_pct: float,
    monthly_payment: float,
    score: int,
    factors: list[dict[str, Any]],
    bank_product_type: str,
    bank_product_label: str,
    letter_kind: str = "PRIMARY",
) -> dict[str, Any]:
    """Письмо к офферу — то же содержание видит клиент и пилот."""
    top = _top_factors(factors, limit=5)
    factor_bullets = [
        {
            "label": item.get("label", ""),
            "delta": int(item.get("score_delta", 0)),
            "direction": "up" if int(item.get("score_delta", 0)) >= 0 else "down",
        }
        for item in top
    ]
    why_product = _PRODUCT_WHY.get(product_type, "")
    if bank_product_type != product_type:
        why_not_other = (
            f"Банк изначально смотрел {bank_product_label}, но для суммы {amount_rub:,.0f} ₽ "
            f"лучше подходит {product_label}: {why_product}"
        )
    else:
        why_not_other = why_product

    inaction = (
        "Если ничего не сделать, предложение сгорит через 14 дней — "
        "нужно будет подать заявку заново, балл пересчитают по актуальным данным."
    )
    if letter_kind == "INSTALLMENT":
        inaction = (
            "Если не оформить рассрочку, списание останется разовым — "
            "касса не восстановится автоматически."
        )

    return {
        "kind": letter_kind,
        "product_type": product_type,
        "product_label": product_label,
        "amount_rub": round(amount_rub, 2),
        "term_months": term_months,
        "rate_pct": rate_pct,
        "monthly_payment_rub": round(monthly_payment, 2),
        "headline": f"{product_label} · {amount_rub:,.0f} ₽ · {term_months} мес.",
        "why_this_product": why_not_other,
        "top_factors": factor_bullets,
        "why_terms": (
            f"Сумма укладывается в лимит при балле {score} ({_corridor_label(score)}). "
            f"Ставка {rate_pct:.1f}% с учётом продукта и коридора. "
            f"{_payment_load_label(monthly_payment, profile.declared_monthly_revenue)}."
        ),
        "if_no_action": inaction,
        "score": score,
    }


def build_client_brief(
    status: str,
    outcome: str,
    profile: CompanyProfile,
    score: int,
    factors: list[dict[str, Any]],
    monthly_payment: float,
    max_payment: float,
    approved_amount: float,
    rate_pct: float,
    term_months: int,
    product_type: str,
    product_label: str,
    rejection_checklist: list[str],
    hard_stop_reason: Optional[str],
    is_hard_stop: bool,
) -> dict[str, Any]:
    why_facts = [
        f"Кредитная оценка: {score} баллов ({_corridor_label(score)}).",
        f"Заявленная выручка: {profile.declared_monthly_revenue:,.0f} ₽/мес.",
        _payment_load_label(monthly_payment or calculate_annuity_payment(approved_amount, rate_pct, term_months), profile.declared_monthly_revenue),
    ]
    if profile.is_multibank_verified:
        why_facts.append("Мультибанк подключён — оборот по другим банкам учтён в скоринге.")
    if is_hard_stop and hard_stop_reason:
        why_facts.append(f"Стоп-фактор: {hard_stop_reason}")

    for item in _top_factors(factors, 3):
        delta = int(item.get("score_delta", 0))
        if delta == 0:
            continue
        sign = "+" if delta > 0 else ""
        why_facts.append(f"{item.get('label', 'Фактор')}: {sign}{delta} баллов.")

    letter = build_decision_letter(
        status,
        profile,
        product_label=product_label,
        product_type=product_type,
        score=score,
        factors=factors,
        approved_amount=approved_amount,
        rate_pct=rate_pct,
        term_months=term_months,
        monthly_payment=monthly_payment,
        rejection_checklist=rejection_checklist,
        hard_stop_reason=hard_stop_reason,
    )

    tone = "warn"
    if status in (ApplicationStatus.APPROVED.value, ApplicationStatus.FUNDED.value):
        tone = "good"
    elif status == ApplicationStatus.REJECTED.value:
        tone = "risk"

    return {
        "where": _STATUS_WHERE.get(status, "Заявка в обработке."),
        "what_next": _STATUS_NEXT.get(status, "Следуйте подсказкам на экране."),
        "why_facts": why_facts,
        "next_action": _STATUS_NEXT.get(status, "Откройте подробности решения."),
        "pre_decision_warnings": build_pre_decision_warnings(
            profile, score, outcome, is_hard_stop, monthly_payment, max_payment
        )
        if status not in (ApplicationStatus.APPROVED.value, ApplicationStatus.REJECTED.value, ApplicationStatus.FUNDED.value)
        else [],
        "decision_letter": letter.as_dict() if letter else None,
        "tone": tone,
    }
