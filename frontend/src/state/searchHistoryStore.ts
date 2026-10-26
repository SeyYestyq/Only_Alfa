import { create } from "zustand";
import type { SearchResult } from "../api/types";

export interface SearchItemFound {
  item: string;
  price_label: string;
  supplier_name: string;
  unit?: string;
}

export interface SearchSupplierFound {
  name: string;
  inn: string;
  price_label: string;
  delivery_days: number;
  is_verified: boolean;
  fssp_label: string;
}

export interface BankSearchInsight {
  recommendedProduct: string;
  preapprovedRatePct: number;
  maxLimitLabel: string;
  actionHint: string;
}

export interface SearchHistoryEntry {
  id: string;
  companyId: string;
  companyName: string;
  timestamp: string;
  query: string;
  intent: string;
  intentLabel: string;
  amountEstimateRub: number;
  amountLabel: string;
  itemsFound: SearchItemFound[];
  suppliers: SearchSupplierFound[];
  aiAnalysis?: string;
  bankInsight: BankSearchInsight;
}

const INITIAL_SEARCH_HISTORY: SearchHistoryEntry[] = [
  {
    id: "sh-1",
    companyId: "cmp_rosters",
    companyName: "ООО «Ростерс Кафе»",
    timestamp: "12 минут назад",
    query: "Ростер для кофе Giesen W15A 2.5 млн",
    intent: "CAPEX",
    intentLabel: "Покупка оборудования (CAPEX / Лизинг)",
    amountEstimateRub: 2_500_000,
    amountLabel: "2 500 000 ₽",
    itemsFound: [
      {
        item: "Ростер Giesen W15A (загрузка 15 кг)",
        price_label: "2 480 000 ₽",
        supplier_name: "ООО «РестоОборудование»",
        unit: "комплект",
      },
      {
        item: "Ростер Diedrich IR-12 (аналог)",
        price_label: "2 650 000 ₽",
        supplier_name: "ООО «КофеТехПро»",
        unit: "комплект",
      },
      {
        item: "Дестоунер Giesen W15A (очистка зерна)",
        price_label: "320 000 ₽",
        supplier_name: "ООО «РестоОборудование»",
        unit: "шт.",
      },
    ],
    suppliers: [
      {
        name: "ООО «РестоОборудование»",
        inn: "7712345671",
        price_label: "2 480 000 ₽",
        delivery_days: 7,
        is_verified: true,
        fssp_label: "ФССП 0 ₽ · Зелёный коридор Альфа",
      },
      {
        name: "ООО «КофеТехПро» (Официальный дилер)",
        inn: "7701234560",
        price_label: "2 520 000 ₽",
        delivery_days: 12,
        is_verified: true,
        fssp_label: "ФССП 0 ₽ · Аккредитован",
      },
    ],
    aiAnalysis:
      "Ростер Giesen W15A увеличит производительность обжарки в 3.8 раза. Средний срок окупаемости в сегменте спешелти кофе — 8-10 месяцев.",
    bankInsight: {
      recommendedProduct: "Альфа-Лизинг оборудования (CAPEX)",
      preapprovedRatePct: 14.5,
      maxLimitLabel: "до 15 000 000 ₽",
      actionHint:
        "Клиент планирует закупку ростера. Доступно предодобрение с вычетом 20% НДС и ускоренной амортизацией без визита в банк.",
    },
  },
  {
    id: "sh-2",
    companyId: "cmp_rosters",
    companyName: "ООО «Ростерс Кафе»",
    timestamp: "Сегодня, 11:20",
    query: "Закупка зеленого зерна арабика 1.8 млн",
    intent: "WORKING_CAPITAL",
    intentLabel: "Оборотные средства / Сырьё",
    amountEstimateRub: 1_800_000,
    amountLabel: "1 800 000 ₽",
    itemsFound: [
      {
        item: "Арабика Brazil Santos NY2 17/18 (мешок 60 кг)",
        price_label: "1 740 000 ₽",
        supplier_name: "ООО «ИмпортКофеТрейд»",
        unit: "партия 3.2т",
      },
      {
        item: "Колумбия Supremo 17/18 свежий урожай",
        price_label: "1 910 000 ₽",
        supplier_name: "ООО «ГринКофеТрейдинг»",
        unit: "партия 2.8т",
      },
    ],
    suppliers: [
      {
        name: "ООО «ИмпортКофеТрейд»",
        inn: "7709876543",
        price_label: "1 740 000 ₽",
        delivery_days: 5,
        is_verified: true,
        fssp_label: "ФССП 0 ₽ · Проверенный поставщик",
      },
    ],
    aiAnalysis:
      "Сезонное пополнение сырьевого запаса зерна перед пиковым зимним сезоном потребления.",
    bankInsight: {
      recommendedProduct: "Возобновляемая кредитная линия (ВКЛ)",
      preapprovedRatePct: 15.2,
      maxLimitLabel: "до 5 000 000 ₽",
      actionHint:
        "Рекомендуется транш до 90 дней с возможностью досрочного погашения без комиссии.",
    },
  },
  {
    id: "sh-3",
    companyId: "cmp_tekhnostroy",
    companyName: "ООО «ТехноСтрой Инжиниринг»",
    timestamp: "Вчера, 16:40",
    query: "Аренда / лизинг автокрана Liebherr 25т",
    intent: "CAPEX",
    intentLabel: "Спецтехника и транспорт",
    amountEstimateRub: 3_200_000,
    amountLabel: "3 200 000 ₽",
    itemsFound: [
      {
        item: "Автокран Liebherr LTM 1030-2.1 (35т стрела)",
        price_label: "3 150 000 ₽",
        supplier_name: "ООО «СпецМашТехника»",
        unit: "ед.",
      },
    ],
    suppliers: [
      {
        name: "ООО «СпецМашТехника»",
        inn: "7722446688",
        price_label: "3 150 000 ₽",
        delivery_days: 10,
        is_verified: true,
        fssp_label: "ФССП 0 ₽ · Аккредитован",
      },
    ],
    aiAnalysis:
      "Модернизация парка строительной техники под подряд по программе благоустройства.",
    bankInsight: {
      recommendedProduct: "Лизинг спецтехники",
      preapprovedRatePct: 14.8,
      maxLimitLabel: "до 10 000 000 ₽",
      actionHint:
        "Высокий скоринг, лимит согласован. Возможен выездной лизинг за 24 часа.",
    },
  },
  {
    id: "sh-4",
    companyId: "cmp_kovalev",
    companyName: "ИП Ковалев Д.С.",
    timestamp: "24 окт, 14:10",
    query: "Кассовый разрыв 200 000 ₽ закупка товаров",
    intent: "OVERDRAFT",
    intentLabel: "Кассовый разрыв / Овердрафт",
    amountEstimateRub: 200_000,
    amountLabel: "200 000 ₽",
    itemsFound: [
      {
        item: "Торговое оборудование и товары для витрины",
        price_label: "195 000 ₽",
        supplier_name: "ООО «РитейлСнаб»",
        unit: "комплект",
      },
    ],
    suppliers: [
      {
        name: "ООО «РитейлСнаб»",
        inn: "7733557799",
        price_label: "195 000 ₽",
        delivery_days: 3,
        is_verified: true,
        fssp_label: "ФССП 0 ₽",
      },
    ],
    aiAnalysis:
      "Краткосрочная потребность для устранения разрыва до поступления эквайринговой выручки.",
    bankInsight: {
      recommendedProduct: "Экспресс-овердрафт",
      preapprovedRatePct: 16.5,
      maxLimitLabel: "до 1 500 000 ₽",
      actionHint:
        "Автопогашение с ежедневных поступлений эквайринга Альфа-Банка.",
    },
  },
];

interface SearchHistoryStore {
  history: SearchHistoryEntry[];
  addSearchFromRun: (
    companyId: string,
    companyName: string,
    query: string,
    result: SearchResult,
  ) => void;
  getHistoryForCompany: (companyId: string) => SearchHistoryEntry[];
  getAllHistory: () => SearchHistoryEntry[];
}

export const useSearchHistoryStore = create<SearchHistoryStore>((set, get) => ({
  history: INITIAL_SEARCH_HISTORY,

  addSearchFromRun: (companyId, companyName, query, result) => {
    const formattedAmount = result.amount_estimate_rub
      ? `${result.amount_estimate_rub.toLocaleString("ru-RU")} ₽`
      : "—";

    const items: SearchItemFound[] = result.market_prices.map((m) => ({
      item: m.item,
      price_label: m.price_label,
      supplier_name: m.supplier_name,
      unit: m.unit,
    }));

    const suppliers: SearchSupplierFound[] = result.suppliers.map((s) => ({
      name: s.name,
      inn: s.inn,
      price_label: s.price_label,
      delivery_days: s.delivery_days,
      is_verified: s.is_verified,
      fssp_label: s.fssp_label,
    }));

    const badge = result.credit_badge;
    const isCapex = result.intent === "CAPEX" || /ростер|оборуд|станок|авто|кран/i.test(query);
    const isOverdraft = result.intent === "OVERDRAFT" || /разрыв|овердрафт|зарплат/i.test(query);

    const recommendedProduct = badge?.product_label
      ? badge.product_label
      : isCapex
        ? "Альфа-Лизинг оборудования (CAPEX)"
        : isOverdraft
          ? "Экспресс-овердрафт"
          : "Возобновляемая кредитная линия (ВКЛ)";

    const preapprovedRatePct = badge?.rate_pct ?? (isCapex ? 14.5 : isOverdraft ? 16.5 : 15.2);
    const maxLimitLabel = badge?.limit_rub
      ? `до ${badge.limit_rub.toLocaleString("ru-RU")} ₽`
      : "до 5 000 000 ₽";

    const actionHint = isCapex
      ? `Клиент ищет оборудование. Банку выгодно предложить лизинг под ${preapprovedRatePct}% с вычетом 20% НДС.`
      : isOverdraft
        ? "Кассовый разрыв. Экспресс-овердрафт с автопогашением защитит финансовую устойчивость."
        : `Потребность в оборотном капитале. Лимит согласован под ${preapprovedRatePct}%.`;

    const newEntry: SearchHistoryEntry = {
      id: `sh-${Date.now()}`,
      companyId,
      companyName,
      timestamp: "Только что",
      query,
      intent: result.intent,
      intentLabel: result.intent_label || "Поиск контрагентов и товаров",
      amountEstimateRub: result.amount_estimate_rub || 0,
      amountLabel: formattedAmount,
      itemsFound: items,
      suppliers,
      aiAnalysis:
        result.ai_enrichment?.text ||
        `По запросу найдено ${items.length} рыночных предложений и ${suppliers.length} проверенных поставщиков.`,
      bankInsight: {
        recommendedProduct,
        preapprovedRatePct,
        maxLimitLabel,
        actionHint,
      },
    };

    set((state) => ({
      history: [newEntry, ...state.history.filter((h) => h.id !== newEntry.id)],
    }));
  },

  getHistoryForCompany: (companyId: string) => {
    return get().history.filter(
      (h) => h.companyId === companyId || h.companyId === `cmp_${companyId}`,
    );
  },

  getAllHistory: () => {
    return get().history;
  },
}));
