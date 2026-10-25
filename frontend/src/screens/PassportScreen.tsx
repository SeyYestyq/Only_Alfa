import { useState } from "react";
import { COLLATERAL_LABELS, COLLATERAL_STATUS_LABELS } from "../api/client";
import { CreditChatModal } from "../components/CreditChatModal";
import { FlowStepper, stepFromStatus } from "../components/FlowStepper";
import { useApp } from "../state/AppState";
import { formatMoney } from "../utils/format";

type Tone = "PASS" | "WARN" | "FAIL";

function badgeLabel(tone: Tone): string {
  if (tone === "PASS") {
    return "Пройдено";
  }
  if (tone === "WARN") {
    return "Внимание";
  }
  return "Стоп";
}

function pillClass(tone: Tone): string {
  if (tone === "PASS") {
    return "pill pill-good";
  }
  if (tone === "WARN") {
    return "pill pill-warn";
  }
  return "pill pill-risk";
}

/** К3 — Паспорт готовности: четыре группы и готовность к решению банка. */
export function PassportScreen() {
  const { application, dashboard, goToScreen } = useApp();
  const [chatOpen, setChatOpen] = useState(false);

  if (!application) {
    return (
      <div className="empty-state">
        <h3>Паспорт готовности пуст</h3>
        <p>Сначала оформите и отправьте заявку.</p>
        <button type="button" className="btn btn-primary" onClick={() => goToScreen("apply")}>
          К заявке
        </button>
      </div>
    );
  }

  const profile = dashboard?.company;
  const anomaly = application.checks.find((check) => check.code === "REVENUE_ANOMALY");
  const hardStop = application.checks.find((check) => check.code === "HARD_STOP");
  const legalTone: Tone = hardStop || profile?.is_egrul_active === false ? "FAIL" : "PASS";
  const financeTone: Tone = anomaly?.status === "ANOMALY" ? "WARN" : "PASS";
  const competitors = profile?.competitors_count ?? 0;
  const locationTone: Tone = competitors >= 5 ? "WARN" : "PASS";
  const docsTone: Tone = application.collateral_status === "REJECTED" ? "WARN" : "PASS";
  const tones: Tone[] = [legalTone, financeTone, locationTone, docsTone];
  const passed = tones.filter((tone) => tone === "PASS").length;
  const invoice = application.invoice as { supplier_name?: string; amount_rub?: number } | null;
  const ageMonths = profile?.age_months;

  return (
    <>
      <h1 className="figma-h1">Паспорт заявки</h1>
      <p className="figma-lead">Четыре группы проверок</p>

      <FlowStepper active={stepFromStatus(application.status, "passport")} />

      <div className="passport-layout">
        <div className="figma-check-grid">
          <article className="figma-check-card">
            <header>
              <h3>Юридический профиль</h3>
              <span className={pillClass(legalTone)}>{badgeLabel(legalTone)}</span>
            </header>
            <ul className="check-list">
              <li>
                {`ЕГРЮЛ: ${profile?.is_egrul_active === false ? "не действующее" : "действующее"}${
                  ageMonths
                    ? ageMonths >= 12
                      ? `, ${Math.floor(ageMonths / 12)} г. ${ageMonths % 12} мес.`
                      : `, ${ageMonths} мес.`
                    : ""
                }`}
              </li>
              <li>Подписант: {profile?.director_name ?? application.company.name}</li>
              <li>
                ОКВЭД {profile?.okved_code ?? "—"}
                {profile?.okved_cluster ? ` — ${profile.okved_cluster}` : ""}
              </li>
              {hardStop && <li>{hardStop.message}</li>}
            </ul>
          </article>

          <article className="figma-check-card">
            <header>
              <h3>Финансы и касса</h3>
              <span className={pillClass(financeTone)}>{badgeLabel(financeTone)}</span>
            </header>
            <ul className="check-list">
              <li>
                {anomaly?.message ??
                  "Заявленная выручка сверена с оборотами по счёту."}
              </li>
              <li>Свободный поток {formatMoney(application.fcf_rub)} / мес.</li>
              <li>
                {(profile?.fssp_amount ?? 0) > 0
                  ? `Исполнительные производства: ${formatMoney(profile?.fssp_amount)}`
                  : "Налоговой задолженности и ФССП нет"}
              </li>
            </ul>
          </article>

          <article className="figma-check-card">
            <header>
              <h3>Локация и спрос</h3>
              <span className={pillClass(locationTone)}>{badgeLabel(locationTone)}</span>
            </header>
            <ul className="check-list">
              <li>
                {competitors > 0
                  ? `${competitors} точек конкурентов рядом — запас прочности ограничен`
                  : "Концентрация конкурентов учтена в скоринге"}
              </li>
              <li>
                {profile?.city ? `${profile.city}${profile.address ? `, ${profile.address}` : ""}` : "Адрес из ЕГРЮЛ"}
              </li>
            </ul>
          </article>

          <article className="figma-check-card">
            <header>
              <h3>Документы и поставщик</h3>
              <span className={pillClass(docsTone)}>{badgeLabel(docsTone)}</span>
            </header>
            <ul className="check-list">
              <li>
                {invoice?.supplier_name
                  ? `Счёт ${invoice.supplier_name}${
                      invoice.amount_rub ? `, ${formatMoney(invoice.amount_rub)}` : ""
                    }`
                  : "Счёт поставщика не приложен — сумма указана в заявке"}
              </li>
              <li>
                {application.collateral_type === "NONE"
                  ? "Без залога"
                  : `${COLLATERAL_LABELS[application.collateral_type]} · ${
                      COLLATERAL_STATUS_LABELS[application.collateral_status] ??
                      application.collateral_status
                    } · ${formatMoney(application.collateral_value_rub)}`}
              </li>
              <li>Согласие на запрос в БКИ уходит вместе с заявкой</li>
            </ul>
          </article>
        </div>

        <aside className="figma-panel figma-panel-sm">
          <div className="figma-panel-title">Готовность</div>
          <div className="readiness-hero">
            <strong>{passed} из 4</strong>
            <span className="muted">можно смотреть решение</span>
          </div>
          <div className="readiness-bars" aria-hidden="true">
            {tones.map((tone, index) => (
              <i key={index} className={tone === "PASS" ? "pass" : tone === "WARN" ? "warn" : ""} />
            ))}
          </div>
          <p className="muted" style={{ marginTop: 12, fontSize: 13, lineHeight: 1.45 }}>
            {application.product_label} · {formatMoney(application.requested_amount_rub)} ·{" "}
            {application.term_months} мес.
            {invoice ? " · по счёту поставщика" : ""}
          </p>
          <button
            type="button"
            className="btn btn-primary btn-block"
            style={{ marginTop: 18 }}
            onClick={() => goToScreen("decision")}
          >
            Открыть решение банка
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-block"
            style={{ marginTop: 8 }}
            onClick={() => setChatOpen(true)}
          >
            Задать вопрос в чате
          </button>
        </aside>
      </div>

      {chatOpen && (
        <CreditChatModal application={application} onClose={() => setChatOpen(false)} />
      )}
    </>
  );
}
