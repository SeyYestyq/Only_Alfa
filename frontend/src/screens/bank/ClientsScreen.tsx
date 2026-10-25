import { useState } from "react";
import { AccountsStrip } from "../../components/AccountsStrip";
import { CashForecastChart } from "../../components/CashForecastChart";
import { DnaPanel } from "../../components/DnaPanel";
import { RadarPanel } from "../../components/RadarPanel";
import { BankEmptyState, ClientsSkeleton } from "../../components/Skeleton";
import { TransactionsPanel } from "../../components/TransactionsPanel";
import { useApp } from "../../state/AppState";
import { formatMoney, formatPercent } from "../../utils/format";
import "../../styles/bank-clients.css";

/**
 * Б6 — Клиенты банка (Master-Detail 360° по макету Figma).
 * Слева — выбор компании из портфеля с балансом.
 * Справа — 360°-аналитика бизнеса: счета, ДНК, прогноз кассы 60 дней, радар и выписка.
 */
export function ClientsScreen() {
  const {
    companies,
    companyId,
    dashboard,
    selectCompany,
    isBusy,
    isReady,
    application,
    applications,
    openApplication,
    goToScreen,
  } = useApp();

  const [query, setQuery] = useState("");
  const showSkeleton = !isReady || (isBusy && companies.length === 0);

  const filteredCompanies = companies.filter((c) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return `${c.name} ${c.inn} ${c.okved_code} ${c.okved_cluster}`.toLowerCase().includes(q);
  });

  // Найти заявку текущей выбранной компании, если есть
  const currentApp = application?.company?.id === companyId ? application : null;

  return (
    <div className="bank-clients-page">
      <div className="bank-page-head">
        <div>
          <div className="figma-eyebrow">Пилот банка · Клиенты и заявки</div>
          <h1 className="figma-h1">Клиенты банка</h1>
          <p className="figma-lead">
            Портфель демо-компаний · откройте клиента, чтобы увидеть аналитику
          </p>
        </div>
        <div className="bank-toolbar">
          <input
            className="bank-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск по названию или ИНН"
            aria-label="Поиск по клиентам"
          />
        </div>
      </div>

      {showSkeleton ? (
        <ClientsSkeleton />
      ) : companies.length === 0 ? (
        <BankEmptyState
          title="В портфеле нет клиентов"
          text="Подключите демо-компании или выполните поиск по ИНН."
        />
      ) : (
        <div className="bank-split">
          {/* Левая колонка: список клиентов */}
          <aside className="bank-clients-sidebar">
            <div className="card-header">
              <div>
                <h2 className="card-title">Все клиенты</h2>
                <div className="card-subtitle">{filteredCompanies.length} в портфеле</div>
              </div>
            </div>
            <ul className="client-list">
              {filteredCompanies.map((company) => {
                const isSelected = companyId === company.id;
                const hasApp = Boolean(application?.company?.id === company.id);

                return (
                  <li key={company.id}>
                    <button
                      type="button"
                      className={`client-row ${isSelected ? "active" : ""}`}
                      disabled={isBusy}
                      onClick={() => void selectCompany(company.id)}
                    >
                      <div className="client-info">
                        <strong>{company.name}</strong>
                        <div className="client-meta">
                          ИНН {company.inn} · {company.legal_form === "IP" ? "ИП" : "ООО"}
                          {hasApp && <span style={{ color: "var(--accent, #ef3124)", marginLeft: 6 }}>● заявка</span>}
                        </div>
                      </div>
                      <div className="client-balance">
                        {formatMoney(company.account_balance)}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </aside>

          {/* Правая колонка: 360° досье выбранного клиента */}
          <main className="bank-client-detail">
            {!dashboard ? (
              <div className="card" style={{ padding: 32, textAlign: "center" }}>
                <h3>Выберите клиента слева</h3>
                <p className="v2-muted">
                  Здесь откроется детальное 360°-досье, прогноз кассы на 60 дней и финансовый радар.
                </p>
              </div>
            ) : (
              <>
                {/* Шапка клиента */}
                <div className="bank-detail-head">
                  <div>
                    <h2 className="bank-detail-title">{dashboard.company.name}</h2>
                    <p className="bank-detail-sub">
                      {dashboard.company.director_name} · выручка{" "}
                      {formatMoney(dashboard.company.monthly_revenue_alfa)}/мес. · рост{" "}
                      {formatPercent(dashboard.company.revenue_growth_pct, 0)} · гео{" "}
                      {dashboard.company.geo_score}
                    </p>
                  </div>
                  {currentApp && (
                    <button
                      type="button"
                      className="bank-btn-action"
                      onClick={() => {
                        void openApplication(currentApp.application_id);
                        goToScreen("bank-xray");
                      }}
                    >
                      К заявке →
                    </button>
                  )}
                </div>

                {/* Баннер активной заявки, если есть */}
                {currentApp && (
                  <div className="bank-active-app-banner">
                    <div className="banner-text">
                      <strong>
                        Активная кредитная заявка №{currentApp.application_id.slice(-6).toUpperCase()}
                      </strong>
                      <span>
                        Статус: {currentApp.status_label} · Запрошено: {formatMoney(currentApp.requested_amount_rub)} · Срок: {currentApp.term_months} мес.
                      </span>
                    </div>
                    <button
                      type="button"
                      className="bank-btn-action"
                      onClick={() => {
                        void openApplication(currentApp.application_id);
                        goToScreen("bank-xray");
                      }}
                    >
                      Разбор заявки
                    </button>
                  </div>
                )}

                {/* 3 карточки счетов */}
                <AccountsStrip dashboard={dashboard} />

                {/* 360°-ДНК бизнеса */}
                <DnaPanel dashboard={dashboard} />

                {/* Прогноз кассы на 60 дней */}
                <section className="card">
                  <div className="card-header">
                    <div>
                      <h2 className="card-title">Прогноз кассы</h2>
                      <p className="card-subtitle">Риск разрыва глазами банка</p>
                    </div>
                    <div className="card-actions">
                      <span className={`pill ${dashboard.cash_forecast.has_gap ? "pill-risk" : "pill-good"}`}>
                        {dashboard.cash_forecast.has_gap ? "Кассовый разрыв" : "Разрыва нет"}
                      </span>
                    </div>
                  </div>
                  <div className="card-body">
                    <CashForecastChart forecast={dashboard.cash_forecast} />
                  </div>
                </section>

                {/* Финансовый радар */}
                <RadarPanel triggers={dashboard.radar_triggers} />

                {/* Все операции выписки */}
                <TransactionsPanel transactions={dashboard.transactions} />
              </>
            )}
          </main>
        </div>
      )}
    </div>
  );
}
