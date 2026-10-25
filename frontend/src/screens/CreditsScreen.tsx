import { ApplicationForm } from "../components/ApplicationForm";
import { CabinetNotifications } from "../components/CabinetNotifications";
import { PreapprovedOffers } from "../components/PreapprovedOffers";
import { SmartSearchPanel } from "../components/SmartSearchPanel";
import { useApp } from "../state/AppState";
import { ApplicationScreen } from "./ApplicationScreen";

export function CreditsScreen() {
  const { dashboard, application, setBusinessTab } = useApp();

  if (application && application.status !== "FUNDED") {
    return (
      <>
        <CabinetNotifications />
        <ApplicationScreen />
      </>
    );
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Кредиты</h1>
          <p className="page-subtitle">
            Готовые предложения банка, своя сумма и заявка со скорингом, Мультибанком и ПЭП
          </p>
        </div>
        <div className="page-actions">
          <button type="button" className="btn btn-ghost" onClick={() => setBusinessTab("home")}>
            На главную
          </button>
        </div>
      </div>

      <CabinetNotifications />

      {application?.status === "FUNDED" && (
        <div className="alert alert-good" style={{ marginBottom: 16 }}>
          Последняя заявка профинансирована. Деньги на счёте — можно оплатить черновик платежа на главной.
          Ниже можно открыть новую заявку.
        </div>
      )}

      <div className="dashboard-grid">
        <div className="main-column">
          {dashboard && <PreapprovedOffers triggers={dashboard.radar_triggers} />}
          <ApplicationForm />
        </div>
        <aside className="side-column">
          <SmartSearchPanel />
        </aside>
      </div>
    </>
  );
}
