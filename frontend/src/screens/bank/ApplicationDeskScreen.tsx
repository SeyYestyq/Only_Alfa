import { useState } from "react";
import { COLLATERAL_LABELS } from "../../api/client";
import { BankBentoCockpit } from "../../components/BankBentoCockpit";
import { BankCapexSignalPanel } from "../../components/BankCapexSignalPanel";
import { BankDealEconomics } from "../../components/BankDealEconomics";
import { EventLog } from "../../components/EventLog";
import { GeoPanel } from "../../components/GeoPanel";
import { BankEmptyState, XrayRecalcPanel, XraySkeleton } from "../../components/Skeleton";
import { UnderwriterActions } from "../../components/UnderwriterActions";
import { RiskScoreGauge } from "../../components/RiskScoreGauge";
import { XrayBaseDecomposition } from "../../components/XrayBaseDecomposition";
import { useApp } from "../../state/AppState";
import { useBankMessagesStore } from "../../state/bankMessagesStore";
import { formatMoney, formatPercent } from "../../utils/format";

type DeskSection = "decision" | "evidence" | "analytics" | "audit" | "cockpit" | "collateral";

const SECTIONS: Array<{ id: DeskSection; label: string; icon: string }> = [
  { id: "cockpit", label: "0. Кокпит (Bento)", icon: "⚡" },
  { id: "evidence", label: "1. CAPEX & Выписка", icon: "🔍" },
  { id: "analytics", label: "2. X-Ray & Экономика", icon: "📊" },
  { id: "audit", label: "3. Журнал аудита", icon: "🛡️" },
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
    return "Контроль выдачи кредита";
  }
  if (status === "REJECTED") {
    return "Отказ зафиксирован (стоп-фактор)";
  }
  if (status === "NEED_MORE_INFO") {
    return "Требуются документы заёмщика";
  }
  if (status === "COUNTER_OFFER") {
    return "Встречный оффер конвейера";
  }
  return "Решение по заявке (ручной разбор)";
}

function scrollToSection(id: string) {
  const targetId = id.startsWith("desk-") ? id : `desk-${id}`;
  document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function getInitials(name: string): string {
  return name
    .replace(/^(ООО|ИП|АО|ПАО)\s+/i, "")
    .replace(/[«»"']/g, "")
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase() || "КР";
}

/**
 * Единый командный пункт кредитного андеррайтера (BRD Экран 3).
 * Высокотехнологичный кокпит: Решение конвейера → Пульт инспектора → CAPEX-факты → X-Ray → ACID Ledger.
 */
export function ApplicationDeskScreen() {
  const { application, xray, cbrRate, dashboard, goToScreen, isBusy } = useApp();
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
  const ageMonths = dashboard?.company.age_months ?? 40;
  const score = application.risk_score;
  const counter = application.counter_offers[0];
  const tone = decisionTone(application.status);
  const limitLabel = formatMoney(application.max_payment_rub || application.approved_amount_rub || 0);
  const companyName = application.company.name;
  const isRosters = dashboard?.company.demo_key === "rosters";
  const demoKey = (dashboard?.company.demo_key || dashboard?.company.id || "rosters").replace("cmp_", "");
  const inn = application.company.inn;
  const initials = getInitials(companyName);

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
            💬 Чат с клиентом
          </button>
        </div>
      </div>

      {/* ── 1. Bento Command Cockpit (Hero Radar + 2x2 Vitals + 3 Modular Cards) ── */}
      <BankBentoCockpit
        onNavigateSection={(id) => {
          setActiveSection(id.replace("desk-", "") as DeskSection);
          scrollToSection(id);
        }}
        activeSection={activeSection}
      />

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
          <span>
            💎 <strong>Залоговое обеспечение:</strong> {COLLATERAL_LABELS[application.collateral_type]} · Оценка:{" "}
            <strong>{formatMoney(application.collateral_value_rub)}</strong> · Статус: {application.collateral_status}
          </span>
          <span className="pill pill-good">Покрытие ≥ 50%</span>
        </section>
      )}

      {/* ── 4. ШАГ 2: Доказательства целевого расходования (CAPEX-сигналы) ── */}
      <section className="figma-panel app-desk-block" id="desk-evidence" style={{ borderRadius: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <div className="figma-panel-title">Шаг 2 · Доказательства целевого расходования (CAPEX & Платежи)</div>
            <p className="muted" style={{ margin: "4px 0 0", fontSize: 13 }}>
              Защита от нецелевого использования: подтверждение реальной закупки оборудования по цепочке транзакций
            </p>
          </div>
          <span className="pill pill-good">Целевое подтверждение 100%</span>
        </div>

        {isRosters ? (
          <BankCapexSignalPanel
            showStatuses
            onSendOffer={openChatWithClient}
          />
        ) : (
          <div className="figma-panel figma-panel-sm" style={{ background: "rgba(255, 255, 255, 0.02)" }}>
            <p className="muted" style={{ margin: 0 }}>
              По компании {companyName} целевой CAPEX-сигнал синхронизирован с финансовой отчётностью.
            </p>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              style={{ marginTop: 12 }}
              onClick={() => goToScreen("bank-signal")}
            >
              Посмотреть демо-сигнал Ростерс (оборудование) →
            </button>
          </div>
        )}
      </section>

      {/* ── 5. ШАГ 3: Финансовый X-Ray & Экономика сделки ── */}
      <section className="app-desk-block" id="desk-analytics">
        <div className="figma-panel" style={{ borderRadius: 20, marginBottom: 20 }}>
          <div className="figma-panel-title" style={{ marginBottom: 4 }}>
            Шаг 3 · Финансовый X-Ray и доходность сделки для банка
          </div>
          <p className="muted" style={{ margin: "0 0 16px", fontSize: 13 }}>
            Комплексный скоринг, маржинальность кредита до выдачи и пространственный анализ локации
          </p>

          <BankDealEconomics xray={xray} productLabel={application.product_label} />

          {waitingXray ? <XrayRecalcPanel /> : null}

          {/* Визуальный спидометр RiskScore + Ключевые цифры */}
          <div className="xray-top" style={{ marginTop: 20 }}>
            <section
              className="figma-panel figma-panel-sm"
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                background: "rgba(255, 255, 255, 0.02)",
                borderRadius: 16,
              }}
            >
              <div className="figma-panel-title" style={{ width: "100%", textAlign: "left" }}>
                Калиброванный спидометр RiskScore
              </div>
              <div style={{ marginTop: 12, marginBottom: 12 }}>
                <RiskScoreGauge score={score} size="md" showCorridors={true} />
              </div>
            </section>

            <section
              className="figma-panel figma-panel-sm"
              style={{ background: "rgba(255, 255, 255, 0.02)", borderRadius: 16 }}
            >
              <div className="figma-panel-title">Ключевые риск-параметры сделки</div>
              <div className="kv-list" style={{ marginTop: 12 }}>
                <div className="meta-row">
                  <span>Гео-оценка (BuyerScore)</span>
                  <strong>{xray ? `${xray.geo.geo_score} / 100 · конкурентов ${xray.geo.competitors_count}` : "—"}</strong>
                </div>
                <div className="meta-row">
                  <span>Среднемесячная выручка</span>
                  <strong>{formatMoney(application.monthly_revenue_alfa)}</strong>
                </div>
                <div className="meta-row">
                  <span>Макс. безопасный платёж</span>
                  <strong>{formatMoney(application.max_payment_rub)}</strong>
                </div>
                <div className="meta-row">
                  <span>Финальная процентная ставка</span>
                  <strong style={{ color: "#ffb020" }}>{formatPercent(application.final_rate_pct)}</strong>
                </div>
              </div>
            </section>
          </div>

          {/* Раскрывающийся блок гео-аналитики OpenStreetMap и декомпозиции базы 500 */}
          <details className="bank-collapse" style={{ marginTop: 20, borderRadius: 16 }}>
            <summary style={{ padding: "16px 20px" }}>
              <span>
                🗺️ <strong>Карта OpenStreetMap / BuyerScore и Waterfall 5 факторов риска</strong>
                <span className="muted"> · углублённая декомпозиция модели</span>
              </span>
            </summary>
            <div className="bank-collapse-body" style={{ padding: 20 }}>
              {xray ? <GeoPanel xray={xray} /> : <div className="muted">Гео загружается…</div>}
              <div style={{ marginTop: 20 }}>
                <XrayBaseDecomposition
                  application={application}
                  company={dashboard?.company ?? null}
                  xray={xray}
                />
              </div>
            </div>
          </details>
        </div>
      </section>

      {/* ── 6. ШАГ 4: Неизменяемый журнал аудита (ACID Ledger) ── */}
      <section className="figma-panel app-desk-block" id="desk-audit" style={{ borderRadius: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div className="figma-panel-title">Шаг 4 · Неизменяемый журнал аудита (ACID Audit Trail)</div>
            <p className="muted" style={{ margin: "4px 0 0", fontSize: 13 }}>
              Криптографический таймлайн событий application_events — фиксация действий скоринга, инспектора и заёмщика
            </p>
          </div>
          <span className="pill pill-outline">SHA-256 Verified</span>
        </div>

        {xray ? <EventLog events={xray.events} /> : <div className="muted" style={{ padding: 16 }}>Журнал подтянется с рентгеном…</div>}
      </section>
    </div>
  );
}
