import { useDropzone } from "react-dropzone";
import { FileUp } from "lucide-react";
import { useApp } from "../state/AppState";
import { formatMoney, formatMoneyExact } from "../utils/format";

/** Зона PDF-счёта. Демо-шаблоны также в списке InvoiceScreen (Invoice-to-Credit). */
export function InvoicePanel() {
  const { templates, parseTemplate, parseFile, isBusy, error, clearError, goToScreen } = useApp();

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
    <div className="invoice-upload">
      <div
        {...getRootProps({
          className: `invoice-drop ${isDragActive ? "dragging" : ""}`,
          role: "button",
          tabIndex: 0,
        })}
      >
        <input {...getInputProps()} />
        <span className="invoice-pdf-badge">PDF</span>
        <div className="dropzone-title">
          {isDragActive ? "Отпустите PDF-счёт" : "Перетащите PDF-счёт сюда"}
        </div>
        <div className="dropzone-sub">или выберите файл · PDF до 10 МБ</div>
        <FileUp size={20} strokeWidth={1.75} aria-hidden style={{ marginTop: 8, opacity: 0.5 }} />
      </div>

      <div className="figma-panel-title" style={{ marginTop: 20 }}>
        Или возьмите демо-счёт
      </div>
      <div className="demo-invoices">
        {templates.map((template) => (
          <button
            key={template.code}
            type="button"
            className="demo-invoice"
            disabled={isBusy}
            onClick={() => void parseTemplate(template.code)}
          >
            <strong>
              {template.supplier_name}
            </strong>
            <span>
              {template.purpose} · {formatMoney(template.amount_rub)}
            </span>
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
    </div>
  );
}

export function InvoiceRecognizedSummary() {
  const { invoiceResult } = useApp();
  if (!invoiceResult) {
    return null;
  }
  const { invoice, antifraud, parsing_ms } = invoiceResult;
  const ok = antifraud.is_verified;

  return (
    <section className="figma-panel figma-panel-sm">
      <div className="invoice-result-head">
        <span className={`pill ${ok ? "pill-good" : "pill-warn"}`}>
          Распознано за {(parsing_ms / 1000).toFixed(1).replace(".", ",")} с
        </span>
      </div>
      <div className="apply-invoice" style={{ marginTop: 12 }}>
        <span className="pdf">PDF</span>
        <div>
          <strong>{invoice.supplier_name}</strong>
          <div className="muted" style={{ fontSize: 13 }}>
            {invoice.purpose}
          </div>
        </div>
      </div>

      <div className="invoice-fields">
        <div>
          <span>Поставщик</span>
          <strong>{invoice.supplier_name} ✓</strong>
        </div>
        <div>
          <span>ИНН поставщика</span>
          <strong className="mono">{invoice.supplier_inn} ✓</strong>
        </div>
        <div>
          <span>Сумма к оплате</span>
          <strong>{formatMoneyExact(invoice.amount_rub)} ✓</strong>
        </div>
        <div>
          <span>НДС</span>
          <strong>{formatMoneyExact(invoice.vat_rub)} ✓</strong>
        </div>
        <div className="full">
          <span>Назначение платежа</span>
          <strong>{invoice.purpose} ✓</strong>
        </div>
      </div>

      <div className="figma-panel-title" style={{ marginTop: 20 }}>
        Проверка поставщика
      </div>
      <div className="supplier-checks">
        <div>
          <span>ЕГРЮЛ</span>
          <strong>{antifraud.egrul_status}</strong>
        </div>
        <div>
          <span>ФССП</span>
          <strong>
            {antifraud.fssp_amount_rub > 0
              ? formatMoney(antifraud.fssp_amount_rub)
              : "Долгов нет"}
          </strong>
        </div>
        <div>
          <span>Статус</span>
          <strong>{ok ? "Проверен" : "Есть замечания"}</strong>
        </div>
      </div>
      <p className="muted" style={{ marginTop: 12, fontSize: 13 }}>
        {antifraud.message}
      </p>
    </section>
  );
}
