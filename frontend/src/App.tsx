import { AppNav } from "./components/AppNav";
import { DemoControlBar } from "./components/DemoControlBar";
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
  const { isReady, screen, error, clearError, viewMode, isBusy } = useApp();

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
    <div className="app-shell">
      <DemoControlBar />
      <AppNav />
      {error && (
        <div className="banner banner-error" role="alert">
          <span>{error}</span>
          <button type="button" className="banner-close" onClick={clearError} aria-label="Закрыть">
            ×
          </button>
        </div>
      )}
      {isBusy && (
        <div className="banner banner-info">
          <span>Выполняем расчёт…</span>
        </div>
      )}
      <main className="page">
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
    </div>
  );
}
