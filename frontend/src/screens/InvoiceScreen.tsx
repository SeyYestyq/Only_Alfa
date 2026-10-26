import { useEffect, useMemo, useState } from "react";
import { InvoicePanel, InvoiceRecognizedSummary } from "../components/InvoicePanel";
import { InvoiceDetailPane } from "../components/invoice/InvoiceDetailPane";
import { InvoiceKpiStrip } from "../components/invoice/InvoiceKpiStrip";
import { InvoiceListPane } from "../components/invoice/InvoiceListPane";
import { invoiceShortfallRub, toUnpaidInvoiceRow, unpaidInvoiceKpis } from "../domain-ui/invoiceFinancing";
import { useApp } from "../state/AppState";
import { useDemoStore } from "../state/demoStore";
import { formatMoney } from "../utils/format";

type FilterTab = "all" | "unpaid" | "draft";

/** Счета к оплате: своими деньгами или кредит на недостачу выбранного счёта. */
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
  const setApplySource = useDemoStore((state) => state.setApplySource);

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

  async function requestFunds() {
    if (!selected || bankView) {
      return;
    }
    const shortfall = invoiceShortfallRub(selected.amount_rub, balance);
    setApplyPrefillAmount(shortfall);
    setApplySource("invoice");
    setApplyIntent("standard");
    const parsed = await parseTemplate(selected.code);
    if (!parsed) {
      setApplySource("plain");
      setApplyPrefillAmount(null);
      return;
    }
    goToScreen("apply");
  }

  return (
    <>
      <section className="home-hero">
        <div className="home-hero-main">
          <div className="figma-eyebrow">{company?.name ?? "Кабинет"}</div>
          <h1 className="figma-h1">Счета к оплате</h1>
          <p className="figma-lead">
            Выберите счёт. Если денег хватает — оплатите со счёта. Если нет — запросите кредит на разницу.
          </p>
          <div className="home-hero-balance">
            <span>На счёте сейчас</span>
            <strong>{formatMoney(balance)}</strong>
            <small>расчётный счёт в Альфе</small>
          </div>
        </div>
        <div className="home-hero-cta">
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

      <InvoiceKpiStrip overdueRub={kpis.overdue} dueSoonRub={kpis.dueSoon} />

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
              onRequestFunds={() => void requestFunds()}
              onPayFromAccount={() => setPaidFromAccount(true)}
              paidFromAccount={paidFromAccount}
            />
          ) : (
            <div className="inv-list-empty">
              <strong>Выберите счёт</strong>
              <p className="muted">Слева — счета поставщиков из API.</p>
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
            Распознать PDF-счёт
          </div>
          <InvoicePanel />
        </section>
      ) : null}
    </>
  );
}
