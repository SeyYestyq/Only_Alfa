import { useDropzone } from "react-dropzone";
import { CheckCircle2, FileUp, TriangleAlert } from "lucide-react";
import { useApp } from "../state/AppState";
import { formatMoney, formatMoneyExact } from "../utils/format";

export function InvoicePanel() {
  const {
    templates,
    invoiceResult,
    parseTemplate,
    parseFile,
    isBusy,
    error,
    clearError,
    goToScreen,
  } = useApp();

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "application/pdf": [".pdf"] },
    multiple: false,
    disabled: isBusy,
    onDrop: (files) => {
      const file = files[0];
      if (file) {
        void parseFile(file);
      }
    },
  });

  return (
    <section className="card">
      <div className="card-header">
        <div>
          <h2 className="card-title">Счёт в кредит</h2>
          <p className="card-subtitle">PDF → ИНН поставщика → ЕГРЮЛ/ФССП → черновик заявки</p>
        </div>
        <span className="pill pill-outline">pdfplumber · react-dropzone</span>
      </div>
      <div className="card-body">
        <div
          {...getRootProps({
            className: `dropzone ${isDragActive ? "dragging" : ""}`,
            role: "button",
            tabIndex: 0,
          })}
        >
          <input {...getInputProps()} />
          <FileUp className="dropzone-icon" size={28} strokeWidth={1.75} aria-hidden />
          <div className="dropzone-title">
            {isDragActive ? "Отпустите PDF-счёт" : "Перетащите PDF-счёт сюда"}
          </div>
          <div className="dropzone-sub">или нажмите, чтобы выбрать файл · до 5 секунд на разбор</div>
        </div>

        <div className="template-buttons">
          {templates.map((template) => (
            <button
              key={template.code}
              type="button"
              className="template-button"
              disabled={isBusy}
              onClick={() => void parseTemplate(template.code)}
            >
              <div>
                <strong>{template.supplier_name}</strong>
                <span className="faint">{template.purpose}</span>
              </div>
              <span className="mono nowrap">{formatMoney(template.amount_rub)}</span>
            </button>
          ))}
        </div>

        {isBusy && (
          <div className="recognize" style={{ marginTop: 16 }}>
            <strong>Распознаём счёт</strong>
            <div className="recognize-bar" />
            <ul className="check-list">
              <li>Текст счёта</li>
              <li>Реквизиты и сумма</li>
              <li>Проверка поставщика</li>
            </ul>
          </div>
        )}

        {error && !isBusy && (
          <div className="alert alert-risk" style={{ marginTop: 16 }}>
            <strong>Не удалось распознать счёт</strong>
            <p style={{ marginTop: 4 }}>{error}</p>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button type="button" className="btn btn-secondary btn-sm" onClick={clearError}>
                Загрузить снова
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => goToScreen("apply")}>
                Ввести вручную
              </button>
            </div>
          </div>
        )}

        {invoiceResult && (
          <div className={`invoice-result ${invoiceResult.antifraud.is_verified ? "" : "warn"}`}>
            <div className="result-head">
              <strong className="result-head-title">
                {invoiceResult.antifraud.is_verified ? (
                  <CheckCircle2 size={16} className="icon-good" aria-hidden />
                ) : (
                  <TriangleAlert size={16} className="icon-warn" aria-hidden />
                )}
                Счёт распознан за {invoiceResult.parsing_ms.toFixed(0)} мс
              </strong>
              <span className={`pill ${invoiceResult.antifraud.is_verified ? "pill-good" : "pill-warn"}`}>
                {invoiceResult.antifraud.egrul_status}
              </span>
            </div>
            <dl className="kv-list">
              <dt>Поставщик</dt>
              <dd>{invoiceResult.invoice.supplier_name}</dd>
              <dt>ИНН</dt>
              <dd className="mono">{invoiceResult.invoice.supplier_inn}</dd>
              <dt>Сумма</dt>
              <dd>{formatMoneyExact(invoiceResult.invoice.amount_rub)}</dd>
              <dt>НДС</dt>
              <dd>{formatMoneyExact(invoiceResult.invoice.vat_rub)}</dd>
              <dt>Назначение</dt>
              <dd>{invoiceResult.invoice.purpose}</dd>
              <dt>ФССП</dt>
              <dd>{formatMoney(invoiceResult.antifraud.fssp_amount_rub)}</dd>
            </dl>
            <p className="muted" style={{ fontSize: 11.5, marginTop: 6 }}>
              {invoiceResult.antifraud.message}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
