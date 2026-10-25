import type { SupplierDealRisk } from "../../api/types";
import { supplierRiskBandLabel, supplierRiskBandTone } from "../../domain-ui/supplierRisk";
import { ErrorState, SkeletonLines } from "../v2/ScreenState";

interface SupplierVerdictProps {
  risk: SupplierDealRisk | null;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
}

/** Компактный вердикт по поставщику. Подробности спрятаны, пока их не откроют. */
export function SupplierVerdict({ risk, isLoading, error, onRetry }: SupplierVerdictProps) {
  if (isLoading) {
    return (
      <section className="v2-card" aria-busy="true">
        <h2>Проверка поставщика</h2>
        <SkeletonLines lines={3} />
      </section>
    );
  }
  if (error) {
    return (
      <section className="v2-card">
        <ErrorState title="Проверка поставщика не загрузилась" text={error} onRetry={onRetry} />
      </section>
    );
  }
  if (!risk) {
    return null;
  }

  const tone = supplierRiskBandTone(risk.risk_band);
  const pill = tone === "risk" ? "bad" : tone;
  const pros = risk.pros.filter((signal) => signal.is_flagged).slice(0, 3);
  const cons = risk.cons.filter((signal) => signal.is_flagged).slice(0, 3);

  return (
    <section className="v2-card">
      <div className="v2-row v2-inv-verdict">
        <div>
          <h2>Проверка поставщика</h2>
          <p className="v2-muted">{risk.supplier_name} · ИНН {risk.supplier_inn} · {risk.okved_cluster}</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <div className="v2-score-num">{Math.round(risk.deal_success_probability_pct)}%</div>
          <span className={`v2-pill ${pill}`}>{supplierRiskBandLabel(risk.risk_band)}</span>
        </div>
      </div>
      <div className="v2-inv-pros">
        <div>
          <h3>Плюсы</h3>
          {pros.length === 0 ? <p className="v2-muted">Явных плюсов нет</p> : pros.map((signal) => (
            <p key={signal.code} className="v2-inv-signal">{signal.label} · {signal.value_label}</p>
          ))}
        </div>
        <div>
          <h3>Минусы</h3>
          {cons.length === 0 ? <p className="v2-muted">Критичных минусов нет</p> : cons.map((signal) => (
            <p key={signal.code} className="v2-inv-signal">{signal.label} · {signal.value_label}</p>
          ))}
        </div>
      </div>
      <details className="v2-inv-details">
        <summary>Подробности проверки</summary>
        <p className="v2-muted">{risk.summary}</p>
        {[...risk.pros, ...risk.cons].map((signal) => (
          <div key={`${signal.polarity}-${signal.code}`} className="v2-check">
            <span>{signal.label}</span>
            <strong>{signal.value_label}</strong>
          </div>
        ))}
      </details>
    </section>
  );
}
