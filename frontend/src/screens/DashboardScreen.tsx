import { CashForecastChart } from "../components/CashForecastChart";
import { OperationsTable } from "../components/OperationsTable";
import { RevenueBars } from "../components/RevenueBars";
import { useApp } from "../state/AppState";
import { useDemoStore } from "../state/demoStore";
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

const ROSTERS_OBLIGATIONS = [
  { date: "25.10", title: "Зарплата, 2-я часть", amount: 410_000, accent: false },
  { date: "28.10", title: "ЕНП", amount: 176_000, accent: false },
  { date: "01.11", title: "Аренда, ул. Покровка, 17", amount: 140_000, accent: false },
  { date: "10.11", title: "Зерно · ООО «Арабика Трейд»", amount: 240_000, accent: false },
  { date: "28.11", title: "ЕНП", amount: 182_000, accent: true },
];

/** К1 — Главная: мой бизнес. Макет Figma 47:388 — структура и копирайт 1:1. */
export function DashboardScreen() {
  const { dashboard, goToScreen, userRole } = useApp();
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
  const user = company.users.find((row) => row.role === userRole) ?? company.users[0];
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

  function startCredit() {
    setApplyIntent("standard");
    goToScreen("apply");
  }

  return (
    <>
      <div className="page-header" style={{ alignItems: "flex-end", marginBottom: 8 }}>
        <div>
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
            Сводка по счёту, выручке и обязательствам. Данные обновлены{" "}
            {new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}.
          </p>
        </div>
        <button type="button" className="btn btn-secondary" onClick={() => goToScreen("messages")}>
          Написать в банк
        </button>
      </div>

      <div className="figma-kpi-row">
        <div className="figma-kpi">
          <div className="figma-kpi-label">Остаток на счёте</div>
          <div className="figma-kpi-value">{formatMoney(dashboard.account_balance)}</div>
          <div className="figma-kpi-delta">
            {isRosters ? "−418 600 ₽ за 30 дней на оборудование" : "текущий баланс в Альфе"}
          </div>
        </div>
        <div className="figma-kpi">
          <div className="figma-kpi-label">Выручка в октябре</div>
          <div className="figma-kpi-value">
            {isRosters ? "2,10 млн ₽" : formatMoney(company.monthly_revenue_alfa)}
          </div>
          <div className={`figma-kpi-delta ${company.revenue_growth_pct >= 0 ? "green" : "red"}`}>
            {company.revenue_growth_pct >= 0 ? "+" : ""}
            {formatPercent(company.revenue_growth_pct, 0)} к октябрю прошлого года
          </div>
        </div>
        <div className="figma-kpi">
          <div className="figma-kpi-label">Свободный денежный поток</div>
          <div className="figma-kpi-value">{formatMoney(fcfDisplay)}</div>
          <div className="figma-kpi-delta">в среднем за 3 месяца</div>
        </div>
        <div className="figma-kpi">
          <div className="figma-kpi-label">Обязательства до 30 ноября</div>
          <div className="figma-kpi-value">{formatMoney(obligationsTotal)}</div>
          <div className="figma-kpi-delta">
            {obligations.length} платежей · ближайший {obligations[0]?.date ?? "—"}
          </div>
        </div>
      </div>

      <div className="figma-grid-2">
        <section className="figma-panel">
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <div>
              <div className="figma-panel-title">Выручка · 12 месяцев</div>
              <div className="figma-panel-heading">
                {isRosters
                  ? "24,85 млн ₽ · +12% к прошлому году"
                  : `${formatMoney(company.annual_revenue)} · ${company.revenue_growth_pct >= 0 ? "+" : ""}${formatPercent(company.revenue_growth_pct, 0)}`}
              </div>
            </div>
            <div style={{ display: "flex", gap: 16, alignItems: "center", fontSize: 13, color: "var(--text-secondary)" }}>
              <span style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
                <i style={{ width: 10, height: 10, borderRadius: 3, background: "var(--accent)", display: "inline-block" }} />
                2025–2026
              </span>
              <span style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
                <i style={{ width: 10, height: 10, borderRadius: 3, background: "#202024", display: "inline-block" }} />
                2024–2025
              </span>
            </div>
          </div>
          <RevenueBars />
          <p className="muted" style={{ marginTop: 14, fontSize: 13, lineHeight: 1.45 }}>
            Низкий сезон июль–август: студенты уезжают, трафик кофеен падает. Жёлтые столбцы — месяцы
            с выручкой ниже среднего.
          </p>
        </section>

        <section className="figma-panel figma-panel-sm">
          <div className="figma-panel-title">Календарь обязательств</div>
          <div className="figma-panel-heading">Ближайшие платежи</div>
          <div className="obligations-list">
            {obligations.map((row) => (
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
        </section>
      </div>

      <div className="figma-grid-2">
        <section className="figma-panel">
          <div className="figma-panel-title">Прогноз остатка · 60 дней</div>
          <div className="figma-panel-heading">
            {dashboard.cash_forecast.has_gap
              ? isRosters
                ? "Разрыв 26–30 ноября"
                : `Разрыв · мин. ${formatMoney(dashboard.cash_forecast.min_balance_rub)}`
              : "Кассового разрыва не ожидается"}
          </div>
          <div style={{ marginTop: 16 }}>
            <CashForecastChart forecast={dashboard.cash_forecast} />
          </div>
          <p className="muted" style={{ marginTop: 12, fontSize: 12 }}>
            Прогноз по выписке за 24 месяца и календарю обязательств. Не учитывает новые договоры.
          </p>
        </section>

        <section className="figma-panel figma-panel-sm">
          <div className="figma-panel-title">Что важно сейчас</div>

          <div className="radar-list" style={{ marginTop: 16 }}>
            {important.slice(0, 2).map((item) => (
              <div key={item.code} className="radar-item">
                <span className={`radar-dot ${item.severity}`} />
                <div>
                  <div className="radar-title">{item.title}</div>
                  <div className="radar-value">{item.value}</div>
                </div>
              </div>
            ))}
            {important.length === 0 && (
              <>
                <div className="radar-item">
                  <span className="radar-dot RISK" />
                  <div>
                    <div className="radar-title">Кассовый разрыв 26–30.11</div>
                    <div className="radar-value">
                      Налоги и аренда раньше выручки · до −35 000 ₽
                    </div>
                  </div>
                </div>
                <div className="radar-item">
                  <span className="radar-dot GOOD" />
                  <div>
                    <div className="radar-title">Выручка растёт +11%</div>
                    <div className="radar-value">Средний чек +6% · хороший фон для кредита</div>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="silence-row">
            <div>
              <strong>Режим тишины</strong>
              <p>Предложения банка скрыты. Аналитика и прогноз остаются на месте.</p>
            </div>
            <button
              type="button"
              className={`silence-switch ${offersMuted ? "on" : ""}`}
              role="switch"
              aria-checked={offersMuted}
              onClick={() => setOffersMuted(!offersMuted)}
            />
          </div>

          {!offersMuted && (
            <div className="figma-offer-card">
              <div className="figma-panel-title">Предложение банка</div>
              <strong style={{ marginTop: 8 }}>
                900 000 ₽ на 24 мес. — вернуть в оборот деньги за оборудование и закрыть разрыв
              </strong>
              <p>18,0% годовых, платёж ≈ 44 930 ₽ / мес.</p>
              <button type="button" className="btn btn-primary" onClick={startCredit}>
                Посмотреть предложение
              </button>
            </div>
          )}
        </section>
      </div>

      <section className="figma-panel" style={{ marginTop: 24 }}>
        <div className="ops-head">
          <div className="figma-panel-heading" style={{ marginTop: 0 }}>
            Последние операции
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => goToScreen("payments")}>
            Все операции →
          </button>
        </div>
        <OperationsTable rows={dashboard.transactions} />
      </section>
    </>
  );
}
