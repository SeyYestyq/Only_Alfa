"""Юнит-тесты дискретной математики: 100% сходимость 5 эталонных профилей."""
from __future__ import annotations

import pytest

from app.domain.cash_forecast import build_cash_forecast, find_cash_gap
from app.domain.decision.decision_engine import calculate_rate, make_decision
from app.domain.scoring.risk_score import calculate_risk_score
from app.domain.types import DecisionOutcome, ProductType
from app.infra.demo_profiles import (
    BODROST_PLUS,
    KOVALEV,
    ROSTERS,
    SMIRNOV,
    TEKHNOSTROY,
)


def test_smirnov_815_approved_rate_14_5():
    score = calculate_risk_score(SMIRNOV)
    decision = make_decision(SMIRNOV, score, 900_000, ProductType.INVEST_LEASING, 24)

    assert score.final_score == 815
    assert score.raw_score == 815
    assert score.is_hard_stop is False
    assert decision.outcome == DecisionOutcome.APPROVED
    assert decision.final_rate_pct == 14.5
    assert decision.max_payment_rub == pytest.approx(161_000, rel=1e-6)
    assert decision.fcf_rub == pytest.approx(280_000)
    assert decision.approved_amount_rub == pytest.approx(900_000)


def test_rosters_610_counter_offer_four_variants_rate_18():
    score = calculate_risk_score(ROSTERS)
    decision = make_decision(ROSTERS, score, 2_500_000, ProductType.INVEST_LEASING, 12)

    assert score.final_score == 610
    assert decision.outcome == DecisionOutcome.COUNTER_OFFER
    assert decision.final_rate_pct == 18.0
    assert len(decision.counter_offers) == 4
    assert decision.max_payment_rub == pytest.approx(110_500, rel=1e-6)
    assert any(offer.rate_pct == 18.0 for offer in decision.counter_offers)
    assert any("9%" in feature for offer in decision.counter_offers for feature in offer.features)


def test_tekhnostroy_760_after_multibank_rate_15_5():
    from dataclasses import replace

    verified = replace(
        TEKHNOSTROY,
        monthly_revenue_multibank=4_200_000,
        is_multibank_verified=True,
    )
    score = calculate_risk_score(verified)
    decision = make_decision(verified, score, 3_200_000, ProductType.VKL, 24)

    assert score.final_score == 760
    assert decision.outcome == DecisionOutcome.APPROVED
    assert decision.final_rate_pct == 15.5
    assert decision.max_payment_rub == pytest.approx(546_250, rel=1e-6)
    assert decision.fcf_rub == pytest.approx(950_000)


def test_kovalev_495_manual_review_and_cash_gap_140k():
    score = calculate_risk_score(KOVALEV)
    decision = make_decision(KOVALEV, score, 200_000, ProductType.OVERDRAFT, 12)
    min_day, min_balance, _ = find_cash_gap(build_cash_forecast(KOVALEV))

    assert score.final_score == 495
    assert decision.outcome == DecisionOutcome.MANUAL_REVIEW
    assert decision.max_payment_rub == pytest.approx(47_500, rel=1e-6)
    assert min_day == 14
    assert min_balance == pytest.approx(-139_667, abs=1_000)


def test_bodrost_hard_stop_zero_score():
    score = calculate_risk_score(BODROST_PLUS)
    decision = make_decision(BODROST_PLUS, score, 1_500_000, ProductType.INVEST_LEASING, 12)

    assert score.is_hard_stop is True
    assert score.raw_score == -30
    assert score.final_score == 0
    assert len(score.hard_stop_reasons) == 2
    assert any("БКИ" in reason for reason in score.hard_stop_reasons)
    assert any("ФССП" in reason for reason in score.hard_stop_reasons)
    assert decision.outcome == DecisionOutcome.REJECTED
    assert decision.approved_amount_rub == 0


@pytest.mark.parametrize(
    ("profile", "expected_codes"),
    [
        (SMIRNOV, ["BKI_CLEAN_HIGH", "CF_GROWTH_HIGH", "DSCR_LOW_LOAD", "PROF_ESTABLISHED", "SEC_HIGH_GEO"]),
        (ROSTERS, ["BKI_CLEAN_HIGH", "CF_STABLE_POSITIVE", "DSCR_MED_LOAD", "PROF_ESTABLISHED", "SEC_LOW_COMPETITION"]),
        (KOVALEV, ["BKI_TECH_OVERDUE", "CF_STABLE_POSITIVE", "DSCR_MED_LOAD", "PROF_YOUNG_12_24M", "SEC_MID_GEO"]),
        (BODROST_PLUS, ["BKI_STOP_OVERDUE", "CF_CRITICAL_DROP", "DSCR_CRITICAL_LOAD", "PROF_NEUTRAL", "SEC_NEUTRAL"]),
    ],
)
def test_factor_codes_and_sum(profile, expected_codes):
    score = calculate_risk_score(profile)
    codes = [factor.code for factor in score.factors_breakdown if factor.group != "G0"]

    assert codes == expected_codes
    assert sum(factor.score_delta for factor in score.factors_breakdown) == score.raw_score


def test_rate_depends_on_key_rate():
    assert calculate_rate(800, ProductType.INVEST_LEASING, key_rate_pct=14.0) == 14.5
    assert calculate_rate(700, ProductType.VKL, key_rate_pct=14.0) == 16.5
    assert calculate_rate(600, ProductType.OVERDRAFT, key_rate_pct=14.0) == 20.0
