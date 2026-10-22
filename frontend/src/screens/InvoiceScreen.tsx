import { InvoicePanel, InvoiceRecognizedSummary } from "../components/InvoicePanel";
import { useApp } from "../state/AppState";
import { formatMoney, roughAnnuity } from "../utils/format";
import type { Transaction } from "../api/types";

function rentRisk(balance: number, payment: number, transactions: Transaction[]) {
  const remainder = balance - payment;
  const rent = transactions.find(
    (row) => row.direction === "OUT" && /аренд/i.test(`${row.description} ${row.category}`),
  );
  const obligation = rent ? Math.abs(rent.amount_rub) : 0;
  return {
    remainder,
    obligation,
    title: rent?.description ?? "аренду",
    shortfall: rent !== undefined && remainder < obligation,
  };
}

/** Оплата счёта поставщика в кредит — макет «счёт поставщика». */
export function InvoiceScreen() {
  const { dashboard, invoiceResult, createApplication, isBusy, viewMode, goToScreen } = useApp();
  const invoice = invoiceResult?.invoice;
  const company = dashboard?.company;
  const balance = dashboard?.account_balance ?? 0;
  const risk =
    invoice && dashboard ? rentRisk(balance, invoice.amount_rub, dashboard.transactions) : null;
  const termMonths = 6;
  const paymentHint = invoice ? roughAnnuity(invoice.amount_rub, termMonths) : 0;

  async function applyForCredit() {
    if (!invoice || !company || !invoiceResult) {
      return;
    }
    await createApplication(
      {
        product_type: "VKL",
        requested_amount_rub: invoice.amount_rub,
        term_months: termMonths,
        declared_monthly_revenue: company.declared_monthly_revenue,
        draft_application_id: invoiceResult.draft.application_id,
      },
      "applications",
    );
  }

  return (
    <>
      <div className="page-header">
        <div>
          <div className="figma-eyebrow">Заявки и предложения · счёт поставщика</div>
          <h1 className="figma-h1">Оплатите счёт поставщика в кредит</h1>
          <p className="figma-lead">
            Перетащите PDF-счёт — реквизиты, сумму и НДС распознаем за 5 секунд, а поставщика проверим
            по ЕГРЮЛ и ФССП.
          </p>
        </div>
      </div>

      <div className={`invoice-layout ${invoice ? "has-result" : ""}`}>
        <section className="figma-panel figma-panel-sm">
          <InvoicePanel />
        </section>

        {invoice && company && risk ? (
          <div className="invoice-side">
            <InvoiceRecognizedSummary />

            <aside className="figma-offer-card" style={{ marginTop: 16 }}>
              <div className="figma-panel-title">Предложение по счёту</div>
              <strong style={{ marginTop: 8 }}>Кредит на оплату поставщику</strong>
              <p>
                Деньги уйдут напрямую {invoice.supplier_name}.{" "}
                {risk.shortfall
                  ? `Если платить со счёта сейчас, может не хватить на «${risk.title}».`
                  : "После платежа на аренду ещё хватает — кредит по желанию."}
              </p>
              <div className="offer-metrics">
                <div>
                  <span>Сумма</span>
                  <strong>{formatMoney(invoice.amount_rub)}</strong>
                </div>
                <div>
                  <span>Срок</span>
                  <strong>{termMonths} мес.</strong>
                </div>
                <div>
                  <span>Платёж</span>
                  <strong>≈ {formatMoney(paymentHint)}</strong>
                </div>
              </div>
              <p className="muted" style={{ fontSize: 12, marginBottom: 12 }}>
                18,0% годовых · без залога · ориентир платежа до решения банка
              </p>
              <label className="pay-account" style={{ marginBottom: 12 }}>
                <input type="radio" name="pay-account" defaultChecked readOnly />
                <span>
                  <strong>Расчётный счёт · Альфа-Банк</strong>
                  <span className="muted">Доступно {formatMoney(balance)}</span>
                </span>
              </label>
              <button
                type="button"
                className="btn btn-primary btn-block"
                disabled={isBusy || viewMode === "bank"}
                onClick={() => void applyForCredit()}
              >
                Оформить кредит на {formatMoney(invoice.amount_rub)}
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-block"
                style={{ marginTop: 8 }}
                onClick={() => goToScreen("apply")}
              >
                Изменить условия в заявке
              </button>
            </aside>
          </div>
        ) : null}
      </div>
    </>
  );
}
