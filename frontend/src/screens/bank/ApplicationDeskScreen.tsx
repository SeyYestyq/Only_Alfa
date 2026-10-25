import { useState } from "react";
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
import { useBankMessagesStore } from "../../state/bankMessagesStore";
import { formatMoney, formatPercent } from "../../utils/format";

type DeskSection = "decision" | "evidence" | "analytics" | "audit";

const SECTIONS: Array<{ id: DeskSection; label: string; icon: string }> = [
  { id: "decision", label: "1. Решение андеррайтера", icon: "⚡" },
  { id: "evidence", label: "2. CAPEX & Выписка", icon: "🔍" },
  { id: "analytics", label: "3. X-Ray & Экономика", icon: "📊" },
  { id: "audit", label: "4. Журнал аудита", icon: "🛡️" },
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

function scrollToSection(id: DeskSection) {
  document.getElementById(`desk-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
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
      {/* ── 1. Высокотехнологичный Cockpit HUD Header ── */}
      <header className="app-desk-hud">
        <div className="app-desk-hud-top">
          <div className="app-desk-company-badge">
            <div className="app-desk-avatar">{initials}</div>
            <div className="app-desk-company-meta">
              <div className="app-desk-company-eyebrow">
                <span>Кредитный конвейер МСП</span>
                <span>·</span>
                <span>Заявка № {application.application_id.slice(-8).toUpperCase()}</span>
                <span>·</span>
                <span className="pill pill-outline" style={{ fontSize: 10, padding: "1px 6px" }}>
                  ИНН {inn}
                </span>
              </div>
              <h1 className="app-desk-company-name">{companyName}</h1>
            </div>
          </div>

          <div className="app-desk-hud-actions">
            <span className={`status-tag is-${tone}`} style={{ fontSize: 12, padding: "6px 12px", fontWeight: 700 }}>
              ● {application.status_label}
            </span>
            <div
              className="pill pill-warning"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12,
                padding: "6px 12px",
                fontWeight: 650,
                background: "rgba(245, 166, 35, 0.12)",
                border: "1px solid rgba(245, 166, 35, 0.3)",
                color: "#ffb020",
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#ffb020", display: "inline-block" }} />
              ⏱ SLA: 14 мин
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
              onClick={openChatWithClient}
            >
              💬 Чат с клиентом
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => goToScreen("bank-clients")}
            >
              ← Портфель клиентов
            </button>
          </div>
        </div>

        {/* Сводные показатели кейса в шапке */}
        <div className="app-desk-hud-metrics">
          <div className="app-desk-hud-chip">
            <span className="app-desk-hud-chip-label">Сумма и срок</span>
            <span className="app-desk-hud-chip-value">
              {formatMoney(application.requested_amount_rub)} · {application.term_months} мес.
            </span>
          </div>
          <div className="app-desk-hud-chip">
            <span className="app-desk-hud-chip-label">RiskScore скоринг</span>
            <span
              className="app-desk-hud-chip-value"
              style={{
                color: score === 0 || score < 520 ? "#ff4d4f" : score >= 750 ? "#00e599" : "#ffb020",
              }}
            >
              {score ? `${score} / 1000` : "Стоп-фактор"}
              <small style={{ color: "#8c93a4", fontSize: 11, fontWeight: 500 }}>
                ({score >= 750 ? "Зелёный" : score >= 600 ? "Жёлтый" : "Красный"})
              </small>
            </span>
          </div>
          <div className="app-desk-hud-chip">
            <span className="app-desk-hud-chip-label">Лимит платежа</span>
            <span className="app-desk-hud-chip-value">{limitLabel} / мес.</span>
          </div>
          <div className="app-desk-hud-chip">
            <span className="app-desk-hud-chip-label">Обеспечение сделки</span>
            <span className="app-desk-hud-chip-value">
              {application.collateral_type !== "NONE"
                ? `${COLLATERAL_LABELS[application.collateral_type]} (50%)`
                : "Бланковый (без залога)"}
            </span>
          </div>
        </div>
      </header>

      {/* ── 2. Sticky Навигация по секциям стола разбора ── */}
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
            <span style={{ marginRight: 6 }}>{section.icon}</span>
            {section.label}
          </button>
        ))}
      </nav>

      {/* Баннер залогового покрытия, если есть */}
      {application.collateral_type !== "NONE" && (
        <div
          className="alert alert-good"
          style={{
            marginBottom: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderRadius: 14,
          }}
        >
          <span>
            💎 <strong>Залоговое обеспечение:</strong> {COLLATERAL_LABELS[application.collateral_type]} · Оценка:{" "}
            <strong>{formatMoney(application.collateral_value_rub)}</strong> · Статус: {application.collateral_status}
          </span>
          <span className="pill pill-good">Покрытие ≥ 50%</span>
        </div>
      )}

      {/* ── 3. ШАГ 1: Bento Decision Cockpit (Решение системы & Пульт андеррайтера) ── */}
      <section className="app-desk-block" id="desk-decision">
        <div className="desk-split-grid">
          {/* Левая колонка (60%): Рекомендация конвейера + Bento KPI + Радар проверок */}
          <div className={`desk-recommendation-card is-${tone}`}>
            <div className="desk-recommendation-header">
              <div>
                <span className="desk-recommendation-kicker">
                  Шаг 1 · Рекомендация конвейера ({application.product_label})
                </span>
                <h2 className="desk-recommendation-title">{decisionTitle(application.status)}</h2>
              </div>
              <span className={`status-tag is-${tone}`} style={{ fontWeight: 700 }}>
                {application.status_label}
              </span>
            </div>

            <p style={{ color: "#d2d8e4", fontSize: 14, lineHeight: 1.5, margin: 0 }}>
              {counter ? (
                <>
                  Конвейер сформировал встречный оффер:{" "}
                  <strong style={{ color: "#ffffff" }}>{formatMoney(counter.amount_rub)}</strong> на{" "}
                  <strong>{counter.term_months} мес.</strong> под{" "}
                  <strong style={{ color: "#ffb020" }}>{formatPercent(counter.rate_pct)}</strong>. Аннуитетный
                  платёж составит <strong>≈ {formatMoney(counter.monthly_payment_rub)} / мес.</strong>
                </>
              ) : (
                <>
                  Рекомендуемый лимит безопасного ежемесячного платежа: <strong>{limitLabel}</strong>. Базовая
                  ставка предложения: <strong>{formatPercent(application.final_rate_pct)}</strong>.
                </>
              )}
            </p>

            {/* 4-Bento KPI Grid */}
            <div className="desk-kpi-quad">
              <div className="desk-kpi-quad-cell">
                <span className="kpi-lbl">Выручка за 30 дней</span>
                <span className="kpi-val">{formatMoney(application.monthly_revenue_alfa)}</span>
                <span className="kpi-sub">↑ +11% год к году</span>
              </div>
              <div className="desk-kpi-quad-cell">
                <span className="kpi-lbl">Безопасный лимит кассы</span>
                <span className="kpi-val">{limitLabel}</span>
                <span className="kpi-sub" style={{ color: "#8c93a4" }}>
                  DTI 28% от чистого потока
                </span>
              </div>
              <div className="desk-kpi-quad-cell">
                <span className="kpi-lbl">Ставка / КС ЦБ</span>
                <span className="kpi-val">{formatPercent(application.final_rate_pct)}</span>
                <span className="kpi-sub" style={{ color: "#8c93a4" }}>
                  КС ЦБ {cbrRate !== null ? formatPercent(cbrRate, 1) : "—"} + маржа
                </span>
              </div>
              <div className="desk-kpi-quad-cell">
                <span className="kpi-lbl">Залоговая масса</span>
                <span className="kpi-val">
                  {application.collateral_type !== "NONE"
                    ? formatMoney(application.collateral_value_rub)
                    : "Без залога"}
                </span>
                <span className="kpi-sub" style={{ color: "#00e599" }}>
                  {application.collateral_type !== "NONE" ? "Ликвидное имущество" : "Бланковый риск"}
                </span>
              </div>
            </div>

            {/* Радар автоматических проверок реестров */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#8c93a4", textTransform: "uppercase", marginBottom: 8 }}>
                Автоматические реестровые проверки (100% симулятор)
              </div>
              <div className="desk-verification-radar">
                <div className="desk-radar-row">
                  <span className="desk-radar-icon-pass">✓</span>
                  <span>
                    <strong>ЕГРЮЛ:</strong> Действует, {Math.floor(ageMonths / 12)} г. {ageMonths % 12} мес.
                  </span>
                </div>
                <div className="desk-radar-row">
                  <span className="desk-radar-icon-pass">✓</span>
                  <span>
                    <strong>БКИ:</strong> Чистая КИ, просрочек нет
                  </span>
                </div>
                <div className="desk-radar-row">
                  <span className="desk-radar-icon-pass">✓</span>
                  <span>
                    <strong>ФССП:</strong> Исполнительных производств 0
                  </span>
                </div>
                <div className="desk-radar-row">
                  <span className="desk-radar-icon-pass">✓</span>
                  <span>
                    <strong>Гео-скоринг:</strong> {xray ? `${xray.geo.geo_score}/100 (конкурентов ${xray.geo.competitors_count})` : "84/100"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Правая колонка (40%): Пульт инспектора (Underwriter Action Console) */}
          <div className="desk-console-card">
            <div className="desk-console-head">
              <div className="desk-console-avatar">ЕО</div>
              <div className="desk-console-meta">
                <span className="desk-console-inspector">Елена Орлова</span>
                <span className="desk-console-role">Кредитный аналитик · Роль: Maker</span>
              </div>
            </div>

            <div
              style={{
                fontSize: 12,
                color: "#9aa1b2",
                lineHeight: 1.45,
                background: "rgba(255, 255, 255, 0.02)",
                padding: "10px 14px",
                borderRadius: 12,
                border: "1px solid rgba(255, 255, 255, 0.05)",
              }}
            >
              🛡️ <strong>Maker-Checker контроль:</strong> Любое действие подписывается ПЭП сотрудника банка и
              фиксируется в неизменяемом аудит-логе. Решения на сумму &gt; 3 млн ₽ передаются на валидацию Checker
              (Ольга Урсул).
            </div>

            {/* Панель кнопок и форма принятия решения */}
            <UnderwriterActions />
          </div>
        </div>
      </section>

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
