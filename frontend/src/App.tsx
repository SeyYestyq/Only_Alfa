import { DemoControlBar } from "./components/DemoControlBar";
import { ApplicationScreen } from "./screens/ApplicationScreen";
import { DashboardScreen } from "./screens/DashboardScreen";
import { InspectorScreen } from "./screens/InspectorScreen";
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
      <main className="page">
        {screen === 1 && <DashboardScreen />}
        {screen === 2 && <ApplicationScreen />}
        {screen === 3 && <InspectorScreen />}
      </main>
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
