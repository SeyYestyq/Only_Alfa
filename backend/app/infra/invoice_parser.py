"""Извлечение реквизитов из PDF-счёта через pdfplumber + 3 демо-шаблона."""
from __future__ import annotations

import io
import re
from dataclasses import asdict, dataclass

import pdfplumber

from app.core.exceptions import InvoiceParseError
from app.infra.demo_content import INVOICE_TEMPLATES, InvoiceTemplate
from app.infra.registry_simulator import simulate_company, validate_inn

_INN_RE = re.compile(r"(?:ИНН|INN)\s*[:\s]*(\d{10}|\d{12})", re.IGNORECASE)
_SUPPLIER_RE = re.compile(r"(?:Поставщик|Supplier)\s*[:\s]*(.+)", re.IGNORECASE)
_TOTAL_RE = re.compile(r"(?:Итого|Total)\s*[:\s]*([\d\s.,]+)", re.IGNORECASE)
_VAT_RE = re.compile(r"(?:НДС|VAT)\s*[:\s]*([\d\s.,]+)", re.IGNORECASE)
_PURPOSE_RE = re.compile(r"(?:Назначение|Purpose)\s*[:\s]*(.+)", re.IGNORECASE)


@dataclass
class ParsedInvoice:
    source: str
    supplier_name: str
    supplier_inn: str
    amount_rub: float
    vat_rub: float
    purpose: str
    template_code: str | None = None

    def to_dict(self) -> dict:
        return asdict(self)


def _to_amount(raw: str) -> float:
    cleaned = raw.strip().replace(" ", "").replace("\xa0", "").replace(",", ".")
    try:
        return round(float(cleaned), 2)
    except ValueError as exc:
        raise InvoiceParseError(f"Не удалось разобрать сумму: {raw!r}") from exc


def parse_amount_from_text(text: str) -> float | None:
    match = _TOTAL_RE.search(text)
    return _to_amount(match.group(1)) if match else None


def parse_pdf(content: bytes) -> ParsedInvoice:
    """Парсит загруженный PDF. При отсутствии обязательных полей — InvoiceParseError."""
    if not content.startswith(b"%PDF"):
        raise InvoiceParseError("Файл не является PDF")
    try:
        with pdfplumber.open(io.BytesIO(content)) as pdf:
            text = "\n".join(page.extract_text() or "" for page in pdf.pages)
    except Exception as exc:  # pdfplumber может бросить разные ошибки парсинга
        raise InvoiceParseError("Не удалось прочитать PDF-файл") from exc

    inn_match = _INN_RE.search(text)
    total_match = _TOTAL_RE.search(text)
    if not inn_match or not total_match:
        raise InvoiceParseError("В счёте не найден ИНН поставщика или итоговая сумма")

    supplier_match = _SUPPLIER_RE.search(text)
    vat_match = _VAT_RE.search(text)
    purpose_match = _PURPOSE_RE.search(text)
    inn = inn_match.group(1)
    validate_inn(inn)

    return ParsedInvoice(
        source="PDF",
        supplier_name=(supplier_match.group(1).strip() if supplier_match else "Не указан"),
        supplier_inn=inn,
        amount_rub=_to_amount(total_match.group(1)),
        vat_rub=_to_amount(vat_match.group(1)) if vat_match else 0.0,
        purpose=(purpose_match.group(1).strip() if purpose_match else "Оплата по счёту"),
    )


def parse_template(template: InvoiceTemplate) -> ParsedInvoice:
    return ParsedInvoice(
        source="TEMPLATE",
        supplier_name=template.supplier_name,
        supplier_inn=template.supplier_inn,
        amount_rub=template.amount_rub,
        vat_rub=template.vat_rub,
        purpose=template.purpose,
        template_code=template.code,
    )


def parse_demo_template(template_code: str) -> ParsedInvoice:
    template = INVOICE_TEMPLATES.get(template_code.upper())
    if template is None:
        raise InvoiceParseError(f"Неизвестный демо-шаблон счёта: {template_code}")
    return parse_template(template)


def run_antifraud(supplier_inn: str) -> dict:
    """Проверка ИНН поставщика по симулятору ЕГРЮЛ/ФССП."""
    try:
        validate_inn(supplier_inn)
    except Exception:
        return {
            "is_verified": False,
            "egrul_status": "NOT_FOUND",
            "fssp_amount_rub": 0.0,
            "message": "ИНН поставщика не прошёл контрольную сумму — оплата заблокирована.",
        }
    profile = simulate_company(supplier_inn)
    is_clean = profile.is_egrul_active and profile.fssp_amount == 0
    return {
        "is_verified": is_clean,
        "egrul_status": "ACTIVE" if profile.is_egrul_active else "LIQUIDATED",
        "fssp_amount_rub": profile.fssp_amount,
        "message": (
            "Поставщик проверен: ЕГРЮЛ ACTIVE, исполнительных производств нет."
            if is_clean
            else "У поставщика есть исполнительные производства — требуется ручная проверка."
        ),
    }
