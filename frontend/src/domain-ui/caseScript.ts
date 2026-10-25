import type { ProductType } from "../api/types";

/**
 * Сценарий демо «Ростерс Кафе» и стартовые заявки пяти профилей.
 * Цифры решения (балл, платёж, лимит) на экранах берутся из API.
 * Здесь только подписи кейса, которые API не отдаёт отдельным полем:
 * будущие обязательства, летний прогноз и реструктуризация после выдачи.
 */

export const ROSTERS_OFFER_AMOUNT = 900_000;
export const ROSTERS_OFFER_TERM = 24;
export const ROSTERS_REQUEST_AMOUNT = 2_500_000;
export const ROSTERS_REQUEST_TERM = 12;
export const EQUIPMENT_TOTAL = 418_600;
/** Остаток до трёх платежей «Кофе-Техника»: 728 600 − 418 600 = 310 000. */
export const BALANCE_BEFORE_EQUIPMENT = 728_600;
export const ROSTERS_APPLICATION_NUMBER = "2026-10-0417";
export const ROSTERS_OBLIGATIONS_TOTAL = 1_148_000;
/** Контроль Decision Engine: MaxPayment Ростерс, тест test_rosters_610. */
export const ROSTERS_SAFE_PAYMENT = 110_500;
/** Лето: поток 180 000 × 0,5 × 0,85. Показывается как прогноз сезона, не как лимит API. */
export const ROSTERS_SUMMER_SAFE = 76_500;
export const JULY_REVENUE_FORECAST = 1_300_000;
/** 3% от прогноза выручки июля. */
export const RESTRUCTURE_PAYMENT = 39_000;
export const LIMIT_UP_AMOUNT = 2_000_000;
export const INSPECTOR_NAME = "Елена Орлова";
export const PEP_CODE = "4817";
/** Подпись кейса на экране ПЭП. Считает бэкенд в договоре, здесь только показ. */
export const ROSTERS_PSK_LABEL = "19,562%";

export const REFUSE_REASONS = [
  { code: "R-03", label: "Платёжная нагрузка выше безопасной" },
  { code: "R-01", label: "Стоп-фактор в проверках" },
  { code: "R-02", label: "Недостаточно оборотов за 12 месяцев" },
];

export interface ApplyPreset {
  amount: number;
  term: number;
  product: ProductType;
  purpose: string;
}

export const APPLY_PRESET: Record<string, ApplyPreset> = {
  rosters: {
    amount: ROSTERS_REQUEST_AMOUNT,
    term: ROSTERS_REQUEST_TERM,
    product: "INVEST_LEASING",
    purpose: "Ростер Giesen W15A · счёт № 418 от 30.09, ООО «Кофе-Техника»",
  },
  smirnov: {
    amount: 900_000,
    term: 24,
    product: "INVEST_LEASING",
    purpose: "Кофемашина для действующей точки",
  },
  tekhnostroy: {
    amount: 3_200_000,
    term: 24,
    product: "VKL",
    purpose: "Исполнение госконтрактов, материалы и авансы субподряда",
  },
  kovalev: {
    amount: 200_000,
    term: 12,
    product: "OVERDRAFT",
    purpose: "Кассовый разрыв: аренда и ЕНП",
  },
  bodrost_plus: {
    amount: 1_500_000,
    term: 12,
    product: "INVEST_LEASING",
    purpose: "Пополнение оборота",
  },
};
