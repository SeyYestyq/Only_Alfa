import { COLLATERAL_LABELS } from "../../api/client";
import { EventLog } from "../../components/EventLog";
import { GeoPanel } from "../../components/GeoPanel";
import { BankEmptyState, Bone, XrayRecalcPanel, XraySkeleton } from "../../components/Skeleton";
import { UnderwriterActions } from "../../components/UnderwriterActions";
import { WaterfallChart } from "../../components/WaterfallChart";
import { useApp } from "../../state/AppState";
import { formatMoney, formatPercent } from "../../utils/format";

const MONTHS = ["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];
/** Свободный поток, тыс. ₽ — сезонность из макета Б3. */
const CASH_FLOW_K = [210, 195, 220, 230, 240, 200, 145, 140, 185, 210, 225, 240];

/** Б3 — Рентген заявки (index copy 6.html). */
export function XrayScreen() {
  const { application, xray, cbrRate, dashboard, goToScreen, isBusy } = useApp();

  if (isBusy && !application) {
    return <XraySkeleton />;
  }

  if (!application) {
    return (
      <BankEmptyState
        title="Нет заявки для рентгена"
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
  const scorePct = Math.min(100, Math.round((score / 1000) * 100));
  const requestedPayment = application.requested_amount_rub > 0
    ? Math.round(application.requested_amount_rub / Math.max(application.term_months, 1) * 1.05)
    : 235_000;
  const counter = application.counter_offers[0];
  const maxBar = Math.max(...CASH_FLOW_K, requestedPayment / 1000);

  return (
    <>
      <div className="figma-eyebrow">
        Заявка № {application.application_id.slice(-8).toUpperCase()} · {application.company.name} · ИНН{" "}
        {application.company.inn}
      </div>
      <h1 className="figma-h1" style={{ fontSize: 32, lineHeight: "40px" }}>
        Рентген заявки
      </h1>
      <p className="figma-lead">
        Клиент просит {formatMoney(application.requested_amount_rub)} на {application.term_months} месяцев
        {application.company.demo_key === "rosters"
          ? " на ростер Giesen W15A. Счёт № 418 от 20.10.2026."
          : ` · ${application.product_label} · ${application.status_label}.`}
        {cbrRate !== null ? ` КС ${formatPercent(cbrRate, 1)}.` : ""}
      </p>

      {application.collateral_type !== "NONE" && (
        <div className="alert alert-info" style={{ marginBottom: 16 }}>
          Обеспечение: {COLLATERAL_LABELS[application.collateral_type]} ·{" "}
          {formatMoney(application.collateral_value_rub)} · {application.collateral_status}
        </div>
      )}

      <div className="xray-top">
        <section className="figma-panel figma-panel-sm">
          <div className="figma-panel-title">RiskScore · из 1000</div>
          <div className="score-hero">
            <strong>{score}</strong>
            <span className="muted">700 — порог одобрения</span>
          </div>
          <div className="score-meter">
            <i style={{ width: `${scorePct}%` }} />
          </div>
          {xray ? (
            <div style={{ marginTop: 16 }}>
              <WaterfallChart
                factors={xray.waterfall.factors}
                finalScore={xray.waterfall.final_score}
                rawScore={xray.waterfall.raw_score}
              />
            </div>
          ) : (
            <div className="sk-stack" style={{ marginTop: 16 }} aria-label="Загрузка Waterfall">
              <Bone height={160} radius={12} />
              <Bone width="70%" height={12} />
              <Bone width="55%" height={12} />
            </div>
          )}
        </section>

        <section className="figma-panel figma-panel-sm">
          <div className="figma-panel-title">Внешние проверки · ответ за 1,4 с</div>
          <div className="supplier-checks" style={{ marginTop: 12 }}>
            <div>
              <span>ЕГРЮЛ</span>
              <strong>
                Действующее, {Math.floor(ageMonths / 12)} г. {ageMonths % 12} мес.
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
              <span>Geo</span>
              <strong>
                {xray ? `${xray.geo.competitors_count} точек в 300 м` : "—"}
              </strong>
            </div>
          </div>
          <div className="figma-offer-card" style={{ marginTop: 16 }}>
            <div className="figma-panel-title">Рекомендация системы</div>
            <strong style={{ marginTop: 6 }}>
              {application.status === "APPROVED"
                ? "Одобрить"
                : application.status === "REJECTED"
                  ? "Отказ"
                  : "Встречное предложение"}
            </strong>
            <p>
              {counter
                ? `${formatMoney(counter.amount_rub)} · ${counter.term_months} мес. · ${formatPercent(counter.rate_pct)} · ≈ ${formatMoney(counter.monthly_payment_rub)} / мес. Платёж укладывается даже в низкий сезон.`
                : `${formatMoney(application.approved_amount_rub || application.requested_amount_rub)} · RiskScore ${score}`}
            </p>
            <p className="muted" style={{ fontSize: 12 }}>
              Решение фиксируется в журнале. Если коллега уже принял решение, API вернёт 409.
            </p>
          </div>
        </section>
      </div>

      {waitingXray ? <XrayRecalcPanel /> : null}

      <section className="figma-panel figma-panel-sm" style={{ marginTop: 16 }}>
        <div className="figma-panel-title">Свободный поток по месяцам vs платёж</div>
        <div className="figma-panel-heading">
          В июле–августе платёж {formatMoney(requestedPayment)} больше потока · низкий сезон −31%
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
      </section>

      <div style={{ marginTop: 16 }}>
        <UnderwriterActions />
      </div>

      <div className="figma-grid-2" style={{ marginTop: 16 }}>
        <section className="figma-panel figma-panel-sm">
          <div className="figma-panel-title">Ключевые факторы</div>
          <div className="kv-list" style={{ marginTop: 8 }}>
            <div className="meta-row">
              <span>GeoScore</span>
              <strong>{xray ? `${xray.geo.geo_score} · конкуренты ${xray.geo.competitors_count}` : "—"}</strong>
            </div>
            <div className="meta-row">
              <span>Выручка / мес.</span>
              <strong>{formatMoney(application.monthly_revenue_alfa)}</strong>
            </div>
            <div className="meta-row">
              <span>Безопасный платёж</span>
              <strong>{formatMoney(application.max_payment_rub)}</strong>
            </div>
            <div className="meta-row">
              <span>Ставка</span>
              <strong>{formatPercent(application.final_rate_pct)}</strong>
            </div>
          </div>
        </section>
        <section className="figma-panel figma-panel-sm">
          {xray ? <GeoPanel xray={xray} /> : <div className="muted">Гео загружается…</div>}
        </section>
      </div>

      {xray && (
        <section className="figma-panel figma-panel-sm" style={{ marginTop: 16 }}>
          <div className="figma-panel-title">Журнал действий</div>
          <div style={{ marginTop: 12 }}>
            <EventLog events={xray.events} />
          </div>
        </section>
      )}
    </>
  );
}
