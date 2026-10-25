import {
  JULY_REVENUE_FORECAST,
  LIMIT_UP_AMOUNT,
  RESTRUCTURE_PAYMENT,
} from "../../domain-ui/caseScript";
import { useApp } from "../../state/AppState";
import { useDemoStore } from "../../state/demoStore";
import { formatMoney } from "../../utils/format";

export function BankPortfolio() {
  const { companies, companyId, application, goToScreen } = useApp();
  const phase = useDemoStore((state) => (companyId ? state.monitoring[companyId] ?? "none" : "none"));
  const setMonitoring = useDemoStore((state) => state.setMonitoring);
  const funded = application?.status === "FUNDED";
  const rosters = companies.find((company) => company.demo_key === "rosters");

  return (
    <>
      <div className="v2-row">
        <div>
          <h1 className="v2-h1">Портфель</h1>
          <p className="v2-lead">Кредиты и ранние сигналы</p>
        </div>
        <span className="v2-pill demo">демо-данные</span>
      </div>
      <section className="v2-kpis">
        <article className="v2-card"><div className="v2-kpi-value">24</div><div className="v2-kpi-sub">кредитов в портфеле · демо</div></article>
        <article className="v2-card"><div className="v2-kpi-value">3</div><div className="v2-kpi-sub">ранних сигнала · демо</div></article>
        <article className="v2-card"><div className="v2-kpi-value">1</div><div className="v2-kpi-sub">просрочка · демо</div></article>
        <article className="v2-card"><div className="v2-kpi-value">2</div><div className="v2-kpi-sub">готовы к росту лимита · демо</div></article>
      </section>
      <div className="v2-split">
        <section className="v2-card">
          <h2>Требуют действия</h2>
          {funded && rosters && companyId === rosters.id ? (
            <div className="v2-check">
              <span>
                <span className="v2-pill warn">Ранний сигнал</span> {rosters.name}<br />
                Июль: выручка {formatMoney(JULY_REVENUE_FORECAST)} · платёж съест запас кассы
              </span>
              <strong>{phase}</strong>
            </div>
          ) : (
            <p className="v2-muted">После выдачи Ростерс Кафе здесь появится ранний сигнал. Цифры 24 / 3 / 1 / 2 — демо-портфель, не эта заявка.</p>
          )}
          <div className="v2-check">
            <span><span className="v2-pill bad">Просрочка</span> ООО «ТехноСтрой» · демо</span>
            <span className="v2-muted">написать в кабинет</span>
          </div>
          <div className="v2-check">
            <span><span className="v2-pill good">Рост лимита</span> ИП Ковалев · демо</span>
            <span className="v2-muted">8 из 12 платежей</span>
          </div>
        </section>
        <section className="v2-card">
          <h2>Ростерс Кафе: как не допустить просрочку</h2>
          <div className="v2-bars" style={{ margin: "12px 0" }}>
            {[70, 80, 90, 85, 60, 45, 40].map((height, index) => (
              <i key={index} className={index > 4 ? "hot" : ""} style={{ height: `${height}%` }} />
            ))}
          </div>
          <p className="v2-muted">Обычное лето — прогноз с учётом ремонта тротуара на Покровке.</p>
          <label className="v2-radio on">
            <input type="radio" readOnly checked />
            <span>
              <strong>Платёж 3% от выручки · июль–август</strong>
              <div className="v2-muted">≈ {formatMoney(RESTRUCTURE_PAYMENT)} вместо графика · недоплата размажется на сентябрь–декабрь</div>
            </span>
          </label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              type="button"
              className="v2-btn"
              disabled={!funded || !companyId || phase !== "none"}
              onClick={() => companyId && setMonitoring(companyId, "early")}
            >
              Зафиксировать ранний сигнал
            </button>
            <button
              type="button"
              className="v2-btn primary"
              disabled={!funded || !companyId || phase === "none"}
              onClick={() => companyId && setMonitoring(companyId, phase === "early" ? "restructure" : "limit")}
            >
              {phase === "limit" ? "Лимит уже предложен" : phase === "restructure" ? `Предложить лимит ${formatMoney(LIMIT_UP_AMOUNT)}` : "Предложить платёж от выручки"}
            </button>
          </div>
          <p className="v2-note">
            Ранний сигнал клиент ещё не видит. Карточка на главной появляется после «предложить». Лимит {formatMoney(LIMIT_UP_AMOUNT)} — отдельное предложение, не новая выдача без клиента.
          </p>
          <button type="button" className="v2-link" onClick={() => goToScreen("home")}>Открыть глазами клиента</button>
        </section>
      </div>
    </>
  );
}
