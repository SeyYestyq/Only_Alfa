"""
Симуляторы внешних реестров: ЕГРЮЛ, БКИ, ФССП, Open Banking.

Детерминированный фолбэк: seed = hash(INN). Один ИНН всегда даёт один профиль,
интернет не требуется.
"""
from __future__ import annotations

import hashlib
import random

from app.core.constants import INN_LENGTH_INDIVIDUAL, INN_LENGTH_LEGAL_ENTITY
from app.core.exceptions import InvalidINN
from app.domain.types import BusinessModel, CompanyProfile, CompanyUser, LegalForm, UserRole

_LEGAL_ENTITY_NAMES = (
    "ООО «Северный Ветер»", "ООО «Гранит»", "ООО «Профит-Групп»", "ООО «Мастерская»",
    "ООО «Логика»", "ООО «Ремонт-Сервис»", "ООО «АльфаТрейд»", "ООО «Стандарт»",
)
_INDIVIDUAL_NAMES = (
    "ИП Орлов С.П.", "ИП Морозова А.И.", "ИП Соколов Д.А.", "ИП Лебедева К.В.",
    "ИП Новиков П.Р.", "ИП Зайцева М.Л.",
)
_DIRECTOR_NAMES = (
    "Иванов Иван Иванович", "Смирнова Анна Петровна", "Козлов Сергей Николаевич",
    "Морозова Елена Андреевна", "Волков Дмитрий Олегович",
)
_CLUSTERS = (
    ("56.10", "Общественное питание (ОКВЭД 56)", BusinessModel.B2C_OFFLINE),
    ("41.20", "Строительство (ОКВЭД 41-43)", BusinessModel.B2B_CONTRACTOR),
    ("46.37", "Торговля (ОКВЭД 45-47)", BusinessModel.WHOLESALE),
    ("25.62", "Производство (ОКВЭД 10-33)", BusinessModel.B2B_CONTRACTOR),
    ("69.20", "Услуги (ОКВЭД 69-75)", BusinessModel.B2C_OFFLINE),
)
_ADDRESSES = (
    ("Москва", "ул. Ленина, 15", 55.7500, 37.6200),
    ("Москва", "ул. Садовая, 22", 55.7300, 37.5900),
    ("Москва", "Кутузовский пр-т, 36", 55.7400, 37.5100),
    ("Москва", "ул. Арбат, 10", 55.7500, 37.5900),
    ("Москва", "Варшавское шоссе, 42", 55.6700, 37.6200),
)


def validate_inn(inn: str) -> None:
    """Проверка длины и контрольной суммы ИНН (10 или 12 цифр)."""
    if not inn.isdigit() or len(inn) not in (INN_LENGTH_LEGAL_ENTITY, INN_LENGTH_INDIVIDUAL):
        raise InvalidINN("ИНН должен состоять из 10 или 12 цифр")
    if len(inn) == INN_LENGTH_LEGAL_ENTITY:
        coefficients = (2, 4, 10, 3, 5, 9, 4, 6, 8)
        control = sum(int(inn[i]) * coefficients[i] for i in range(9)) % 11 % 10
        if control != int(inn[9]):
            raise InvalidINN("Контрольная сумма ИНН не совпадает")
        return
    first = (7, 2, 4, 10, 3, 5, 9, 4, 6, 8)
    second = (3, 7, 2, 4, 10, 3, 5, 9, 4, 6, 8)
    control_11 = sum(int(inn[i]) * first[i] for i in range(10)) % 11 % 10
    control_12 = sum(int(inn[i]) * second[i] for i in range(11)) % 11 % 10
    if control_11 != int(inn[10]) or control_12 != int(inn[11]):
        raise InvalidINN("Контрольная сумма ИНН не совпадает")


def simulate_company(inn: str) -> CompanyProfile:
    """Собирает 360°-портрет по ИНН детерминированно (seed = hash(INN))."""
    digest = hashlib.sha256(inn.encode("utf-8")).hexdigest()
    rng = random.Random(int(digest[:16], 16))
    legal_form = LegalForm.OOO if len(inn) == INN_LENGTH_LEGAL_ENTITY else LegalForm.IP
    okved_code, cluster, business_model = _CLUSTERS[rng.randrange(len(_CLUSTERS))]
    city, address, latitude, longitude = _ADDRESSES[rng.randrange(len(_ADDRESSES))]
    is_individual = legal_form == LegalForm.IP

    monthly_revenue = round(rng.uniform(350_000, 4_200_000), -3)
    growth = round(rng.uniform(-12, 26), 1)
    purchases = round(monthly_revenue * rng.uniform(0.30, 0.55), -3)
    rent = round(monthly_revenue * rng.uniform(0.10, 0.22), -3)
    taxes = round(monthly_revenue * rng.uniform(0.04, 0.08), -3)
    bki_payment = round(monthly_revenue * rng.uniform(0.01, 0.08), -3)
    overdue = rng.choices([0, 14, 45], weights=[82, 12, 6])[0]
    age_months = rng.randint(8, 96)
    geo_score = rng.randint(30, 95)
    buyer_score = rng.randint(30, 95)
    name = (
        _INDIVIDUAL_NAMES[rng.randrange(len(_INDIVIDUAL_NAMES))]
        if is_individual
        else _LEGAL_ENTITY_NAMES[rng.randrange(len(_LEGAL_ENTITY_NAMES))]
    )
    director = _DIRECTOR_NAMES[rng.randrange(len(_DIRECTOR_NAMES))]
    owner_role = UserRole.IP_OWNER if is_individual else UserRole.CEO_OWNER
    company_id = "cmp_" + digest[:12]

    return CompanyProfile(
        id=company_id,
        inn=inn,
        name=name,
        legal_form=legal_form,
        okved_code=okved_code,
        okved_cluster=cluster,
        business_model=business_model,
        director_name=director,
        city=city,
        address=address,
        latitude=latitude,
        longitude=longitude,
        age_months=age_months,
        monthly_revenue_alfa=monthly_revenue,
        monthly_revenue_multibank=0.0,
        declared_monthly_revenue=monthly_revenue,
        annual_revenue=monthly_revenue * 12,
        purchases_monthly=purchases,
        rent_fot_monthly=rent,
        taxes_monthly=taxes,
        bki_monthly_payment=bki_payment,
        bki_overdue_days=overdue,
        bki_history_months=rng.choice([0, 12, 18, 30, 48]),
        bki_active_contracts=rng.choice([0, 1, 2]),
        fssp_amount=0.0,
        revenue_growth_pct=growth,
        geo_score=geo_score,
        buyer_score=buyer_score,
        competitors_count=rng.randint(0, 11),
        alfa_tenure_months=rng.randint(4, 72),
        alfa_revenue_share=round(rng.uniform(0.3, 1.0), 2),
        account_balance=round(monthly_revenue * rng.uniform(0.05, 0.6), -3),
        anchor_buyer="",
        users=[
            CompanyUser(
                id=f"usr_{digest[:8]}_owner",
                full_name=director,
                role=owner_role,
                role_label="Предприниматель" if is_individual else "Генеральный директор",
            ),
            CompanyUser(
                id=f"usr_{digest[:8]}_accountant",
                full_name="Бухгалтер (симулятор ЕГРЮЛ)",
                role=UserRole.ACCOUNTANT,
                role_label="Бухгалтер",
            ),
        ],
    )
