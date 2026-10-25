import { NoticeBell } from "./NoticeBell";
import { useApp } from "../state/AppState";
import type { ScreenId } from "../api/types";
import { useDemoStore } from "../state/demoStore";
import { useBankMessagesStore } from "../state/bankMessagesStore";
import { roleLabel } from "../utils/format";

type NavLink = { id: ScreenId; label: string; badge?: number };

const CREDIT_SCREENS: ScreenId[] = [
  "applications",
  "apply",
  "passport",
  "decision",
  "signing",
];

/** Навигация личного кабинета: Главная, Кредиты и Оплата счёта — в разных вкладках. */
const CLIENT_LINKS: NavLink[] = [
  { id: "home", label: "Главная" },
  { id: "applications", label: "Кредиты" },
  { id: "invoice", label: "Оплатить счёт" },
];

/** Портфель = список компаний + 360°. */
const BANK_CLIENT_SCREENS: ScreenId[] = ["bank-clients", "bank-profile", "bank-queue"];

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase();
}

export function AppNav() {
  const { screen, goToScreen, viewMode, dashboard, userRole, application, companies, templates } = useApp();
  const company = dashboard?.company;
  const user = company?.users.find((row) => row.role === userRole) ?? company?.users[0];
  const displayName =
    viewMode === "bank" ? "Елена Орлова" : (user?.full_name ?? "Пользователь");
  const displayRole =
    viewMode === "bank" ? "Кредитный инспектор" : roleLabel(userRole);
  const noticeCount = useDemoStore((state) => state.clientNotices.length);
  const unreadChats = useBankMessagesStore((state) =>
    state.threads.reduce((sum, t) => sum + t.unreadCount, 0),
  );

  const creditBadge =
    noticeCount > 0
      ? noticeCount
      : application?.status === "NEED_MORE_INFO" ||
          application?.status === "COUNTER_OFFER" ||
          application?.status === "APPROVED" ||
          application?.status === "AWAITING_CEO_APPROVAL"
        ? 1
        : undefined;

  /** Подписи для кредитного конвейера: Клиенты, Чаты, активный Разбор и Портфель. */
  const bankLinks: NavLink[] = [
    {
      id: "bank-clients",
      label: "Клиенты",
    },
    {
      id: "bank-messages",
      label: "Чаты",
      badge: unreadChats > 0 ? unreadChats : undefined,
    },
    ...(application
      ? [
          {
            id: "bank-xray" as ScreenId,
            label: `Разбор №${application.application_id.slice(-4).toUpperCase()}`,
          },
        ]
      : []),
    { id: "bank-effect", label: "Портфель" },
  ];
  const links = viewMode === "bank" ? bankLinks : CLIENT_LINKS;

  return (
    <header className="figma-topnav">
      <div className="figma-logo">
        <span className="figma-logo-mark">А</span>
        <div>
          <div className="figma-logo-title">Альфа Бизнес</div>
          <div className="figma-logo-sub">
            {viewMode === "bank" ? "Кредитный конвейер МСП" : "Кредитный кабинет"}
          </div>
        </div>
      </div>

      <nav className="figma-nav-items" aria-label="Разделы">
        {links.map((link) => {
          const active =
            link.id === "applications"
              ? CREDIT_SCREENS.includes(screen)
              : link.id === "invoice"
                ? screen === "invoice"
                : link.id === "bank-xray"
                  ? screen === "bank-xray"
                  : link.id === "bank-messages"
                    ? screen === "bank-messages"
                    : link.id === "bank-clients"
                      ? BANK_CLIENT_SCREENS.includes(screen)
                      : screen === link.id;
          const badge =
            link.id === "applications"
              ? creditBadge
              : link.id === "invoice"
                ? (templates.length > 0 ? templates.length : undefined)
                : link.badge;
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
          aria-label="Открыть умный поиск"
        >
          Найти платёж или сервис…
        </button>
      ) : (
        <button
          type="button"
          className="figma-search"
          onClick={() => goToScreen("bank-clients")}
          title="Открыть список клиентов — поиск по названию или ИНН"
        >
          Найти клиента по ИНН…
        </button>
      )}

      <NoticeBell />

      <div className="figma-profile">
        <span className="figma-avatar">{initials(displayName)}</span>
        <div>
          <div className="figma-profile-name">{displayName}</div>
          <div className="figma-profile-role">{displayRole}</div>
        </div>
      </div>
    </header>
  );
}
