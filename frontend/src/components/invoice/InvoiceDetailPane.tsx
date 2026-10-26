import { invoiceShortfallRub, invoiceStatusLabel, type UnpaidInvoiceRow } from "../../domain-ui/invoiceFinancing";
import { formatMoney, formatMoneyExact } from "../../utils/format";

interface InvoiceDetailPaneProps {
  invoice: UnpaidInvoiceRow;
  companyName: string;
  balanceRub: number;
  isBusy: boolean;
  disabled?: boolean;
  onRequestFunds: () => void;
  onPayFromAccount?: () => void;
  paidFromAccount?: boolean;
}

/** Карточка выбранного счёта: оплата своими деньгами или одна плашка на недостачу. */
export function InvoiceDetailPane({
  invoice,
  companyName,
  balanceRub,
  isBusy,
  disabled,
  onRequestFunds,
  onPayFromAccount,
  paidFromAccount,
}: InvoiceDetailPaneProps) {
  const shortfall = invoiceShortfallRub(invoice.amount_rub, balanceRub);
  const fitsOnAccount = shortfall <= 0;

  return (
    <div className="inv-detail-pane">
      <header className="inv-detail-head">
        <div>
          <div className="inv-detail-number">
            {invoice.number}
            <span className={`inv-status-pill status-${invoice.status}`}>
              {invoiceStatusLabel(invoice.status)}
            </span>
          </div>
          <div className="inv-detail-company">{invoice.supplier_name}</div>
          <div className="muted" style={{ fontSize: 13 }}>
            ИНН {invoice.supplier_inn} · {invoice.purpose}
          </div>
        </div>
        <div className="inv-detail-buyer">
          <span className="muted">Плательщик</span>
          <strong>{companyName}</strong>
        </div>
      </header>

      <div className="inv-line-cards">
        {invoice.lines.map((line) => (
          <div key={line.label} className="inv-line-card">
            <strong>{formatMoneyExact(line.amount_rub)}</strong>
            <span>{line.label}</span>
          </div>
        ))}
      </div>

      <div className="inv-totals">
        <div>
          <span>Без НДС</span>
          <strong>{formatMoneyExact(invoice.net_rub)}</strong>
        </div>
        <div>
          <span>Итого по счёту</span>
          <strong>{formatMoneyExact(invoice.amount_rub)}</strong>
        </div>
      </div>

      {fitsOnAccount ? (
        <div className="inv-alt-pay">
          {paidFromAccount ? (
            <div className="alert alert-good">Демо: платёж со счёта отмечен.</div>
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              disabled={isBusy || disabled || !onPayFromAccount}
              onClick={onPayFromAccount}
            >
              Оплатить со счёта
            </button>
          )}
        </div>
      ) : (
        <aside className="inv-shortfall">
          <div className="inv-shortfall-copy">
            <strong>Своих средств не хватает на {formatMoney(shortfall)}</strong>
            <p className="muted">
              На счёте {formatMoney(balanceRub)}, счёт на {formatMoney(invoice.amount_rub)}.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-primary"
            disabled={isBusy || disabled}
            onClick={onRequestFunds}
          >
            Получить деньги
          </button>
        </aside>
      )}
    </div>
  );
}
