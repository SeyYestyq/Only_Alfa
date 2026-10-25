import { useApp } from "../state/AppState";
import { formatMoney, formatPercent } from "../utils/format";
import { AccountsStrip } from "./AccountsStrip";
import { CashForecastChart } from "./CashForecastChart";
import { DnaPanel } from "./DnaPanel";
import { RadarPanel } from "./RadarPanel";
import { TransactionsPanel } from "./TransactionsPanel";

export function BankClientsPanel() {
  const {
    companies,
    companyId,
    dashboard,
    selectCompany,
    isBusy,
    setBankTab,
    application,
    openApplication,
  } = useApp();

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Клиенты банка</h1>
          <p className="page-subtitle">Портфель демо-компаний · откройте клиента, чтобы увидеть аналитику</p>
        </div>
      </div>

      <div className="bank-split">
        <section className="card bank-clients-list">
          <div className="card-header">
            <div>
              <h2 className="card-title">Все клиенты</h2>
              <p className="card-subtitle">{companies.length} в портфеле</p>
            </div>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <ul className="client-list">
              {companies.map((company) => (
                <li key={company.id}>
                  <button
                    type="button"
                    className={`client-row ${companyId === company.id ? "active" : ""}`}
                    disabled={isBusy}
                    onClick={() => void selectCompany(company.id)}
                  >
                    <div>
                      <strong>{company.name}</strong>
                      <div className="faint">
                        ИНН {company.inn} · {company.legal_form === "IP" ? "ИП" : "ООО"}
                      </div>
                    </div>
                    <div className="mono client-balance">{formatMoney(company.account_balance)}</div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <div className="bank-client-detail">
          {!dashboard ? (
            <div className="empty-state">
              <h3>Выберите клиента</h3>
              <p>Слева откройте компанию — здесь появится 360°-аналитика бизнеса.</p>
            </div>
          ) : (
            <>
              <div className="page-header" style={{ marginBottom: 12 }}>
                <div>
                  <h2 className="page-title" style={{ fontSize: 22 }}>{dashboard.company.name}</h2>
                  <p className="page-subtitle">
                    {dashboard.company.director_name} · выручка{" "}
                    {formatMoney(dashboard.company.monthly_revenue_alfa)}/мес. · рост{" "}
                    {formatPercent(dashboard.company.revenue_growth_pct, 0)} · гео{" "}
                    {dashboard.company.geo_score}
                  </p>
                </div>
                <div className="page-actions">
                  {application && (
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => {
                        void openApplication(application.application_id);
                        setBankTab("applications");
                      }}
                    >
                      К заявке
                    </button>
                  )}
                </div>
              </div>
              <AccountsStrip dashboard={dashboard} />
              <DnaPanel dashboard={dashboard} />
              <section className="card section-gap">
                <div className="card-header">
                  <div>
                    <h2 className="card-title">Прогноз кассы</h2>
                    <p className="card-subtitle">Риск разрыва глазами банка</p>
                  </div>
                </div>
                <div className="card-body">
                  <CashForecastChart forecast={dashboard.cash_forecast} />
                </div>
              </section>
              <div className="section-gap">
                <RadarPanel triggers={dashboard.radar_triggers} />
              </div>
              <div className="section-gap">
                <TransactionsPanel transactions={dashboard.transactions} />
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
