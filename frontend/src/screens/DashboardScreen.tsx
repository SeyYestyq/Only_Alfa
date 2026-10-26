import { TransactionsPanel } from "../components/TransactionsPanel";
import { PeriodChart } from "../components/PeriodChart";
import { useApp } from "../state/AppState";
import { formatMoney, formatPercent, givenName } from "../utils/format";

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) {
    return "Доброе утро";
  }
  if (hour < 18) {
    return "Добрый день";
  }
  return "Добрый вечер";
}

/** К1 — Главная: баланс крупно, KPI, внимание+оплаты, счёт. */
export function DashboardScreen() {
  const { dashboard, goToScreen, openPlainApply, userRole } = useApp();

  if (!dashboard) {
    return (
      <div className="loading">
        <span className="spinner" /> Загружаем сводку…
      </div>
    );
  }

  const company = dashboard.company;
  const user = company.users.find((row) => row.role === userRole) ?? company.users[0];
  const important = dashboard.radar_triggers;
  const fcfDisplay = Math.max(0, Math.round(company.monthly_revenue_alfa * 0.12));
  const outgoing = dashboard.transactions.filter((row) => row.direction === "OUT");
  const obligationsTotal = outgoing
    .slice(0, 6)
    .reduce((sum, row) => sum + Math.abs(row.amount_rub), 0);
  const obligations = outgoing.slice(0, 5).map((row) => ({
    date: new Date(row.occurred_at).toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
    }),
    title: row.description,
    amount: Math.abs(row.amount_rub),
    accent: false,
  }));

  const importantItems =
    important.length > 0
      ? important.slice(0, 3)
      : [
          {
            code: "GAP",
            severity: "RISK" as const,
            title: "Кассовый разрыв 26–30.11",
            value: "Налоги и аренда раньше выручки · до −35 000 ₽",
          },
          {
            code: "GROWTH",
            severity: "GOOD" as const,
            title: "Выручка растёт +11%",
            value: "Средний чек +6% · хороший фон для кредита",
          },
        ];

  return (
    <>
      <section className="home-hero clarity-rise">
        <div className="home-hero-main">
          <div className="figma-eyebrow">
            {company.name} ·{" "}
            {new Date().toLocaleDateString("ru-RU", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </div>
          <h1 className="figma-h1">
            {greeting()}, {givenName(user?.full_name)}
          </h1>
          <p className="figma-lead">
            Остаток, ближайшие оплаты и счета к оплате — на этом экране.
          </p>
          <div className="home-hero-balance">
            <span>На счёте сейчас</span>
            <strong>{formatMoney(dashboard.account_balance)}</strong>
            <small>расчётный счёт в Альфе</small>
          </div>
        </div>
        <div className="home-hero-cta">
          <button type="button" className="btn btn-primary primary-cta" onClick={() => goToScreen("invoice")}>
            Счета к оплате
          </button>
          <button type="button" className="btn btn-ghost" onClick={openPlainApply}>
            Оформить кредит
          </button>
        </div>
      </section>

      <div className="home-bento clarity-rise clarity-rise-d1">
        <div className="figma-kpi">
          <div className="figma-kpi-label">Выручка в октябре</div>
          <div className="figma-kpi-value">
            {formatMoney(company.monthly_revenue_alfa)}
          </div>
          <div className={`figma-kpi-delta ${company.revenue_growth_pct >= 0 ? "green" : "red"}`}>
            {company.revenue_growth_pct >= 0 ? "+" : ""}
            {formatPercent(company.revenue_growth_pct, 0)} к прошлому году
          </div>
        </div>
        <div className="figma-kpi">
          <div className="figma-kpi-label">После расходов</div>
          <div className="figma-kpi-value">{formatMoney(fcfDisplay)}</div>
          <div className="figma-kpi-delta">в среднем за 3 месяца</div>
        </div>
        <div className="figma-kpi">
          <div className="figma-kpi-label">К оплате до 30.11</div>
          <div className="figma-kpi-value">{formatMoney(obligationsTotal)}</div>
          <div className="figma-kpi-delta">ближайший {obligations[0]?.date ?? "—"}</div>
        </div>
      </div>

      <div className="home-section clarity-rise clarity-rise-d2">
        <PeriodChart monthlyRevenue={company.monthly_revenue_alfa} />
      </div>

      <section className="figma-panel attention-split home-section clarity-rise clarity-rise-d3">
        <div className="attention-col">
          <div className="figma-panel-title">Что важно сейчас</div>
          <div className="radar-list" style={{ marginTop: 14 }}>
            {importantItems.map((item) => (
              <div key={item.code} className="radar-item">
                <span className={`radar-dot ${item.severity}`} />
                <div>
                  <div className="radar-title">{item.title}</div>
                  <div className="radar-value">{item.value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="attention-divider" aria-hidden="true" />

        <div className="attention-col">
          <div className="figma-panel-title">Ближайшие оплаты</div>
          <div className="obligations-list" style={{ marginTop: 6 }}>
            {obligations.slice(0, 4).map((row) => (
              <div
                key={`${row.date}-${row.title}`}
                className={`obligation-row ${row.accent ? "accent" : ""}`}
              >
                <span className="date">{row.date}</span>
                <span>{row.title}</span>
                <span className="amount">{formatMoney(row.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <TransactionsPanel transactions={dashboard.transactions} variant="figma" />
    </>
  );
}
