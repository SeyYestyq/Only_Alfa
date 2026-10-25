import type { ScreenId } from "../api/types";
import { useApp } from "../state/AppState";
import { ApplicationDeskScreen } from "./bank/ApplicationDeskScreen";
import { BankPortfolioScreen } from "./bank/BankPortfolioScreen";
import { ClientsScreen } from "./bank/ClientsScreen";
import { QueueScreen } from "./bank/QueueScreen";
import { SignalScreen } from "./bank/SignalScreen";

/**
 * Кабинет банка = Очередь → Разбор (стол) → Портфель (аналитика/эффект) → Клиенты.
 */
export function BankHubScreen() {
  const { screen } = useApp();
  const active: ScreenId = screen.startsWith("bank-") ? screen : "bank-clients";
  const isDesk = active === "bank-xray" || active === "bank-messages";
  const isClients = active === "bank-clients" || active === "bank-profile";

  return (
    <>
      {isClients && <ClientsScreen />}
      {active === "bank-queue" && <QueueScreen />}
      {active === "bank-signal" && <SignalScreen />}
      {isDesk && <ApplicationDeskScreen />}
      {active === "bank-effect" && <BankPortfolioScreen />}
    </>
  );
}
