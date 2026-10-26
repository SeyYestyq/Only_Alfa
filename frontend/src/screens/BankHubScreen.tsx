import type { ScreenId } from "../api/types";
import { useApp } from "../state/AppState";
import { ApplicationDeskScreen } from "./bank/ApplicationDeskScreen";
import { BankMessagesScreen } from "./bank/BankMessagesScreen";
import { BankPortfolioScreen } from "./bank/BankPortfolioScreen";
import { ClientsScreen } from "./bank/ClientsScreen";

/**
 * Кабинет банка = Клиенты (с точками заявок) → Чаты (переписка) → Разбор (стол) → Портфель.
 * «Из аналитики» — та же карточка клиента, прокрученная к сигналу под прогнозом кассы.
 */
export function BankHubScreen() {
  const { screen } = useApp();
  const active: ScreenId = screen.startsWith("bank-") ? screen : "bank-clients";
  const isClients =
    active === "bank-clients" ||
    active === "bank-profile" ||
    active === "bank-queue" ||
    active === "bank-signal";

  return (
    <>
      {isClients && <ClientsScreen />}
      {active === "bank-messages" && <BankMessagesScreen />}
      {active === "bank-xray" && <ApplicationDeskScreen />}
      {active === "bank-effect" && <BankPortfolioScreen />}
    </>
  );
}

