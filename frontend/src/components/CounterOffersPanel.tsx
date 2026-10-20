import type { Application } from "../api/types";
import { useApp } from "../state/AppState";
import { formatMoney, formatPercent } from "../utils/format";

export function CounterOffersPanel({ application }: { application: Application }) {
  const { acceptOffer, isBusy } = useApp();

  if (application.counter_offers.length === 0) {
    return null;
  }

  const canChoose = ["COUNTER_OFFER"].includes(application.status);

  return (
    <section className="card">
      <div className="card-header">
        <div>
          <h2 className="card-title">4 встречных предложения</h2>
          <p className="card-subtitle">
            Банк не отказывает — он подбирает посильный платёж. Выбор фиксируется в аудите.
          </p>
        </div>
        <span className="pill pill-warn">{application.status_label}</span>
      </div>
      <div className="card-body">
        <div className="offer-grid">
          {application.counter_offers.map((offer) => {
            const selected = application.selected_offer_index === offer.index;
            return (
              <article key={offer.index} className={`offer-card ${selected ? "selected" : ""}`}>
                <div className="offer-top">
                  <div>
                    <div className="offer-title">{offer.label}</div>
                    <div className="faint" style={{ fontSize: 11 }}>
                      {offer.product_label}
                    </div>
                  </div>
                  <span className={`pill ${selected ? "pill-risk" : "pill-outline"}`}>
                    {selected ? "Выбран" : `Вариант ${offer.index}`}
                  </span>
                </div>

                <div className="offer-numbers">
                  <div>
                    <span>Сумма</span>
                    <span>{formatMoney(offer.amount_rub)}</span>
                  </div>
                  <div>
                    <span>Ставка</span>
                    <span>{formatPercent(offer.rate_pct)}</span>
                  </div>
                  <div>
                    <span>Платёж</span>
                    <span>{formatMoney(offer.monthly_payment_rub)}</span>
                  </div>
                  <div>
                    <span>Срок</span>
                    <span>{offer.term_months} мес.</span>
                  </div>
                </div>

                <ul className="offer-features">
                  {offer.features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>

                <button
                  type="button"
                  className={`btn ${selected ? "btn-ghost" : "btn-secondary"} btn-sm btn-block`}
                  disabled={isBusy || !canChoose}
                  onClick={() => void acceptOffer(offer.index)}
                >
                  {selected ? "Выбран для подписания" : "Выбрать этот вариант"}
                </button>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
