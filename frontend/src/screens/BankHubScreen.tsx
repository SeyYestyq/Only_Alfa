import type { ScreenId } from "../api/types";
import { useApp } from "../state/AppState";
import { BankMessagesScreen } from "./bank/BankMessagesScreen";
import { ClientsScreen } from "./bank/ClientsScreen";
import { EffectScreen } from "./bank/EffectScreen";
import { Profile360Screen } from "./bank/Profile360Screen";
import { QueueScreen } from "./bank/QueueScreen";
import { SignalScreen } from "./bank/SignalScreen";
import { XrayScreen } from "./bank/XrayScreen";

const TABS: Array<{ id: ScreenId; label: string; badge?: number }> = [
  { id: "bank-queue", label: "Очередь" },
  { id: "bank-signal", label: "Сигналы" },
  { id: "bank-clients", label: "Клиенты" },
  { id: "bank-messages", label: "Сообщения" },
  { id: "bank-effect", label: "Эффект", badge: 3 },
  { id: "bank-xray", label: "Рентген" },
  { id: "bank-profile", label: "360°" },
];

/** Банковский конвейер: вкладки Б1–Б7 по макетам Figma. */
export function BankHubScreen() {
  const { screen, goToScreen } = useApp();
  const active: ScreenId = screen.startsWith("bank-") ? screen : "bank-queue";

  return (
    <>
      <div className="bank-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`figma-nav-item ${active === tab.id ? "active" : ""}`}
            onClick={() => goToScreen(tab.id)}
          >
            {tab.label}
            {typeof tab.badge === "number" ? <span className="figma-nav-badge">{tab.badge}</span> : null}
          </button>
        ))}
      </div>

      {active === "bank-queue" && <QueueScreen />}
      {active === "bank-signal" && <SignalScreen />}
      {active === "bank-xray" && <XrayScreen />}
      {active === "bank-messages" && <BankMessagesScreen />}
      {active === "bank-effect" && <EffectScreen />}
      {active === "bank-clients" && <ClientsScreen />}
      {active === "bank-profile" && <Profile360Screen />}
    </>
  );
}
