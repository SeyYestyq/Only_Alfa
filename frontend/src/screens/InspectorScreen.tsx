import { EventLog } from "../components/EventLog";
import { GeoPanel } from "../components/GeoPanel";
import { PnlPanel } from "../components/PnlPanel";
import { UnderwriterActions } from "../components/UnderwriterActions";
import { WaterfallChart } from "../components/WaterfallChart";
import { useApp } from "../state/AppState";
import { formatMoney, formatPercent } from "../utils/format";

export function InspectorScreen() {
  const { application, xray, viewMode, setViewMode, setBankTab, cbrRate } = useApp();

  if (!application) {
    return (
      <div className="empty-state">
        <h3>Нет заявки для разбора</h3>
        <p>
          Пилот банка показывает аналитику бизнеса, условия заявки, P&L, Waterfall и audit trail.
          Выберите заявку в очереди или создайте её глазами бизнеса.
        </p>
        <button type="button" className="btn btn-primary" onClick={() => setBankTab("applications")}>
          К очереди заявок
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="page-header">
        <div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
            <span className="pill pill-risk">Пилот банка</span>
            <span className="pill pill-outline">{application.product_label}</span>
            <span className="pill pill-outline">ID {application.application_id.slice(-8)}</span>
          </div>
          <h1 className="page-title">Заявка: {application.company.name}</h1>
          <p className="page-subtitle">
            RiskScore {application.risk_score} · статус {application.status_label} · ставка{" "}
            {formatPercent(application.final_rate_pct)} · КС ЦБ{" "}
            {cbrRate === null ? "—" : formatPercent(cbrRate, 1)}
          </p>
        </div>
        <div className="page-actions">
          {viewMode !== "bank" && (
            <button type="button" className="btn btn-secondary" onClick={() => setViewMode("bank")}>
              Включить режим банка
            </button>
          )}
          <button type="button" className="btn btn-ghost" onClick={() => setBankTab("clients")}>
            К клиенту
          </button>
        </div>
      </div>

      <UnderwriterActions />

      {xray ? (
        <>
          <section className="card section-gap">
            <div className="card-header">
              <div>
                <h2 className="card-title">P&L банка по сделке</h2>
                <p className="card-subtitle">
                  Экономика рассчитывается на бэкенде по ставке, сроку и RiskScore
                </p>
              </div>
              <span className="pill pill-outline">{application.term_months} мес.</span>
            </div>
            <div className="card-body">
              <PnlPanel pnl={xray.bank_pnl} />
              <div className="grid-2 section-gap">
                <div className="alert alert-info">
                  <strong>Прогноз кассы:</strong> минимальный остаток{" "}
                  {formatMoney(xray.cash_forecast_summary.min_balance_rub)} на день{" "}
                  {xray.cash_forecast_summary.min_day}. Дней в минусе:{" "}
                  {xray.cash_forecast_summary.days_negative}.
                </div>
                <div className={`alert ${xray.cash_forecast_summary.has_gap ? "alert-risk" : "alert-good"}`}>
                  {xray.cash_forecast_summary.has_gap
                    ? "Кассовый разрыв подтверждён — кредит имеет целевое назначение."
                    : "Кассового разрыва нет — банк видит запас прочности."}
                </div>
              </div>
            </div>
          </section>

          <section className="card section-gap">
            <div className="card-header">
              <div>
                <h2 className="card-title">Waterfall скоринга</h2>
                <p className="card-subtitle">
                  База 500 + пять дискретных факторов · без диапазонов и «примерных» весов
                </p>
              </div>
              <span className="pill pill-risk">{xray.waterfall.final_score} / 1000</span>
            </div>
            <div className="card-body">
              <WaterfallChart
                factors={xray.waterfall.factors}
                finalScore={xray.waterfall.final_score}
                rawScore={xray.waterfall.raw_score}
              />
            </div>
          </section>

          <section className="card section-gap">
            <div className="card-header">
              <div>
                <h2 className="card-title">Гео, заказчик и ценность для банка</h2>
                <p className="card-subtitle">OSM · BuyerScore · обоснование для продуктовой команды</p>
              </div>
            </div>
            <div className="card-body">
              <GeoPanel xray={xray} />
            </div>
          </section>

          <section className="card section-gap">
            <div className="card-header">
              <div>
                <h2 className="card-title">Живой audit trail</h2>
                <p className="card-subtitle">
                  Смена статуса и запись события — в одной ACID-транзакции
                </p>
              </div>
              <span className="pill pill-outline">{xray.events.length} событий</span>
            </div>
            <div className="card-body">
              <EventLog events={xray.events} />
              {xray.checks.length > 0 && (
                <>
                  <div className="divider" />
                  <div className="card-subtitle" style={{ marginBottom: 6 }}>
                    Проверки по заявке
                  </div>
                  <table className="table events-table">
                    <thead>
                      <tr>
                        <th>Код</th>
                        <th>Статус</th>
                        <th>Сообщение</th>
                      </tr>
                    </thead>
                    <tbody>
                      {xray.checks.map((check) => (
                        <tr key={check.id}>
                          <td className="event-type">{check.code}</td>
                          <td>
                            <span className="pill pill-outline">{check.status}</span>
                          </td>
                          <td>{check.message}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
            </div>
          </section>
        </>
      ) : (
        <div className="loading">
          <span className="spinner" /> Считаем P&L и Waterfall…
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setBankTab("applications")}>
            Обновить
          </button>
        </div>
      )}
    </>
  );
}
