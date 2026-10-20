import type { Application } from "../api/types";
import { formatMoney, formatPercent } from "../utils/format";

export function PassportPanel({ application }: { application: Application }) {
  const scoreWidth = Math.max(0, Math.min(100, application.risk_score / 10));

  return (
    <div className="passport-grid">
      <article className="passport-card">
        <div className="passport-label">RiskScore</div>
        <div className="passport-value">{application.risk_score}</div>
        <div className="passport-sub">
          из 1000 · {application.outcome_label}
          {application.raw_score !== application.risk_score && (
            <> · сырой балл {application.raw_score}</>
          )}
        </div>
        <div className="score-bar">
          <span style={{ width: `${scoreWidth}%` }} />
        </div>
      </article>

      <article className="passport-card">
        <div className="passport-label">Свободный поток</div>
        <div className={`passport-value ${application.fcf_rub < 0 ? "red" : ""}`}>
          {formatMoney(application.fcf_rub)}
        </div>
        <div className="passport-sub">
          MaxPayment {formatMoney(application.max_payment_rub)} · K<sub>sector</sub>{" "}
          {application.k_sector.toFixed(2)}
        </div>
      </article>

      <article className="passport-card">
        <div className="passport-label">Условия</div>
        <div className="passport-value">{application.final_rate_pct > 0 ? formatPercent(application.final_rate_pct) : "—"}</div>
        <div className="passport-sub">
          {formatMoney(application.approved_amount_rub)} · {formatMoney(application.monthly_payment_rub)}/мес. ·{" "}
          {application.term_months} мес.
        </div>
        <div className="passport-sub">
          Расчётный лимит: {formatMoney(application.limit_rub)}
        </div>
      </article>

      <article className="passport-card">
        <div className="passport-label">Готовность</div>
        <div className="passport-value" style={{ fontSize: 17 }}>
          {application.status_label}
        </div>
        <div className="passport-sub">
          {application.product_label} · запрос {formatMoney(application.requested_amount_rub)}
        </div>
      </article>
    </div>
  );
}
