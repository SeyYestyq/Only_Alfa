import type { Application, CompanyDetail, Factor, Xray } from "../api/types";
import { formatMoney, formatPercent } from "../utils/format";

/** База RiskScore из BRD — точка отсчёта модели. */
export const XRAY_SCORE_BASE = 500;

export interface XrayFunnelStage {
  id: string;
  count: number;
  pctOfBase: number;
  label: string;
  hint: string;
}

export interface XrayFactorBar {
  id: string;
  label: string;
  value: string;
  detail: string;
  /** 0–10 блоков в полоске (как traffic sources в референсе). */
  blocks: number;
  scoreDelta: number | null;
  tone: "pro" | "con";
}

export interface XrayWorkloadCell {
  day: string;
  hour: number;
  intensity: number;
}

export interface XrayBaseDecompositionModel {
  base: number;
  riskScore: number;
  cohortPct: number;
  cohortDeltaPct: number;
  funnel: XrayFunnelStage[];
  pros: XrayFactorBar[];
  cons: XrayFactorBar[];
  workloadHeatmap: XrayWorkloadCell[];
  summary: string;
}

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"] as const;

function findFactor(factors: Factor[], group: string): Factor | null {
  return factors.find((factor) => factor.group === group && factor.code !== "BASE_SCORE") ?? null;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function blocksFromStrength(strength01: number): number {
  return clamp(Math.round(strength01 * 10), 1, 10);
}

function formatAge(months: number): string {
  const years = Math.floor(months / 12);
  const rest = months % 12;
  if (years <= 0) {
    return `${months} мес.`;
  }
  if (rest === 0) {
    return `${years} г.`;
  }
  return `${years} г. ${rest} мес.`;
}

function formatSignedDelta(delta: number | null): string | null {
  if (delta === null) {
    return null;
  }
  return delta > 0 ? `+${delta}` : String(delta);
}

/**
 * Презентационная декомпозиция базы 500 для инспектора.
 * Баллы факторов — только из API; воронка когорты — демо-визуализация профиля.
 */
export function buildXrayBaseDecomposition(input: {
  application: Application;
  company: CompanyDetail | null;
  xray: Xray | null;
}): XrayBaseDecompositionModel {
  const { application, company, xray } = input;
  const factors = xray?.waterfall.factors ?? application.factors_breakdown ?? [];
  const cashflow = findFactor(factors, "G2");
  const debt = findFactor(factors, "G3");
  const profile = findFactor(factors, "G4");

  const ageMonths = company?.age_months ?? 36;
  const confirmedRevenue =
    application.monthly_revenue_alfa + application.monthly_revenue_multibank;
  const revenueRub =
    confirmedRevenue > 0
      ? confirmedRevenue
      : company?.monthly_revenue_alfa || application.declared_monthly_revenue || 0;
  const growth = company?.revenue_growth_pct ?? 0;
  const fssp = company?.fssp_amount ?? 0;
  const fcf = application.fcf_rub;
  const maxPayment = application.max_payment_rub;
  const payment = application.monthly_payment_rub || application.requested_amount_rub / Math.max(application.term_months, 1);
  const debtLoad01 = fcf > 0 ? clamp(payment / Math.max(fcf, 1), 0, 1.2) : 1;
  const hasLawsuits = fssp > 0 || application.is_hard_stop;

  // Когортная воронка: от базы 500 к «похожим» — сужается как conversion funnel.
  const afterRevenue = clamp(
    Math.round(
      XRAY_SCORE_BASE *
        (0.52 + clamp(growth / 100, -0.2, 0.25) + clamp(revenueRub / 8_000_000, 0, 0.18)),
    ),
    180,
    420,
  );
  const afterTenure = clamp(
    Math.round(afterRevenue * (0.38 + clamp(ageMonths / 120, 0, 0.35))),
    60,
    afterRevenue - 20,
  );
  const cleanKeep = hasLawsuits ? 0.28 : debtLoad01 > 0.5 ? 0.42 : 0.55;
  const afterClean = clamp(Math.round(afterTenure * cleanKeep), 18, afterTenure - 8);
  const cohortPct = Math.round((afterClean / XRAY_SCORE_BASE) * 1000) / 10;
  const cohortDeltaPct = Math.round((cohortPct - 7.4) * 10) / 10;

  const funnel: XrayFunnelStage[] = [
    {
      id: "base",
      count: XRAY_SCORE_BASE,
      pctOfBase: 100,
      label: "База модели",
      hint: "RiskScore base = 500",
    },
    {
      id: "revenue",
      count: afterRevenue,
      pctOfBase: Math.round((afterRevenue / XRAY_SCORE_BASE) * 100),
      label: "Выручка",
      hint: `${formatMoney(revenueRub)} / мес.`,
    },
    {
      id: "tenure",
      count: afterTenure,
      pctOfBase: Math.round((afterTenure / XRAY_SCORE_BASE) * 100),
      label: "Стаж",
      hint: formatAge(ageMonths),
    },
    {
      id: "clean",
      count: afterClean,
      pctOfBase: Math.round((afterClean / XRAY_SCORE_BASE) * 100),
      label: "Чистые",
      hint: hasLawsuits ? "минус иски / нагрузка" : "без тяжёлых минусов",
    },
  ];

  const revenueStrength = clamp(0.35 + revenueRub / 6_000_000 + growth / 80, 0.2, 1);
  const tenureStrength = clamp(ageMonths / 60, 0.15, 1);
  const lawsuitStrength = hasLawsuits
    ? clamp(0.35 + fssp / Math.max(revenueRub * 0.2, 1), 0.4, 1)
    : 0.12;
  const workloadStrength = clamp(0.2 + debtLoad01, 0.15, 1);

  const pros: XrayFactorBar[] = [
    {
      id: "revenue",
      label: "Выручка",
      value: formatMoney(revenueRub),
      detail: [
        growth !== 0 ? `динамика ${formatPercent(growth, 0)}` : "оборот по счетам",
        cashflow ? `фактор ${formatSignedDelta(cashflow.score_delta)}` : null,
      ]
        .filter(Boolean)
        .join(" · "),
      blocks: blocksFromStrength(revenueStrength),
      scoreDelta: cashflow?.score_delta ?? null,
      tone: "pro",
    },
    {
      id: "tenure",
      label: "Стаж",
      value: formatAge(ageMonths),
      detail: [
        company?.is_egrul_active === false ? "ЕГРЮЛ не ACTIVE" : "ЕГРЮЛ действующее",
        profile ? `профиль ${formatSignedDelta(profile.score_delta)}` : null,
      ]
        .filter(Boolean)
        .join(" · "),
      blocks: blocksFromStrength(tenureStrength),
      scoreDelta: profile?.score_delta ?? null,
      tone: "pro",
    },
  ];

  const cons: XrayFactorBar[] = [
    {
      id: "lawsuits",
      label: "Иски",
      value: fssp > 0 ? formatMoney(fssp) : "0 производств",
      detail: fssp > 0 ? "ФССП / исполнительные" : "ФССП чисто · арбитраж не найден",
      blocks: blocksFromStrength(lawsuitStrength),
      scoreDelta: null,
      tone: "con",
    },
    {
      id: "workload",
      label: "Нагрузка",
      value:
        maxPayment > 0
          ? `${Math.round((payment / maxPayment) * 100)}% лимита`
          : formatMoney(payment),
      detail: [
        `платёж ${formatMoney(payment)}`,
        debt ? `ПДН ${formatSignedDelta(debt.score_delta)}` : `FCF ${formatMoney(fcf)}`,
      ].join(" · "),
      blocks: blocksFromStrength(workloadStrength),
      scoreDelta: debt?.score_delta ?? null,
      tone: "con",
    },
  ];

  const workloadHeatmap = buildWorkloadHeatmap({
    seed: application.company.inn || application.application_id,
    debtLoad01,
    hasSeasonDip: true,
  });

  const proSum = (cashflow?.score_delta ?? 0) + (profile?.score_delta ?? 0);
  const conSum = debt?.score_delta ?? 0;
  const summary = [
    `База ${XRAY_SCORE_BASE}`,
    proSum !== 0 ? `плюсы ${formatSignedDelta(proSum)}` : null,
    conSum !== 0 ? `минусы ${formatSignedDelta(conSum)}` : null,
    `RiskScore ${application.risk_score}`,
  ]
    .filter(Boolean)
    .join(" → ");

  return {
    base: XRAY_SCORE_BASE,
    riskScore: application.risk_score,
    cohortPct,
    cohortDeltaPct,
    funnel,
    pros,
    cons,
    workloadHeatmap,
    summary,
  };
}

function buildWorkloadHeatmap(input: {
  seed: string;
  debtLoad01: number;
  hasSeasonDip: boolean;
}): XrayWorkloadCell[] {
  let hash = 0;
  for (let i = 0; i < input.seed.length; i += 1) {
    hash = (hash * 31 + input.seed.charCodeAt(i)) >>> 0;
  }

  const cells: XrayWorkloadCell[] = [];
  for (let dayIndex = 0; dayIndex < WEEKDAYS.length; dayIndex += 1) {
    for (let hour = 0; hour < 8; hour += 1) {
      const noise = ((hash >> ((dayIndex + hour) % 16)) & 7) / 7;
      const weekdayBoost = dayIndex < 5 ? 0.35 : 0.05;
      const middayBoost = hour >= 2 && hour <= 5 ? 0.3 : 0.05;
      const season = input.hasSeasonDip && dayIndex === 4 && hour >= 5 ? -0.15 : 0;
      const raw = weekdayBoost + middayBoost + noise * 0.35 + input.debtLoad01 * 0.25 + season;
      cells.push({
        day: WEEKDAYS[dayIndex],
        hour,
        intensity: clamp(raw, 0.08, 1),
      });
    }
  }
  return cells;
}
