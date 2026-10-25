import { formatMoney } from "../../utils/format";
import { INVOICE_INSTANT_FINANCING_RATIO } from "../../domain-ui/invoiceFinancing";

interface InvoiceKpiStripProps {
  overdueRub: number;
  dueSoonRub: number;
  availableRub: number;
  onFinanceAll?: () => void;
  financeDisabled?: boolean;
}

/** KPI-полоса кабинета счетов: просрочка, ближайшие, доступно к финансированию. */
export function InvoiceKpiStrip({
  overdueRub,
  dueSoonRub,
  availableRub,
  onFinanceAll,
  financeDisabled,
}: InvoiceKpiStripProps) {
  const pct = Math.round(INVOICE_INSTANT_FINANCING_RATIO * 100);

  return (
    <div className="inv-kpi-row">
      <section className="inv-kpi-card inv-kpi-stats">
        <div className="inv-kpi-metrics">
          <div>
            <div className="inv-kpi-label">Просрочено</div>
            <div className="inv-kpi-value is-warn">{formatMoney(overdueRub)}</div>
          </div>
          <div>
            <div className="inv-kpi-label">К оплате в ближайший месяц</div>
            <div className="inv-kpi-value">{formatMoney(dueSoonRub)}</div>
          </div>
          <div>
            <div className="inv-kpi-label">Средний срок оплаты</div>
            <div className="inv-kpi-value">
              12 <span className="inv-kpi-unit">дней</span>
            </div>
          </div>
        </div>
        <div className="inv-kpi-timeline" aria-hidden="true">
          {["Сен", "Окт", "Ноя", "Дек"].map((month, index) => (
            <div key={month} className={`inv-kpi-month ${index === 2 ? "is-active" : ""}`}>
              <span className="inv-kpi-dot" />
              <span>{month}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="inv-kpi-card inv-kpi-payout">
        <div className="inv-kpi-label">Доступно к мгновенному финансированию</div>
        <div className="inv-kpi-value inv-kpi-payout-sum">{formatMoney(availableRub)}</div>
        <p className="inv-kpi-hint">
          Банк финансирует до {pct}% суммы неоплаченного счёта — без залога, на срок до оплаты
          покупателем.
        </p>
        {onFinanceAll ? (
          <button
            type="button"
            className="btn btn-primary"
            disabled={financeDisabled || availableRub <= 0}
            onClick={onFinanceAll}
          >
            Финансировать выбранный
          </button>
        ) : null}
      </section>
    </div>
  );
}
