import { NoticeBell } from "./NoticeBell";
import { useApp } from "../state/AppState";
import type { ScreenId } from "../api/types";
import { noticesForRole, useDemoStore } from "../state/demoStore";
import { roleLabel } from "../utils/format";

type NavLink = { id: ScreenId; label: string; badge?: number };

const CREDIT_SCREENS: ScreenId[] = [
  "applications",
  "apply",
  "passport",
  "decision",
  "signing",
  "invoice",
];

/** Документы договора — на шаге «Подпись», не отдельный раздел. */
const CLIENT_LINKS: NavLink[] = [
  { id: "home", label: "Главная" },
  { id: "applications", label: "Кредит" },
];

/** Разбор = стол заявки (xray/messages). Сигнал CAPEX — отдельный экран. */
const BANK_DESK_SCREENS: ScreenId[] = ["bank-xray", "bank-messages"];
/** Портфель = список компаний + 360°. */
const BANK_CLIENT_SCREENS: ScreenId[] = ["bank-clients", "bank-profile"];

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase();
}

export function AppNav() {
  const { screen, goToScreen, viewMode, dashboard, userRole, application, companies } = useApp();
  const company = dashboard?.company;
  const user = company?.users.find((row) => row.role === userRole) ?? company?.users[0];
  const displayName =
    viewMode === "bank" ? "Елена Орлова" : (user?.full_name ?? "Пользователь");
  const displayRole =
    viewMode === "bank" ? "Кредитный инспектор" : roleLabel(userRole);
  const allNotices = useDemoStore((state) => state.clientNotices);
  const noticeCount = noticesForRole(allNotices, userRole).length;
  const creditBadge =
    noticeCount > 0
      ? noticeCount
      : application?.status === "NEED_MORE_INFO" ||
          application?.status === "COUNTER_OFFER" ||
          application?.status === "APPROVED" ||
          application?.status === "AWAITING_CEO_APPROVAL"
        ? 1
        : undefined;

  /** Подписи как у кредитного конвейера, не «красивые абстракции». */
  const bankLinks: NavLink[] = [
    {
      id: "bank-queue",
      label: "На разборе",
      badge: companies.length > 0 ? companies.length : undefined,
    },
    {
      id: "bank-xray",
      label: application
        ? `Разбор №${application.application_id.slice(-4).toUpperCase()}`
        : "Разбор",
    },
    { id: "bank-clients", label: "Портфель" },
    { id: "bank-effect", label: "Показатели банка" },
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
              : link.id === "bank-xray"
                ? BANK_DESK_SCREENS.includes(screen)
                : link.id === "bank-clients"
                  ? BANK_CLIENT_SCREENS.includes(screen)
                  : screen === link.id;
          const badge = link.id === "applications" ? creditBadge : link.badge;
          const deskNeedsCase = link.id === "bank-xray" && !application && viewMode === "bank";
          return (
            <button
              key={link.id}
              type="button"
              className={`figma-nav-item ${active ? "active" : ""} ${deskNeedsCase ? "is-muted" : ""}`}
              title={
                deskNeedsCase
                  ? "Сначала откройте заявку в списке «На разборе»"
                  : undefined
              }
              onClick={() => {
                if (deskNeedsCase) {
                  goToScreen("bank-queue");
                  return;
                }
                goToScreen(link.id);
              }}
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
          onClick={() => goToScreen("bank-queue")}
          title="Открыть список заявок — поиск по ИНН внутри"
        >
          Найти заявку по ИНН…
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
