import { useState } from "react";
import {
  FunnelChart,
  KpiButton,
  ProductBars,
  RiskBar,
  attentionRows,
  countDelta,
  pctDelta,
  type AttentionRow,
} from "../../components/bank/AnalyticsBlocks";
import {
  ANALYTICS_BOOK,
  ANALYTICS_PERIODS,
  type AnalyticsPeriod,
  applyIssued,
  biggestDropIndex,
  dropHint,
} from "../../domain-ui/bankAnalytics";
import { ROSTERS_OFFER_AMOUNT, ROSTERS_REQUEST_AMOUNT } from "../../domain-ui/caseScript";
import { useApp } from "../../state/AppState";
import { formatMoney } from "../../utils/format";
import { PortfolioSearchIntentCard } from "../../components/bank/PortfolioSearchIntentCard";
import "../../styles/bank-portfolio.css";

export function BankPortfolioScreen() {
  const { companies, companyId, application, goToScreen, selectCompany } = useApp();
  const [period, setPeriod] = useState<AnalyticsPeriod>(30);

  const rosters = companies.find((company) => company.demo_key === "rosters");
  const live = rosters && companyId === rosters.id ? application : null;
  const issuedExtra = live?.status === "FUNDED" ? (live.approved_amount_rub || ROSTERS_OFFER_AMOUNT) : 0;
  const book = applyIssued(ANALYTICS_BOOK[period], issuedExtra);
  const dropAt = biggestDropIndex(book.funnel);
  const rostersLine = live?.status === "COUNTER_OFFER"
    ? `Ростерс Кафе просит ${formatMoney(ROSTERS_REQUEST_AMOUNT)} при предложении ${formatMoney(ROSTERS_OFFER_AMOUNT)}.`
    : null;

  function openQueue() {
    goToScreen("bank-queue");
  }

  function openClients() {
    goToScreen("bank-clients");
  }

  return (
    <div className="v2-analytics">
      {/* Шапка экрана Портфель */}
      <header className="v2-analytics-head">
        <div>
          <h1 className="v2-h1">Портфель</h1>
          <p className="v2-lead">Октябрь 2026 · {companies.length} клиентов</p>
        </div>
        <div className="v2-period" role="group" aria-label="Период">
          {ANALYTICS_PERIODS.map((days) => (
            <button
              key={days}
              type="button"
              className={period === days ? "on" : ""}
              aria-pressed={period === days}
              onClick={() => setPeriod(days)}
            >
              {days} дней
            </button>
          ))}
        </div>
      </header>

      {/* 4 ключевые KPI карточки */}
      <section className="v2-kpis">
        <KpiButton
          value={formatMoney(book.issuedRub)}
          caption="Выдано"
          delta={pctDelta(book.issuedDeltaPct, "up")}
          demo
          onClick={openClients}
        />
        <KpiButton
          value={String(book.inWork)}
          caption="Заявок в работе"
          delta={countDelta(book.inWorkDelta, "work")}
          demo
          onClick={openQueue}
        />
        <KpiButton
          value={`${book.decisionMin} мин`}
          caption="Среднее время решения"
          delta={pctDelta(book.decisionDeltaPct, "down")}
          demo
          onClick={openQueue}
        />
        <KpiButton
          value={String(book.atRisk)}
          caption="Клиенты в зоне риска"
          delta={countDelta(book.atRiskDelta, "risk")}
          riskValue={book.atRisk > 0}
          demo
          onClick={openClients}
        />
      </section>

      {/* Воронка и Требует внимания */}
      <div className="v2-analytics-main">
        <section className="v2-card">
          <div className="v2-card-head">
            <h2>Воронка</h2>
            <span className="v2-pill demo">демо</span>
          </div>
          <FunnelChart book={book} hint={dropHint(dropAt, rostersLine)} dropAt={dropAt} />
        </section>

        <AttentionCard
          rows={attentionRows(companies, live?.status)}
          onOpen={(id, screen) => void selectCompany(id, { nextScreen: screen })}
        />
      </div>

      {/* Продукты и Риск портфеля */}
      <div className="v2-analytics-charts">
        <section className="v2-card">
          <div className="v2-card-head">
            <h2>Продукты</h2>
            <span className="v2-pill demo">демо</span>
          </div>
          <ProductBars book={book} liveNote={issuedExtra > 0 ? issuedExtra : null} />
        </section>

        <section className="v2-card">
          <div className="v2-card-head">
            <h2>Риск портфеля</h2>
            <span className="v2-pill demo">демо</span>
          </div>
          <RiskBar risk={book.risk} />
        </section>
      </div>

      {/* Поисковые интенты клиентов портфеля */}
      <PortfolioSearchIntentCard />

      {/* Секция: Эффект для банка */}
      <section className="v2-effect-section">
        <div className="v2-card-head">
          <h2>Эффект для банка</h2>
          <span className="v2-pill demo">демо</span>
        </div>

        <section className="v2-kpis v2-kpis-quad">
          <article className="v2-card v2-effect-kpi">
            <div className="v2-kpi-value">38 с</div>
            <div className="v2-kpi-sub">все проверки в прогоне Ростерс · демо</div>
          </article>
          <article className="v2-card v2-effect-kpi">
            <div className="v2-kpi-value">8 мин</div>
            <div className="v2-kpi-sub">от заявки до решения · демо</div>
          </article>
          <article className="v2-card v2-effect-kpi">
            <div className="v2-kpi-value">23 мин</div>
            <div className="v2-kpi-sub">от заявки до денег · демо</div>
          </article>
          <article className="v2-card v2-effect-kpi">
            <div className="v2-kpi-value">2 поля</div>
            <div className="v2-kpi-sub">ввести вручную: сумма и срок</div>
          </article>
        </section>

        <div className="v2-grid-3">
          <section className="v2-card">
            <h2>Для предпринимателя</h2>
            <p className="v2-muted">
              Банк приходит сам — до кассового разрыва, а не после. Видно, почему такая сумма.
              Бухгалтер готовит, гендиректор подписывает. После выдачи банк предупреждает о трудном месяце заранее.
            </p>
          </section>

          <section className="v2-card">
            <h2>Для банка</h2>
            <p className="v2-muted">
              Все задачи в одной очереди по SLA. Решение на одном экране. Встречное вместо отказа —
              клиент остаётся с банком. Ранние сигналы до просрочки.
            </p>
          </section>

          <section className="v2-card">
            <div className="v2-row-head">
              <h2>Что измерим в пилоте</h2>
              <span className="v2-pill demo">прогноз</span>
            </div>
            <ul className="v2-bullet-list">
              <li>Конверсия: предложение → заявка → выдача</li>
              <li>Доля решений в зелёном коридоре без инспектора</li>
              <li>Время от заявки до денег, медиана</li>
              <li>Доля встречных, принятых клиентом</li>
              <li>Просрочки 30+ по кредитам из кабинета против обычных</li>
              <li>Доля реструктуризаций до первой просрочки</li>
            </ul>
          </section>
        </div>
      </section>
    </div>
  );
}

function AttentionCard({
  rows,
  onOpen,
}: {
  rows: AttentionRow[];
  onOpen: (id: string, screen: AttentionRow["screen"]) => void;
}) {
  return (
    <section className="v2-card">
      <div className="v2-card-head">
        <h2>Требует внимания</h2>
      </div>
      <ul className="v2-attention">
        {rows.map((row) => (
          <li key={row.id}>
            <div className="v2-attention-copy">
              <strong>{row.name}</strong>
              <p>{row.reason}</p>
            </div>
            <div className="v2-attention-actions">
              <button
                type="button"
                className="v2-btn-dense"
                onClick={() => onOpen(row.id, row.screen)}
              >
                Открыть
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
