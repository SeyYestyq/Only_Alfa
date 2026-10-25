import type { ScreenId } from "../api/types";
import { useApp } from "../state/AppState";
import { ApplicationDeskScreen } from "./bank/ApplicationDeskScreen";
import { ClientsScreen } from "./bank/ClientsScreen";
import { EffectScreen } from "./bank/EffectScreen";
import { QueueScreen } from "./bank/QueueScreen";
import { SignalScreen } from "./bank/SignalScreen";

/**
 * Кабинет банка = 4 зоны + сигнал CAPEX:
 * Очередь → Разбор (стол) → Портфель → Показатели.
 * bank-signal — макет Figma (без старой верхней панели).
 * bank-xray / bank-messages — стол заявки.
 */
export function BankHubScreen() {
  const { screen } = useApp();
  const active: ScreenId = screen.startsWith("bank-") ? screen : "bank-queue";
  const isDesk = active === "bank-xray" || active === "bank-messages";
  const isClients = active === "bank-clients" || active === "bank-profile";

  return (
    <>
      {active === "bank-queue" && <QueueScreen />}
      {active === "bank-signal" && <SignalScreen />}
      {isDesk && <ApplicationDeskScreen />}
      {active === "bank-effect" && <EffectScreen />}
      {isClients && <ClientsScreen />}
    </>
  );
}
