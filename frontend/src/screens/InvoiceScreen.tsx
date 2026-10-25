import { useEffect, useMemo, useState } from "react";
import { InvoicePanel, InvoiceRecognizedSummary } from "../components/InvoicePanel";
import { InvoiceDetailPane } from "../components/invoice/InvoiceDetailPane";
import { InvoiceKpiStrip } from "../components/invoice/InvoiceKpiStrip";
import { InvoiceListPane } from "../components/invoice/InvoiceListPane";
import {
  instantFinancingAmount,
  toUnpaidInvoiceRow,
  unpaidInvoiceKpis,
} from "../domain-ui/invoiceFinancing";
import { useApp } from "../state/AppState";
import { useDemoStore } from "../state/demoStore";
import { formatMoney } from "../utils/format";

type FilterTab = "all" | "unpaid" | "draft";

/**
 * Invoice-to-Credit: кабинет неоплаченных счетов (list + detail) и CTA
 * «мгновенное финансирование 85%» → форма заявки с предзаполненной суммой.
 */
export function InvoiceScreen() {
  const {
    dashboard,
    templates,
    invoiceResult,
    isBusy,
    viewMode,
    goToScreen,
    parseTemplate,
  } = useApp();
  const setApplyIntent = useDemoStore((state) => state.setApplyIntent);
  const setApplyPrefillAmount = useDemoStore((state) => state.setApplyPrefillAmount);

  const [tab, setTab] = useState<FilterTab>("unpaid");
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [paidFromAccount, setPaidFromAccount] = useState(false);
  const [showUpload, setShowUpload] = useState(false);

  const unpaidRows = useMemo(() => templates.map(toUnpaidInvoiceRow), [templates]);

  useEffect(() => {
    if (!selectedCode && unpaidRows[0]) {
      setSelectedCode(unpaidRows[0].code);
    }
  }, [selectedCode, unpaidRows]);

  useEffect(() => {
    const fromParse = invoiceResult?.invoice.template_code;
    if (fromParse && unpaidRows.some((row) => row.code === fromParse)) {
      setSelectedCode(fromParse);
    }
  }, [invoiceResult?.invoice.template_code, unpaidRows]);

  const selected = unpaidRows.find((row) => row.code === selectedCode) ?? unpaidRows[0] ?? null;
  const kpis = unpaidInvoiceKpis(unpaidRows);
  const company = dashboard?.company;
  const balance = dashboard?.account_balance ?? 0;
  const bankView = viewMode === "bank";

  async function startFinancing(code: string, amountRub: number) {
    setApplyPrefillAmount(instantFinancingAmount(amountRub));
    setApplyIntent("standard");
    await parseTemplate(code);
    goToScreen("apply");
  }

  async function financeSelected() {
    if (!selected || bankView) {
      return;
    }
    await startFinancing(selected.code, selected.amount_rub);
  }

  return (
    <>
      <section className="home-hero">
        <div className="home-hero-main">
          <div className="figma-eyebrow">
            {company?.name ?? "Кабинет"} · Invoice-to-Credit
          </div>
          <h1 className="figma-h1">Счета к оплате</h1>
          <p className="figma-lead">
            Выберите счёт поставщика — банк профинансирует до 85%. Остаток закроется после оплаты
            контрагентом.
          </p>
          <div className="home-hero-balance">
            <span>На счёте сейчас</span>
            <strong>{formatMoney(balance)}</strong>
            <small>можно оплатить целиком или взять финансирование</small>
          </div>
        </div>
        <div className="home-hero-cta">
          <button
            type="button"
            className="btn btn-primary primary-cta"
            disabled={isBusy || bankView || !selected}
            onClick={() => void financeSelected()}
          >
            Финансировать выбранный
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => setShowUpload((open) => !open)}
          >
            {showUpload ? "Скрыть PDF" : "Загрузить PDF"}
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => goToScreen("home")}>
            ← На главную
          </button>
        </div>
      </section>

      <InvoiceKpiStrip
        overdueRub={kpis.overdue}
        dueSoonRub={kpis.dueSoon}
        availableRub={kpis.available}
        onFinanceAll={() => void financeSelected()}
        financeDisabled={isBusy || bankView || !selected}
      />

      <section className="inv-workspace">
        <InvoiceListPane
          rows={tab === "draft" ? [] : unpaidRows}
          selectedCode={selected?.code ?? null}
          tab={tab}
          onTabChange={setTab}
          onSelect={(code) => {
            setSelectedCode(code);
            setPaidFromAccount(false);
          }}
        />

        <div className="inv-detail-wrap">
          {selected && company ? (
            <InvoiceDetailPane
              invoice={selected}
              companyName={company.name}
              balanceRub={balance}
              isBusy={isBusy}
              disabled={bankView}
              onFinance={() => void financeSelected()}
              onPayFromAccount={() => setPaidFromAccount(true)}
              paidFromAccount={paidFromAccount}
            />
          ) : (
            <div className="inv-list-empty">
              <strong>Выберите счёт</strong>
              <p className="muted">Слева — демо-шаблоны Invoice-to-Credit из API.</p>
            </div>
          )}

          {invoiceResult ? (
            <div className="inv-recognized">
              <InvoiceRecognizedSummary />
            </div>
          ) : null}
        </div>
      </section>

      {showUpload ? (
        <section className="figma-panel figma-panel-sm" style={{ marginTop: 16 }}>
          <div className="figma-panel-title">Свой PDF-счёт</div>
          <div className="figma-panel-heading" style={{ fontSize: 18, marginBottom: 12 }}>
            Распознать и перейти к финансированию
          </div>
          <InvoicePanel />
        </section>
      ) : null}
    </>
  );
}
