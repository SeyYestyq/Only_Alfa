import {
  invoiceStatusLabel,
  type UnpaidInvoiceRow,
} from "../../domain-ui/invoiceFinancing";
import { formatMoney } from "../../utils/format";

type FilterTab = "all" | "unpaid" | "draft";

interface InvoiceListPaneProps {
  rows: UnpaidInvoiceRow[];
  selectedCode: string | null;
  tab: FilterTab;
  onTabChange: (tab: FilterTab) => void;
  onSelect: (code: string) => void;
}

function initials(name: string): string {
  return name
    .replace(/[«»"]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase();
}

/** Список неоплаченных счетов (слева в split-layout). */
export function InvoiceListPane({
  rows,
  selectedCode,
  tab,
  onTabChange,
  onSelect,
}: InvoiceListPaneProps) {
  const unpaidCount = rows.length;

  return (
    <div className="inv-list-pane">
      <div className="inv-status-tabs" role="tablist" aria-label="Статус счетов">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "all"}
          className={`inv-status-tab ${tab === "all" ? "active" : ""}`}
          onClick={() => onTabChange("all")}
        >
          Все счета
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "draft"}
          className={`inv-status-tab ${tab === "draft" ? "active" : ""}`}
          onClick={() => onTabChange("draft")}
        >
          Черновики (0)
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "unpaid"}
          className={`inv-status-tab ${tab === "unpaid" ? "active" : ""}`}
          onClick={() => onTabChange("unpaid")}
        >
          Неоплаченные ({unpaidCount})
        </button>
      </div>

      {tab === "draft" ? (
        <div className="inv-list-empty">
          <strong>Черновиков нет</strong>
          <p className="muted">Для демо используйте неоплаченные счета поставщиков.</p>
        </div>
      ) : rows.length === 0 ? (
        <div className="inv-list-empty">
          <strong>Нет счетов</strong>
          <p className="muted">Загрузите PDF или дождитесь демо-шаблонов.</p>
        </div>
      ) : (
        <ul className="inv-list">
          {rows.map((row) => {
            const selected = row.code === selectedCode;
            return (
              <li key={row.code}>
                <button
                  type="button"
                  className={`inv-list-row ${selected ? "active" : ""}`}
                  onClick={() => onSelect(row.code)}
                  aria-current={selected ? "true" : undefined}
                >
                  <span className="inv-avatar" aria-hidden="true">
                    {initials(row.supplier_name)}
                  </span>
                  <span className="inv-list-main">
                    <strong>{row.number}</strong>
                    <span className="muted">{row.due_label}</span>
                  </span>
                  <span className={`inv-status-pill status-${row.status}`}>
                    {invoiceStatusLabel(row.status)}
                  </span>
                  <span className="inv-list-amount">{formatMoney(row.amount_rub)}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
