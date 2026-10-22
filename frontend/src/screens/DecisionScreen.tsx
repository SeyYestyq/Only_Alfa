import { COLLATERAL_LABELS } from "../api/client";
import { FlowStepper, stepFromStatus } from "../components/FlowStepper";
import { MultibankPanel } from "../components/MultibankPanel";
import { StatusTrack } from "../components/StatusTrack";
import { useApp } from "../state/AppState";
import { useDemoStore } from "../state/demoStore";
import { formatMoney, formatPercent, statusTone } from "../utils/format";

/** К4 — Решение / контр-оффер (Figma 50:663). */
export function DecisionScreen() {
  const { application, goToScreen, effectiveRole, isBusy, acceptOffer } = useApp();
  const setApplyIntent = useDemoStore((state) => state.setApplyIntent);

  if (!application) {
    return (
      <div className="empty-state">
        <h3>Решения ещё нет</h3>
        <p>Отправьте заявку на экране «Заявки и предложения».</p>
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

  function openCollateralForm() {
    setApplyIntent("collateral", true);
    goToScreen("apply");
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
          ? `${formatMoney(application.requested_amount_rub)} на ${application.term_months} мес. дали платёж выше безопасного в низкий сезон. Выберите вариант — его отправим на подпись.`
          : `${application.product_label} · RiskScore ${application.risk_score}`}
      </p>
      <FlowStepper active={stepFromStatus(application.status, "decision")} />

      {application.status === "ANOMALY_VERIFICATION" && (
        <div style={{ marginBottom: 24 }}>
          <MultibankPanel application={application} />
        </div>
      )}

      {application.status === "NEED_MORE_INFO" && (
        <section className="figma-panel figma-panel-sm" style={{ marginBottom: 24 }}>
          <div className="figma-panel-heading">Инспектор запросил документы</div>
          <ul className="check-list" style={{ marginTop: 12 }}>
            {(application.rejection_checklist.length > 0
              ? application.rejection_checklist
              : application.checks
                  .filter((check) => check.code === "DOCUMENT_REQUEST")
                  .map((check) => check.message)
            ).map((item) => (
              <li key={item}>{item}</li>
            ))}
            {application.rejection_checklist.length === 0 &&
              !application.checks.some((check) => check.code === "DOCUMENT_REQUEST") && (
                <li>Нужен документ, который запросил банк. Ответьте в сообщениях.</li>
              )}
          </ul>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ marginTop: 16 }}
            onClick={() => goToScreen("messages")}
          >
            Ответить в чате
          </button>
        </section>
      )}

      {application.status === "AWAITING_CEO_APPROVAL" && (
        <section className="figma-panel figma-panel-sm" style={{ marginBottom: 24 }}>
          <div className="figma-panel-heading">Ожидает {director}</div>
          <p className="muted" style={{ marginTop: 8 }}>
            Условия отправлены подписанту. Напомнить можно из сообщений.
          </p>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ marginTop: 16 }}
            onClick={() => goToScreen("messages")}
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
          <strong>
            {application.is_hard_stop ? "Hard Stop: мгновенный отказ" : "Заявка отклонена"}
          </strong>
          <p style={{ marginTop: 4 }}>
            {application.hard_stop_reason ?? "RiskScore ниже красного коридора."}
          </p>
          <ul className="checklist">
            {application.rejection_checklist.map((item) => (
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

      {application.status === "COUNTER_OFFER" && application.counter_offers.length > 0 && (
        <>
          <div className="figma-offers">
            {application.counter_offers.map((offer) => {
              const selected = application.selected_offer_index === offer.index;
              const foot =
                offer.features.find((feature) => !feature.startsWith("Вариант")) ??
                offer.features[0];
              return (
                <button
                  key={offer.index}
                  type="button"
                  className={`figma-offer ${selected ? "selected" : ""}`}
                  disabled={isBusy || selected}
                  onClick={() => void acceptOffer(offer.index)}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                    {selected ? (
                      <span className="pill pill-risk">Выбрано</span>
                    ) : (
                      <span />
                    )}
                  </div>
                  <div className="figma-offer-title">{offer.label}</div>
                  <div className="figma-offer-amount">{formatMoney(offer.amount_rub)}</div>
                  <div className="figma-offer-meta">
                    <span>
                      <span>Срок</span>
                      <strong>{offer.term_months} мес.</strong>
                    </span>
                    <span>
                      <span>Ставка</span>
                      <strong>
                        {offer.monthly_payment_rub > 0
                          ? formatPercent(offer.rate_pct)
                          : offer.features.includes("9% эквайринга")
                            ? "9% эквайринга"
                            : formatPercent(offer.rate_pct)}
                      </strong>
                    </span>
                    <span>
                      <span>Платёж</span>
                      <strong>
                        {offer.monthly_payment_rub > 0
                          ? `≈ ${formatMoney(offer.monthly_payment_rub)}`
                          : offer.features.find((f) => f.includes("%") || f.includes("Аванс")) ??
                            offer.product_label}
                      </strong>
                    </span>
                  </div>
                  <div className="figma-offer-foot">{foot}</div>
                </button>
              );
            })}
          </div>

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
                <strong>Можно подписывать</strong>
                <div className="muted" style={{ fontSize: 13 }}>
                  Статус {application.status_label} ·{" "}
                  <span className={statusTone(application.status) === "GOOD" ? "green" : "amber"}>
                    RiskScore {application.risk_score}
                  </span>
                </div>
              </>
            ) : (
              <>
                <strong>Подписать договор может только гендиректор</strong>
                <div className="muted" style={{ fontSize: 13 }}>
                  Вы вошли как бухгалтер. Вариант отправим {director}.
                </div>
              </>
            )}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            className="btn btn-ghost"
            disabled={
              !canSign ||
              (application.status === "COUNTER_OFFER" && !application.selected_offer_index)
            }
            onClick={() => goToScreen("signing")}
          >
            Подписать ПЭП
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              if (canSign) {
                goToScreen("signing");
              }
            }}
          >
            {canSign ? "Перейти к выдаче" : "Отправить гендиректору"}
          </button>
        </div>
      </div>
    </>
  );
}
