import type { InvoiceTemplate } from "../api/types";

/**
 * Доля суммы счёта, доступная к мгновенному финансированию (Invoice-to-Credit).
 * Ориентир продукта на UI; решение и лимит считает бэкенд при заявке.
 */
export const INVOICE_INSTANT_FINANCING_RATIO = 0.85;
/** Срок предложения на экране счёта. Ставку и платёж решения считает бэкенд. */
export const INVOICE_FINANCING_TERM_MONTHS = 6;
/** Подпись ставки до решения. Не расчёт ПСК. */
export const INVOICE_RATE_LABEL = "18%";
export const INVOICE_RATE_ANNUAL = 0.18;
export const INVOICE_PSK_LABEL = "в договоре";

export type InvoiceUiStatus = "unsent" | "viewed" | "overdue";

export interface UnpaidInvoiceRow {
  code: string;
  number: string;
  supplier_name: string;
  supplier_inn: string;
  purpose: string;
  amount_rub: number;
  vat_rub: number;
  status: InvoiceUiStatus;
  due_label: string;
  net_rub: number;
  financing_rub: number;
  lines: Array<{ label: string; amount_rub: number }>;
}

const STATUS_BY_CODE: Record<string, InvoiceUiStatus> = {
  LA_MARZOCCO: "viewed",
  ROSTERS_EQUIP: "unsent",
  CABLE_VVG: "overdue",
};

const DUE_BY_CODE: Record<string, string> = {
  LA_MARZOCCO: "Через 5 дней",
  ROSTERS_EQUIP: "Через 12 дней",
  CABLE_VVG: "Просрочен на 3 дня",
};

const STATUS_LABEL: Record<InvoiceUiStatus, string> = {
  unsent: "Не отправлен",
  viewed: "Просмотрен",
  overdue: "Просрочен",
};

export function invoiceStatusLabel(status: InvoiceUiStatus): string {
  return STATUS_LABEL[status];
}

/** Сумма мгновенного финансирования = 85% от суммы счёта. */
export function instantFinancingAmount(invoiceTotalRub: number): number {
  return Math.round(invoiceTotalRub * INVOICE_INSTANT_FINANCING_RATIO);
}

export function toUnpaidInvoiceRow(template: InvoiceTemplate): UnpaidInvoiceRow {
  const net = Math.max(0, template.amount_rub - template.vat_rub);
  const status = STATUS_BY_CODE[template.code] ?? "unsent";
  return {
    code: template.code,
    number: `#${template.code.replace(/_/g, "-").slice(0, 12)}`,
    supplier_name: template.supplier_name,
    supplier_inn: template.supplier_inn,
    purpose: template.purpose,
    amount_rub: template.amount_rub,
    vat_rub: template.vat_rub,
    status,
    due_label: DUE_BY_CODE[template.code] ?? "В этом месяце",
    net_rub: net,
    financing_rub: instantFinancingAmount(template.amount_rub),
    lines: [
      { label: template.purpose, amount_rub: net },
      { label: "НДС", amount_rub: template.vat_rub },
    ],
  };
}

/** Строка очереди: счёт и вероятность из сохранённой проверки, без нового расчёта. */
export function invoiceQueueLine(invoice: Record<string, unknown> | null | undefined): string | null {
  if (!invoice || typeof invoice.supplier_name !== "string" || !invoice.supplier_name) {
    return null;
  }
  const risk = invoice.supplier_deal_risk;
  const probability = risk && typeof risk === "object" && "deal_success_probability_pct" in risk
    ? Number((risk as { deal_success_probability_pct: unknown }).deal_success_probability_pct)
    : null;
  if (probability != null && Number.isFinite(probability)) {
    return `Счёт ${invoice.supplier_name} · успех сделки ${Math.round(probability)}%`;
  }
  return `Счёт ${invoice.supplier_name}`;
}

export function unpaidInvoiceKpis(rows: UnpaidInvoiceRow[]) {
  const overdue = rows
    .filter((row) => row.status === "overdue")
    .reduce((sum, row) => sum + row.amount_rub, 0);
  const dueSoon = rows
    .filter((row) => row.status !== "overdue")
    .reduce((sum, row) => sum + row.amount_rub, 0);
  const available = rows.reduce((sum, row) => sum + row.financing_rub, 0);
  return { overdue, dueSoon, available, count: rows.length };
}
