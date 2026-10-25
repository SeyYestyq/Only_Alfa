import type { ProductType, RadarTrigger } from "../api/types";
import { useApp } from "../state/AppState";

function productFromTrigger(code: string): { product: ProductType; term: number } {
  if (code === "TRG_CASH_GAP") {
    return { product: "OVERDRAFT", term: 3 };
  }
  if (code === "TRG_CAPEX" || code === "TRG_SCALE") {
    return { product: "INVEST_LEASING", term: 24 };
  }
  if (code === "TRG_REFINANCE") {
    return { product: "VKL", term: 12 };
  }
  return { product: "VKL", term: 12 };
}

export function PreapprovedOffers({ triggers }: { triggers: RadarTrigger[] }) {
  const { createApplication, dashboard, isBusy, viewMode } = useApp();

  if (!dashboard) {
    return null;
  }

  const offers = triggers.filter((trigger) => trigger.severity !== "GOOD");

  async function requestFromTrigger(trigger: RadarTrigger) {
    const { product, term } = productFromTrigger(trigger.code);
    // Сумма заявки = заявленная выручка с дашборда (бэкенд), без локального скоринга
    await createApplication({
      product_type: product,
      requested_amount_rub: Math.max(10_000, dashboard!.company.declared_monthly_revenue),
      term_months: term,
      declared_monthly_revenue: dashboard!.company.declared_monthly_revenue,
    });
  }

  return (
    <section className="card">
      <div className="card-header">
        <div>
          <h2 className="card-title">Варианты, которые банк уже готов предложить</h2>
          <p className="card-subtitle">
            Сигналы радара по вашим оборотам и кассе — нажмите, чтобы отправить в скоринг
          </p>
        </div>
        <span className="pill pill-outline">{offers.length || "нет"} сигналов</span>
      </div>
      <div className="card-body">
        {offers.length === 0 ? (
          <div className="alert alert-good">
            Критичных сигналов нет. Можно запросить свою сумму ниже — Decision Engine всё равно
            посчитает лимит и ставку.
          </div>
        ) : (
          <div className="preapproved-grid">
            {offers.map((trigger) => {
              const mapping = productFromTrigger(trigger.code);
              return (
                <article key={trigger.code} className="preapproved-card">
                  <span className={`radar-dot ${trigger.severity}`} />
                  <div className="preapproved-body">
                    <h3>{trigger.title}</h3>
                    <p>{trigger.value}</p>
                    <p className="faint">{trigger.action_label}</p>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      disabled={isBusy || viewMode === "bank"}
                      onClick={() => void requestFromTrigger(trigger)}
                    >
                      Запросить · {mapping.product === "OVERDRAFT" ? "овердрафт" : mapping.product === "VKL" ? "ВКЛ" : "инвест-кредит"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
