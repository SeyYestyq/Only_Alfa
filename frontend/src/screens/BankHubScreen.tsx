import type { ScreenId } from "../api/types";
import { useApp } from "../state/AppState";
import { ApplicationDeskScreen } from "./bank/ApplicationDeskScreen";
import { BankMessagesScreen } from "./bank/BankMessagesScreen";
import { BankPortfolioScreen } from "./bank/BankPortfolioScreen";
import { ClientsScreen } from "./bank/ClientsScreen";
import { QueueScreen } from "./bank/QueueScreen";
import { SignalScreen } from "./bank/SignalScreen";

/**
 * Кабинет банка = Клиенты (с точками заявок) → Чаты (переписка) → Разбор (стол) → Портфель.
 */
export function BankHubScreen() {
  const { screen } = useApp();
  const active: ScreenId = screen.startsWith("bank-") ? screen : "bank-clients";
  const isClients = active === "bank-clients" || active === "bank-profile" || active === "bank-queue";

  return (
    <>
      {isClients && <ClientsScreen />}
      {active === "bank-messages" && <BankMessagesScreen />}
      {active === "bank-xray" && <ApplicationDeskScreen />}
      {active === "bank-signal" && <SignalScreen />}
      {active === "bank-effect" && <BankPortfolioScreen />}
    </>
  );
}

