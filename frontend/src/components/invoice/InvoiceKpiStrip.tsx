import { formatMoney } from "../../utils/format";

interface InvoiceKpiStripProps {
  overdueRub: number;
  dueSoonRub: number;
}

/** Сводка по счетам: просрочка и ближайшие оплаты, без полосы финансирования. */
export function InvoiceKpiStrip({ overdueRub, dueSoonRub }: InvoiceKpiStripProps) {
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
    </div>
  );
}
