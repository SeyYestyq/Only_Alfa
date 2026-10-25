const moneyFormatter = new Intl.NumberFormat("ru-RU", {
  maximumFractionDigits: 0,
});

const moneyExactFormatter = new Intl.NumberFormat("ru-RU", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Ориентир аннуитета на UI до ответа API. Решение и платёж считает бэкенд. */
export function roughAnnuity(amount: number, months: number, ratePct = 0.18): number {
  if (amount <= 0 || months <= 0) {
    return 0;
  }
  const monthlyRate = ratePct / 12;
  return Math.round((amount * monthlyRate) / (1 - (1 + monthlyRate) ** -months));
}

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
/** «Фамилия Имя Отчество» → фамилия. */
export function familyName(fullName: string | undefined): string {
  return fullName?.trim().split(/\s+/)[0] || "Подписант";
}

export function givenName(fullName: string | undefined): string {
  const parts = fullName?.trim().split(/\s+/) ?? [];
  if (parts.length >= 3) {
    return parts[1] ?? fullName ?? "коллега";
  }
  return parts[0] ?? "коллега";
}

/** «Фамилия Имя Отчество» → «Имя Фамилия». */
export function shortPerson(fullName: string | undefined): string {
  const parts = fullName?.trim().split(/\s+/) ?? [];
  if (parts.length >= 3) {
    return `${parts[1]} ${parts[0]}`;
  }
  if (parts.length === 2) {
    return `${parts[1]} ${parts[0]}`;
  }
  return fullName || "коллега";
}

export function givenInitial(fullName: string | undefined): string {
  const parts = fullName?.trim().split(/\s+/) ?? [];
  const given = parts.length >= 3 ? parts[1] : parts[0];
  return (given?.[0] ?? "?").toUpperCase();
}

export function formatAge(months: number): string {
  const years = Math.floor(months / 12);
  const rest = months % 12;
  const yearLabel = years % 10 === 1 && years % 100 !== 11
    ? "год"
    : years % 10 >= 2 && years % 10 <= 4 && (years % 100 < 10 || years % 100 >= 20)
      ? "года"
      : "лет";
  if (years <= 0) {
    return `${months} мес.`;
  }
  if (rest === 0) {
    return `${years} ${yearLabel}`;
  }
  return `${years} ${yearLabel} ${rest} мес.`;
}

export function roleLabel(role: string): string {
  return {
    CEO_OWNER: "Генеральный директор",
    IP_OWNER: "Предприниматель",
    ACCOUNTANT: "Бухгалтер",
    UNDERWRITER: "Кредитный инспектор",
  }[role] ?? role;
}
