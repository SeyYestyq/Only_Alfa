const moneyFormatter = new Intl.NumberFormat("ru-RU", {
  maximumFractionDigits: 0,
});

const moneyExactFormatter = new Intl.NumberFormat("ru-RU", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatMoney(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "—";
  }
  return `${moneyFormatter.format(Math.round(value))} ₽`;
}

export function formatMoneyExact(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "—";
  }
  return `${moneyExactFormatter.format(value)} ₽`;
}

export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "—";
  }
  return moneyFormatter.format(value);
}

export function formatPercent(value: number | null | undefined, digits = 1): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "—";
  }
  return `${value.toFixed(digits).replace(".", ",")}%`;
}

export function formatDate(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" });
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function statusTone(status: string): "GOOD" | "WARN" | "RISK" | "NEUTRAL" {
  if (["FUNDED", "APPROVED"].includes(status)) {
    return "GOOD";
  }
  if (["MANUAL_REVIEW", "NEED_MORE_INFO", "ANOMALY_VERIFICATION", "COUNTER_OFFER", "AWAITING_CEO_APPROVAL", "DRAFT_BY_EMPLOYEE"].includes(status)) {
    return "WARN";
  }
  if (status === "REJECTED") {
    return "RISK";
  }
  return "NEUTRAL";
}

/** «Фамилия Имя Отчество» → имя, иначе первое слово. */
export function givenName(fullName: string | undefined): string {
  const parts = fullName?.trim().split(/\s+/) ?? [];
  if (parts.length >= 3) {
    return parts[1] ?? fullName ?? "коллега";
  }
  return parts[0] ?? "коллега";
}

export function roleLabel(role: string): string {
  return {
    CEO_OWNER: "Генеральный директор",
    IP_OWNER: "Предприниматель",
    ACCOUNTANT: "Бухгалтер",
    UNDERWRITER: "Кредитный инспектор",
  }[role] ?? role;
}
