import { useState, type FormEvent } from "react";
import { useApp } from "../state/AppState";
import { useDemoStore } from "../state/demoStore";
import { formatMoney, formatPercent } from "../utils/format";

export function SmartSearchPanel() {
  const {
    dashboard,
    searchResult,
    runSearch,
    isBusy,
    viewMode,
    goToScreen,
  } = useApp();
  const setApplyIntent = useDemoStore((state) => state.setApplyIntent);
  const [query, setQuery] = useState("");

  if (!dashboard) {
    return null;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!query.trim()) {
      return;
    }
    await runSearch(query.trim());
  }

  async function handleChip(chip: string) {
    setQuery(chip);
    await runSearch(chip);
  }

  const badge = searchResult?.credit_badge ?? null;

  return (
    <section className="card">
      <div className="card-header">
        <div>
          <h2 className="card-title">Умный бизнес-поиск</h2>
          <p className="card-subtitle">Search-to-Credit · 4 класса намерения · ответ без сети</p>
        </div>
        {searchResult && (
          <span className="pill pill-neutral">{searchResult.classification_ms.toFixed(1)} мс</span>
        )}
      </div>
      <div className="card-body">
        <form className="search-form" onSubmit={handleSubmit}>
          <input
            className="search-input"
            placeholder="Что нужно бизнесу? Например, «кофемашина 900 000»"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <button className="btn btn-primary" type="submit" disabled={isBusy || !query.trim()}>
            Найти
          </button>
        </form>

        <div className="chip-row">
          {dashboard.search_chips.map((chip) => (
            <button key={chip} type="button" className="chip" onClick={() => void handleChip(chip)} disabled={isBusy}>
              {chip}
            </button>
          ))}
        </div>

        {searchResult && (
          <div className="search-result">
            <div className="result-head">
              <div>
                <div className="result-query">«{searchResult.query}»</div>
              </div>
              <span className="pill pill-warn">{searchResult.intent_label}</span>
            </div>

            {searchResult.silence_mode ? (
              <div className="silence-box">
                <strong>Режим тишины</strong>
                {searchResult.silence_reason}
              </div>
            ) : (
              <>
                {badge && (
                  <div className="credit-badge">
                    <div className="badge-top">
                      <div>
                        <div style={{ fontSize: 11, opacity: 0.6, textTransform: "uppercase", letterSpacing: 1 }}>
                          {badge.product_label}
                        </div>
                        <div className="badge-rate">
                          {formatPercent(badge.rate_pct)}
                          <small> годовых</small>
                        </div>
                      </div>
                      <span className={`pill ${badge.is_preapproved ? "pill-good" : "pill-warn"}`}>
                        {badge.is_preapproved ? "Предодобрено" : "Требует проверки"}
                      </span>
                    </div>
                    <div className="badge-grid">
                      <div>
                        <span>Сумма</span>
                        <span>{formatMoney(badge.amount_rub)}</span>
                      </div>
                      <div>
                        <span>Платёж / мес.</span>
                        <span>{formatMoney(badge.monthly_payment_rub)}</span>
                      </div>
                      <div>
                        <span>Срок</span>
                        <span>{badge.term_months} мес.</span>
                      </div>
                      <div>
                        <span>Лимит</span>
                        <span>{formatMoney(badge.limit_rub)}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm btn-block"
                      disabled={viewMode === "bank" || !badge}
                      onClick={() => {
                        setApplyIntent("standard");
                        goToScreen("apply");
                      }}
                    >
                      Перенести условия в заявку
                    </button>
                    <div className="badge-disclaimer">{badge.disclaimer}</div>
                  </div>
                )}

                <div>
                  <div className="card-subtitle" style={{ marginBottom: 6 }}>
                    Проверенные поставщики · {searchResult.suppliers.length}
                  </div>
                  <div className="supplier-list">
                    {searchResult.suppliers.map((supplier) => (
                      <article key={supplier.inn} className="supplier-card">
                        <div>
                          <strong>{supplier.name}</strong>
                          <div className="supplier-meta">
                            ИНН {supplier.inn} · {supplier.price_label} · поставка {supplier.delivery_days} дн.
                          </div>
                        </div>
                        <span className="pill pill-good">{supplier.fssp_label}</span>
                      </article>
                    ))}
                  </div>
                </div>

                {searchResult.market_prices.length > 0 && (
                  <div>
                    <div className="card-subtitle" style={{ marginBottom: 4 }}>
                      Рыночные цены
                    </div>
                    <table className="market-table">
                      <thead>
                        <tr>
                          <th>Позиция</th>
                          <th>Цена</th>
                        </tr>
                      </thead>
                      <tbody>
                        {searchResult.market_prices.map((row) => (
                          <tr key={`${row.item}-${row.price_rub}`}>
                            <td>{row.item}</td>
                            <td className="nowrap">{row.price_label}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {searchResult.ai_enrichment && (
                  <div className="alert alert-info">
                    <strong>AI-обогащение:</strong> {searchResult.ai_enrichment.text}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
