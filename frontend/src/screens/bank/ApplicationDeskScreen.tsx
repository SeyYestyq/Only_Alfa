import { useEffect, useState } from "react";
import { COLLATERAL_LABELS } from "../../api/client";
import { BankCapexSignalPanel } from "../../components/BankCapexSignalPanel";
import { BankDealEconomics } from "../../components/BankDealEconomics";
import { EventLog } from "../../components/EventLog";
import { GeoPanel } from "../../components/GeoPanel";
import { BankEmptyState, XrayRecalcPanel, XraySkeleton } from "../../components/Skeleton";
import { UnderwriterActions } from "../../components/UnderwriterActions";
import { RiskScoreGauge } from "../../components/RiskScoreGauge";
import { XrayBaseDecomposition } from "../../components/XrayBaseDecomposition";
import { useApp } from "../../state/AppState";
import { formatMoney, formatPercent } from "../../utils/format";

type DeskSection = "decision" | "evidence" | "analytics" | "audit";

const SECTIONS: Array<{ id: DeskSection; label: string }> = [
  { id: "decision", label: "1. Решение" },
  { id: "evidence", label: "2. Доказательства" },
  { id: "analytics", label: "3. Аналитика" },
  { id: "audit", label: "4. Журнал" },
];

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
    return "Контроль выдачи";
  }
  if (status === "REJECTED") {
    return "Отказ зафиксирован";
  }
  if (status === "NEED_MORE_INFO") {
    return "Ждём или принимаем документы";
  }
  if (status === "COUNTER_OFFER") {
    return "Встречные условия";
  }
  return "Решение по заявке";
}

function scrollToSection(id: DeskSection) {
  document.getElementById(`desk-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

/**
 * Единый стол заявки для инспектора (BRD Экран 3).
 * Вертикальный путь: решение → доказательства → аналитика → аудит.
 */
export function ApplicationDeskScreen() {
  const { application, xray, cbrRate, dashboard, goToScreen, isBusy } = useApp();
  const [activeSection, setActiveSection] = useState<DeskSection>("decision");

  if (isBusy && !application) {
    return <XraySkeleton />;
  }

  if (!application) {
    return (
      <BankEmptyState
        title="Нет открытой заявки"
        text="Стол инспектора работает от заявки: выберите строку в очереди — здесь появятся аналитика и кнопки решения."
        action={
          <button type="button" className="btn btn-primary" onClick={() => goToScreen("bank-queue")}>
            К очереди заявок
          </button>
        }
      />
    );
  }

  const waitingXray = isBusy && !xray;
  const ageMonths = dashboard?.company.age_months ?? 40;
  const score = application.risk_score;
  const counter = application.counter_offers[0];
  const tone = decisionTone(application.status);
  const limitLabel = formatMoney(application.max_payment_rub || application.approved_amount_rub || 0);
  const companyName = application.company.name;
  const isRosters = dashboard?.company.demo_key === "rosters";

  return (
    <div className="app-desk">
      <header className="app-desk-bar">
        <div className="app-desk-bar-main">
          <div className="figma-eyebrow">Заявка · стол инспектора · клиент видит меньше деталей</div>
          <h1 className="app-desk-title">
            {companyName}
            <span className="muted">
              {" "}
              · № {application.application_id.slice(-8).toUpperCase()}
            </span>
          </h1>
          <div className="bank-case-facts">
            <span>
              Сумма <b>{formatMoney(application.requested_amount_rub)}</b>
            </span>
            <span>
              Срок <b>{application.term_months} мес.</b>
            </span>
            <span className={`status-tag is-${tone}`}>{application.status_label}</span>
            <span
              className={`status-tag ${
                score === 0 || score < 520 ? "is-risk" : score >= 750 ? "is-good" : "is-warn"
              }`}
            >
              Риск {score || "стоп"}
            </span>
            {cbrRate !== null ? <span className="muted">КС {formatPercent(cbrRate, 1)}</span> : null}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => goToScreen("bank-clients")}>
            ← К клиенту
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => goToScreen("bank-queue")}>
            ← Заявки
          </button>
        </div>
      </header>

      <nav className="app-desk-sections" aria-label="Шаги разбора">
        {SECTIONS.map((section) => (
          <button
            key={section.id}
            type="button"
            className={`app-desk-section ${activeSection === section.id ? "active" : ""}`}
            onClick={() => {
              setActiveSection(section.id);
              scrollToSection(section.id);
            }}
          >
            {section.label}
          </button>
        ))}
      </nav>

      {application.collateral_type !== "NONE" && (
        <div className="alert alert-info" style={{ marginBottom: 16 }}>
          Обеспечение: {COLLATERAL_LABELS[application.collateral_type]} ·{" "}
          {formatMoney(application.collateral_value_rub)} · {application.collateral_status}
        </div>
      )}

      <section className={`bank-decision-card is-${tone}`} id="desk-decision">
        <div className="bank-decision-kicker">Шаг 1 · решение</div>
        <h2 className="bank-decision-title" id="bank-decision">
          {decisionTitle(application.status)}
        </h2>
        <p className="bank-decision-text">
          {counter
            ? `Система предлагает ${formatMoney(counter.amount_rub)} · ${counter.term_months} мес. · ${formatPercent(counter.rate_pct)} · ≈ ${formatMoney(counter.monthly_payment_rub)} / мес.`
            : `Стадия «${application.status_label}». Лимит платежа ${limitLabel} · ставка ${formatPercent(application.final_rate_pct)}.`}
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

      <section className="app-desk-block" id="desk-evidence">
        <div className="figma-panel-title" style={{ marginBottom: 8 }}>
          Шаг 2 · доказательства (сигнал в платежах)
        </div>
        <p className="muted" style={{ margin: "0 0 16px", fontSize: 13 }}>
          Клиент этого разреза не видит — только итоговое предложение. Макет Figma: платежи и рекомендация
          системы.
        </p>
        {isRosters ? (
          <BankCapexSignalPanel
            showStatuses
            onSendOffer={() => goToScreen("bank-messages")}
          />
        ) : (
          <div className="figma-panel figma-panel-sm">
            <p className="muted" style={{ margin: 0 }}>
              По этой заявке отдельного CAPEX-сигнала нет — смотрите аналитику и решение выше.
            </p>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              style={{ marginTop: 12 }}
              onClick={() => goToScreen("bank-signal")}
            >
              Открыть демо-сигнал Ростерс
            </button>
          </div>
        )}
      </section>

      <section className="app-desk-block" id="desk-analytics">
        <div className="figma-panel-title" style={{ marginBottom: 12 }}>
          Шаг 3 · аналитика для выдачи
        </div>
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
              Гео / BuyerScore и декомпозиция базы 500
              <span className="muted"> · углублённо</span>
            </span>
          </summary>
          <div className="bank-collapse-body" style={{ paddingTop: 12 }}>
            {xray ? <GeoPanel xray={xray} /> : <div className="muted">Гео загружается…</div>}
            <div style={{ marginTop: 16 }}>
              <XrayBaseDecomposition
                application={application}
                company={dashboard?.company ?? null}
                xray={xray}
              />
            </div>
          </div>
        </details>
      </section>

      <section className="figma-panel figma-panel-sm app-desk-block" id="desk-audit">
        <div className="figma-panel-title">Шаг 4 · журнал аудита</div>
        <p className="muted" style={{ margin: "6px 0 12px", fontSize: 13 }}>
          Неизменяемый лог application_events — для банка и жюри.
        </p>
        {xray ? <EventLog events={xray.events} /> : <div className="muted">Журнал подтянется с рентгеном…</div>}
      </section>
    </div>
  );
}
