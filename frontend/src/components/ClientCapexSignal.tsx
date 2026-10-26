import { useEffect, useRef } from "react";
import { useApp } from "../state/AppState";
import { BankCapexSignalPanel } from "./BankCapexSignalPanel";

export const CLIENT_CAPEX_ANCHOR_ID = "client-capex-signal";

const CAPEX_TRIGGER_CODE = "TRG_CAPEX_EXP";

/** Таблица кофейного оборудования — только сюжет Ростерс, не чужие компании с TRG_CAPEX_EXP. */
function isRostersCompany(demoKey: string | null | undefined, companyId: string): boolean {
  const key = (demoKey || companyId).replace(/^cmp_/, "").toLowerCase();
  return key === "rosters";
}

/** Сигнал CAPEX в карточке клиента: под прогнозом кассы, не отдельным экраном. */
export function ClientCapexSignal() {
  const { dashboard, goToScreen, screen, isBusy, companyId } = useApp();
  const focusCapex = screen === "bank-signal";
  const loadedCompanyId = dashboard?.company.id ?? null;
  const scrolledForCompany = useRef<string | null>(null);

  useEffect(() => {
    if (!focusCapex) {
      scrolledForCompany.current = null;
      return;
    }
    if (!loadedCompanyId || isBusy || loadedCompanyId !== companyId) {
      return;
    }
    if (scrolledForCompany.current === companyId) {
      return;
    }
    const timer = window.setTimeout(() => {
      scrolledForCompany.current = companyId;
      document.getElementById(CLIENT_CAPEX_ANCHOR_ID)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 80);
    return () => window.clearTimeout(timer);
  }, [companyId, focusCapex, isBusy, loadedCompanyId]);

  if (!dashboard) {
    return null;
  }

  const showPayments = isRostersCompany(dashboard.company.demo_key, dashboard.company.id);

  return (
    <section
      id={CLIENT_CAPEX_ANCHOR_ID}
      className="client-capex-signal"
      aria-label="Сигнал по платежам"
    >
      {showPayments ? (
        <>
          <header className="signal-hero">
            <div className="figma-eyebrow">
              Сигналы · {dashboard.company.name} · {CAPEX_TRIGGER_CODE}
            </div>
            <h2 className="figma-h1">Клиент покупает оборудование</h2>
            <p className="figma-lead">
              За 15 дней — три платежа поставщику кофейного оборудования. Остаток на счёте снизился
              на 57%.
            </p>
          </header>
          <BankCapexSignalPanel onSendOffer={() => goToScreen("bank-messages")} />
        </>
      ) : (
        <section className="card">
          <div className="card-body">
            <p className="muted client-capex-empty">Отдельного сигнала по платежам нет</p>
          </div>
        </section>
      )}
    </section>
  );
}
