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

export const ROSTERS_OBLIGATIONS = [
  { date: "25.10", title: "Зарплата", amount: 410_000 },
  { date: "28.10", title: "ЕНП", amount: 176_000 },
  { date: "01.11", title: "Аренда, Покровка, 17", amount: 140_000 },
  { date: "13.11", title: "ООО «Арабика Трейд»", amount: 240_000 },
  { date: "28.11", title: "ЕНП", amount: 182_000 },
];

export const EQUIPMENT_LINES = [
  { date: "02.10", title: "Аванс за ростер Giesen W15A, счёт № 418", amount: 186_000 },
  { date: "09.10", title: "Кофемолка Mahlkönig EK43", amount: 142_600 },
  { date: "16.10", title: "Монтаж и пусконаладка", amount: 90_000 },
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

export interface BankSignalCopy {
  code: string;
  title: string;
  quiet: boolean;
  lines: string[];
  offerAmount: number | null;
  offerTerm: number | null;
}

export const BANK_SIGNAL: Record<string, BankSignalCopy> = {
  rosters: {
    code: "TRG_CAPEX_EXP",
    title: "тратит на оборудование из оборота",
    quiet: false,
    lines: [
      "02.10 — аванс за ростер Giesen W15A, 186 000 ₽",
      "09.10 — кофемолка Mahlkönig EK43, 142 600 ₽",
      "16.10 — монтаж, 90 000 ₽",
      "Итого из оборота 418 600 ₽. Остаток после платежей — на счёте.",
    ],
    offerAmount: ROSTERS_OFFER_AMOUNT,
    offerTerm: ROSTERS_OFFER_TERM,
  },
  tekhnostroy: {
    code: "TRG_SCALE_UP",
    title: "растёт на госконтрактах",
    quiet: false,
    lines: [
      "Три новых контракта в ЕИС, аванс закрывает около 30%.",
      "Выписка Альфы ниже заявленных оборотов — это рост, не тишина.",
      "Предложение имеет смысл после выписок Мультибанка.",
    ],
    offerAmount: 3_200_000,
    offerTerm: 24,
  },
  smirnov: {
    code: "QUIET_MODE",
    title: "в режиме тишины",
    quiet: true,
    lines: [
      "Касса 60 дней в плюсе, кредитов не предлагаем.",
      "Клиент сам написал про перенос платежа на 3 дня — ответ в чате, без заявки.",
      "Повторное предложение не раньше чем через 30 дней.",
    ],
    offerAmount: null,
    offerTerm: null,
  },
  kovalev: {
    code: "TRG_CASH_GAP",
    title: "уходит в кассовый разрыв",
    quiet: false,
    lines: [
      "Прогноз кассы: минус около 140 000 ₽ на 14-й день.",
      "Техническая просрочка БКИ — только ручной разбор, не автоотказ.",
    ],
    offerAmount: 200_000,
    offerTerm: 12,
  },
  bodrost_plus: {
    code: "HARD_STOP",
    title: "стоп-фактор, предложение не отправляем",
    quiet: true,
    lines: [
      "ФССП 320 000 ₽ и просрочка БКИ длиннее 30 дней.",
      "Клиенту нужен план, что закрыть, а не новая сумма.",
    ],
    offerAmount: null,
    offerTerm: null,
  },
};

export function signalFor(demoKey: string | null | undefined): BankSignalCopy {
  return BANK_SIGNAL[demoKey ?? ""] ?? {
    code: "SIGNAL",
    title: "новый сигнал по выписке",
    quiet: false,
    lines: ["Сигнал собран из операций расчётного счёта."],
    offerAmount: null,
    offerTerm: null,
  };
}
