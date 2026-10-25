import type { CounterOffer, ProductType } from "../api/types";

/**
 * Продуктовые «семьи» для клиентского выбора на К4.
 * Новая семья = новая запись в CREDIT_PRODUCT_CATALOG (OCP), без правок UI-карточек.
 */
export type CreditProductKind = "WORKING_CAPITAL" | "CAPEX" | "OVERDRAFT";

export interface CreditProductPresentation {
  kind: CreditProductKind;
  /** API product_type, которые относятся к этой семье */
  productTypes: readonly ProductType[];
  title: string;
  shortDescription: string;
  longDescription: string;
  whyRecommended: string;
  badgeHint: string;
  iconLabel: string;
}

export const CREDIT_PRODUCT_CATALOG: readonly CreditProductPresentation[] = [
  {
    kind: "WORKING_CAPITAL",
    productTypes: ["VKL", "VKL_SEC"],
    title: "Оборотный кредит",
    shortDescription: "Пополнение кассы и закрытие кассовых разрывов без закупки оборудования.",
    longDescription:
      "Возобновляемая кредитная линия под обороты в Альфа-Банке. Лимит можно наращивать по лестнице после первых платежей без просрочек. Подходит, когда нужны деньги на закупки, зарплату или сезон, а не на основные средства.",
    whyRecommended: "Платёж укладывается в низкий сезон и оставляет запас по FCF.",
    badgeHint: "Касса",
    iconLabel: "ОК",
  },
  {
    kind: "CAPEX",
    productTypes: ["INVEST_LEASING"],
    title: "Кредит на оборудование",
    shortDescription: "Инвест-кредит или лизинг под CAPEX — станки, ростеры, витрины.",
    longDescription:
      "Целевое финансирование основных средств: оборудование остаётся предметом лизинга или залога. Срок длиннее оборотного, аванс от 0%. Банк сверяет счёт поставщика и назначение платежа.",
    whyRecommended: "Деньги идут поставщику; нагрузка растянута до 36 месяцев.",
    badgeHint: "CAPEX",
    iconLabel: "ОБ",
  },
  {
    kind: "OVERDRAFT",
    productTypes: ["OVERDRAFT"],
    title: "Овердрафт",
    shortDescription: "Короткий лимит сверх остатка — платёж может считаться от выручки.",
    longDescription:
      "Овердрафт закрывает краткие кассовые провалы. В демо-варианте «платёж от выручки» доля эквайринга снижается вместе с летним спадом — без жёсткого аннуитета в низкий сезон.",
    whyRecommended: "Гибкая нагрузка: летом платёж автоматически меньше.",
    badgeHint: "Гибко",
    iconLabel: "ОВ",
  },
] as const;

const KIND_BY_PRODUCT: Record<ProductType, CreditProductKind> = {
  VKL: "WORKING_CAPITAL",
  VKL_SEC: "WORKING_CAPITAL",
  INVEST_LEASING: "CAPEX",
  OVERDRAFT: "OVERDRAFT",
};

export function kindForProductType(productType: ProductType): CreditProductKind {
  return KIND_BY_PRODUCT[productType];
}

export function presentationForKind(kind: CreditProductKind): CreditProductPresentation {
  const found = CREDIT_PRODUCT_CATALOG.find((item) => item.kind === kind);
  if (!found) {
    throw new Error(`Unknown credit product kind: ${kind}`);
  }
  return found;
}

export function presentationForProductType(productType: ProductType): CreditProductPresentation {
  return presentationForKind(kindForProductType(productType));
}

/** Демо-оффер, если в ответе API нет варианта нужной семьи. */
export function demoCounterOfferForKind(
  kind: CreditProductKind,
  requestedAmountRub: number,
  baseRatePct: number,
  index: number,
): CounterOffer {
  const presentation = presentationForKind(kind);
  const productType = presentation.productTypes[0];
  const amount =
    kind === "WORKING_CAPITAL"
      ? Math.min(requestedAmountRub, 1_200_000)
      : kind === "OVERDRAFT"
        ? Math.min(requestedAmountRub, 1_800_000)
        : requestedAmountRub;
  const termMonths = kind === "CAPEX" ? 36 : kind === "OVERDRAFT" ? 18 : 24;
  const monthly =
    kind === "OVERDRAFT" ? 0 : Math.round((amount * (baseRatePct / 100 / 12)) / (1 - (1 + baseRatePct / 100 / 12) ** -termMonths));

  const featureByKind: Record<CreditProductKind, string[]> = {
    WORKING_CAPITAL: ["Укладывается в низкий сезон", "Рост лимита после 3 платежей"],
    CAPEX: ["Альфа-Лизинг", "Аванс от 0%", "Срок до 36 мес."],
    OVERDRAFT: ["9% эквайринга", "Летом платёж снижается автоматически"],
  };

  return {
    index,
    product_type: productType,
    product_label: presentation.title,
    amount_rub: amount,
    term_months: termMonths,
    rate_pct: baseRatePct,
    monthly_payment_rub: monthly,
    label: presentation.title,
    features: featureByKind[kind],
  };
}
