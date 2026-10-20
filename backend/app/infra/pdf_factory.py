"""Минимальная генерация PDF для демо-счетов (без внешних зависимостей)."""
from __future__ import annotations


def _escape(text: str) -> str:
    return text.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")


def build_invoice_pdf(lines: list[str]) -> bytes:
    """Создаёт одностраничный PDF с текстовыми строками (шрифт Helvetica)."""
    text_commands = ["BT", "/F1 11 Tf", "50 780 Td", "16 TL"]
    for line in lines:
        text_commands.append(f"({_escape(line)}) Tj T*")
    text_commands.append("ET")
    stream = "\n".join(text_commands).encode("cp1252", errors="replace")

    objects: list[bytes] = [
        b"<< /Type /Catalog /Pages 2 0 R >>",
        b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] "
        b"/Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
        b"<< /Length " + str(len(stream)).encode() + b" >>\nstream\n" + stream + b"\nendstream",
    ]

    output = bytearray(b"%PDF-1.4\n")
    offsets: list[int] = []
    for number, body in enumerate(objects, start=1):
        offsets.append(len(output))
        output += f"{number} 0 obj\n".encode() + body + b"\nendobj\n"
    xref_position = len(output)
    output += f"xref\n0 {len(objects) + 1}\n".encode()
    output += b"0000000000 65535 f \n"
    for offset in offsets:
        output += f"{offset:010d} 00000 n \n".encode()
    output += (
        f"trailer\n<< /Size {len(objects) + 1} /Root 1 0 R >>\nstartxref\n{xref_position}\n%%EOF\n"
    ).encode()
    return bytes(output)


def build_demo_invoice_pdf(
    supplier_name: str,
    supplier_inn: str,
    amount_rub: float,
    vat_rub: float,
    purpose: str,
) -> bytes:
    """Счёт в формате, который разбирает pdfplumber (ключи ИНН / Итого / НДС)."""
    lines = [
        "INVOICE / SCHET NA OPLATU",
        f"Supplier: {supplier_name}",
        f"INN: {supplier_inn}",
        f"Purpose: {purpose}",
        f"Total: {amount_rub:.2f}",
        f"VAT: {vat_rub:.2f}",
        "Payment terms: 100% prepayment",
    ]
    return build_invoice_pdf(lines)
