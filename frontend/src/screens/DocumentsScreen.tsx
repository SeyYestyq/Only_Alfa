import { useApp } from "../state/AppState";

/** Документы по текущей заявке. Файлы в демо не скачиваются — это состав пакета. */
export function DocumentsScreen() {
  const { application, goToScreen } = useApp();

  return (
    <>
      <div className="figma-eyebrow">Документы</div>
      <h1 className="figma-h1">Пакет по заявке</h1>
      {!application ? (
        <div className="empty-state" style={{ marginTop: 24 }}>
          <h3>Документов ещё нет</h3>
          <p>Кредитный договор и график появляются, когда банк подготовил условия.</p>
          <button type="button" className="btn btn-primary" onClick={() => goToScreen("applications")}>
            К заявкам
          </button>
        </div>
      ) : (
        <section className="figma-panel figma-panel-sm" style={{ marginTop: 24, maxWidth: 720 }}>
          <div className="figma-panel-title">
            Заявка {application.application_id.slice(-8).toUpperCase()} · {application.status_label}
          </div>
          <div className="doc-file">
            <span className="apply-invoice pdf">PDF</span>
            <div>
              <strong>Кредитный договор</strong>
              <div className="muted" style={{ fontSize: 13 }}>{application.product_label}</div>
            </div>
          </div>
          <div className="doc-file">
            <span className="apply-invoice pdf">PDF</span>
            <div>
              <strong>График платежей</strong>
              <div className="muted" style={{ fontSize: 13 }}>{application.term_months} мес.</div>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ marginTop: 16 }}
            onClick={() => goToScreen("signing")}
          >
            К подписанию
          </button>
        </section>
      )}
    </>
  );
}
