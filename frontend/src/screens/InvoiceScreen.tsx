import { InvoicePanel } from "../components/InvoicePanel";
import { useApp } from "../state/AppState";
import { formatMoney } from "../utils/format";
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

/** Оплата счёта: выбор счёта, предупреждение о кассе и согласие на кредит. */
export function InvoiceScreen() {
  const { dashboard, invoiceResult, createApplication, isBusy, viewMode } = useApp();
  const invoice = invoiceResult?.invoice;
  const company = dashboard?.company;
  const balance = dashboard?.account_balance ?? 0;
  const risk = invoice && dashboard
    ? rentRisk(balance, invoice.amount_rub, dashboard.transactions)
    : null;

  async function applyForCredit() {
    if (!invoice || !company || !invoiceResult) {
      return;
    }
    await createApplication(
      {
        product_type: "VKL",
        requested_amount_rub: invoice.amount_rub,
        term_months: 12,
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
          <div className="figma-eyebrow">Платёж поставщику</div>
          <h1 className="figma-h1">Оплата по счёту</h1>
          <p className="figma-lead">
            Выберите счёт списания. Если после платежа не хватит на ближайшую аренду, можно оформить кредит.
          </p>
        </div>
      </div>

      <InvoicePanel />

      {invoice && company && risk && (
        <div className="figma-grid-2">
          <section className="figma-panel figma-panel-sm">
            <div className="figma-panel-title">К оплате</div>
            <div className="figma-panel-heading">{invoice.supplier_name}</div>
            <p className="muted" style={{ marginTop: 8 }}>
              {invoice.purpose} · {formatMoney(invoice.amount_rub)}
            </p>

            <div className="figma-panel-title" style={{ marginTop: 24 }}>
              С какого счёта
            </div>
            <label className="pay-account">
              <input type="radio" name="pay-account" defaultChecked readOnly />
              <span>
                <strong>Расчётный счёт · Альфа-Банк</strong>
                <span className="muted">Доступно {formatMoney(balance)}</span>
              </span>
            </label>
          </section>

          <aside className="figma-panel figma-panel-sm">
            {risk.shortfall ? (
              <div className="alert alert-risk">
                <strong>Если оплатить этот счёт, может не хватить на «{risk.title}»</strong>
                <p style={{ marginTop: 8 }}>
                  Списание {formatMoney(invoice.amount_rub)} оставит {formatMoney(risk.remainder)}.
                  «{risk.title}» — {formatMoney(risk.obligation)}.
                </p>
              </div>
            ) : (
              <div className="alert alert-info">
                <strong>На аренду после платежа хватает</strong>
                <p style={{ marginTop: 8 }}>
                  Останется {formatMoney(risk.remainder)}. Кредит можно не подключать.
                </p>
              </div>
            )}

            <button
              type="button"
              className="btn btn-primary"
              style={{ marginTop: 16 }}
              disabled={isBusy || viewMode === "bank" || !risk.shortfall}
              onClick={() => void applyForCredit()}
            >
              Оформить кредит
            </button>
            <p className="muted" style={{ marginTop: 10, fontSize: 13 }}>
              Заявка появится в разделе «Заявки» со статусом, который посчитает банк.
            </p>
          </aside>
        </div>
      )}
    </>
  );
}
