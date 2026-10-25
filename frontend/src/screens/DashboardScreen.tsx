import { OperationsTable } from "../components/OperationsTable";
import { PeriodChart } from "../components/PeriodChart";
import { useApp } from "../state/AppState";
import { useDemoStore } from "../state/demoStore";
import { formatMoney, formatPercent } from "../utils/format";

const ROSTERS_OBLIGATIONS = [
  { date: "25.10", title: "Зарплата, 2-я часть", amount: 410_000, accent: false },
  { date: "28.10", title: "ЕНП", amount: 176_000, accent: false },
  { date: "01.11", title: "Аренда, ул. Покровка, 17", amount: 140_000, accent: false },
  { date: "10.11", title: "Зерно · ООО «Арабика Трейд»", amount: 240_000, accent: false },
  { date: "28.11", title: "ЕНП", amount: 182_000, accent: true },
];

/** К1 — Главная: баланс крупно, KPI, внимание+оплаты, счёт. */
export function DashboardScreen() {
  const { dashboard, goToScreen } = useApp();
  const setApplyIntent = useDemoStore((state) => state.setApplyIntent);
  const offersMuted = useDemoStore((state) => state.offersMuted);
  const setOffersMuted = useDemoStore((state) => state.setOffersMuted);

  if (!dashboard) {
    return (
      <div className="loading">
        <span className="spinner" /> Загружаем сводку…
      </div>
    );
  }

  const company = dashboard.company;
  const isRosters = company.demo_key === "rosters";
  const important = dashboard.radar_triggers;
  const fcfDisplay = isRosters ? 260_000 : Math.max(0, Math.round(company.monthly_revenue_alfa * 0.12));
  const obligationsTotal = isRosters
    ? 1_148_000
    : dashboard.transactions
        .filter((row) => row.direction === "OUT")
        .slice(0, 6)
        .reduce((sum, row) => sum + Math.abs(row.amount_rub), 0);
  const obligations = isRosters
    ? ROSTERS_OBLIGATIONS
    : dashboard.transactions
        .filter((row) => row.direction === "OUT")
        .slice(0, 5)
        .map((row) => ({
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

  function startCredit() {
    setApplyIntent("standard");
    goToScreen("apply");
  }

  return (
    <>
      <section className="home-hero clarity-rise">
        <div className="home-hero-main">
          <h1 className="figma-h1">Обзор</h1>
          <p className="figma-lead">Касса, кредиты и следующий шаг</p>
          <div className="home-hero-balance">
            <span>На счёте сейчас</span>
            <strong>{formatMoney(dashboard.account_balance)}</strong>
            <small>
              {isRosters ? "−418 600 ₽ за 30 дней на оборудование" : "расчётный счёт в Альфе"}
            </small>
          </div>
        </div>
        <div className="home-hero-cta">
          <button type="button" className="btn btn-primary primary-cta" onClick={() => goToScreen("invoice")}>
            Счета → финансирование
          </button>
          <button type="button" className="btn btn-ghost" onClick={startCredit}>
            Оформить кредит
          </button>
        </div>
      </section>

      <div className="home-bento clarity-rise clarity-rise-d1">
        <div className="figma-kpi">
          <div className="figma-kpi-label">Выручка в октябре</div>
          <div className="figma-kpi-value">
            {isRosters ? "2,10 млн ₽" : formatMoney(company.monthly_revenue_alfa)}
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
        <PeriodChart monthlyRevenue={isRosters ? 2_100_000 : company.monthly_revenue_alfa} />
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

      {!offersMuted && (
        <section className="home-offer-quiet home-section clarity-rise clarity-rise-d4">
          <div className="home-offer-body">
            <span className="status-tag is-info">Предложение банка</span>
            <strong>900 000 ₽ · 24 мес. · ≈ 44 930 ₽ / мес.</strong>
            <p className="muted">Вернуть деньги за оборудование и закрыть кассовый разрыв</p>
          </div>
          <div className="home-offer-actions">
            <button type="button" className="btn btn-secondary btn-sm" onClick={startCredit}>
              Условия
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setOffersMuted(true)}
            >
              Скрыть
            </button>
          </div>
        </section>
      )}

      {offersMuted && (
        <div className="silence-restore">
          <span className="muted">Предложения банка скрыты</span>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOffersMuted(false)}>
            Показать снова
          </button>
        </div>
      )}

      <section className="figma-panel home-section clarity-rise clarity-rise-d5">
        <div className="ops-head">
          <div>
            <div className="figma-panel-title">Движения по счёту</div>
            <div className="figma-panel-heading" style={{ marginTop: 4, fontSize: 18 }}>
              Последние операции
            </div>
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => goToScreen("payments")}>
            Все →
          </button>
        </div>
        <OperationsTable rows={dashboard.transactions} />
      </section>
    </>
  );
}
