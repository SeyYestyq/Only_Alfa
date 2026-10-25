import { useState } from "react";
import { useApp } from "../state/AppState";

export function UnderwriterActions() {
  const {
    application,
    effectiveRole,
    viewMode,
    setViewMode,
    underwriterAction,
    isBusy,
  } = useApp();
  const [comment, setComment] = useState("");
  const [documentName, setDocumentName] = useState("Договор аренды.pdf");

  if (!application) {
    return null;
  }

  const isUnderwriterStatus = ["MANUAL_REVIEW", "NEED_MORE_INFO"].includes(application.status);
  if (!isUnderwriterStatus) {
    return (
      <div className="alert alert-info">
        Действия инспектора доступны только для заявок в статусе MANUAL_REVIEW или NEED_MORE_INFO.
        Текущий статус: <strong>{application.status_label}</strong>.
      </div>
    );
  }

  if (viewMode !== "bank" || effectiveRole !== "UNDERWRITER") {
    return (
      <div className="alert alert-warn" style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <span>
          Заявка на ручном разборе. Переключитесь в режим «Глазами банка», чтобы действовать от имени
          кредитного инспектора.
        </span>
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => setViewMode("bank")}>
          Включить режим банка
        </button>
      </div>
    );
  }

  const needsDocument = application.status === "NEED_MORE_INFO";

  return (
    <section className="card">
      <div className="card-header">
        <div>
          <h2 className="card-title">Решение пилота банка</h2>
          <p className="card-subtitle">
            Одобрить · предложить другие условия · запросить документы · отказать. Клиент увидит
            уведомление в кабинете.
          </p>
        </div>
        <span className="pill pill-warn">{application.status_label}</span>
      </div>
      <div className="card-body">
        <div className="form-grid">
          <label className="field field-full">
            <span className="field-label">Комментарий инспектора</span>
            <textarea
              className="field-textarea"
              placeholder="Например: запрошен договор аренды помещения"
              value={comment}
              onChange={(event) => setComment(event.target.value)}
            />
          </label>
          <label className="field field-full">
            <span className="field-label">Документ клиента (для NEED_MORE_INFO → APPROVE)</span>
            <input
              className="field-input"
              value={documentName}
              onChange={(event) => setDocumentName(event.target.value)}
              placeholder="Договор аренды.pdf"
            />
          </label>
        </div>

        <div className="action-bar" style={{ marginTop: 12 }}>
          {application.status === "MANUAL_REVIEW" && (
            <button
              type="button"
              className="btn btn-ghost"
              disabled={isBusy}
              onClick={() => void underwriterAction("NEED_MORE_INFO", comment || "Запрошен договор аренды", documentName)}
            >
              NEED_MORE_INFO · запросить документ
            </button>
          )}
          <button
            type="button"
            className="btn btn-primary"
            disabled={isBusy || (needsDocument && !documentName.trim())}
            onClick={() => void underwriterAction("APPROVE", comment || "Одобрено на ручном разборе", documentName)}
          >
            {needsDocument ? "APPROVE · принять документ и одобрить" : "APPROVE · одобрить лимит"}
          </button>
          {application.status === "MANUAL_REVIEW" && (
            <button
              type="button"
              className="btn btn-secondary"
              disabled={isBusy}
              onClick={() => void underwriterAction("COUNTER_OFFER", comment || "Сформировать встречные условия")}
            >
              COUNTER_OFFER
            </button>
          )}
          <button
            type="button"
            className="btn btn-danger"
            disabled={isBusy}
            onClick={() => void underwriterAction("REJECT", comment || "Отказ на ручном разборе")}
          >
            REJECT
          </button>
        </div>
        {needsDocument && (
          <p className="muted" style={{ fontSize: 11.5, marginTop: 8 }}>
            После запроса документа заявка в NEED_MORE_INFO. Заполните имя файла и нажмите APPROVE —
            бэкенд зафиксирует загруженный документ и одобрит стартовый лимит.
          </p>
        )}
      </div>
    </section>
  );
}
