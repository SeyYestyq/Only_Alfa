/**
 * Демо-книга портфеля для экрана аналитики.
 * Это не скоринг и не лимит API: суммы помечены «демо».
 * Живой кейс Ростерс (900 000 / 2 500 000 / лимит 2 000 000) сюда не подмешивается.
 */

export type AnalyticsPeriod = 7 | 30 | 90;

export interface ProductBar {
  name: string;
  rub: number;
}

export interface AnalyticsSnapshot {
  issuedRub: number;
  issuedDeltaPct: number;
  inWork: number;
  inWorkDelta: number;
  decisionMin: number;
  decisionDeltaPct: number;
  atRisk: number;
  atRiskDelta: number;
  funnel: [number, number, number, number, number];
  products: ProductBar[];
  risk: { ok: number; watch: number; risk: number };
}

export const ANALYTICS_PERIODS: AnalyticsPeriod[] = [7, 30, 90];

export const FUNNEL_LABELS = ["Сигналы", "Предложения", "Заявки", "Одобрено", "Выдано"] as const;

const BOOK_7: AnalyticsSnapshot = {
  issuedRub: 4_200_000,
  issuedDeltaPct: 4,
  inWork: 4,
  inWorkDelta: 1,
  decisionMin: 6,
  decisionDeltaPct: -8,
  atRisk: 1,
  atRiskDelta: 0,
  funnel: [12, 9, 4, 3, 2],
  products: [
    { name: "Оборудование", rub: 1_600_000 },
    { name: "Оборотный", rub: 1_100_000 },
    { name: "Счёт поставщику", rub: 700_000 },
    { name: "Овердрафт", rub: 400_000 },
    { name: "Лизинг", rub: 250_000 },
    { name: "Залог", rub: 100_000 },
    { name: "другие", rub: 50_000 },
  ],
  risk: { ok: 8, watch: 2, risk: 1 },
};

const BOOK_30: AnalyticsSnapshot = {
  issuedRub: 18_600_000,
  issuedDeltaPct: 8,
  inWork: 7,
  inWorkDelta: 2,
  decisionMin: 8,
  decisionDeltaPct: -11,
  atRisk: 3,
  atRiskDelta: 1,
  funnel: [48, 31, 14, 9, 8],
  products: [
    { name: "Оборудование", rub: 6_200_000 },
    { name: "Оборотный", rub: 4_400_000 },
    { name: "Счёт поставщику", rub: 3_200_000 },
    { name: "Овердрафт", rub: 2_100_000 },
    { name: "Лизинг", rub: 1_400_000 },
    { name: "Залог", rub: 800_000 },
    { name: "другие", rub: 500_000 },
  ],
  risk: { ok: 18, watch: 5, risk: 3 },
};

const BOOK_90: AnalyticsSnapshot = {
  issuedRub: 52_400_000,
  issuedDeltaPct: 11,
  inWork: 11,
  inWorkDelta: -1,
  decisionMin: 11,
  decisionDeltaPct: 6,
  atRisk: 6,
  atRiskDelta: 2,
  funnel: [140, 102, 74, 40, 35],
  products: [
    { name: "Оборудование", rub: 16_800_000 },
    { name: "Оборотный", rub: 12_400_000 },
    { name: "Счёт поставщику", rub: 9_200_000 },
    { name: "Овердрафт", rub: 6_100_000 },
    { name: "Лизинг", rub: 4_200_000 },
    { name: "Залог", rub: 2_400_000 },
    { name: "другие", rub: 1_300_000 },
  ],
  risk: { ok: 40, watch: 9, risk: 6 },
};

export const ANALYTICS_BOOK: Record<AnalyticsPeriod, AnalyticsSnapshot> = {
  7: BOOK_7,
  30: BOOK_30,
  90: BOOK_90,
};

export function conversionPct(current: number, previous: number): number {
  if (previous <= 0) {
    return 0;
  }
  return Math.round((current / previous) * 100);
}

/** Индекс шага, на который приходится наибольшая потеря. */
export function biggestDropIndex(counts: readonly number[]): number {
  let index = 1;
  let worst = Number.POSITIVE_INFINITY;
  for (let step = 1; step < counts.length; step += 1) {
    const previous = counts[step - 1];
    const ratio = previous > 0 ? counts[step] / previous : 1;
    if (ratio < worst) {
      worst = ratio;
      index = step;
    }
  }
  return index;
}

const DROP_HINT = [
  "",
  "Меньше всего сигналов доходит до предложения.",
  "Меньше всего предложений доходит до заявки.",
  "Меньше всего заявок доходит до одобрения.",
  "Меньше всего одобрений доходит до выдачи.",
];

export function dropHint(index: number, rostersLine: string | null): string {
  const base = DROP_HINT[index] ?? DROP_HINT[2];
  if (index === 2 && rostersLine) {
    return `${base} ${rostersLine}`;
  }
  return base;
}

/** Живая выдача Ростерс добавляется к демо-книге только после FUNDED. */
export function applyIssued(snapshot: AnalyticsSnapshot, extraRub: number): AnalyticsSnapshot {
  if (extraRub <= 0) {
    return snapshot;
  }
  const products = snapshot.products
    .map((row) => (row.name === "Оборудование" ? { ...row, rub: row.rub + extraRub } : row))
    .sort((left, right) => right.rub - left.rub);
  const funnel: AnalyticsSnapshot["funnel"] = [...snapshot.funnel];
  funnel[4] += 1;
  return {
    ...snapshot,
    issuedRub: snapshot.issuedRub + extraRub,
    products,
    funnel,
  };
}
