import type { BankPnl } from "../api/types";
import { formatMoney, formatPercent } from "../utils/format";

export function PnlPanel({ pnl }: { pnl: BankPnl }) {
  const cards = [
    { label: "Ожидаемый доход", value: formatMoney(pnl.expected_interest_income_rub), sub: "процентные доходы" },
    { label: "Фондирование", value: formatMoney(pnl.funding_cost_rub), sub: "стоимость денег по КС" },
    { label: "Стоимость риска", value: formatMoney(pnl.risk_cost_rub), sub: `PD ${formatPercent(pnl.probability_of_default_pct, 2)}` },
    { label: "Операционные расходы", value: formatMoney(pnl.opex_rub), sub: "0,5% от суммы" },
    { label: "Ожидаемая маржа", value: formatMoney(pnl.expected_margin_rub), sub: formatPercent(pnl.margin_pct, 1), accent: pnl.expected_margin_rub >= 0 },
    { label: "LTV сделки", value: formatMoney(pnl.ltv_rub), sub: "доход × 1,4" },
    { label: "Вероятность одобрения", value: `${pnl.approval_probability_pct}%`, sub: "модель банка" },
    { label: "Сумма к выдаче", value: formatMoney(pnl.approved_amount_rub), sub: "лимит после решения" },
  ];

  return (
    <div className="pnl-grid">
      {cards.map((card) => (
        <article key={card.label} className="metric-card">
          <div className="metric-label">{card.label}</div>
          <div className={`metric-value ${card.accent === false ? "red" : card.accent ? "green" : ""}`}>
            {card.value}
          </div>
          <div className="metric-sub">{card.sub}</div>
        </article>
      ))}
    </div>
  );
}
