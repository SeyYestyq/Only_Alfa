import { useState } from "react";
import { EnvelopeIcon, StarIcon } from "../../components/icons";
import { COLLATERAL_LABELS } from "../../api/client";
import type { Application, ApplicationSummary } from "../../api/types";
import { BankBentoCockpit } from "../../components/BankBentoCockpit";
import { BankDealEconomics } from "../../components/BankDealEconomics";
import { EventLog } from "../../components/EventLog";
import { GeoPanel } from "../../components/GeoPanel";
import { BankEmptyState, XrayRecalcPanel, XraySkeleton } from "../../components/Skeleton";
import { PilotClientRequestCard } from "../../components/PilotClientRequestCard";
import { useApp } from "../../state/AppState";
import { useBankMessagesStore } from "../../state/bankMessagesStore";
import { formatMoney } from "../../utils/format";

type DeskSection = "decision" | "evidence" | "analytics" | "audit" | "cockpit" | "collateral";

const PATH_STEPS: Array<{ id: DeskSection; label: string }> = [
  { id: "decision", label: "Решение" },
  { id: "evidence", label: "Доказательства" },
  { id: "analytics", label: "Аналитика" },
];

/** Статусы, которые считаем уже поданной заявкой. Черновик не считается. */
const PRIOR_APPLICATION_STATUSES = new Set([
  "SUBMITTED",
  "MANUAL_REVIEW",
  "NEED_MORE_INFO",
  "COUNTER_OFFER",
  "ANOMALY_VERIFICATION",
  "ANOMALY_DETECTED",
  "AWAITING_CEO_APPROVAL",
  "APPROVED",
  "FUNDED",
  "REJECTED",
]);

function decisionTone(status: string): "good" | "warn" | "risk" {
  if (status === "APPROVED" || status === "FUNDED") {
    return "good";
  }
  if (status === "REJECTED") {
    return "risk";
  }
  return "warn";
}

/**
 * В API нет флага «новый клиент».
 * Другая заявка компании в сессии уже подана, одобрена или выдана — повторное обращение.
 * Иначе это первое обращение: «Новый клиент».
 */
function clientArrivalChip(
  application: Application,
  applications: readonly ApplicationSummary[],
): { label: string; pill: string; title: string } {
  const prior = applications.filter(
    (row) =>
      row.application_id !== application.application_id &&
      PRIOR_APPLICATION_STATUSES.has(row.status),
  );
  if (prior.length > 0) {
    if (application.status === "APPROVED" || application.status === "FUNDED") {
      return {
        label: application.status_label,
        pill: "pill-good",
        title: `У компании уже была заявка: ${prior[0]?.status_label ?? application.status_label}`,
      };
    }
    return {
      label: "Повторное обращение",
      pill: "pill-warn",
      title: `У компании уже есть заявка: ${prior[0]?.status_label ?? "в работе"}`,
    };
  }
  return {
    label: "Новый клиент",
    pill: "pill-neutral",
    title: "В текущей сессии нет другой поданной, одобренной или выданной заявки этой компании",
  };
}

function scrollToSection(id: string) {
  const targetId = id.startsWith("desk-") ? id : `desk-${id}`;
  document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

/**
 * Стол разбора: решение → доказательства → аналитика.
 * Пульт одобрения, встречного оффера и запроса документов остаётся в кокпите.
 */
export function ApplicationDeskScreen() {
  const { application, applications, xray, dashboard, goToScreen, isBusy } = useApp();
  const setActiveThread = useBankMessagesStore((state) => state.setActiveThread);
  const [activeSection, setActiveSection] = useState<DeskSection>("decision");

  if (isBusy && !application) {
    return <XraySkeleton />;
  }

  if (!application) {
    return (
      <BankEmptyState
        title="Нет открытой заявки"
        text="Стол инспектора работает от заявки: выберите компанию в списке клиентов — здесь появятся аналитика, скоринг и пульт решения."
        action={
          <button type="button" className="btn btn-primary" onClick={() => goToScreen("bank-clients")}>
            К списку клиентов
          </button>
        }
      />
    );
  }

  const waitingXray = isBusy && !xray;
  const score = application.risk_score;
  const tone = decisionTone(application.status);
  const amountLabel = formatMoney(
    application.approved_amount_rub || application.requested_amount_rub || 0,
  );
  const companyName = application.company.name;
  const caseNo = application.application_id.slice(-8).toUpperCase();
  const arrival = clientArrivalChip(application, applications);
  const demoKey = (dashboard?.company.demo_key || dashboard?.company.id || "rosters").replace("cmp_", "");

  function openChatWithClient() {
    setActiveThread(demoKey);
    goToScreen("bank-messages");
  }

  return (
    <div className="app-desk">
      {/* ── 0. Top Bar Actions: Return to client list & Chat ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
          onClick={() => goToScreen("bank-clients")}
        >
          ← К списку клиентов
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span className="pill pill-outline" style={{ fontSize: 11, padding: "3px 8px" }}>
            Заявка № {application.application_id.slice(-8).toUpperCase()}
          </span>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
            onClick={openChatWithClient}
          >
            <EnvelopeIcon size={14} />
            <span>Чат с клиентом</span>
          </button>
        </div>
      </div>

      <nav className="desk-path" aria-label="Ход разбора">
        {PATH_STEPS.map((step, index) => (
          <span key={step.id} style={{ display: "contents" }}>
            {index > 0 ? (
              <span className="desk-path-sep" aria-hidden="true">
                →
              </span>
            ) : null}
            <button
              type="button"
              className={activeSection === step.id || (step.id === "decision" && activeSection === "cockpit") ? "is-active" : ""}
              onClick={() => {
                setActiveSection(step.id);
                scrollToSection(step.id);
              }}
            >
              {step.label}
            </button>
          </span>
        ))}
      </nav>

      <section id="desk-decision">
        <header className={`desk-step-head is-${tone}`}>
          <div className="desk-step-kicker">Заявка от клиента · № {caseNo}</div>
          <div className="desk-identity">
            <h2 className="desk-step-title">{companyName}</h2>
            <span className={`pill ${arrival.pill}`} title={arrival.title}>
              {arrival.label}
            </span>
          </div>
          <p className="muted desk-step-lead">
            {amountLabel} · балл {score} · {application.status_label}
          </p>
        </header>

        <PilotClientRequestCard application={application} />

        <BankBentoCockpit />
      </section>

      {/* Баннер залогового покрытия, если есть */}
      {application.collateral_type !== "NONE" && (
        <section
          id="desk-collateral"
          className="alert alert-good"
          style={{
            marginBottom: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderRadius: 18,
            padding: "16px 20px",
          }}
        >
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <StarIcon size={14} />
            <span>
              <strong>Залоговое обеспечение:</strong> {COLLATERAL_LABELS[application.collateral_type]} · Оценка:{" "}
              <strong>{formatMoney(application.collateral_value_rub)}</strong> · Статус: {application.collateral_status}
            </span>
          </span>
          <span className="pill pill-good">Покрытие ≥ 50%</span>
        </section>
      )}

      {/* ── 4. ШАГ 2: Доказательства целевого расходования (CAPEX-сигналы) ── */}
      <section className="figma-panel app-desk-block" id="desk-evidence" style={{ borderRadius: 20 }}>
        <header className="desk-step-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
          <div>
            <div className="desk-step-kicker">Шаг 2 · Доказательства</div>
            <h2 className="desk-step-title">Целевое расходование</h2>
            <p className="muted desk-step-lead">
              Платежи поставщику, которые подтверждают, на что уходят деньги.
            </p>
          </div>
          <span className="pill pill-good">Целевое подтверждение 100%</span>
        </header>

        <div className="figma-panel figma-panel-sm" style={{ background: "var(--surface-2)" }}>
          <p className="muted" style={{ margin: 0 }}>
            Сигнал по платежам — в карточке клиента, сразу после прогноза кассы.
          </p>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            style={{ marginTop: 12 }}
            onClick={() => goToScreen("bank-profile")}
          >
            Открыть в карточке клиента
          </button>
        </div>
      </section>

      {/* ── 5. ШАГ 3: Финансовый X-Ray & Экономика сделки ── */}
      <section className="app-desk-block" id="desk-analytics">
        <div className="figma-panel" style={{ borderRadius: 20, marginBottom: 20 }}>
          <header className="desk-step-head">
            <div className="desk-step-kicker">Шаг 3 · Аналитика</div>
            <h2 className="desk-step-title">Доходность и экономика сделки</h2>
            <p className="muted desk-step-lead">
              Маржинальность кредита до выдачи, стоимость риска и пространственный анализ.
            </p>
          </header>

          <BankDealEconomics xray={xray} productLabel={application.product_label} />

          {waitingXray ? <XrayRecalcPanel /> : null}

          {/* Раскрывающийся блок гео-аналитики OpenStreetMap */}
          <details className="bank-collapse" style={{ marginTop: 20, borderRadius: 16 }}>
            <summary style={{ padding: "16px 20px" }}>
              <span>
                <strong>Карта OpenStreetMap / BuyerScore</strong>
                <span className="muted"> · гео-оценка локации и конкурентное окружение</span>
              </span>
            </summary>
            <div className="bank-collapse-body" style={{ padding: 20 }}>
              {xray ? <GeoPanel xray={xray} /> : <div className="muted">Гео загружается…</div>}
            </div>
          </details>
        </div>
      </section>

      {/* ── 6. ШАГ 4: Неизменяемый журнал аудита (ACID Ledger) ── */}
      <section className="figma-panel app-desk-block" id="desk-audit" style={{ borderRadius: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div className="desk-step-kicker">Журнал</div>
            <h2 className="desk-step-title">Аудит решений</h2>
            <p className="muted desk-step-lead">
              События скоринга, инспектора и заёмщика по этой заявке.
            </p>
          </div>
          <span className="pill pill-outline">SHA-256 Verified</span>
        </div>

        {xray ? <EventLog events={xray.events} /> : <div className="muted" style={{ padding: 16 }}>Журнал подтянется с рентгеном…</div>}
      </section>
    </div>
  );
}
