import { useRef, useState } from "react";
import { COLLATERAL_LABELS } from "../api/client";
import { CreditChatModal } from "../components/CreditChatModal";
import { FlowStepper, stepFromStatus } from "../components/FlowStepper";
import { MultibankPanel } from "../components/MultibankPanel";
import { ApplicationBriefPanel } from "../components/ApplicationBriefPanel";
import { ClientProductRequestPanel } from "../components/ClientProductRequestPanel";
import { OfferLetterPanel } from "../components/OfferLetterPanel";
import { ProductOfferCards } from "../components/offers/ProductOfferCards";
import { StatusTrack } from "../components/StatusTrack";
import { useApp } from "../state/AppState";
import { useDemoStore } from "../state/demoStore";
import { formatMoney, formatPercent } from "../utils/format";

/** К4 — Решение: что банк посмотрел, жёлтые флаги, подтверждение / загрузка документов. */
export function DecisionScreen() {
  const { application, goToScreen, effectiveRole, isBusy, acceptOffer } = useApp();
  const setApplyIntent = useDemoStore((state) => state.setApplyIntent);
  const creditDocs = useDemoStore((state) => state.creditDocs);
  const addCreditDoc = useDemoStore((state) => state.addCreditDoc);
  const [chatOpen, setChatOpen] = useState(false);
  const [confirmedFacts, setConfirmedFacts] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  if (!application) {
    return (
      <div className="empty-state">
        <h3>Решения ещё нет</h3>
        <p>Отправьте заявку на экране «Кредит».</p>
        <button type="button" className="btn btn-primary" onClick={() => goToScreen("apply")}>
          Оформить заявку
        </button>
      </div>
    );
  }

  const canSign = effectiveRole === "CEO_OWNER" || effectiveRole === "IP_OWNER";
  const director =
    application.company.users.find((user) => user.role === "CEO_OWNER" || user.role === "IP_OWNER")
      ?.full_name ?? "подписанту";

  const docRequests =
    application.rejection_checklist.length > 0
      ? application.rejection_checklist
      : application.checks
          .filter((check) => check.code === "DOCUMENT_REQUEST")
          .map((check) => check.message);

  function openCollateralForm() {
    setApplyIntent("collateral", true);
    useDemoStore.getState().setApplySource("plain");
    goToScreen("apply");
  }

  function onUpload(file: File | undefined) {
    if (!file) {
      return;
    }
    addCreditDoc(file.name);
  }

  return (
    <>
      <div className="figma-eyebrow" style={{ marginBottom: 8 }}>
        ЗАЯВКА № {application.application_id.slice(-8).toUpperCase()} · {application.status_label}
      </div>
      <h1 className="figma-h1">
        {application.status === "APPROVED"
          ? "Банк готов выдать деньги"
          : application.status === "REJECTED"
            ? "Отказ с планом на 90 дней"
            : application.status === "ANOMALY_VERIFICATION"
              ? "Нужна сверка выручки"
              : application.status === "NEED_MORE_INFO"
                ? "Нужны документы"
                : application.status === "AWAITING_CEO_APPROVAL"
                  ? "Ожидает гендиректора"
                  : application.status === "MANUAL_REVIEW"
                    ? "Заявка на ручной проверке"
                    : "Банк готов дать деньги на других условиях"}
      </h1>
      <p className="figma-lead" style={{ marginBottom: 28 }}>
        {application.status === "COUNTER_OFFER"
          ? `${formatMoney(application.requested_amount_rub)} на ${application.term_months} мес. — платёж выше комфортного в низкий сезон. Выберите вариант ниже.`
          : `${application.product_label} · ${formatMoney(application.requested_amount_rub)} на ${application.term_months} мес.`}
      </p>
      <FlowStepper active={stepFromStatus(application.status, "decision")} />

      {application.client_brief && <ApplicationBriefPanel brief={application.client_brief} />}



      {application.status === "ANOMALY_VERIFICATION" && (
        <div style={{ marginBottom: 24 }}>
          <MultibankPanel application={application} />
        </div>
      )}

      {(application.status === "NEED_MORE_INFO" || application.status === "APPROVED") && (
        <section className="figma-panel figma-panel-sm decision-flags" style={{ marginBottom: 24 }}>
          <div className="figma-panel-title">Требует вашего внимания</div>
          <div className="decision-flag-list">
            {application.status === "NEED_MORE_INFO" && (
              <div className="decision-flag">
                <span className="decision-flag-mark">!</span>
                <div>
                  <strong>Подтвердите или приложите документы</strong>
                  <p>
                    {(docRequests.length > 0
                      ? docRequests
                      : ["Выписка по счёту в другом банке за 6 месяцев"]
                    ).join(" · ")}
                  </p>
                  {creditDocs.length > 0 && (
                    <p className="muted" style={{ marginTop: 6 }}>
                      Уже приложено: {creditDocs.join(", ")}
                    </p>
                  )}
                  <div className="decision-flag-actions">
                    <input
                      ref={fileRef}
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      hidden
                      onChange={(event) => {
                        onUpload(event.target.files?.[0]);
                        event.target.value = "";
                      }}
                    />
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => fileRef.current?.click()}
                    >
                      Подгрузить документ
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setChatOpen(true)}
                    >
                      Написать в банк
                    </button>
                  </div>
                </div>
              </div>
            )}
            {application.status === "APPROVED" && (
              <div className="decision-flag">
                <span className="decision-flag-mark">!</span>
                <div>
                  <strong>Подтвердите условия кредита</strong>
                  <p>
                    {formatMoney(application.approved_amount_rub)} ·{" "}
                    {formatPercent(application.final_rate_pct)} · платёж{" "}
                    {formatMoney(application.monthly_payment_rub)} / мес.
                  </p>
                  <div className="decision-flag-actions">
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      disabled={!canSign || confirmedFacts}
                      onClick={() => {
                        setConfirmedFacts(true);
                        goToScreen("signing");
                      }}
                    >
                      {confirmedFacts ? "Условия подтверждены" : "Подтвердить и перейти к подписи"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {application.status === "AWAITING_CEO_APPROVAL" && (
        <section className="figma-panel figma-panel-sm" style={{ marginBottom: 24 }}>
          <div className="figma-panel-heading">Ожидает {director}</div>
          <p className="muted" style={{ marginTop: 8 }}>
            Условия отправлены подписанту. Напомнить можно в чате по этой заявке.
          </p>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ marginTop: 16 }}
            onClick={() => setChatOpen(true)}
          >
            Напомнить сейчас
          </button>
        </section>
      )}

      {isBusy && application.counter_offers.length === 0 && application.status !== "REJECTED" && (
        <section className="figma-panel figma-panel-sm" style={{ marginBottom: 24 }}>
          <div className="figma-panel-heading">Банк готовит варианты…</div>
          <p className="muted" style={{ marginTop: 8 }}>
            Считаем нагрузку и встречные предложения. Страницу можно не обновлять.
          </p>
        </section>
      )}

      {application.status === "APPROVED" && (
        <section className="figma-panel figma-panel-sm" style={{ marginBottom: 24 }}>
          <div className="figma-kpi-row" style={{ marginTop: 0 }}>
            <div className="figma-kpi">
              <div className="figma-kpi-label">Одобрено</div>
              <div className="figma-kpi-value">{formatMoney(application.approved_amount_rub)}</div>
            </div>
            <div className="figma-kpi">
              <div className="figma-kpi-label">Ставка</div>
              <div className="figma-kpi-value">{formatPercent(application.final_rate_pct)}</div>
            </div>
            <div className="figma-kpi">
              <div className="figma-kpi-label">Платёж</div>
              <div className="figma-kpi-value">{formatMoney(application.monthly_payment_rub)}</div>
            </div>
            <div className="figma-kpi">
              <div className="figma-kpi-label">Обеспечение</div>
              <div className="figma-kpi-value" style={{ fontSize: 18, lineHeight: "28px" }}>
                {application.collateral_type === "NONE"
                  ? "Без залога"
                  : COLLATERAL_LABELS[application.collateral_type]}
              </div>
            </div>
          </div>
        </section>
      )}

      {application.status === "REJECTED" && (
        <div className="alert alert-risk" style={{ marginBottom: 24 }}>
          <strong>{application.is_hard_stop ? "Мгновенный отказ по стоп-фактору" : "Заявка отклонена"}</strong>
          <p style={{ marginTop: 4 }}>
            {application.hard_stop_reason ?? "Кредитная оценка ниже допустимого коридора."}
          </p>
          <div className="figma-panel-title" style={{ marginTop: 12 }}>План на 90 дней</div>
          <ul className="checklist">
            {(application.client_brief?.decision_letter?.next_steps?.length
              ? application.client_brief.decision_letter.next_steps
              : application.rejection_checklist
            ).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {application.collateral_status === "REJECTED" && (
        <div className="alert alert-risk" style={{ marginBottom: 24 }}>
          <strong>Залога не хватило на полную сумму</strong>
          <p style={{ marginTop: 4 }}>
            Оценка {formatMoney(application.collateral_value_rub)} покрывает меньше половины запроса.
            Увеличьте стоимость или выберите встречный вариант.
          </p>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ marginTop: 12 }}
            onClick={openCollateralForm}
          >
            Изменить залог
          </button>
        </div>
      )}

      {(application.status === "APPROVED" || application.status === "COUNTER_OFFER") &&
        application.offer_letters &&
        application.offer_letters[0] && <OfferLetterPanel letter={application.offer_letters[0]} />}

      {(application.status === "COUNTER_OFFER" || application.status === "APPROVED") && (
        <ClientProductRequestPanel application={application} />
      )}

      {application.status === "COUNTER_OFFER" && application.counter_offers.length > 0 && (
        <>
          <ProductOfferCards
            offers={application.counter_offers}
            preferredProduct={application.product_type}
            requestedAmountRub={application.requested_amount_rub}
            fallbackRatePct={application.final_rate_pct || 18}
            selectedOfferIndex={application.selected_offer_index}
            isBusy={isBusy}
            canChoose
            onAccept={(index) => void acceptOffer(index)}
          />

          <div className="figma-why">
            <div className="figma-why-card">
              <h3>Почему так?</h3>
              <ul>
                <li>
                  Летом (июль–август) выручка ниже на ~31% — исходный платёж выше свободного потока.
                </li>
                <li>
                  Рядом 9 кофеен · маленький запас прочности, если трафик просядет.
                </li>
                <li>
                  Кредитная история хорошая — поэтому банк предлагает альтернативы, а не отказ.
                </li>
              </ul>
            </div>
            <div className="figma-why-card">
              <h3>Что можно изменить?</h3>
              <ul>
                <li>Подключить выписки Мультибанка — до +25% к лимиту.</li>
                <li>
                  <strong>Предложить залог:</strong> ВКЛ с залогом — до 60 млн ₽ и полная запрошенная
                  сумма.
                </li>
                <li>Вернуться к полной сумме через 3 месяца по лестнице лимитов.</li>
              </ul>
              {application.collateral_type === "NONE" && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ marginTop: 14 }}
                  onClick={openCollateralForm}
                >
                  Оформить кредит под залог
                </button>
              )}
            </div>
          </div>
        </>
      )}

      <div style={{ marginTop: 24 }}>
        <StatusTrack status={application.status} />
      </div>

      <div className="figma-footer-bar">
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start", maxWidth: 720 }}>
          <span className="pill pill-neutral" style={{ marginTop: 2 }}>
            i
          </span>
          <div>
            {canSign ? (
              <>
                <strong>Дальше — подпись договора</strong>
                <div className="muted" style={{ fontSize: 13 }}>
                  {application.status_label}
                  {application.status === "COUNTER_OFFER" && !application.selected_offer_index
                    ? " · сначала выберите вариант выше"
                    : ""}
                </div>
              </>
            ) : (
              <>
                <strong>Подписать может только руководитель</strong>
                <div className="muted" style={{ fontSize: 13 }}>
                  Бухгалтер видит статус; подписант получит уведомление на экран подписи.
                </div>
              </>
            )}
          </div>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          disabled={
            !canSign ||
            (application.status === "COUNTER_OFFER" && !application.selected_offer_index)
          }
          onClick={() => goToScreen("signing")}
        >
          {canSign ? "Подписать договор" : "К экрану подписи"}
        </button>
      </div>

      {chatOpen && (
        <CreditChatModal
          application={application}
          onClose={() => setChatOpen(false)}
          initialDraft={
            application.status === "AWAITING_CEO_APPROVAL"
              ? `Напоминание: условия кредита готовы к подписи для ${director}.`
              : ""
          }
        />
      )}
    </>
  );
}
