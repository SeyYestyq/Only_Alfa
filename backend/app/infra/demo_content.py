"""Контент демо-стенда: выписка, лента News-to-Action, чипсы поиска, каталог поставщиков."""
from __future__ import annotations

from dataclasses import dataclass, field

# ── Транзакции счёта ─────────────────────────────────────────────────────────
DEMO_TRANSACTIONS: dict[str, list[dict]] = {
    "smirnov": [
        {"id": "trn_smirnov_1", "days_ago": 2, "description": "Оплата ООО «КофеТехПро» за расходники",
         "amount_rub": 180_000, "direction": "OUT", "category": "Закупки", "can_installment": True},
        {"id": "trn_smirnov_2", "days_ago": 3, "description": "Эквайринг за неделю",
         "amount_rub": 362_500, "direction": "IN", "category": "Выручка", "can_installment": False},
        {"id": "trn_smirnov_3", "days_ago": 8, "description": "Аренда помещения",
         "amount_rub": 250_000, "direction": "OUT", "category": "Аренда", "can_installment": False},
        {"id": "trn_smirnov_4", "days_ago": 11, "description": "Налоги ЕНП",
         "amount_rub": 50_000, "direction": "OUT", "category": "Налоги", "can_installment": False},
    ],
    "rosters": [
        {"id": "trn_rosters_1", "days_ago": 1, "description": "Оплата ООО «РестоОборудование»",
         "amount_rub": 235_000, "direction": "OUT", "category": "Оборудование", "can_installment": True},
        {"id": "trn_rosters_2", "days_ago": 4, "description": "Эквайринг за неделю",
         "amount_rub": 525_000, "direction": "IN", "category": "Выручка", "can_installment": False},
        {"id": "trn_rosters_3", "days_ago": 9, "description": "Аренда и ФОТ",
         "amount_rub": 400_000, "direction": "OUT", "category": "Аренда", "can_installment": False},
        {"id": "trn_rosters_4", "days_ago": 12, "description": "Платёж по кредиту",
         "amount_rub": 78_000, "direction": "OUT", "category": "Кредиты", "can_installment": False},
    ],
    "tekhnostroy": [
        {"id": "trn_tekhnostroy_1", "days_ago": 2, "description": "Оплата ООО «КабельТрейд»",
         "amount_rub": 640_000, "direction": "OUT", "category": "Закупки", "can_installment": True},
        {"id": "trn_tekhnostroy_2", "days_ago": 5, "description": "Оплата по контракту ГК «Самолёт»",
         "amount_rub": 1_800_000, "direction": "IN", "category": "Выручка", "can_installment": False},
        {"id": "trn_tekhnostroy_3", "days_ago": 7, "description": "Аренда техники и ФОТ",
         "amount_rub": 1_400_000, "direction": "OUT", "category": "Аренда", "can_installment": False},
        {"id": "trn_tekhnostroy_4", "days_ago": 13, "description": "Налоги",
         "amount_rub": 550_000, "direction": "OUT", "category": "Налоги", "can_installment": False},
    ],
    "kovalev": [
        {"id": "trn_kovalev_1", "days_ago": 3, "description": "Оплата ООО «КофеТехПро»",
         "amount_rub": 95_000, "direction": "OUT", "category": "Закупки", "can_installment": True},
        {"id": "trn_kovalev_2", "days_ago": 5, "description": "Эквайринг за неделю",
         "amount_rub": 170_000, "direction": "IN", "category": "Выручка", "can_installment": False},
        {"id": "trn_kovalev_3", "days_ago": 10, "description": "Аренда помещения",
         "amount_rub": 245_000, "direction": "OUT", "category": "Аренда", "can_installment": False},
        {"id": "trn_kovalev_4", "days_ago": 14, "description": "Налоги ЕНП",
         "amount_rub": 100_000, "direction": "OUT", "category": "Налоги", "can_installment": False},
    ],
    "bodrost_plus": [
        {"id": "trn_bodrost_1", "days_ago": 1, "description": "Оплата ООО «ТоргОпт»",
         "amount_rub": 120_000, "direction": "OUT", "category": "Закупки", "can_installment": True},
        {"id": "trn_bodrost_2", "days_ago": 6, "description": "Поступления от ключевого клиента",
         "amount_rub": 400_000, "direction": "IN", "category": "Выручка", "can_installment": False},
        {"id": "trn_bodrost_3", "days_ago": 8, "description": "Аренда склада",
         "amount_rub": 160_000, "direction": "OUT", "category": "Аренда", "can_installment": False},
        {"id": "trn_bodrost_4", "days_ago": 12, "description": "Исполнительный лист ФССП",
         "amount_rub": 320_000, "direction": "OUT", "category": "ФССП", "can_installment": False},
    ],
}

# ── Лента News-to-Action ─────────────────────────────────────────────────────
DEMO_NEWS: dict[str, list[dict]] = {
    "smirnov": [
        {"id": "news_smirnov_1", "title": "Выручка кофеен +18% год к году",
         "text": "Рынок HoReCa растёт третий квартал подряд. Спрос на премиальное оборудование ускоряется.",
         "cta": "Подобрать кофемашину", "cluster": "HORECA"},
        {"id": "news_smirnov_2", "title": "Гранты для HoReCa до 500 тыс. ₽",
         "text": "Минэкономики продлило программу поддержки малых точек питания до конца года.",
         "cta": "Проверить условия", "cluster": "HORECA"},
        {"id": "news_smirnov_3", "title": "Ставка ЦБ 14% — время фиксировать лимит",
         "text": "Инвест-кредит на оборудование можно зафиксировать по ставке от 14.5% годовых.",
         "cta": "Рассчитать платёж", "cluster": "HORECA"},
    ],
    "rosters": [
        {"id": "news_rosters_1", "title": "9 конкурентов в радиусе 300 метров",
         "text": "GeoScore локации 38 — трафик делится между прямыми конкурентами.",
         "cta": "Посмотреть альтернативы", "cluster": "HORECA"},
        {"id": "news_rosters_2", "title": "Оборудование для кухни подорожало на 12%",
         "text": "Импортное оборудование растёт в цене — лизинг фиксирует стоимость сейчас.",
         "cta": "Зафиксировать цену", "cluster": "HORECA"},
        {"id": "news_rosters_3", "title": "Эквайринг можно направить на погашение",
         "text": "До 9% дневного эквайринга может уходить на обслуживание кредита.",
         "cta": "Смотреть оффер", "cluster": "HORECA"},
    ],
    "tekhnostroy": [
        {"id": "news_tekhnostroy_1", "title": "Госзаказ на строительство вырос на 34%",
         "text": "Подрядчики с подтверждённым рейтингом заказчика получают приоритет.",
         "cta": "Усилить лимит", "cluster": "CONSTRUCTION"},
        {"id": "news_tekhnostroy_2", "title": "Кабель ВВГнг подорожал на 6%",
         "text": "Цены на кабельную продукцию растут из-за спроса со стороны ЦОД.",
         "cta": "Закупить сейчас", "cluster": "CONSTRUCTION"},
        {"id": "news_tekhnostroy_3", "title": "Мультибанк снимает вопрос аномалии выручки",
         "text": "Выписки из Сбера, Т-Банка и ВТБ подтверждают обороты за 3 месяца.",
         "cta": "Подтянуть выписки", "cluster": "CONSTRUCTION"},
    ],
    "kovalev": [
        {"id": "news_kovalev_1", "title": "Кассовый разрыв через 14 дней",
         "text": "Аренда и налоги ЕНП совпадают в одной дате — прогноз показывает минус.",
         "cta": "Открыть прогноз кассы", "cluster": "HORECA"},
        {"id": "news_kovalev_2", "title": "Техническая просрочка ещё не приговор",
         "text": "Просрочка 20 дней не блокирует заявку, но переводит её на ручной разбор.",
         "cta": "Что делать", "cluster": "HORECA"},
        {"id": "news_kovalev_3", "title": "Лестница лимитов 300 → 750 тыс. ₽",
         "text": "Начните со стартового лимита и увеличивайте его по мере платежей.",
         "cta": "Узнать условия", "cluster": "HORECA"},
    ],
    "bodrost_plus": [
        {"id": "news_bodrost_1", "title": "Отток ключевого клиента снизил выручку на 60%",
         "text": "Финансовый радар фиксирует отрицательный денежный поток.",
         "cta": "План оздоровления", "cluster": "RETAIL"},
        {"id": "news_bodrost_2", "title": "Исполнительные листы ФССП: 320 тыс. ₽",
         "text": "Задолженность превышает 20% месячного оборота — кредитование приостановлено.",
         "cta": "Как закрыть долг", "cluster": "RETAIL"},
        {"id": "news_bodrost_3", "title": "90 дней до повторной заявки",
         "text": "Пошаговый план восстановления платёжной дисциплины и оборотов.",
         "cta": "Смотреть план", "cluster": "RETAIL"},
    ],
}

# ── Чипсы умного поиска: запасной вариант по ОКВЭД ───────────────────────────
SEARCH_CHIPS_BY_CLUSTER: dict[str, list[str]] = {
    "HORECA": ["Кофемашина La Marzocco", "Конвектомат Rational", "Календарь УСН", "Овердрафт на аренду"],
    "CONSTRUCTION": ["Кабель ВВГнг 15 км", "Бетон М300 40 м³", "Овердрафт на зарплату", "Календарь УСН"],
    "RETAIL": ["Пополнение товарного запаса", "Стеллажи для склада", "Овердрафт на налоги", "Календарь УСН"],
    "PRODUCTION": ["Токарный станок ЧПУ", "Комплектующие для линии", "MES-система", "Календарь УСН"],
    "SERVICES": ["CRM-система", "Спецтехника в лизинг", "Обучение сотрудников", "Календарь УСН"],
}

# ── Готовые запросы под 5 демо-профилей (история бизнеса + 4 класса intent) ─
# CAPEX · WORKING_CAPITAL · OVERDRAFT · INFO_ONLY — чтобы на демо сразу показать Search-to-Credit.
SEARCH_CHIPS_BY_DEMO_KEY: dict[str, list[str]] = {
    # ИП Смирнов · сильный профиль (≈815): предодобренный CAPEX кофейни
    "smirnov": [
        "Кофемашина La Marzocco 900 000",
        "Закупка кофе в зёрнах 240 000",
        "Не хватает на аренду в низкий сезон",
        "Календарь УСН",
    ],
    # ООО Ростерс · встречное предложение (≈610): дорогой ростер / кассовый разрыв
    "rosters": [
        "Купить оборудование для обжарки 2 500 000",
        "Закупка зерна арабика партия 400 000",
        "Кассовый разрыв через неделю на ЕНП",
        "Расскажи про льготы для кофеен",
    ],
    # ТехноСтрой · аномалия выручки / Мультибанк (≈760 после): стройматериалы
    "tekhnostroy": [
        "Кабель ВВГнг 15 км",
        "Бетон М300 40 м3",
        "Овердрафт на зарплату подрядчикам",
        "Когда платить налог по УСН",
    ],
    # ИП Ковалев · слабый балл (≈495): мелкий бар, просрочка, ручной разбор
    "kovalev": [
        "Кофемашина для эспрессо-бара 450 000",
        "Закупка расходников и упаковки 90 000",
        "Не хватает на зарплату",
        "Что такое ПЭП",
    ],
    # Бодрость Плюс · Hard Stop: опт, ФССП — запросы покажут отказный фон
    "bodrost_plus": [
        "Пополнение товарного запаса 300 000",
        "Стеллажи для склада купить",
        "Овердрафт на налоги",
        "Календарь УСН",
    ],
}


@dataclass(frozen=True)
class CatalogSeed:
    id: str
    cluster: str
    cluster_code: str
    item_name: str
    amount_rub: float
    price_label: str
    unit: str
    supplier_name: str
    supplier_inn: str
    delivery_days: int
    keywords: str
    news_insight: str
    fssp_clean: bool = True


CATALOG_SEED: list[CatalogSeed] = [
    CatalogSeed("cat_coffee_marzocco", "HORECA", "56", "Кофемашина La Marzocco Linea PB",
                900_000, "от 890 000 ₽", "шт.", "ООО «КофеТехПро»", "7701234560", 7,
                "кофемашина la marzocco оборудование кофейня capex",
                "Выручка кофеен +18% г/г — рынок растёт"),
    CatalogSeed("cat_rational", "HORECA", "56", "Конвектомат Rational iCombi Classic",
                1_800_000, "от 1 750 000 ₽", "шт.", "ООО «РестоОборудование»", "7712345671", 12,
                "конвектомат rational печь оборудование кухня capex",
                "Гранты Минэкономики для HoReCa до 500 тыс. ₽"),
    CatalogSeed("cat_coffee_beans", "HORECA", "56", "Кофе в зёрнах, 300 кг",
                240_000, "800 ₽/кг", "партия", "ООО «КофеТехПро»", "7701234560", 3,
                "кофе зерно расходники закупка оборотные",
                "Цены на арабику выросли на 12% — фиксируйте контракт"),
    CatalogSeed("cat_vent", "HORECA", "56", "Ремонт вытяжки и вентиляции",
                150_000, "от 150 000 ₽", "работы", "ООО «РестоОборудование»", "7712345671", 5,
                "ремонт вытяжка вентиляция помещение",
                "Аренда в Москве +9% за год"),
    CatalogSeed("cat_packaging", "HORECA", "56", "Упаковка и расходники HoReCa",
                90_000, "от 90 000 ₽", "партия", "ООО «ХорекаСнаб»", "7701234578", 4,
                "упаковка расходники закупка",
                "Упаковка подорожала на 7% — выгодно закупить партию"),

    CatalogSeed("cat_cable", "CONSTRUCTION", "41", "Кабель ВВГнг 4×25, 15 км",
                3_200_000, "213 333 ₽/км", "партия", "ООО «КабельТрейд»", "7723456782", 10,
                "кабель ввгнг 15 км стройматериал закупка",
                "Госзаказ на строительство вырос на 34%"),
    CatalogSeed("cat_concrete", "CONSTRUCTION", "41", "Бетон М300, 40 м³",
                180_000, "4 500 ₽/м³", "м³", "ООО «БетонСтрой»", "7734567893", 2,
                "бетон м300 стройматериал",
                "Льготная ипотека для застройщиков — новые лимиты"),
    CatalogSeed("cat_rebar", "CONSTRUCTION", "41", "Арматура А500С, 20 т",
                1_360_000, "68 000 ₽/т", "т", "ООО «МеталлТрейд»", "7745678901", 8,
                "арматура металл стройматериал",
                "Металлопрокат подешевел на 6%"),
    CatalogSeed("cat_cable_small", "CONSTRUCTION", "41", "Кабельная продукция, 3 км",
                640_000, "213 333 ₽/км", "партия", "ООО «КабельТрейд»", "7723456782", 6,
                "кабель ввгнг продукция",
                "Спрос на кабель растёт из-за ЦОД"),

    CatalogSeed("cat_goods", "RETAIL", "46", "Пополнение товарного запаса",
                1_500_000, "от 500 000 ₽", "партия", "ООО «ТоргОпт»", "7756789018", 4,
                "товар закупка оборотные пополнение",
                "Wildberries и Ozon снизили комиссию до 15%"),
    CatalogSeed("cat_shelves", "RETAIL", "46", "Стеллажи и складское оборудование",
                420_000, "от 420 000 ₽", "комплект", "ООО «ТоргОпт»", "7756789018", 9,
                "стеллажи склад оборудование",
                "Складская логистика подорожала на 8%"),
    CatalogSeed("cat_delivery", "RETAIL", "46", "Доставка последней мили, 3 мес.",
                360_000, "120 000 ₽/мес.", "услуга", "ООО «ЛогистикГрупп»", "7789012347", 3,
                "логистика доставка",
                "Тарифы доставки выросли на 5%"),
    CatalogSeed("cat_season", "RETAIL", "46", "Сезонный товар под овердрафт",
                800_000, "от 800 000 ₽", "партия", "ООО «ТоргОпт»", "7756789018", 5,
                "овердрафт налоги зарплата сезон",
                "Сезонный пик продаж — октябрь"),

    CatalogSeed("cat_cnc", "PRODUCTION", "10", "Токарный станок ЧПУ",
                1_200_000, "от 1 200 000 ₽", "шт.", "ООО «ПромМаш»", "7767890122", 21,
                "станок чпу оборудование производство",
                "Субсидии на промышленный лизинг: ставка 5%"),
    CatalogSeed("cat_parts", "PRODUCTION", "10", "Комплектующие для линии розлива",
                540_000, "от 540 000 ₽", "комплект", "ООО «ПромМаш»", "7767890122", 11,
                "комплектующие производство закупка",
                "Цены на комплектующие стабилизировались"),
    CatalogSeed("cat_mes", "PRODUCTION", "10", "MES-система для цеха",
                780_000, "от 780 000 ₽", "лицензия", "ООО «ИТ-Решения»", "7778901231", 14,
                "mes автоматизация оборудование ит",
                "ИТ-отрасль: льготы продлены до 2028"),
    CatalogSeed("cat_retrofit", "PRODUCTION", "10", "Модернизация станка, 2 узла",
                300_000, "от 300 000 ₽", "работы", "ООО «ПромМаш»", "7767890122", 15,
                "модернизация станок",
                "Производительность +15% после модернизации"),

    CatalogSeed("cat_crm", "SERVICES", "69", "CRM-система на год",
                420_000, "35 000 ₽/мес.", "год", "ООО «ИТ-Решения»", "7778901231", 2,
                "crm ит оборудование подписка",
                "ИТ-отрасль: налоговые льготы продлены"),
    CatalogSeed("cat_spec", "SERVICES", "69", "Спецтехника в лизинг",
                2_800_000, "от 2 800 000 ₽", "шт.", "ООО «АгроПром»", "7790123450", 30,
                "спецтехника лизинг оборудование",
                "Лизинг спецтехники вырос на 21%"),
    CatalogSeed("cat_vans", "SERVICES", "69", "Автопарк: 2 фургона",
                3_400_000, "от 1 700 000 ₽/шт.", "шт.", "ООО «ЛогистикГрупп»", "7789012347", 25,
                "фургон авто транспорт лизинг",
                "Грузоперевозки: тарифы +7%"),
    CatalogSeed("cat_training", "SERVICES", "69", "Обучение сотрудников",
                120_000, "от 120 000 ₽", "программа", "ООО «ИТ-Решения»", "7778901231", 7,
                "обучение консультация",
                "Гранты на обучение до 300 тыс. ₽"),
]


@dataclass(frozen=True)
class InvoiceTemplate:
    code: str
    company_demo_key: str
    supplier_name: str
    supplier_inn: str
    amount_rub: float
    vat_rub: float
    purpose: str
    file_name: str
    extra: dict = field(default_factory=dict)


INVOICE_TEMPLATES: dict[str, InvoiceTemplate] = {
    "LA_MARZOCCO": InvoiceTemplate(
        code="LA_MARZOCCO",
        company_demo_key="smirnov",
        supplier_name="ООО «КофеТехПро»",
        supplier_inn="7701234560",
        amount_rub=900_000,
        vat_rub=150_000,
        purpose="Кофемашина La Marzocco Linea PB",
        file_name="invoice_la_marzocco.pdf",
    ),
    "ROSTERS_EQUIP": InvoiceTemplate(
        code="ROSTERS_EQUIP",
        company_demo_key="rosters",
        supplier_name="ООО «РестоОборудование»",
        supplier_inn="7712345671",
        amount_rub=2_500_000,
        vat_rub=416_666.67,
        purpose="Комплект оборудования для кухни",
        file_name="invoice_rosters_equipment.pdf",
    ),
    "CABLE_VVG": InvoiceTemplate(
        code="CABLE_VVG",
        company_demo_key="tekhnostroy",
        supplier_name="ООО «КабельТрейд»",
        supplier_inn="7723456782",
        amount_rub=3_200_000,
        vat_rub=533_333.33,
        purpose="Кабель ВВГнг 4×25, 15 км",
        file_name="invoice_cable_vvg.pdf",
    ),
}

TEMPLATE_CODE_BY_SUPPLIER_INN: dict[str, str] = {
    template.supplier_inn: template.code for template in INVOICE_TEMPLATES.values()
}
