import type { InvoiceTemplate } from "../api/types";

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

/** Недостача: сколько не хватает своих средств, чтобы закрыть этот счёт. */
export function invoiceShortfallRub(amountRub: number, balanceRub: number): number {
  return Math.max(0, amountRub - balanceRub);
}

/** Свои средства на этот счёт: остаток, но не больше суммы счёта. */
export function ownFundsForInvoice(amountRub: number, balanceRub: number): number {
  return Math.min(Math.max(0, balanceRub), Math.max(0, amountRub));
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
    lines: [
      { label: template.purpose, amount_rub: net },
      { label: "НДС", amount_rub: template.vat_rub },
    ],
  };
}

export function unpaidInvoiceKpis(rows: UnpaidInvoiceRow[]) {
  const overdue = rows
    .filter((row) => row.status === "overdue")
    .reduce((sum, row) => sum + row.amount_rub, 0);
  const dueSoon = rows
    .filter((row) => row.status !== "overdue")
    .reduce((sum, row) => sum + row.amount_rub, 0);
  return { overdue, dueSoon, count: rows.length };
}
