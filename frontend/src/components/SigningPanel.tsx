import type { Application } from "../api/types";
import { useApp } from "../state/AppState";
import { formatMoney, formatPercent, roleLabel } from "../utils/format";

const SIGNING_STATUSES = ["APPROVED", "COUNTER_OFFER", "AWAITING_CEO_APPROVAL"];

export function SigningPanel({ application }: { application: Application }) {
  const { signApplication, isBusy, effectiveRole, viewMode, goToScreen } = useApp();
  const legalForm = application.company.legal_form;
  const isSigningRole = legalForm === "OOO" ? effectiveRole === "CEO_OWNER" : effectiveRole === "IP_OWNER";
  const canSign = SIGNING_STATUSES.includes(application.status);

  const statusHint =
    application.status === "FUNDED"
      ? "Заявка профинансирована, деньги зачислены на счёт."
      : application.status === "REJECTED"
        ? "Подписание недоступно: заявка отклонена."
        : application.status === "ANOMALY_VERIFICATION"
          ? "Сначала подтвердите выручку в блоке Мультибанка."
          : ["MANUAL_REVIEW", "NEED_MORE_INFO"].includes(application.status)
            ? "Решение принимает кредитный инспектор на Экране 3."
            : application.status === "COUNTER_OFFER"
              ? "Выберите один из 4 вариантов — или подпишите текущие условия."
              : application.status === "AWAITING_CEO_APPROVAL"
                ? "Оффер выбран, остался один шаг — подпись ПЭП."
                : "Условия готовы, можно подписывать ПЭП.";

  return (
    <section className="card">
      <div className="card-header">
        <div>
          <h2 className="card-title">Подписание ПЭП</h2>
          <p className="card-subtitle">
            {legalForm === "OOO"
              ? "Для ООО подписывает только генеральный директор (CEO_OWNER). Бухгалтер получит 403."
              : "ИП подписывает в одно лицо — роль IP_OWNER."}
          </p>
        </div>
        <span className={`pill ${application.status === "FUNDED" ? "pill-good" : "pill-outline"}`}>
          {roleLabel(effectiveRole)}
        </span>
      </div>
      <div className="card-body">
        {application.status === "FUNDED" ? (
          <div className="alert alert-good">
            <strong>Профинансировано.</strong> {statusHint} Остаток на счёте:{" "}
            {formatMoney(application.account_balance)}.
          </div>
        ) : (
          <div className="signing-card">
            <div className="signing-row">
              <div className="signing-status">
                <strong>{application.status_label}</strong>
                <span>{statusHint}</span>
              </div>
              <div style={{ textAlign: "right" }}>
                <div className="passport-label">К подписанию</div>
                <div style={{ fontSize: 22, fontWeight: 850 }}>
                  {formatMoney(application.approved_amount_rub)}
                </div>
                <div className="faint" style={{ fontSize: 11 }}>
                  {formatPercent(application.final_rate_pct)} · {application.term_months} мес. ·{" "}
                  {formatMoney(application.monthly_payment_rub)}/мес.
                </div>
              </div>
            </div>

            <div className="divider" />

            <div className="signing-row">
              <p className="muted" style={{ fontSize: 12, maxWidth: 520 }}>
                {isSigningRole
                  ? "Ваша роль даёт право подписи. ПЭП — простая электронная подпись, фиксируется в audit trail."
                  : "У вашей роли нет права подписи: кнопка заблокирована. Прямой запрос к API вернёт 403 Forbidden."}
              </p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {["MANUAL_REVIEW", "NEED_MORE_INFO"].includes(application.status) && (
                  <button type="button" className="btn btn-ghost" onClick={() => goToScreen(3)}>
                    Открыть Экран инспектора
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={isBusy || !canSign || !isSigningRole || viewMode === "bank"}
                  onClick={() => void signApplication()}
                  title={
                    isSigningRole
                      ? "Подписать простой электронной подписью"
                      : "У вашей роли нет права подписи — бэкенд вернёт 403"
                  }
                >
                  Подписать ПЭП
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
