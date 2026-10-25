import { useEffect, useState, type FormEvent } from "react";
import type { ProductType } from "../api/types";
import { PRODUCT_LABELS } from "../api/client";
import { useApp } from "../state/AppState";
import { formatMoney } from "../utils/format";

export function ApplicationForm() {
  const { dashboard, searchResult, createApplication, isBusy, viewMode } = useApp();
  const [amount, setAmount] = useState(0);
  const [term, setTerm] = useState(24);
  const [product, setProduct] = useState<ProductType>("INVEST_LEASING");
  const [declaredRevenue, setDeclaredRevenue] = useState(0);

  const company = dashboard?.company;
  const badge = searchResult?.credit_badge;

  useEffect(() => {
    if (!company) {
      return;
    }
    const suggested = badge?.amount_rub
      ?? Math.max(100_000, Math.round((company.annual_revenue / 12) * 0.7 / 1000) * 1000);
    setAmount(suggested);
    setTerm(badge?.term_months ?? 24);
    setProduct(badge?.product_type ?? "INVEST_LEASING");
    setDeclaredRevenue(company.declared_monthly_revenue);
  }, [company?.id, searchResult]);

  if (!company) {
    return null;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    await createApplication({
      product_type: product,
      requested_amount_rub: amount,
      term_months: term,
      declared_monthly_revenue: declaredRevenue,
    });
  }

  return (
    <section className="card">
      <div className="card-header">
        <div>
          <h2 className="card-title">Своя сумма</h2>
          <p className="card-subtitle">
            Не нашли готовый вариант — укажите сумму, банк быстро прогонит скоринг по оборотам и контрагентам
          </p>
        </div>
      </div>
      <div className="card-body">
        {badge && (
          <div className="alert alert-info" style={{ marginBottom: 12 }}>
            Предварительно: {badge.product_label} до {formatMoney(badge.amount_rub)} ·{" "}
            {badge.term_months} мес. · {badge.rate_pct.toFixed(1)}%
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <label className="field">
              <span className="field-label">Сумма, ₽</span>
              <input
                className="field-input"
                type="number"
                min={10_000}
                step={1_000}
                value={amount}
                onChange={(event) => setAmount(Number(event.target.value))}
                required
              />
            </label>
            <label className="field">
              <span className="field-label">Срок, мес.</span>
              <input
                className="field-input"
                type="number"
                min={3}
                max={60}
                value={term}
                onChange={(event) => setTerm(Number(event.target.value))}
                required
              />
            </label>
            <label className="field field-full">
              <span className="field-label">Продукт</span>
              <select
                className="field-select"
                value={product}
                onChange={(event) => setProduct(event.target.value as ProductType)}
              >
                {Object.entries(PRODUCT_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="field field-full">
              <span className="field-label">Заявленная выручка, ₽/мес.</span>
              <input
                className="field-input"
                type="number"
                min={10_000}
                step={1_000}
                value={declaredRevenue}
                onChange={(event) => setDeclaredRevenue(Number(event.target.value))}
                required
              />
            </label>
          </div>
          <div style={{ marginTop: 12 }}>
            <button
              className="btn btn-primary btn-block"
              type="submit"
              disabled={isBusy || viewMode === "bank" || amount <= 0}
            >
              Просмотреть варианты / запустить скоринг
            </button>
            {viewMode === "bank" && (
              <p className="faint" style={{ fontSize: 11, marginTop: 6 }}>
                В режиме банка создание заявок недоступно — переключитесь на «Глазами бизнеса».
              </p>
            )}
          </div>
        </form>
      </div>
    </section>
  );
}
