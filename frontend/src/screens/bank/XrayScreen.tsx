import { COLLATERAL_LABELS } from "../../api/client";
import { BankDealEconomics } from "../../components/BankDealEconomics";
import { EventLog } from "../../components/EventLog";
import { GeoPanel } from "../../components/GeoPanel";
import { BankEmptyState, XrayRecalcPanel, XraySkeleton } from "../../components/Skeleton";
import { UnderwriterActions } from "../../components/UnderwriterActions";
import { RiskScoreGauge } from "../../components/RiskScoreGauge";
import { XrayBaseDecomposition } from "../../components/XrayBaseDecomposition";
import { useApp } from "../../state/AppState";
import { formatMoney, formatPercent } from "../../utils/format";

const MONTHS = ["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];
/** Свободный поток, тыс. ₽ — сезонность из макета Б3. */
const CASH_FLOW_K = [210, 195, 220, 230, 240, 200, 145, 140, 185, 210, 225, 240];

function decisionTone(status: string): "good" | "warn" | "risk" {
  if (status === "APPROVED" || status === "FUNDED") {
    return "good";
  }
  if (status === "REJECTED") {
    return "risk";
  }
  return "warn";
}

function decisionTitle(status: string): string {
  if (status === "APPROVED" || status === "FUNDED") {
    return "Одобрить / выдать";
  }
  if (status === "REJECTED") {
    return "Отказ";
  }
  if (status === "NEED_MORE_INFO") {
    return "Дождаться или принять документы";
  }
  if (status === "COUNTER_OFFER") {
    return "Встречное предложение";
  }
  return "Принять решение";
}

/** Б3 — Рентген: решение сверху, аналитика свёрнута ниже. */
export function XrayScreen() {
  const { application, xray, dashboard, goToScreen, isBusy } = useApp();

  if (isBusy && !application) {
    return <XraySkeleton />;
  }

  if (!application) {
    return (
      <BankEmptyState
        title="Нет заявки для разбора"
        text="Откройте заявку из очереди — система создаст кейс и соберёт проверки."
        action={
          <button type="button" className="btn btn-primary" onClick={() => goToScreen("bank-queue")}>
            К очереди
          </button>
        }
      />
    );
  }

  const waitingXray = isBusy && !xray;
  const ageMonths = dashboard?.company.age_months ?? 40;
  const score = application.risk_score;
  const requestedPayment =
    application.requested_amount_rub > 0
      ? Math.round((application.requested_amount_rub / Math.max(application.term_months, 1)) * 1.05)
      : 229_200;
  const counter = application.counter_offers[0];
  const maxBar = Math.max(...CASH_FLOW_K, requestedPayment / 1000);
  const tone = decisionTone(application.status);
  const limitLabel = formatMoney(application.max_payment_rub || application.approved_amount_rub || 0);

  return (
    <>
      <div className="bank-page-head">
        <div>
          <h1 className="figma-h1">Разбор заявки</h1>
          <p className="figma-lead">Балл, экономика и журнал</p>
        </div>
      </div>

      {application.collateral_type !== "NONE" && (
        <div className="alert alert-info" style={{ marginBottom: 16 }}>
          Обеспечение: {COLLATERAL_LABELS[application.collateral_type]} ·{" "}
          {formatMoney(application.collateral_value_rub)} · {application.collateral_status}
        </div>
      )}

      <section className={`bank-decision-card is-${tone}`} id="bank-decision">
        <div className="bank-decision-kicker">Что сделать</div>
        <h2 className="bank-decision-title">{decisionTitle(application.status)}</h2>
        <p className="bank-decision-text">
          {counter
            ? `Система предлагает ${formatMoney(counter.amount_rub)} · ${counter.term_months} мес. · ${formatPercent(counter.rate_pct)} · ≈ ${formatMoney(counter.monthly_payment_rub)} / мес. Платёж укладывается в низкий сезон.`
            : `Текущая стадия: ${application.status_label}. Риск ${score || "стоп"} · лимит платежа ${limitLabel}.`}
        </p>
        <div className="bank-decision-metrics">
          <div>
            <span>Риск</span>
            <strong className={score === 0 || score < 520 ? "red" : score >= 750 ? "green" : undefined}>
              {score || "стоп"}
            </strong>
          </div>
          <div>
            <span>Лимит платежа</span>
            <strong>{limitLabel}</strong>
          </div>
          <div>
            <span>Ставка</span>
            <strong>{formatPercent(application.final_rate_pct)}</strong>
          </div>
          <div>
            <span>Выручка / мес.</span>
            <strong>{formatMoney(application.monthly_revenue_alfa)}</strong>
          </div>
        </div>
        <div className="supplier-checks" style={{ marginBottom: 14 }}>
          <div>
            <span>ЕГРЮЛ</span>
            <strong>
              Действует, {Math.floor(ageMonths / 12)} г. {ageMonths % 12} мес.
            </strong>
          </div>
          <div>
            <span>БКИ</span>
            <strong>Просрочек нет</strong>
          </div>
          <div>
            <span>ФССП</span>
            <strong>Производств нет</strong>
          </div>
          <div>
            <span>Гео</span>
            <strong>{xray ? `${xray.geo.competitors_count} точек в 300 м` : "—"}</strong>
          </div>
        </div>
        <UnderwriterActions />
      </section>

      <BankDealEconomics xray={xray} productLabel={application.product_label} />

      {waitingXray ? <XrayRecalcPanel /> : null}

      <div className="xray-top">
        <section className="figma-panel figma-panel-sm" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div className="figma-panel-title" style={{ width: "100%", textAlign: "left" }}>
            RiskScore
          </div>
          <div style={{ marginTop: 8, marginBottom: 8 }}>
            <RiskScoreGauge score={score} size="md" showCorridors={true} />
          </div>
        </section>

        <section className="figma-panel figma-panel-sm">
          <div className="figma-panel-title">Ключевые цифры</div>
          <div className="kv-list" style={{ marginTop: 8 }}>
            <div className="meta-row">
              <span>Гео-оценка</span>
              <strong>{xray ? `${xray.geo.geo_score} · конкуренты ${xray.geo.competitors_count}` : "—"}</strong>
            </div>
            <div className="meta-row">
              <span>Выручка / мес.</span>
              <strong>{formatMoney(application.monthly_revenue_alfa)}</strong>
            </div>
            <div className="meta-row">
              <span>Лимит платежа</span>
              <strong>{formatMoney(application.max_payment_rub)}</strong>
            </div>
            <div className="meta-row">
              <span>Ставка</span>
              <strong>{formatPercent(application.final_rate_pct)}</strong>
            </div>
          </div>
        </section>
      </div>

      <details className="bank-collapse">
        <summary>
          <span>
            Гео и конкуренты
            <span className="muted"> · карта района</span>
          </span>
        </summary>
        <div className="bank-collapse-body" style={{ paddingTop: 12 }}>
          {xray ? <GeoPanel xray={xray} /> : <div className="muted">Гео загружается…</div>}
        </div>
      </details>

      <details className="bank-collapse">
        <summary>
          <span>
            Сезонность потока
            <span className="muted"> · июль–август −31%</span>
          </span>
        </summary>
        <div className="bank-collapse-body">
          <div className="figma-panel-heading" style={{ marginTop: 12 }}>
            В июле–августе платёж {formatMoney(requestedPayment)} больше потока
          </div>
          <div className="xray-season">
            {MONTHS.map((month, index) => {
              const value = CASH_FLOW_K[index] ?? 0;
              const isLow = index === 6 || index === 7;
              return (
                <div key={month} className={`xray-season-col ${isLow ? "low" : ""}`}>
                  <div className="xray-season-bars">
                    <i style={{ height: `${(value / maxBar) * 100}%` }} title={`Поток ${value} тыс.`} />
                    <b style={{ height: `${(requestedPayment / 1000 / maxBar) * 100}%` }} title="Запрошенный платёж" />
                  </div>
                  <span>{month}</span>
                </div>
              );
            })}
          </div>
          <div className="xray-season-legend">
            <span>
              <i className="flow" /> Свободный поток, тыс. ₽
            </span>
            <span>
              <i className="req" /> Запрошено · {formatMoney(requestedPayment)}
            </span>
            {counter ? (
              <span>
                <i className="counter" /> Встречное · {formatMoney(counter.monthly_payment_rub)}
              </span>
            ) : null}
          </div>
        </div>
      </details>

      <details className="bank-collapse">
        <summary>
          <span>
            Декомпозиция базы 500
            <span className="muted"> · аналитика модели, не блокирует решение</span>
          </span>
        </summary>
        <div className="bank-collapse-body" style={{ paddingTop: 12 }}>
          <XrayBaseDecomposition
            application={application}
            company={dashboard?.company ?? null}
            xray={xray}
          />
        </div>
      </details>

      {xray && (
        <details className="bank-collapse">
          <summary>
            <span>
              Журнал действий
              <span className="muted"> · аудит</span>
            </span>
          </summary>
          <div className="bank-collapse-body" style={{ marginTop: 12 }}>
            <EventLog events={xray.events} />
          </div>
        </details>
      )}
    </>
  );
}
