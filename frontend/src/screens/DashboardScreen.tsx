import { AccountsStrip } from "../components/AccountsStrip";
import { CabinetNotifications } from "../components/CabinetNotifications";
import { CashForecastChart } from "../components/CashForecastChart";
import { InvoicePanel } from "../components/InvoicePanel";
import { NewsFeed } from "../components/NewsFeed";
import { OperationsChart } from "../components/OperationsChart";
import { RadarPanel } from "../components/RadarPanel";
import { SmartSearchPanel } from "../components/SmartSearchPanel";
import { TransactionsPanel } from "../components/TransactionsPanel";
import { useApp } from "../state/AppState";
import { formatMoney } from "../utils/format";

export function DashboardScreen() {
  const { dashboard, refresh, isBusy, setBusinessTab } = useApp();

  if (!dashboard) {
    return (
      <div className="loading">
        <span className="spinner" /> Загружаем счета и операции…
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
            <span className="pill pill-outline">{company.city}</span>
          </div>
          <h1 className="page-title">Главная · {company.name}</h1>
          <p className="page-subtitle">
            Все счета и операции · остаток {formatMoney(dashboard.account_balance)} ·{" "}
            {company.director_name}
          </p>
        </div>
        <div className="page-actions">
          <button type="button" className="btn btn-secondary" onClick={() => setBusinessTab("credits")}>
            Кредиты
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => void refresh()} disabled={isBusy}>
            Обновить
          </button>
        </div>
      </div>

      <CabinetNotifications />
      <AccountsStrip dashboard={dashboard} />

      <div className="dashboard-grid home-grid">
        <div className="main-column">
          <section className="card">
            <div className="card-header">
              <div>
                <h2 className="card-title">Операции: поступления и платежи</h2>
                <p className="card-subtitle">Сводка по выписке — банк видит ритм кассы до заявки</p>
              </div>
            </div>
            <div className="card-body">
              <OperationsChart transactions={dashboard.transactions} />
            </div>
          </section>

          <section className="card">
            <div className="card-header">
              <div>
                <h2 className="card-title">Прогноз кассы на 60 дней</h2>
                <p className="card-subtitle">
                  Красная зона — кассовый разрыв (аренда, ФОТ, налоги)
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

          <TransactionsPanel transactions={dashboard.transactions} />
        </div>

        <aside className="side-column">
          <InvoicePanel />
          <SmartSearchPanel />
          <RadarPanel triggers={dashboard.radar_triggers} />
          <NewsFeed items={dashboard.news_feed} />
        </aside>
      </div>
    </>
  );
}
