import { AppNav } from "./components/AppNav";
import { CreditNoticeToasts } from "./components/CreditNoticeToasts";
import { DynamicIsland } from "./components/DynamicIsland";
import { ApplicationsScreen } from "./screens/ApplicationsScreen";
import { ApplyScreen } from "./screens/ApplyScreen";
import { BankHubScreen } from "./screens/BankHubScreen";
import { DashboardScreen } from "./screens/DashboardScreen";
import { DecisionScreen } from "./screens/DecisionScreen";
import { DocumentsScreen } from "./screens/DocumentsScreen";
import { InvoiceScreen } from "./screens/InvoiceScreen";
import { MessagesScreen } from "./screens/MessagesScreen";
import { PassportScreen } from "./screens/PassportScreen";
import { PaymentsScreen } from "./screens/PaymentsScreen";
import { SearchScreen } from "./screens/SearchScreen";
import { SigningScreen } from "./screens/SigningScreen";
import { useApp } from "./state/AppState";

export default function App() {
  const { isReady, screen, viewMode } = useApp();

  if (!isReady) {
    return (
      <div className="loading" style={{ minHeight: "100vh" }}>
        <span className="spinner" />
        Поднимаем кредитный кабинет…
      </div>
    );
  }

  const isBank = viewMode === "bank" || screen.startsWith("bank-");

  return (
    <div className="app-shell has-dyn-island">
      <DynamicIsland />
      <AppNav />
      <main className={`page ${isBank ? "page-bank" : ""}`}>
        {isBank ? (
          <BankHubScreen />
        ) : (
          <>
            {screen === "home" && <DashboardScreen />}
            {screen === "applications" && <ApplicationsScreen />}
            {screen === "apply" && <ApplyScreen />}
            {screen === "passport" && <PassportScreen />}
            {screen === "decision" && <DecisionScreen />}
            {screen === "signing" && <SigningScreen />}
            {screen === "search" && <SearchScreen />}
            {screen === "payments" && <PaymentsScreen />}
            {screen === "invoice" && <InvoiceScreen />}
            {screen === "messages" && <MessagesScreen />}
            {screen === "documents" && <DocumentsScreen />}
          </>
        )}
      </main>
      <footer className="footer">
        <span>
          <strong>Only_Alfa</strong> · хакатон «Альфа-Будущее»
        </span>
        <span>Демо-данные. Расчёты выполняет бэкенд, фронтенд только отображает ответы API.</span>
        <span>Режим: {viewMode === "bank" ? "глазами банка" : "глазами бизнеса"}</span>
      </footer>
      <CreditNoticeToasts />
    </div>
  );
}
