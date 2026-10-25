import { BankCapexSignalPanel } from "../../components/BankCapexSignalPanel";
import { BankEmptyState, SignalSkeleton } from "../../components/Skeleton";
import { useApp } from "../../state/AppState";

/**
 * Б2 — Сигнал CAPEX (Figma): платежи + рекомендация системы.
 * Без старой верхней панели управления — только контент макета.
 */
export function SignalScreen() {
  const { dashboard, goToScreen, isBusy } = useApp();

  if (isBusy && !dashboard) {
    return <SignalSkeleton />;
  }

  if (!dashboard) {
    return (
      <BankEmptyState
        title="Новых сигналов нет"
        text="Система проверяет платежи каждые 15 минут. Последняя проверка — 23:30."
      />
    );
  }

  const company = dashboard.company;
  const hasSignals = dashboard.radar_triggers.length > 0 || company.demo_key === "rosters";

  if (!hasSignals && !isBusy) {
    return (
      <>
        <h1 className="figma-h1">Сигнал в платежах</h1>
        <BankEmptyState
          title="Новых сигналов нет"
          text={`По ${company.name} за последние 15 минут срабатываний нет.`}
        />
      </>
    );
  }

  return (
    <>
      <header className="signal-hero">
        <div className="figma-eyebrow">
          Сигналы · {company.name} · TRG_CAPEX_EXP
        </div>
        <h1 className="figma-h1">Клиент покупает оборудование</h1>
        <p className="figma-lead">
          За 15 дней — три платежа поставщику кофейного оборудования. Остаток на счёте снизился на
          57%.
        </p>
      </header>

      <BankCapexSignalPanel onSendOffer={() => goToScreen("bank-messages")} />
    </>
  );
}
