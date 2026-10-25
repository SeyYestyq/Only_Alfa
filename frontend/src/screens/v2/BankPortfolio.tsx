import { useState } from "react";
import { BankEffectSection } from "./BankEffect";
import {
  FunnelChart,
  KpiButton,
  ProductBars,
  RiskBar,
  attentionRows,
  countDelta,
  pctDelta,
} from "../../components/v2/AnalyticsBlocks";
import { EmptyState, SkeletonLines } from "../../components/v2/ScreenState";
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
import { useDemoStore, type MonitoringPhase } from "../../state/demoStore";
import { useUiStore } from "../../state/uiStore";
import { formatMoney } from "../../utils/format";

export function BankPortfolio() {
  const { companies, companyId, application, goToScreen, selectCompany } = useApp();
  const monitoring = useDemoStore((state) => state.monitoring);
  const setMonitoring = useDemoStore((state) => state.setMonitoring);
  const setQueuePreset = useUiStore((state) => state.setQueuePreset);
  const setClientFocus = useUiStore((state) => state.setClientFocus);
  const [period, setPeriod] = useState<AnalyticsPeriod>(30);

  const rosters = companies.find((company) => company.demo_key === "rosters");
  const live = rosters && companyId === rosters.id ? application : null;
  const phase: MonitoringPhase = rosters ? monitoring[rosters.id] ?? "none" : "none";
  const canAct = live?.status === "FUNDED" || phase !== "none";
  const issuedExtra = live?.status === "FUNDED" ? (live.approved_amount_rub || ROSTERS_OFFER_AMOUNT) : 0;
  const book = applyIssued(ANALYTICS_BOOK[period], issuedExtra);
  const dropAt = biggestDropIndex(book.funnel);
  const rostersLine = live?.status === "COUNTER_OFFER"
    ? `Ростерс Кафе просит ${formatMoney(ROSTERS_REQUEST_AMOUNT)} при предложении ${formatMoney(ROSTERS_OFFER_AMOUNT)}.`
    : null;

  function openQueue() {
    setQueuePreset("app");
    goToScreen("bank-queue");
  }

  return (
    <div className="v2-analytics">
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

      {companies.length === 0 ? (
        <section className="v2-kpis" aria-busy="true">
          {Array.from({ length: 4 }, (_, index) => (
            <article key={index} className="v2-card"><SkeletonLines lines={3} /></article>
          ))}
        </section>
      ) : (
        <section className="v2-kpis">
          <KpiButton value={formatMoney(book.issuedRub)} caption="Выдано" delta={pctDelta(book.issuedDeltaPct, "up")} demo onClick={() => { setClientFocus("issued"); goToScreen("bank-customers"); }} />
          <KpiButton value={String(book.inWork)} caption="Заявок в работе" delta={countDelta(book.inWorkDelta, "work")} demo onClick={openQueue} />
          <KpiButton value={`${book.decisionMin} мин`} caption="Среднее время решения" delta={pctDelta(book.decisionDeltaPct, "down")} demo onClick={openQueue} />
          <KpiButton value={String(book.atRisk)} caption="Клиенты в зоне риска" delta={countDelta(book.atRiskDelta, "risk")} riskValue={book.atRisk > 0} demo onClick={() => { setClientFocus("risk"); goToScreen("bank-customers"); }} />
        </section>
      )}

      <div className="v2-analytics-main">
        <section className="v2-card">
          <div className="v2-card-head">
            <h2>Воронка</h2>
            <span className="v2-pill demo">демо</span>
          </div>
          {companies.length === 0 ? <SkeletonLines lines={4} /> : (
            <FunnelChart book={book} hint={dropHint(dropAt, rostersLine)} dropAt={dropAt} />
          )}
        </section>
        <AttentionCard
          rows={attentionRows(companies, live?.status, phase, canAct)}
          loading={companies.length === 0}
          onOpen={(id, screen) => void selectCompany(id, { nextScreen: screen })}
          onAct={(id, next) => setMonitoring(id, next)}
          onQueue={openQueue}
        />
      </div>

      <div className="v2-analytics-charts">
        <section className="v2-card">
          <div className="v2-card-head">
            <h2>Продукты</h2>
            <span className="v2-pill demo">демо</span>
          </div>
          {companies.length === 0 ? <SkeletonLines lines={5} /> : (
            <ProductBars book={book} liveNote={issuedExtra > 0 ? issuedExtra : null} />
          )}
        </section>
        <section className="v2-card">
          <div className="v2-card-head">
            <h2>Риск портфеля</h2>
            <span className="v2-pill demo">демо</span>
          </div>
          {companies.length === 0 ? <SkeletonLines lines={3} /> : <RiskBar risk={book.risk} />}
        </section>
      </div>
      <BankEffectSection />
    </div>
  );
}

function AttentionCard({
  rows,
  loading,
  onOpen,
  onAct,
  onQueue,
}: {
  rows: ReturnType<typeof attentionRows>;
  loading: boolean;
  onOpen: (id: string, screen: ReturnType<typeof attentionRows>[number]["screen"]) => void;
  onAct: (id: string, phase: MonitoringPhase) => void;
  onQueue: () => void;
}) {
  return (
    <section className="v2-card">
      <div className="v2-card-head">
        <h2>Требует внимания</h2>
      </div>
      {loading ? <SkeletonLines lines={4} /> : rows.length === 0 ? (
        <EmptyState
          title="Сейчас некого разбирать"
          text="В портфеле нет клиентов с сигналом, SLA или встречным предложением."
          action="К очереди"
          onAction={onQueue}
        />
      ) : (
        <ul className="v2-attention">
          {rows.map((row) => (
            <li key={row.id}>
              <div className="v2-attention-copy">
                <strong>{row.name}</strong>
                <p>{row.reason}</p>
              </div>
              <div className="v2-attention-actions">
                {row.primary && row.nextPhase ? (
                  <button type="button" className="v2-btn dense primary" onClick={() => onAct(row.id, row.nextPhase as MonitoringPhase)}>
                    {row.primary}
                  </button>
                ) : null}
                <button type="button" className="v2-btn dense" onClick={() => onOpen(row.id, row.screen)}>Открыть</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
