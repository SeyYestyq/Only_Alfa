import type { OfferLetter } from "../api/types";
import { formatMoney, formatPercent } from "../utils/format";

export function OfferLetterPanel({ letter, compact }: { letter: OfferLetter; compact?: boolean }) {
  return (
    <article className="figma-panel figma-panel-sm offer-letter" style={{ marginBottom: compact ? 0 : 16 }}>
      <div className="figma-panel-title">Письмо к предложению банка</div>
      <h3 style={{ fontSize: compact ? 16 : 18, fontWeight: 650, margin: "8px 0" }}>{letter.headline}</h3>
      <p className="muted" style={{ fontSize: 14, lineHeight: 1.45 }}>{letter.why_this_product}</p>
      <div className="figma-kpi-row" style={{ marginTop: 12 }}>
        <div className="figma-kpi">
          <div className="figma-kpi-label">Ставка</div>
          <div className="figma-kpi-value">{formatPercent(letter.rate_pct)}</div>
        </div>
        <div className="figma-kpi">
          <div className="figma-kpi-label">Платёж</div>
          <div className="figma-kpi-value">{formatMoney(letter.monthly_payment_rub)}</div>
        </div>
        <div className="figma-kpi">
          <div className="figma-kpi-label">Балл</div>
          <div className="figma-kpi-value">{letter.score}</div>
        </div>
      </div>
      <div style={{ marginTop: 12 }}>
        <div className="figma-panel-title">Факторы решения</div>
        <ul className="checklist">
          {letter.top_factors.map((factor) => (
            <li key={factor.label}>
              {factor.label}: {factor.delta > 0 ? "+" : ""}
              {factor.delta} баллов
            </li>
          ))}
        </ul>
      </div>
      <p className="muted" style={{ marginTop: 10, fontSize: 13 }}>{letter.why_terms}</p>
      <p className="faint" style={{ marginTop: 8, fontSize: 12 }}>{letter.if_no_action}</p>
    </article>
  );
}
