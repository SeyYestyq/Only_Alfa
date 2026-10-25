import { useEffect, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import { ApiError, api } from "../api/client";
import type { SupplierDealRisk } from "../api/types";
import { SupplierVerdict } from "../components/invoice/SupplierVerdict";
import { EmptyState, ErrorState, SkeletonLines } from "../components/v2/ScreenState";
import {
  INVOICE_FINANCING_TERM_MONTHS,
  INVOICE_INSTANT_FINANCING_RATIO,
  INVOICE_PSK_LABEL,
  INVOICE_RATE_ANNUAL,
  INVOICE_RATE_LABEL,
  instantFinancingAmount,
  invoiceStatusLabel,
  toUnpaidInvoiceRow,
} from "../domain-ui/invoiceFinancing";
import { useApp } from "../state/AppState";
import { formatMoney, roughAnnuity } from "../utils/format";

interface RecognizedInvoice {
  code: string | null;
  supplier_name: string;
  supplier_inn: string;
  amount_rub: number;
  purpose: string;
  due_label: string;
}

const STEPS = ["Счёт", "Проверка", "Финансирование"];

/**
 * Счёт → проверка поставщика → одно предложение финансирования.
 * Оформление идёт в ту же заявку, что и обычный кредит.
 */
export function InvoiceScreen() {
  const {
    dashboard,
    templates,
    invoiceResult,
    isBusy,
    error,
    clearError,
    viewMode,
    parseTemplate,
    parseFile,
    createApplication,
  } = useApp();

  const rows = useMemo(() => templates.map(toUnpaidInvoiceRow), [templates]);
  const [invoice, setInvoice] = useState<RecognizedInvoice | null>(null);
  const [risk, setRisk] = useState<SupplierDealRisk | null>(null);
  const [riskLoading, setRiskLoading] = useState(false);
  const [riskError, setRiskError] = useState<string | null>(null);
  const [riskAttempt, setRiskAttempt] = useState(0);

  const company = dashboard?.company;
  const bankView = viewMode === "bank";
  const pct = Math.round(INVOICE_INSTANT_FINANCING_RATIO * 100);
  const financing = invoice ? instantFinancingAmount(invoice.amount_rub) : 0;
  const payment = invoice ? roughAnnuity(financing, INVOICE_FINANCING_TERM_MONTHS, INVOICE_RATE_ANNUAL) : 0;
  const step = !invoice ? 0 : riskLoading || !risk ? 1 : 2;

  useEffect(() => {
    if (!invoiceResult) {
      return;
    }
    const parsed = invoiceResult.invoice;
    const known = rows.find((row) => row.code === parsed.template_code);
    setInvoice({
      code: parsed.template_code,
      supplier_name: parsed.supplier_name,
      supplier_inn: parsed.supplier_inn,
      amount_rub: parsed.amount_rub,
      purpose: parsed.purpose,
      due_label: known?.due_label ?? "Срок в счёте",
    });
  }, [invoiceResult, rows]);

  useEffect(() => {
    if (!invoice || !company) {
      setRisk(null);
      setRiskError(null);
      return;
    }
    let cancelled = false;
    setRiskLoading(true);
    setRiskError(null);
    void api.getSupplierDealRisk(invoice.supplier_inn, {
      buyerCompanyId: company.id,
      invoiceAmountRub: invoice.amount_rub,
      displayName: invoice.supplier_name,
    }).then((payload) => {
      if (!cancelled) {
        setRisk(payload);
      }
    }).catch((cause: unknown) => {
      if (!cancelled) {
        setRisk(null);
        setRiskError(cause instanceof ApiError ? cause.detail : "Не удалось сверить поставщика");
      }
    }).finally(() => {
      if (!cancelled) {
        setRiskLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [invoice?.supplier_inn, invoice?.amount_rub, invoice?.supplier_name, company?.id, riskAttempt]);

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

  function chooseTemplate(code: string) {
    const row = rows.find((item) => item.code === code);
    if (!row) {
      return;
    }
    clearError();
    setInvoice({
      code: row.code,
      supplier_name: row.supplier_name,
      supplier_inn: row.supplier_inn,
      amount_rub: row.amount_rub,
      purpose: row.purpose,
      due_label: row.due_label,
    });
  }

  async function finance() {
    if (!invoice || !company || bankView) {
      return;
    }
    const amount = instantFinancingAmount(invoice.amount_rub);
    const parsed = invoice.code ? await parseTemplate(invoice.code) : invoiceResult ?? undefined;
    const draftId = parsed?.draft.application_id ?? invoiceResult?.draft.application_id;
    if (!draftId) {
      return;
    }
    await createApplication({
      product_type: "INVEST_LEASING",
      requested_amount_rub: amount,
      term_months: INVOICE_FINANCING_TERM_MONTHS,
      declared_monthly_revenue: company.declared_monthly_revenue,
      draft_application_id: draftId,
    });
  }

  if (!dashboard) {
    return <SkeletonLines lines={6} />;
  }

  const forecast = dashboard.cash_forecast;
  const fits = forecast.min_balance_rub >= payment;

  return (
    <>
      <div className="v2-row v2-inv-head">
        <div>
          <h1 className="v2-h1">Счёт и финансирование</h1>
          <p className="v2-lead">Загрузите счёт — банк оплатит поставщику напрямую</p>
        </div>
        <div className="v2-steps" aria-label="Шаги">
          {STEPS.map((label, index) => (
            <span key={label} className={index === step ? "on" : index < step ? "done" : ""}>
              <i>{index + 1}</i>
              {label}
            </span>
          ))}
        </div>
      </div>

      <div className="v2-invoice">
        <div className="v2-invoice-main">
          {!invoice ? (
            <div {...getRootProps({ className: `v2-inv-drop ${isDragActive ? "on" : ""}` })}>
              <input {...getInputProps()} />
              {isBusy ? <SkeletonLines lines={3} /> : error ? (
                <ErrorState title="Не удалось прочитать счёт" text={error} onRetry={clearError} />
              ) : rows.length === 0 ? (
                <EmptyState
                  title="Счетов пока нет"
                  text="Перетащите PDF или дождитесь демо-шаблонов."
                  action="Обновить"
                  onAction={() => window.location.reload()}
                />
              ) : (
                <>
                  <div className="v2-kicker">Счёт</div>
                  <h2>{isDragActive ? "Отпустите PDF" : "Перетащите PDF-счёт"}</h2>
                  <p className="v2-muted">или выберите демо-счёт ниже. Файл до 10 МБ.</p>
                  <div className="v2-inv-picks">
                    {rows.map((row) => (
                      <button key={row.code} type="button" className="v2-btn" onClick={(event) => { event.stopPropagation(); chooseTemplate(row.code); }}>
                        {row.supplier_name}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : (
            <section className="v2-card">
              <div className="v2-row">
                <div>
                  <div className="v2-kicker">Распознанный счёт</div>
                  <h2>Проверьте поля</h2>
                </div>
                <button type="button" className="v2-btn ghost" onClick={() => setInvoice(null)}>Другой счёт</button>
              </div>
              <div className="v2-inv-fields">
                <label>Поставщик
                  <input value={invoice.supplier_name} onChange={(event) => setInvoice({ ...invoice, supplier_name: event.target.value })} />
                </label>
                <label>ИНН
                  <input className="v2-num" value={invoice.supplier_inn} onChange={(event) => setInvoice({ ...invoice, supplier_inn: event.target.value })} />
                </label>
                <label>Сумма счёта, ₽
                  <input
                    className="v2-num"
                    inputMode="numeric"
                    value={String(invoice.amount_rub)}
                    onChange={(event) => setInvoice({ ...invoice, amount_rub: Number(event.target.value.replace(/[^\d]/g, "")) || 0 })}
                  />
                </label>
                <label>Срок оплаты
                  <input value={invoice.due_label} onChange={(event) => setInvoice({ ...invoice, due_label: event.target.value })} />
                </label>
                <label className="wide">Назначение
                  <input value={invoice.purpose} onChange={(event) => setInvoice({ ...invoice, purpose: event.target.value })} />
                </label>
              </div>
            </section>
          )}

          {invoice ? (
            <SupplierVerdict
              risk={risk}
              isLoading={riskLoading}
              error={riskError}
              onRetry={() => setRiskAttempt((value) => value + 1)}
            />
          ) : null}

          {invoice && !riskLoading && !riskError ? (
            <section className="v2-card">
              <div className="v2-kicker">Финансирование</div>
              <h2>Банк платит поставщику {pct}% счёта</h2>
              <div className="v2-check"><span>К финансированию</span><strong className="v2-num">{formatMoney(financing)}</strong></div>
              <div className="v2-check"><span>Срок</span><strong>{INVOICE_FINANCING_TERM_MONTHS} мес.</strong></div>
              <div className="v2-check"><span>Ставка до решения</span><strong>{INVOICE_RATE_LABEL}</strong></div>
              <div className="v2-check"><span>Платёж, ориентир</span><strong className="v2-num">≈ {formatMoney(payment)}</strong></div>
              <div className="v2-check"><span>ПСК</span><strong>{INVOICE_PSK_LABEL}</strong></div>
              <p className="v2-note">
                {fits
                  ? `Платёж ниже минимума кассы ${formatMoney(forecast.min_balance_rub)} на дне ${forecast.min_day}. Точный график придёт в решении.`
                  : `В низкую точку кассы (${formatMoney(forecast.min_balance_rub)}, день ${forecast.min_day}) ориентир платежа не помещается. Банк пересчитает его в решении.`}
              </p>
              {bankView ? (
                <p className="v2-muted">Оформляет клиент. Заявка с проверкой поставщика появится в очереди.</p>
              ) : (
                <button type="button" className="v2-btn primary" disabled={isBusy || financing <= 0} onClick={() => void finance()}>
                  {isBusy ? "Оформляем…" : "Оформить финансирование"}
                </button>
              )}
            </section>
          ) : null}
        </div>

        <aside className="v2-card v2-inv-history">
          <div className="v2-kicker">История счетов</div>
          <h2>Статусы</h2>
          {rows.length === 0 ? (
            <p className="v2-muted">Список пуст.</p>
          ) : rows.map((row) => (
            <button
              key={row.code}
              type="button"
              className={invoice?.code === row.code ? "on" : ""}
              onClick={() => chooseTemplate(row.code)}
            >
              <span>
                <strong>{row.supplier_name}</strong>
                <small>{invoiceStatusLabel(row.status)} · {row.due_label}</small>
              </span>
              <b className="v2-num">{formatMoney(row.amount_rub)}</b>
            </button>
          ))}
        </aside>
      </div>
    </>
  );
}
