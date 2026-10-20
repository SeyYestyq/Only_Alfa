import { ApplicationForm } from "../components/ApplicationForm";
import { CashForecastChart } from "../components/CashForecastChart";
import { DnaPanel } from "../components/DnaPanel";
import { InvoicePanel } from "../components/InvoicePanel";
import { NewsFeed } from "../components/NewsFeed";
import { RadarPanel } from "../components/RadarPanel";
import { SmartSearchPanel } from "../components/SmartSearchPanel";
import { TransactionsPanel } from "../components/TransactionsPanel";
import { useApp } from "../state/AppState";
import { formatMoney, formatPercent } from "../utils/format";

export function DashboardScreen() {
  const { dashboard, refresh, isBusy } = useApp();

  if (!dashboard) {
    return (
      <div className="loading">
        <span className="spinner" /> Загружаем 360°-портрет…
      </div>
    );
  }

  const company = dashboard.company;

  return (
    <>
      <div className="page-header">
        <div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
            <span className="pill pill-neutral">{company.legal_form === "IP" ? "ИП" : "ООО"}</span>
            <span className="pill pill-outline">ИНН {company.inn}</span>
            <span className="pill pill-outline">ОКВЭД {company.okved_code}</span>
            {company.demo_key && <span className="pill pill-risk">Демо-профиль</span>}
          </div>
          <h1 className="page-title">{company.name}</h1>
          <p className="page-subtitle">
            {company.director_name} · {company.city}, {company.address} · выручка в Альфе{" "}
            {formatMoney(company.monthly_revenue_alfa)}/мес. · остаток {formatMoney(dashboard.account_balance)}
          </p>
        </div>
        <div className="page-actions">
          <div className="metric-card" style={{ minWidth: 150 }}>
            <div className="metric-label">Динамика выручки</div>
            <div className={`metric-value ${company.revenue_growth_pct >= 0 ? "green" : "red"}`}>
              {company.revenue_growth_pct >= 0 ? "+" : ""}
              {formatPercent(company.revenue_growth_pct, 0)}
            </div>
            <div className="metric-sub">за 3 месяца</div>
          </div>
          <button type="button" className="btn btn-ghost" onClick={() => void refresh()} disabled={isBusy}>
            Обновить данные
          </button>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="main-column">
          <DnaPanel dashboard={dashboard} />

          <section className="card">
            <div className="card-header">
              <div>
                <h2 className="card-title">Прогноз кассы на 60 дней</h2>
                <p className="card-subtitle">
                  Ежедневный остаток с учётом аренды, ФОТ и налогов · красная зона — кассовый разрыв
                </p>
              </div>
              <div className="card-actions">
                <div className="chart-legend">
                  <span>
                    <i /> остаток
                  </span>
                  <span>
                    <i className="red-zone" /> зона разрыва
                  </span>
                </div>
              </div>
            </div>
            <div className="card-body">
              <CashForecastChart forecast={dashboard.cash_forecast} />
            </div>
          </section>

          <InvoicePanel />
          <TransactionsPanel transactions={dashboard.transactions} />
        </div>

        <aside className="side-column">
          <SmartSearchPanel />
          <ApplicationForm />
          <RadarPanel triggers={dashboard.radar_triggers} />
          <NewsFeed items={dashboard.news_feed} />
        </aside>
      </div>
    </>
  );
}
