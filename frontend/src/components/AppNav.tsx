import { useApp } from "../state/AppState";
import type { ScreenId } from "../api/types";
import { roleLabel } from "../utils/format";

type NavLink = { id: ScreenId; label: string; badge?: number };

const CREDIT_SCREENS: ScreenId[] = ["applications", "apply", "passport", "decision", "signing"];

const CLIENT_LINKS: NavLink[] = [
  { id: "home", label: "Главная" },
  { id: "payments", label: "Выручка и платежи" },
  { id: "applications", label: "Заявки и предложения" },
  { id: "messages", label: "Сообщения" },
  { id: "documents", label: "Документы" },
];

const BANK_LINKS: NavLink[] = [
  { id: "bank-queue", label: "Очередь" },
  { id: "bank-signal", label: "Сигналы" },
  { id: "bank-clients", label: "Клиенты" },
  { id: "bank-messages", label: "Сообщения" },
  { id: "bank-effect", label: "Эффект", badge: 3 },
];

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase();
}

export function AppNav() {
  const { screen, goToScreen, viewMode, dashboard, userRole, setUserRole } = useApp();
  const links = viewMode === "bank" ? BANK_LINKS : CLIENT_LINKS;
  const company = dashboard?.company;
  const user = company?.users.find((row) => row.role === userRole) ?? company?.users[0];
  const displayName =
    viewMode === "bank" ? "Елена Орлова" : (user?.full_name ?? "Пользователь");
  const displayRole =
    viewMode === "bank" ? "Кредитный инспектор" : roleLabel(userRole);
  const messageCount = dashboard?.news_feed.length ?? 0;

  function switchRole() {
    const roles = (company?.users ?? [])
      .map((row) => row.role)
      .filter((role, index, all) => all.indexOf(role) === index);
    if (roles.length < 2) {
      return;
    }
    const current = roles.indexOf(userRole);
    const next = roles[(current + 1) % roles.length];
    if (next) {
      setUserRole(next);
    }
  }

  return (
    <header className="figma-topnav">
      <div className="figma-logo">
        <span className="figma-logo-mark">А</span>
        <div>
          <div className="figma-logo-title">Альфа Бизнес</div>
          <div className="figma-logo-sub">
            {viewMode === "bank" ? "Кредитный конвейер" : "Кредитный кабинет"}
          </div>
        </div>
      </div>

      <nav className="figma-nav-items" aria-label="Разделы">
        {links.map((link) => {
          const active =
            link.id === "applications"
              ? CREDIT_SCREENS.includes(screen)
              : link.id === "payments"
                ? screen === "payments" || screen === "invoice"
                : screen === link.id;
          const badge = link.id === "messages" ? messageCount : link.badge;
          return (
            <button
              key={link.id}
              type="button"
              className={`figma-nav-item ${active ? "active" : ""}`}
              onClick={() => goToScreen(link.id)}
            >
              {link.label}
              {typeof badge === "number" && badge > 0 ? (
                <span className="figma-nav-badge">{badge}</span>
              ) : null}
            </button>
          );
        })}
      </nav>

      <div className="app-nav-spacer" />

      {viewMode === "business" ? (
        <button
          type="button"
          className={`figma-search ${screen === "search" ? "active" : ""}`}
          onClick={() => goToScreen("search")}
        >
          Поиск по операциям и сервисам
        </button>
      ) : (
        <div className="figma-search">Поиск: ИНН, клиент, заявка №</div>
      )}

      <button type="button" className="figma-profile" onClick={switchRole}>
        <span className="figma-avatar">{initials(displayName)}</span>
        <div>
          <div className="figma-profile-name">{displayName}</div>
          <div className="figma-profile-role">
            {displayRole}
            {viewMode === "business" ? " · сменить роль" : ""}
          </div>
        </div>
      </button>
    </header>
  );
}
