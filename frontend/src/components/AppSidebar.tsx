import { Building2, CreditCard, FileStack, Home, Users } from "lucide-react";
import { useApp } from "../state/AppState";

export function AppSidebar() {
  const {
    viewMode,
    businessTab,
    bankTab,
    setBusinessTab,
    setBankTab,
    application,
  } = useApp();

  if (viewMode === "bank") {
    return (
      <aside className="app-sidebar" aria-label="Навигация банка">
        <div className="sidebar-brand">
          <div className="sidebar-brand-mark">А</div>
          <div>
            <div className="sidebar-brand-title">Пилот банка</div>
            <div className="sidebar-brand-sub">Клиенты и заявки</div>
          </div>
        </div>
        <nav className="sidebar-nav">
          <button
            type="button"
            className={`sidebar-link ${bankTab === "clients" ? "active" : ""}`}
            onClick={() => setBankTab("clients")}
          >
            <Users size={18} aria-hidden />
            Клиенты
          </button>
          <button
            type="button"
            className={`sidebar-link ${bankTab === "applications" ? "active" : ""}`}
            onClick={() => setBankTab("applications")}
          >
            <FileStack size={18} aria-hidden />
            Заявки
            {application && <span className="sidebar-badge">1</span>}
          </button>
        </nav>
      </aside>
    );
  }

  return (
    <aside className="app-sidebar" aria-label="Кабинет предпринимателя">
      <div className="sidebar-brand">
        <div className="sidebar-brand-mark">А</div>
        <div>
          <div className="sidebar-brand-title">Кабинет</div>
          <div className="sidebar-brand-sub">Счета и кредиты</div>
        </div>
      </div>
      <nav className="sidebar-nav">
        <button
          type="button"
          className={`sidebar-link ${businessTab === "home" ? "active" : ""}`}
          onClick={() => setBusinessTab("home")}
        >
          <Home size={18} aria-hidden />
          Главная
        </button>
        <button
          type="button"
          className={`sidebar-link ${businessTab === "credits" ? "active" : ""}`}
          onClick={() => setBusinessTab("credits")}
        >
          <CreditCard size={18} aria-hidden />
          Кредиты
          {application && application.status !== "FUNDED" && application.status !== "REJECTED" && (
            <span className="sidebar-badge">!</span>
          )}
        </button>
      </nav>
      <div className="sidebar-footer">
        <Building2 size={14} aria-hidden />
        <span>Альфа-Банк · демо</span>
      </div>
    </aside>
  );
}
