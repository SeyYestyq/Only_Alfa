import { AppSidebar } from "./components/AppSidebar";
import { DemoControlBar } from "./components/DemoControlBar";
import { BankApplicationsPanel } from "./components/BankApplicationsPanel";
import { BankClientsPanel } from "./components/BankClientsPanel";
import { CreditsScreen } from "./screens/CreditsScreen";
import { DashboardScreen } from "./screens/DashboardScreen";
import { useApp } from "./state/AppState";

export default function App() {
  const {
    isReady,
    error,
    clearError,
    viewMode,
    isBusy,
    businessTab,
    bankTab,
  } = useApp();

  if (!isReady) {
    return (
      <div className="loading" style={{ minHeight: "100vh" }}>
        <span className="spinner" />
        Поднимаем кредитный кабинет…
      </div>
    );
  }

  return (
    <>
      <DemoControlBar />
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
      <div className="app-shell">
        <AppSidebar />
        <main className="page shell-page">
          {viewMode === "bank" ? (
            bankTab === "clients" ? <BankClientsPanel /> : <BankApplicationsPanel />
          ) : businessTab === "home" ? (
            <DashboardScreen />
          ) : (
            <CreditsScreen />
          )}
        </main>
      </div>
      <footer className="footer">
        <span>
          <strong>Only_Alfa</strong> · хакатон «Альфа-Будущее»
        </span>
        <span>Демо-данные. Расчёты выполняет бэкенд, фронтенд только отображает ответы API.</span>
        <span>Режим: {viewMode === "bank" ? "глазами банка" : "глазами бизнеса"}</span>
      </footer>
    </>
  );
}
