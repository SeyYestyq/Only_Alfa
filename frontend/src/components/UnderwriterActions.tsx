import { useState } from "react";
import { StarIcon, ArrowsClockwiseIcon, ArticleIcon } from "./icons";
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

  const actionable = ["MANUAL_REVIEW", "NEED_MORE_INFO", "COUNTER_OFFER", "ANOMALY_DETECTED", "MULTIBANK_PENDING"].includes(
    application.status,
  );
  if (!actionable) {
    return (
      <div className="alert alert-info" style={{ margin: 0 }}>
        Решение зафиксировано: <strong>{application.status_label}</strong>. Журнал событий — ниже в рентгене.
      </div>
    );
  }

  if (viewMode !== "bank" || effectiveRole !== "UNDERWRITER") {
    return (
      <div className="alert alert-warn" style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap", margin: 0 }}>
        <span>Чтобы решить заявку, включите режим банка (роль инспектора).</span>
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => setViewMode("bank")}>
          Режим банка
        </button>
      </div>
    );
  }

  const needsDocument = application.status === "NEED_MORE_INFO";

  return (
    <section className="bank-inspector-actions" style={{ margin: 0 }}>
      <div className="form-grid">
        <label className="field field-full">
          <span className="field-label">Комментарий клиенту / в журнал</span>
          <textarea
            className="field-textarea"
            placeholder="Например: запрошен договор аренды помещения"
            value={comment}
            onChange={(event) => setComment(event.target.value)}
          />
        </label>
        <label className="field field-full">
          <span className="field-label">Документ от клиента (если уже прислал)</span>
          <input
            className="field-input"
            value={documentName}
            onChange={(event) => setDocumentName(event.target.value)}
            placeholder="Договор аренды.pdf"
          />
        </label>
      </div>

      <div className="action-bar bank-decision-cta" style={{ marginTop: 12 }}>
        <button
          type="button"
          className="btn btn-primary"
          disabled={isBusy || (needsDocument && !documentName.trim())}
          onClick={() => void underwriterAction("APPROVE", comment || "Одобрено на ручном разборе", documentName)}
          style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
        >
          <StarIcon size={15} />
          <span>{needsDocument ? "Принять документы и одобрить" : "Одобрить"}</span>
        </button>
        {(application.status === "MANUAL_REVIEW" ||
          application.status === "ANOMALY_DETECTED" ||
          application.status === "MULTIBANK_PENDING") && (
          <button
            type="button"
            className="btn btn-secondary"
            disabled={isBusy}
            onClick={() => void underwriterAction("COUNTER_OFFER", comment || "Сформировать встречные условия")}
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            <ArrowsClockwiseIcon size={15} />
            <span>Другие условия</span>
          </button>
        )}
        {(application.status === "MANUAL_REVIEW" || application.status === "COUNTER_OFFER") && (
          <button
            type="button"
            className="btn btn-ghost"
            disabled={isBusy}
            onClick={() => void underwriterAction("NEED_MORE_INFO", comment || "Запрошен договор аренды", documentName)}
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            <ArticleIcon size={15} />
            <span>Запросить документы</span>
          </button>
        )}
        <button
          type="button"
          className="btn btn-danger"
          disabled={isBusy}
          onClick={() => void underwriterAction("REJECT", comment || "Отказ на ручном разборе")}
        >
          Отказать
        </button>
      </div>
      {needsDocument && (
        <p className="muted" style={{ fontSize: 12, marginTop: 8, marginBottom: 0 }}>
          Клиент получит уведомление. Когда файлы появятся — нажмите «Принять документы и одобрить».
        </p>
      )}
    </section>
  );
}
