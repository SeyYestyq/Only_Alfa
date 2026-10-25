import type { SupplierDealRisk, SupplierRiskSignal } from "../../api/types";
import {
  supplierRiskBandLabel,
  supplierRiskBandTone,
} from "../../domain-ui/supplierRisk";

interface SupplierRiskPanelProps {
  risk: SupplierDealRisk | null;
  isLoading: boolean;
  error?: string | null;
  supplierName: string;
  supplierInn: string;
}

function SignalList({
  title,
  signals,
  emptyLabel,
}: {
  title: string;
  signals: SupplierRiskSignal[];
  emptyLabel: string;
}) {
  const visible = signals.filter((signal) => signal.is_flagged);
  return (
    <div className="supplier-risk-col">
      <div className="supplier-risk-col-title">{title}</div>
      {visible.length === 0 ? (
        <p className="supplier-risk-empty">{emptyLabel}</p>
      ) : (
        <ul className="supplier-risk-signals">
          {visible.map((signal) => (
            <li key={signal.code}>
              <strong>{signal.label}</strong>
              <span>{signal.value_label}</span>
              {signal.score_delta_pct !== 0 ? (
                <em>
                  {signal.score_delta_pct > 0 ? "+" : ""}
                  {signal.score_delta_pct.toFixed(0)} п.п.
                </em>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Тёмная панель аналитики контрагента перед финансированием 85%. */
export function SupplierRiskPanel({
  risk,
  isLoading,
  error,
  supplierName,
  supplierInn,
}: SupplierRiskPanelProps) {
  if (isLoading) {
    return (
      <aside className="supplier-risk-panel" aria-busy="true">
        <div className="supplier-risk-eyebrow">Аналитика поставщика</div>
        <p className="muted">Сверяем реестры по ИНН {supplierInn}…</p>
      </aside>
    );
  }

  if (error) {
    return (
      <aside className="supplier-risk-panel is-error">
        <div className="supplier-risk-eyebrow">Аналитика поставщика</div>
        <strong>{supplierName}</strong>
        <p className="muted">{error}</p>
      </aside>
    );
  }

  if (!risk) {
    return null;
  }

  const tone = supplierRiskBandTone(risk.risk_band);
  const probability = Math.round(risk.deal_success_probability_pct);

  return (
    <aside className="supplier-risk-panel" data-band={risk.risk_band}>
      <header className="supplier-risk-head">
        <div>
          <div className="supplier-risk-eyebrow">Аналитика поставщика · симулятор реестров</div>
          <strong className="supplier-risk-name">{risk.supplier_name || supplierName}</strong>
          <div className="supplier-risk-meta">
            ИНН {risk.supplier_inn} · {risk.okved_cluster}
          </div>
        </div>
        <div className={`supplier-risk-score tone-${tone}`}>
          <span className="supplier-risk-prob">{probability}%</span>
          <span>вероятность успеха сделки</span>
          <span className={`pill pill-${tone}`}>{supplierRiskBandLabel(risk.risk_band)}</span>
        </div>
      </header>

      <div className="supplier-risk-grid">
        <SignalList
          title="Плюсы"
          signals={risk.pros}
          emptyLabel="Явных плюсов по порогам нет"
        />
        <SignalList
          title="Минусы"
          signals={risk.cons}
          emptyLabel="Критичных минусов нет"
        />
      </div>

      <p className="supplier-risk-summary">{risk.summary}</p>
    </aside>
  );
}
