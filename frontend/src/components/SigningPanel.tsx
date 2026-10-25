import type { Application } from "../api/types";
import { ApplicationBriefPanel } from "./ApplicationBriefPanel";
import { OfferLetterPanel } from "./OfferLetterPanel";
import { useApp } from "../state/AppState";
import { formatDateTime, formatMoney, formatPercent } from "../utils/format";

const SIGNING_STATUSES = ["APPROVED", "AWAITING_CEO_APPROVAL"];

/** Подписание: условия слева, код ПЭП справа. */
export function SigningPanel({ application }: { application: Application }) {
  const { signApplication, isBusy, effectiveRole, viewMode } = useApp();
  const legalForm = application.company.legal_form;
  const isSigningRole = legalForm === "OOO" ? effectiveRole === "CEO_OWNER" : effectiveRole === "IP_OWNER";
  const canSign = SIGNING_STATUSES.includes(application.status) && isSigningRole && viewMode !== "bank";
  const digits = ["4", "8", "1", "7", "", ""];
  return (
    <>
      <div className="sign-layout">
        <section className="figma-panel figma-panel-sm">
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
            <h2 style={{ fontSize: 18, fontWeight: 650 }}>{application.product_label}</h2>
            <span className="pill pill-outline">
              {application.collateral_type === "NONE" ? "Без залога" : "С залогом"}
            </span>
          </div>
          <div className="sign-figures">
            <div>
              <div className="figma-kpi-label">Сумма</div>
              <div className="figma-kpi-value" style={{ fontSize: 28 }}>
                {formatMoney(application.approved_amount_rub || application.requested_amount_rub)}
              </div>
            </div>
            <div>
              <div className="figma-kpi-label">Платёж в месяц</div>
              <div className="figma-kpi-value" style={{ fontSize: 28 }}>
                ≈ {formatMoney(application.monthly_payment_rub)}
              </div>
            </div>
            <div>
              <div className="figma-kpi-label">Срок</div>
              <div className="figma-kpi-value" style={{ fontSize: 28 }}>
                {application.term_months} мес.
              </div>
            </div>
          </div>
          <div className="kv-list" style={{ marginTop: 8 }}>
            <div className="meta-row">
              <span>Ставка</span>
              <strong>{formatPercent(application.final_rate_pct)}</strong>
            </div>
            <div className="meta-row">
              <span>Счёт зачисления</span>
              <strong>{application.company.name}</strong>
            </div>
            <div className="meta-row">
              <span>Заёмщик</span>
              <strong>
                {application.company.name} · ИНН {application.company.inn}
              </strong>
            </div>
          </div>
          <div className="figma-panel-title" style={{ marginTop: 20 }}>
            Документы
          </div>
          <div className="doc-file">
            <span className="apply-invoice pdf">PDF</span>
            <div>
              <strong>Кредитный договор</strong>
              <div className="muted" style={{ fontSize: 12 }}>
                {application.created_at ? `заявка от ${formatDateTime(application.created_at)}` : "готовится к подписи"}
              </div>
            </div>
          </div>
          <div className="doc-file">
            <span className="apply-invoice pdf">PDF</span>
            <div>
              <strong>График платежей</strong>
              <div className="muted" style={{ fontSize: 12 }}>{application.term_months} платежей</div>
            </div>
          </div>
        </section>

        <section className="figma-panel figma-panel-sm">
          <div className="figma-panel-title">Простая электронная подпись</div>
          {isBusy ? (
            <>
              <h2 style={{ fontSize: 22, fontWeight: 650, margin: "8px 0" }}>Подписываем договор</h2>
              <p className="muted" style={{ fontSize: 14, lineHeight: 1.45 }}>
                Ждём ответа. Не закрывайте страницу: повторное нажатие не создаст второй договор.
              </p>
            </>
          ) : application.status === "FUNDED" ? (
            <>
              <h2 style={{ fontSize: 22, fontWeight: 650, margin: "8px 0" }}>Деньги зачислены</h2>
              <p className="muted">
                Остаток на счёте после выдачи: {formatMoney(application.account_balance)}.
              </p>
            </>
          ) : !canSign ? (
            <>
              <h2 style={{ fontSize: 22, fontWeight: 650, margin: "8px 0" }}>
                Подписать может только руководитель
              </h2>
              <p className="muted" style={{ fontSize: 14, lineHeight: 1.45 }}>
                {application.status === "COUNTER_OFFER"
                  ? "Сначала выберите вариант на экране решения."
                  : "Бухгалтер не подписывает договор. Подписант получит уведомление и откроет этот экран сам."}
              </p>
              {application.status === "FUNDED" && (
                <p style={{ marginTop: 12 }}>
                  Договор подписан руководителем. Деньги зачислены — статус обновлён автоматически.
                </p>
              )}
            </>
          ) : (
            <>
              <h2 style={{ fontSize: 22, fontWeight: 650, margin: "8px 0" }}>Введите код из приложения</h2>
              <p className="muted" style={{ fontSize: 14, lineHeight: 1.45 }}>
                Код подтверждаете вы. Демо-подпись не уходит во внешний криптопровайдер.
              </p>
              <div className="otp-row" aria-hidden="true">
                {digits.map((digit, index) => (
                  <span key={index} className={`otp-box ${index === 4 ? "current" : ""}`}>
                    {digit}
                  </span>
                ))}
              </div>
              <button
                type="button"
                className="btn btn-primary btn-block"
                disabled={isBusy}
                onClick={() => void signApplication()}
              >
                Подписать и получить деньги
              </button>
              <p className="faint" style={{ fontSize: 12, marginTop: 12 }}>
                Демо: подпись эмулируется. В промышленной эксплуатации — внешний криптопровайдер.
              </p>
            </>
          )}
        </section>
      </div>

      {application.client_brief && (
        <div style={{ marginTop: 20 }}>
          <ApplicationBriefPanel brief={application.client_brief} />
        </div>
      )}
      {application.offer_letters && application.offer_letters[0] && (
        <OfferLetterPanel letter={application.offer_letters[0]} />
      )}
    </>
  );
}
