import { useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { CheckCircle2, FileUp, TriangleAlert } from "lucide-react";
import type { ProductType } from "../api/types";
import { PRODUCT_LABELS } from "../api/client";
import { useApp } from "../state/AppState";
import { formatMoney, formatMoneyExact } from "../utils/format";
import { LiquidityOfferBanner } from "./LiquidityOfferBanner";

export function InvoicePanel() {
  const {
    templates,
    invoiceResult,
    parseTemplate,
    parseFile,
    submitDraft,
    isBusy,
    viewMode,
    dashboard,
  } = useApp();
  const [product, setProduct] = useState<ProductType>("INVEST_LEASING");
  const [term, setTerm] = useState(24);
  const [showPayConfirm, setShowPayConfirm] = useState(false);

  useEffect(() => {
    if (invoiceResult) {
      setProduct("INVEST_LEASING");
      setTerm(24);
      setShowPayConfirm(false);
    }
  }, [invoiceResult]);

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
          <h2 className="card-title">Создать платёж</h2>
          <p className="card-subtitle">
            Перетащите счёт или выберите шаблон — система проверит поставщика и кассовый разрыв
          </p>
        </div>
        <span className="pill pill-outline">Invoice → Credit</span>
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
            {isDragActive ? "Отпустите документы платежа" : "Перетащите PDF-счёт сюда"}
          </div>
          <div className="dropzone-sub">или нажмите, чтобы выбрать файл · проверка ЕГРЮЛ/ФССП</div>
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

        {invoiceResult && dashboard && (
          <LiquidityOfferBanner
            forecast={dashboard.cash_forecast}
            triggers={dashboard.radar_triggers}
            paymentAmount={invoiceResult.invoice.amount_rub}
            accountBalance={dashboard.account_balance}
            disabled={isBusy || viewMode === "bank"}
            onRequest={(nextProduct, nextTerm) => {
              setProduct(nextProduct);
              setTerm(nextTerm);
              void submitDraft(nextProduct, nextTerm);
            }}
          />
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
                Черновик платежа · {invoiceResult.parsing_ms.toFixed(0)} мс
              </strong>
              <span className={`pill ${invoiceResult.antifraud.is_verified ? "pill-good" : "pill-warn"}`}>
                {invoiceResult.antifraud.egrul_status}
              </span>
            </div>
            <dl className="kv-list">
              <dt>Кому</dt>
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
                <span className="field-label">Продукт финансирования</span>
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
              <div className="field-full payment-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={isBusy || viewMode === "bank"}
                  onClick={() => setShowPayConfirm(true)}
                >
                  Оплатить счёт
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={isBusy || viewMode === "bank" || term < 3}
                  onClick={() => void submitDraft(product, term)}
                >
                  Оформить финансирование
                </button>
              </div>
              {showPayConfirm && (
                <div className="alert alert-info field-full">
                  {dashboard && invoiceResult.invoice.amount_rub > dashboard.account_balance ? (
                    <>
                      На счёте {formatMoney(dashboard.account_balance)}, к оплате{" "}
                      {formatMoneyExact(invoiceResult.invoice.amount_rub)}. Сначала получите
                      финансирование или верните деньги в оборот — затем оплатите счёт.
                    </>
                  ) : (
                    <>
                      Демо: оплата счёта доступна после зачисления кредита на главной. Оформите
                      финансирование, подпишите ПЭП — и вернитесь к этому черновику.
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
