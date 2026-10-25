import { useEffect, useState } from "react";
import { api } from "../api/client";
import type { Application, ApplicationSummary } from "../api/types";
import { CreditChatModal } from "../components/CreditChatModal";
import { useApp } from "../state/AppState";
import { formatDateTime, formatMoney, statusTone } from "../utils/format";

const TONE_CLASS = {
  GOOD: "pill-good",
  WARN: "pill-warn",
  RISK: "pill-risk",
  NEUTRAL: "pill-neutral",
} as const;

function needsBankThread(status: string): boolean {
  return (
    status === "NEED_MORE_INFO" ||
    status === "COUNTER_OFFER" ||
    status === "REJECTED" ||
    status === "AWAITING_CEO_APPROVAL" ||
    status === "MANUAL_REVIEW" ||
    status === "ANOMALY_VERIFICATION"
  );
}

function primaryActionLabel(status: string): string {
  if (status === "NEED_MORE_INFO") {
    return "Документы";
  }
  if (status === "APPROVED" || status === "AWAITING_CEO_APPROVAL") {
    return "К подписи";
  }
  if (status === "COUNTER_OFFER") {
    return "Выбрать условия";
  }
  return "Открыть";
}

/** Вкладка «Кредит»: список заявок сверху вниз — действие → статус → детали. */
export function ApplicationsScreen() {
  const {
    applications,
    application,
    loadApplications,
    openApplication,
    goToScreen,
    isBusy,
  } = useApp();
  const [chatTarget, setChatTarget] = useState<Application | null>(null);
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    void loadApplications();
  }, [loadApplications]);

  async function openCreditChat(row: ApplicationSummary) {
    if (application?.application_id === row.application_id) {
      setChatTarget(application);
      return;
    }
    setChatLoading(true);
    try {
      const detail = await api.getApplication(row.application_id);
      setChatTarget(detail);
    } catch {
      // локально не открываем
    } finally {
      setChatLoading(false);
    }
  }

  const docsFromList = applications.find((row) => row.status === "NEED_MORE_INFO");
  const showDocsBanner =
    application?.status === "NEED_MORE_INFO" || docsFromList !== undefined;
  const docsApplicationId =
    application?.status === "NEED_MORE_INFO"
      ? application.application_id
      : docsFromList?.application_id;
  const docsAmount =
    application?.status === "NEED_MORE_INFO"
      ? application.requested_amount_rub
      : docsFromList?.requested_amount_rub ?? 0;

  function openDocsChat() {
    if (application?.status === "NEED_MORE_INFO") {
      setChatTarget(application);
      return;
    }
    if (docsFromList) {
      void openCreditChat(docsFromList);
    }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="figma-h1">Заявки</h1>
          <p className="figma-lead">Статус и документы по кредиту</p>
        </div>
        <button type="button" className="btn btn-primary primary-cta" onClick={() => goToScreen("invoice")}>
          Счета → финансирование
        </button>
      </div>

      {showDocsBanner && docsApplicationId && (
        <section className="figma-panel figma-panel-sm credit-bank-message" style={{ marginBottom: 24 }}>
          <div className="credit-bank-message-layout">
            <div className="credit-bank-message-main">
              <div className="figma-panel-title">Сообщение от Альфа-Банка</div>
              <strong style={{ display: "block", marginTop: 6, fontSize: 18 }}>
                Нужны документы по заявке № {docsApplicationId.slice(-8).toUpperCase()}
              </strong>
              <p style={{ marginTop: 8, fontSize: 14, lineHeight: 1.5, color: "var(--text-secondary)" }}>
                Сумма {formatMoney(docsAmount)}. Прикрепите выписку из другого банка за 6 месяцев —
                инспектор ответит в том же окне.
              </p>
            </div>
            <div className="credit-bank-message-cta">
              <button
                type="button"
                className="btn btn-primary"
                disabled={chatLoading}
                onClick={openDocsChat}
              >
                Прикрепить документы
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => void openApplication(docsApplicationId)}
              >
                Смотреть заявку
              </button>
            </div>
          </div>
        </section>
      )}

      {applications.length === 0 ? (
        <div className="empty-state">
          <h3>Заявок пока нет</h3>
          <p>Оформите кредит при оплате счёта поставщика — заявка появится здесь.</p>
          <button type="button" className="btn btn-primary" onClick={() => goToScreen("invoice")}>
            Счета → финансирование
          </button>
        </div>
      ) : (
        <section className="figma-panel figma-panel-sm">
          <div className="credit-list">
            {applications.map((row) => (
              <article key={row.application_id} className="credit-list-item">
                <div className="credit-list-main">
                  <div className="credit-list-top">
                    <strong>{formatMoney(row.requested_amount_rub)}</strong>
                    <span className={`pill ${TONE_CLASS[statusTone(row.status)]}`}>
                      {row.status_label || row.status}
                    </span>
                  </div>
                  <div className="credit-list-meta">
                    <span>{row.product_label || row.product_type}</span>
                    <span className="muted">·</span>
                    <span className="muted">
                      № {row.application_id.slice(-8).toUpperCase()}
                      {row.created_at ? ` · ${formatDateTime(row.created_at)}` : ""}
                    </span>
                  </div>
                </div>
                <div className="credit-row-actions">
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    disabled={isBusy}
                    onClick={() => void openApplication(row.application_id)}
                  >
                    {primaryActionLabel(row.status)}
                  </button>
                  {needsBankThread(row.status) && (
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      disabled={isBusy || chatLoading}
                      onClick={() => void openCreditChat(row)}
                    >
                      Чат с банком
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {chatTarget && (
        <CreditChatModal application={chatTarget} onClose={() => setChatTarget(null)} />
      )}
    </>
  );
}
