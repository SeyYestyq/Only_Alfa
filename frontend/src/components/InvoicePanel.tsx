import { useEffect, useRef, useState, type DragEvent } from "react";
import type { ProductType } from "../api/types";
import { PRODUCT_LABELS } from "../api/client";
import { useApp } from "../state/AppState";
import { formatMoney, formatMoneyExact } from "../utils/format";

export function InvoicePanel() {
  const {
    templates,
    invoiceResult,
    parseTemplate,
    parseFile,
    submitDraft,
    isBusy,
    viewMode,
  } = useApp();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [product, setProduct] = useState<ProductType>("INVEST_LEASING");
  const [term, setTerm] = useState(24);

  useEffect(() => {
    if (invoiceResult) {
      setProduct("INVEST_LEASING");
      setTerm(24);
    }
  }, [invoiceResult]);

  function pickFile(file: File | undefined) {
    if (file) {
      void parseFile(file);
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    pickFile(event.dataTransfer.files[0]);
  }

  return (
    <section className="card">
      <div className="card-header">
        <div>
          <h2 className="card-title">Счёт в кредит</h2>
          <p className="card-subtitle">PDF → ИНН поставщика → ЕГРЮЛ/ФССП → черновик заявки</p>
        </div>
        <span className="pill pill-outline">pdfplumber</span>
      </div>
      <div className="card-body">
        <div
          className={`dropzone ${isDragging ? "dragging" : ""}`}
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              inputRef.current?.click();
            }
          }}
        >
          <div className="dropzone-title">Перетащите PDF-счёт сюда</div>
          <div className="dropzone-sub">или нажмите, чтобы выбрать файл · до 5 секунд на разбор</div>
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            hidden
            onChange={(event) => pickFile(event.target.files?.[0])}
          />
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

        {invoiceResult && (
          <div className={`invoice-result ${invoiceResult.antifraud.is_verified ? "" : "warn"}`}>
            <div className="result-head">
              <strong>Счёт распознан за {invoiceResult.parsing_ms.toFixed(0)} мс</strong>
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

            <div className="form-grid" style={{ marginTop: 10 }}>
              <label className="field">
                <span className="field-label">Продукт</span>
                <select
                  className="field-select"
                  value={product}
                  onChange={(event) => setProduct(event.target.value as ProductType)}
                >
                  {Object.entries(PRODUCT_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span className="field-label">Срок, мес.</span>
                <input
                  className="field-input"
                  type="number"
                  min={3}
                  max={60}
                  value={term}
                  onChange={(event) => setTerm(Number(event.target.value))}
                />
              </label>
              <div className="field-full">
                <button
                  type="button"
                  className="btn btn-primary btn-block"
                  disabled={isBusy || viewMode === "bank" || term < 3}
                  onClick={() => void submitDraft(product, term)}
                >
                  Отправить черновик в скоринг
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
