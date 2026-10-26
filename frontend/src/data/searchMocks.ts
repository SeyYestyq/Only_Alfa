import type { SearchResult } from "../api/types";

export interface BusinessSearchScenario {
  id: string;
  query: string;
  shortLabel: string;
  category: "capex" | "overdraft" | "working_capital" | "guarantee" | "factoring" | "tax_info";
  productTag: string;
  icon: string;
  commercialBenefitToAlfa: string;
  result: SearchResult & {
    alfa_product_perk?: string;
    tax_benefit?: string;
  };
}

export const BUSINESS_SEARCH_SCENARIOS: BusinessSearchScenario[] = [
  {
    id: "roaster_giesen",
    query: "Ростер для кофе Giesen W15A 2.5 млн",
    shortLabel: "Ростер Giesen W15A 2.5 млн",
    category: "capex",
    productTag: "Альфа-Лизинг оборудования",
    icon: "☕",
    commercialBenefitToAlfa:
      "Высокомаржинальный лизинг с залогом оборудования (LTV 85%). Удержание счёта на 3 года + комиссионный доход со страхования.",
    result: {
      query: "Ростер для кофе Giesen W15A 2.5 млн",
      intent: "CAPEX",
      intent_label: "Покупка оборудования (CAPEX / Лизинг)",
      silence_mode: false,
      silence_reason: null,
      amount_estimate_rub: 2_500_000,
      amount_source: "QUERY",
      market_prices: [
        {
          item: "Ростер Giesen W15A (загрузка 15 кг)",
          price_rub: 2_480_000,
          price_label: "2 480 000 ₽",
          unit: "комплект",
          supplier_name: "ООО «РестоОборудование»",
        },
        {
          item: "Ростер Diedrich IR-12 (аналог)",
          price_rub: 2_650_000,
          price_label: "2 650 000 ₽",
          unit: "комплект",
          supplier_name: "ООО «КофеТехПро»",
        },
        {
          item: "Дестоунер Giesen W15A (опция очистки)",
          price_rub: 320_000,
          price_label: "320 000 ₽",
          unit: "шт.",
          supplier_name: "ООО «РестоОборудование»",
        },
      ],
      suppliers: [
        {
          name: "ООО «РестоОборудование»",
          inn: "7712345671",
          fssp_amount_rub: 0,
          fssp_label: "ФССП: 0 ₽ · Зелёный коридор Альфа",
          is_verified: true,
          price_label: "2 480 000 ₽",
          delivery_days: 7,
        },
        {
          name: "ООО «КофеТехПро» (Официальный дилер)",
          inn: "7701234560",
          fssp_amount_rub: 0,
          fssp_label: "ФССП: 0 ₽ · Аккредитован",
          is_verified: true,
          price_label: "2 520 000 ₽",
          delivery_days: 12,
        },
        {
          name: "ООО «ПромМашСнаб»",
          inn: "7767890122",
          fssp_amount_rub: 0,
          fssp_label: "ФССП: 0 ₽ · Проверен",
          is_verified: true,
          price_label: "2 550 000 ₽",
          delivery_days: 14,
        },
      ],
      credit_badge: {
        product_type: "INVEST_LEASING",
        product_label: "Альфа-Лизинг оборудования (CAPEX)",
        amount_rub: 2_500_000,
        term_months: 36,
        rate_pct: 14.5,
        monthly_payment_rub: 86_120,
        max_payment_rub: 165_000,
        limit_rub: 15_000_000,
        is_preapproved: true,
        query: "Ростер для кофе Giesen W15A 2.5 млн",
        disclaimer:
          "Предодобрено без выезда оценщика. Оборудование является предметом залога. Решение онлайн за 90 сек.",
      },
      news_item: null,
      classification_ms: 1.4,
      ai_provider_mode: "deterministic_alfa_risk_v2",
      ai_enrichment: {
        text: "Ростер Giesen W15A увеличит производительность обжарки в 3.8 раза. При оформлении через Альфа-Лизинг бизнес возвращает до 416 667 ₽ НДС, а ускоренная амортизация (коэффициент 3) снижает налог на прибыль. Предварительно одобрен субсидированный аванс от 0%.",
        model: "Alfa Financial Copilot",
        latency_ms: 42,
      },
      total_ms: 8.6,
      alfa_product_perk: "Аванс 0% · Вычет 20% НДС · Решение онлайн за 90 секунд",
      tax_benefit: "Экономия на налогах: до 416 667 ₽ по НДС + снижение налога на прибыль",
    },
  },
  {
    id: "overdraft_gap",
    query: "Кассовый разрыв 650 000 ₽ на зарплату и аренду",
    shortLabel: "Кассовый разрыв 650 000 ₽",
    category: "overdraft",
    productTag: "Экспресс-овердрафт с автопогашением",
    icon: "⚡",
    commercialBenefitToAlfa:
      "Перевод зарплатного проекта в Альфу (0% на первые 30 дней) + автопогашение до 9% с ежедневной выручки эквайринга без риска дефолта.",
    result: {
      query: "Кассовый разрыв 650 000 ₽ на зарплату и аренду",
      intent: "OVERDRAFT",
      intent_label: "Кассовый разрыв / Экспресс-овердрафт",
      silence_mode: false,
      silence_reason: null,
      amount_estimate_rub: 650_000,
      amount_source: "QUERY",
      market_prices: [
        {
          item: "Экспресс-овердрафт с грейс-периодом 30 дней",
          price_rub: 650_000,
          price_label: "0% первые 30 дней",
          unit: "транш",
          supplier_name: "АО «АЛЬФА-БАНК»",
        },
        {
          item: "Автопогашение с дневного эквайринга (6-9%)",
          price_rub: 0,
          price_label: "Без штрафов",
          unit: "сервис",
          supplier_name: "АО «АЛЬФА-БАНК»",
        },
      ],
      suppliers: [
        {
          name: "Зарплатный реестр Альфа-Банк",
          inn: "7728168971",
          fssp_amount_rub: 0,
          fssp_label: "ФССП: 0 ₽ · Мгновенное зачисление",
          is_verified: true,
          price_label: "Лимит до 1.5 млн ₽",
          delivery_days: 0,
        },
        {
          name: "Сервис моментальных выплат сотрудникам",
          inn: "7728168971",
          fssp_amount_rub: 0,
          fssp_label: "ФССП: 0 ₽ · Без комиссии",
          is_verified: true,
          price_label: "0 ₽ за платёжки",
          delivery_days: 0,
        },
      ],
      credit_badge: {
        product_type: "OVERDRAFT",
        product_label: "Экспресс-овердрафт под эквайринг",
        amount_rub: 650_000,
        term_months: 12,
        rate_pct: 16.0,
        monthly_payment_rub: 21_660,
        max_payment_rub: 120_000,
        limit_rub: 1_500_000,
        is_preapproved: true,
        query: "Кассовый разрыв 650 000 ₽ на зарплату и аренду",
        disclaimer:
          "Грейс-период 0% на 30 дней при подключении зарплатного проекта Альфа-Банка. Деньги на счёте через 2 минуты.",
      },
      news_item: null,
      classification_ms: 1.1,
      ai_provider_mode: "deterministic_alfa_risk_v2",
      ai_enrichment: {
        text: "Прогноз кассы показывает наложение даты выплаты аванса сотрудникам и аренды. Альфа-Овердрафт моментально закрывает дефицит ликвидности без залога. При поступлении выручки по эквайрингу банк автоматически списывает 8% вечернего реестра.",
        model: "Alfa Cash Radar AI",
        latency_ms: 38,
      },
      total_ms: 7.2,
      alfa_product_perk: "0% ставка на 30 дней · Деньги на счёте за 2 минуты · Автопогашение с кассы",
      tax_benefit: "Защита от штрафов трудовой инспекции и блокировок ФНС",
    },
  },
  {
    id: "arabica_bulk",
    query: "Закупка кофе арабика 5 тонн 1 800 000 ₽",
    shortLabel: "Закупка зерна арабика 1.8 млн",
    category: "working_capital",
    productTag: "Возобновляемая кредитная линия (ВКЛ)",
    icon: "📦",
    commercialBenefitToAlfa:
      "Траншевый кредитный портфель под контракт + комиссия за комплаенс-проверку поставщика и аккредитивные расчёты.",
    result: {
      query: "Закупка кофе арабика 5 тонн 1 800 000 ₽",
      intent: "WORKING_CAPITAL",
      intent_label: "Пополнение оборотных средств (ВКЛ)",
      silence_mode: false,
      silence_reason: null,
      amount_estimate_rub: 1_800_000,
      amount_source: "QUERY",
      market_prices: [
        {
          item: "Кофе арабика Бразилия Сантос (5 000 кг)",
          price_rub: 1_800_000,
          price_label: "360 ₽/кг",
          unit: "партия",
          supplier_name: "ООО «КофеТехПро»",
        },
        {
          item: "Кофе арабика Колумбия Супремо (5 000 кг)",
          price_rub: 1_950_000,
          price_label: "390 ₽/кг",
          unit: "партия",
          supplier_name: "ООО «ХорекаСнаб»",
        },
      ],
      suppliers: [
        {
          name: "ООО «КофеТехПро»",
          inn: "7701234560",
          fssp_amount_rub: 0,
          fssp_label: "ФССП: 0 ₽ · Платёжный рейтинг 99/100",
          is_verified: true,
          price_label: "1 800 000 ₽",
          delivery_days: 3,
        },
        {
          name: "ООО «ХорекаСнаб»",
          inn: "7701234578",
          fssp_amount_rub: 0,
          fssp_label: "ФССП: 0 ₽ · Прямой импорт",
          is_verified: true,
          price_label: "1 850 000 ₽",
          delivery_days: 5,
        },
      ],
      credit_badge: {
        product_type: "VKL",
        product_label: "Возобновляемая кредитная линия (ВКЛ)",
        amount_rub: 1_800_000,
        term_months: 18,
        rate_pct: 15.2,
        monthly_payment_rub: 112_400,
        max_payment_rub: 160_000,
        limit_rub: 5_000_000,
        is_preapproved: true,
        query: "Закупка кофе арабика 5 тонн 1 800 000 ₽",
        disclaimer:
          "Транши до 90 дней. Проценты начисляются только на фактически использованный остаток лимита.",
      },
      news_item: null,
      classification_ms: 1.3,
      ai_provider_mode: "deterministic_alfa_risk_v2",
      ai_enrichment: {
        text: "Цены на зелёное зерно арабики растут на 12% из-за неурожая в Латинской Америке. Фиксация контракта на 5 тонн позволяет сэкономить до 216 000 ₽ на сезонном скачке. ВКЛ Альфа-Банка предоставляет транши по первому запросу за 1 клик.",
        model: "Alfa Commodity Radar",
        latency_ms: 40,
      },
      total_ms: 7.9,
      alfa_product_perk: "Транши до 90 дней · Платите % только за использованную сумму · Без залога",
      tax_benefit: "Фиксация себестоимости сырья до сезонного роста цен на 12%",
    },
  },
  {
    id: "guarantee_44fz",
    query: "Банковская гарантия 44-ФЗ 1 200 000 ₽",
    shortLabel: "Гарантия 44-ФЗ 1.2 млн ₽",
    category: "guarantee",
    productTag: "Экспресс-гарантия Альфа-Банка",
    icon: "🏛️",
    commercialBenefitToAlfa:
      "Чистый комиссионный доход 1.8% без отвлечения кредитного капитала + обязательное открытие спецсчёта в Альфа-Банке с неснижаемым остатком.",
    result: {
      query: "Банковская гарантия 44-ФЗ 1 200 000 ₽",
      intent: "INFO_ONLY",
      intent_label: "Тендерное сопровождение · Гарантия 44-ФЗ",
      silence_mode: false,
      silence_reason: null,
      amount_estimate_rub: 1_200_000,
      amount_source: "QUERY",
      market_prices: [
        {
          item: "Банковская гарантия на исполнение контракта 44-ФЗ",
          price_rub: 21_600,
          price_label: "Комиссия 1.8% (21 600 ₽)",
          unit: "гарантия",
          supplier_name: "АО «АЛЬФА-БАНК»",
        },
        {
          item: "Тендерный спецсчёт с процентом на остаток (9.5%)",
          price_rub: 0,
          price_label: "Бесплатное открытие",
          unit: "счёт",
          supplier_name: "АО «АЛЬФА-БАНК»",
        },
      ],
      suppliers: [
        {
          name: "Реестр банковских гарантий Минфина РФ (ЕИС)",
          inn: "7728168971",
          fssp_amount_rub: 0,
          fssp_label: "ФССП: 0 ₽ · Аккредитация Минфина",
          is_verified: true,
          price_label: "Выпуск за 2 часа",
          delivery_days: 0,
        },
        {
          name: "Тендерная площадка Сбер А / РТС-Тендер",
          inn: "7701234560",
          fssp_amount_rub: 0,
          fssp_label: "ФССП: 0 ₽ · Интеграция по API",
          is_verified: true,
          price_label: "Прямая отправка",
          delivery_days: 0,
        },
      ],
      credit_badge: {
        product_type: "INVEST_LEASING",
        product_label: "Банковская гарантия 44-ФЗ / 223-ФЗ",
        amount_rub: 1_200_000,
        term_months: 12,
        rate_pct: 1.8,
        monthly_payment_rub: 1_800,
        max_payment_rub: 160_000,
        limit_rub: 10_000_000,
        is_preapproved: true,
        query: "Банковская гарантия 44-ФЗ 1 200 000 ₽",
        disclaimer:
          "Внесение в реестр ЕИС за 2 часа. Без залога, поручительства и визита в банк. Доступно для МСП с опытом от 3 месяцев.",
      },
      news_item: null,
      classification_ms: 1.2,
      ai_provider_mode: "deterministic_alfa_risk_v2",
      ai_enrichment: {
        text: "Компания полностью соответствует требованиям 44-ФЗ: отсутствие в реестре недобросовестных поставщиков (РНП) и нулевая задолженность по налогам. Гарантия выпускается с электронной подписью онлайн, спецсчёт открывается автоматически с начислением 9.5% на остаток.",
        model: "Alfa Tender Engine",
        latency_ms: 35,
      },
      total_ms: 6.8,
      alfa_product_perk: "В реестре ЕИС за 2 часа · Комиссия всего 1.8% · Без залога и визита",
      tax_benefit: "Не отвлекает деньги из оборота на обеспечение контракта",
    },
  },
  {
    id: "factoring_retail",
    query: "Отсрочка платежа X5 Retail 3 млн на 90 дней",
    shortLabel: "Отсрочка X5 Retail 3 млн",
    category: "factoring",
    productTag: "Альфа-Факторинг без регресса",
    icon: "🛒",
    commercialBenefitToAlfa:
      "Риск дефолта несёт федеральная сеть с рейтингом AAA (X5 Retail Group). Банк зарабатывает комиссию 1.3%/мес., получая все потоки компании.",
    result: {
      query: "Отсрочка платежа X5 Retail 3 млн на 90 дней",
      intent: "WORKING_CAPITAL",
      intent_label: "Финансирование дебиторской задолженности (Факторинг)",
      silence_mode: false,
      silence_reason: null,
      amount_estimate_rub: 3_000_000,
      amount_source: "QUERY",
      market_prices: [
        {
          item: "Финансирование поставок X5 Group (95% сразу)",
          price_rub: 2_850_000,
          price_label: "Выплата в день отгрузки",
          unit: "транш",
          supplier_name: "АО «АЛЬФА-БАНК»",
        },
        {
          item: "Комиссия факторинга за 90 дней отсрочки",
          price_rub: 117_000,
          price_label: "1.3% в месяц",
          unit: "услуга",
          supplier_name: "АО «АЛЬФА-БАНК»",
        },
      ],
      suppliers: [
        {
          name: "X5 Retail Group (Пятёрочка, Перекрёсток)",
          inn: "7728029110",
          fssp_amount_rub: 0,
          fssp_label: "Дебитор класса AAA · Подтверждён",
          is_verified: true,
          price_label: "Оплата по факторингу",
          delivery_days: 1,
        },
        {
          name: "ЭДО СФЕРА Курьер / Диадок (Интеграция УПД)",
          inn: "7701234560",
          fssp_amount_rub: 0,
          fssp_label: "ФССП: 0 ₽ · Электронный факторинг",
          is_verified: true,
          price_label: "Автоматический зачёт",
          delivery_days: 0,
        },
      ],
      credit_badge: {
        product_type: "VKL",
        product_label: "Альфа-Факторинг без регресса",
        amount_rub: 3_000_000,
        term_months: 6,
        rate_pct: 15.6,
        monthly_payment_rub: 39_000,
        max_payment_rub: 250_000,
        limit_rub: 20_000_000,
        is_preapproved: true,
        query: "Отсрочка платежа X5 Retail 3 млн на 90 дней",
        disclaimer:
          "Без регресса — если дебитор задержит оплату, риск берёт на себя Альфа-Банк. До 95% суммы УПД поступает на счёт в день поставки.",
      },
      news_item: null,
      classification_ms: 1.5,
      ai_provider_mode: "deterministic_alfa_risk_v2",
      ai_enrichment: {
        text: "X5 Group имеет безупречный кредитный профиль. Подключение факторинга высвобождает 2 850 000 ₽ замороженных оборотных средств в день отгрузки партии, позволяя совершить ещё 2 оборота товара за 90 дней и нарастить валовую маржу на 24%.",
        model: "Alfa Factoring Copilot",
        latency_ms: 45,
      },
      total_ms: 9.1,
      alfa_product_perk: "Деньги в день отгрузки · Без залога · 100% защита от неплатежа дебитора",
      tax_benefit: "Ускорение оборачиваемости капитала с 90 до 1 дня",
    },
  },
  {
    id: "tax_calendar_usn",
    query: "Когда платить налог по УСН за 1 квартал и ЕНП",
    shortLabel: "Календарь УСН и ЕНП",
    category: "tax_info",
    productTag: "Режим тишины · Налоговая копилка",
    icon: "📅",
    commercialBenefitToAlfa:
      "Демонстрация честности (банк не навязывает лишний кредит) + продажа сервиса «Налоговая копилка Альфа» с остатками под 11% годовых.",
    result: {
      query: "Когда платить налог по УСН за 1 квартал и ЕНП",
      intent: "INFO_ONLY",
      intent_label: "Информационный запрос · Налоговый календарь",
      silence_mode: true,
      silence_reason:
        "Кредит не требуется: на счёте компании 842 500 ₽, расчётный налог по УСН за 1 кв. составляет 48 200 ₽. Срок уплаты — 28 апреля. Кассовый разрыв отсутствует.",
      amount_estimate_rub: 48_200,
      amount_source: "DEFAULT",
      market_prices: [
        {
          item: "Авансовый платёж УСН («Доходы» 6%)",
          price_rub: 48_200,
          price_label: "48 200 ₽",
          unit: "налог",
          supplier_name: "ФНС России (ЕНС)",
        },
        {
          item: "Налоговая копилка Альфа-Банка (начисление 11%)",
          price_rub: 0,
          price_label: "Бесплатно",
          unit: "сервис",
          supplier_name: "АО «АЛЬФА-БАНК»",
        },
      ],
      suppliers: [
        {
          name: "ФНС России (Единый налоговый платёж)",
          inn: "7707329110",
          fssp_amount_rub: 0,
          fssp_label: "Задолженность: 0 ₽",
          is_verified: true,
          price_label: "Срок: 28 апреля",
          delivery_days: 0,
        },
        {
          name: "Автоматическая онлайн-бухгалтерия Альфа",
          inn: "7728168971",
          fssp_amount_rub: 0,
          fssp_label: "Интеграция с расчётным счётом",
          is_verified: true,
          price_label: "Расчёт в 1 клик",
          delivery_days: 0,
        },
      ],
      credit_badge: null,
      news_item: null,
      classification_ms: 0.9,
      ai_provider_mode: "deterministic_alfa_risk_v2",
      ai_enrichment: {
        text: "Режим тишины активен: кредитование не рекомендуется, так как компания обладает избыточной ликвидностью. Рекомендуем подключить сервис «Налоговая копилка Альфа»: 6% с каждого входящего эквайрингового платежа автоматически резервируются на отдельном счёте с начислением 11% годовых.",
        model: "Alfa Silence Core AI",
        latency_ms: 30,
      },
      total_ms: 5.4,
      alfa_product_perk: "Режим этичного ИИ · Налоговая копилка с начислением 11% годовых",
      tax_benefit: "Автоматический расчёт вычета страховых взносов и 0 ₽ переплат",
    },
  },
];

export function findMatchingScenario(query: string): BusinessSearchScenario | undefined {
  const norm = query.toLowerCase().replace(/ё/g, "е").trim();
  if (!norm) return undefined;

  // Direct ID or exact match first
  const exact = BUSINESS_SEARCH_SCENARIOS.find(
    (item) =>
      item.query.toLowerCase().replace(/ё/g, "е") === norm ||
      item.shortLabel.toLowerCase().replace(/ё/g, "е") === norm,
  );
  if (exact) return exact;

  if (norm.includes("ростер") || norm.includes("giesen")) {
    return BUSINESS_SEARCH_SCENARIOS.find((s) => s.id === "roaster_giesen");
  }
  if (norm.includes("разрыв") || norm.includes("650") || (norm.includes("овердрафт") && norm.includes("зарплат"))) {
    return BUSINESS_SEARCH_SCENARIOS.find((s) => s.id === "overdraft_gap");
  }
  if (norm.includes("гаранти") || norm.includes("44-фз") || norm.includes("223-фз") || norm.includes("тендер")) {
    return BUSINESS_SEARCH_SCENARIOS.find((s) => s.id === "guarantee_44fz");
  }
  if (norm.includes("факторинг") || norm.includes("x5") || norm.includes("отсрочк") || norm.includes("дебитор")) {
    return BUSINESS_SEARCH_SCENARIOS.find((s) => s.id === "factoring_retail");
  }
  if (norm.includes("арабик") || (norm.includes("зерно") && norm.includes("1.8")) || (norm.includes("кофе") && norm.includes("тонн"))) {
    return BUSINESS_SEARCH_SCENARIOS.find((s) => s.id === "arabica_bulk");
  }
  if (norm.includes("усн") || norm.includes("енп") || norm.includes("когда платить") || norm.includes("календарь")) {
    return BUSINESS_SEARCH_SCENARIOS.find((s) => s.id === "tax_calendar_usn");
  }

  return undefined;
}
