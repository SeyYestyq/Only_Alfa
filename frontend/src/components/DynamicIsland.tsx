import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowCounterClockwiseIcon } from "./icons";
import { useTheme } from "../hooks/useTheme";
import { useApp } from "../state/AppState";
import { useDemoStore } from "../state/demoStore";
import { formatMoney, roleLabel } from "../utils/format";

type ResetToast =
  | { kind: "ok"; title: string; text: string }
  | { kind: "err"; title: string; text: string }
  | null;

function shortName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0]} ${parts[1][0]}.`;
  }
  return fullName;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase();
}

function companyShortName(name: string | undefined): string {
  if (!name) {
    return "Компания";
  }
  return name.replace(/^ООО\s+/i, "").replace(/^ИП\s+/i, "ИП ");
}

/**
 * Верхний динамический остров: свёрнутый статус + разворот демо-контролов.
 * Заменяет DemoControlBar и баннеры busy/error.
 */
export function DynamicIsland() {
  const {
    companies,
    companyId,
    dashboard,
    userRole,
    viewMode,
    isBusy,
    error,
    clearError,
    application,
    selectCompany,
    setUserRole,
    setViewMode,
    resetAllScenarios,
  } = useApp();

  const noticeCount = useDemoStore((state) => state.clientNotices.length);
  const { theme, preference, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [flash, setFlash] = useState(false);
  const [resetToast, setResetToast] = useState<ResetToast>(null);
  const [companyOpen, setCompanyOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [companyQuery, setCompanyQuery] = useState("");
  const [userQuery, setUserQuery] = useState("");
  const [isScrolledHidden, setIsScrolledHidden] = useState(false);
  const lastScrollYRef = useRef(0);
  const islandRef = useRef<HTMLDivElement>(null);
  const prevNoticeCount = useRef(noticeCount);

  const company = dashboard?.company ?? companies.find((row) => row.id === companyId);
  const users = dashboard?.company.users ?? company?.users ?? [];
  const currentUser = users.find((user) => user.role === userRole) ?? users[0] ?? null;
  const companyShort = companyShortName(company?.name);

  const filteredCompanies = companies.filter((row) => {
    const hay = `${row.name} ${row.inn}`.toLowerCase();
    return !companyQuery.trim() || hay.includes(companyQuery.trim().toLowerCase());
  });

  const filteredUsers = useMemo(() => {
    const query = userQuery.trim().toLowerCase();
    return users.filter((user) => {
      if (!query) {
        return true;
      }
      const hay = `${user.full_name} ${roleLabel(user.role)}`.toLowerCase();
      return hay.includes(query);
    });
  }, [users, userQuery]);

  const statusLine = useMemo(() => {
    if (error) {
      return error.length > 48 ? `${error.slice(0, 48)}…` : error;
    }
    if (isBusy) {
      return "Считаем…";
    }
    if (viewMode === "bank") {
      if (application) {
        return `Разбор №${application.application_id.slice(-4).toUpperCase()}`;
      }
      const openCount = companies.length;
      return openCount > 0 ? `${openCount} на разборе` : "Очередь пуста";
    }
    if (application) {
      return application.status_label;
    }
    if (dashboard) {
      return `на счёте ${formatMoney(dashboard.account_balance)}`;
    }
    return "Кабинет";
  }, [error, isBusy, viewMode, application, companies.length, dashboard]);

  useEffect(() => {
    function onDocClick(event: MouseEvent) {
      if (!islandRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setCompanyOpen(false);
        setUserOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // Умный скролл: прячем при скролле вниз, показываем при скролле вверх или у топа страницы
  useEffect(() => {
    let ticking = false;

    function handleScroll() {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentY = window.scrollY;
          const diff = currentY - lastScrollYRef.current;

          // У самого верха страницы — остров всегда на виду
          if (currentY <= 35) {
            setIsScrolledHidden(false);
          } else if (open) {
            // Если развёрнут и пользователь активно скроллит вниз — плавно сворачиваем
            if (diff > 80 && currentY > 120) {
              setOpen(false);
              setCompanyOpen(false);
              setUserOpen(false);
              setIsScrolledHidden(true);
            }
          } else {
            // В свёрнутом виде: скролл вниз — прячем, скролл вверх — показываем
            if (diff > 8 && currentY > 60) {
              setIsScrolledHidden(true);
            } else if (diff < -8) {
              setIsScrolledHidden(false);
            }
          }

          lastScrollYRef.current = currentY;
          ticking = false;
        });
        ticking = true;
      }
    }

    function handleMouseMove(e: MouseEvent) {
      // Если курсор поднесён к верхней кромке экрана (sensor/edge) — плавно приоткрываем остров
      if (e.clientY <= 36) {
        setIsScrolledHidden(false);
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [open]);

  useEffect(() => {
    if (!resetToast) {
      return;
    }
    const timer = window.setTimeout(() => setResetToast(null), 5000);
    return () => window.clearTimeout(timer);
  }, [resetToast]);

  useEffect(() => {
    if (viewMode !== "business") {
      setUserOpen(false);
    }
  }, [viewMode]);

  useEffect(() => {
    if (isBusy || error) {
      setOpen(true);
      setIsScrolledHidden(false);
    }
  }, [isBusy, error]);

  useEffect(() => {
    if (noticeCount > prevNoticeCount.current) {
      setFlash(true);
      const timer = window.setTimeout(() => setFlash(false), 1500);
      prevNoticeCount.current = noticeCount;
      return () => window.clearTimeout(timer);
    }
    prevNoticeCount.current = noticeCount;
    return undefined;
  }, [noticeCount]);

  async function handleResetAll() {
    if (isBusy) return;
    try {
      await resetAllScenarios();
      setResetToast({
        kind: "ok",
        title: "Сценарии сброшены",
        text: "Все заявки, балансы компаний и чаты возвращены в исходное состояние",
      });
      window.setTimeout(() => setResetToast(null), 3000);
    } catch {
      setResetToast({
        kind: "err",
        title: "Ошибка сброса",
        text: "Не удалось сбросить демо-сценарии",
      });
      window.setTimeout(() => setResetToast(null), 3000);
    }
  }

  const islandClass = [
    "dyn-island",
    open ? "is-open" : "",
    isBusy ? "is-busy" : "",
    error ? "is-alert" : "",
    flash ? "is-flash" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      {/* Сенсорная зона у верхней кромки экрана для вызова острова мышью */}
      <div
        className="dyn-island-hover-sensor"
        onMouseEnter={() => setIsScrolledHidden(false)}
        aria-hidden
      />
      <div
        className={`dyn-island-anchor ${isScrolledHidden ? "is-scrolled-hidden" : ""}`}
        aria-live="polite"
      >
        <div className={islandClass} ref={islandRef}>
          <div className="dyn-island-header">
            <button
              type="button"
              className="dyn-island-pill"
              aria-expanded={open}
              onClick={() => setOpen((value) => !value)}
            >
              <span className={`dyn-island-dot ${isBusy ? "pulse" : ""} ${error ? "alert" : ""}`} />
              <span className="dyn-island-badge">ДЕМО</span>
              <span className="dyn-island-mode">{viewMode === "bank" ? "Банк" : "Бизнес"}</span>
              <span className="dyn-island-sep" aria-hidden>
                ·
              </span>
              <span className="dyn-island-company">{companyShort}</span>
              <span className="dyn-island-sep" aria-hidden>
                ·
              </span>
              <span className="dyn-island-status">{statusLine}</span>
              <span
                className="dyn-island-theme-cue"
                aria-hidden
                title={
                  preference === "auto"
                    ? `Тема: авто/система (${theme === "light" ? "светлая" : "тёмная"})`
                    : theme === "light"
                      ? "Светлая тема"
                      : "Тёмная тема"
                }
              >
                {preference === "auto" ? "⚙" : theme === "light" ? "☀" : "☾"}
              </span>
              <span className={`dyn-island-chevron ${open ? "is-expanded" : ""}`} aria-hidden>
                ▾
              </span>
            </button>
            <button
              type="button"
              className="dyn-island-quick-reset"
              disabled={isBusy}
              onClick={(e) => {
                e.stopPropagation();
              void handleResetAll();
            }}
            title="Сбросить все сценарии к исходному состоянию"
            aria-label="Сброс всех сценариев"
          >
            <span className="dyn-reset-icon" aria-hidden>
              <ArrowCounterClockwiseIcon size={14} />
            </span>
            <span className="dyn-quick-reset-label">Сброс</span>
          </button>
        </div>

        {open ? (
          <div className="dyn-island-body">
            {error ? (
              <div className="dyn-island-banner is-error" role="alert">
                <span>{error}</span>
                <button type="button" className="banner-close" onClick={clearError} aria-label="Закрыть">
                  ×
                </button>
              </div>
            ) : null}
            {isBusy && !error ? (
              <div className="dyn-island-banner is-busy">
                <span className="spinner" />
                <span>Выполняем расчёт…</span>
              </div>
            ) : null}

            <div className="dyn-island-controls">
              <div className={`demo-org ${companyOpen ? "open" : ""}`}>
                <button
                  type="button"
                  className="demo-org-trigger"
                  disabled={isBusy}
                  onClick={() => {
                    setCompanyOpen((value) => !value);
                    setUserOpen(false);
                  }}
                >
                  <span className="demo-org-icon" aria-hidden>
                    ◇
                  </span>
                  <span className="demo-org-name">{companyShort}</span>
                  <span className="demo-org-chevron" aria-hidden>
                    ▾
                  </span>
                </button>
                {companyOpen ? (
                  <div className="demo-popover demo-org-menu" role="listbox">
                    <input
                      className="demo-popover-search"
                      value={companyQuery}
                      onChange={(event) => setCompanyQuery(event.target.value)}
                      placeholder="Компания или ИНН…"
                      autoFocus
                    />
                    <ul className="demo-popover-list">
                      {filteredCompanies.map((row) => (
                        <li key={row.id}>
                          <button
                            type="button"
                            className={row.id === companyId ? "active" : ""}
                            onClick={() => {
                              void selectCompany(row.id, {
                                nextScreen: viewMode === "bank" ? "bank-queue" : "home",
                              });
                              setCompanyOpen(false);
                              setCompanyQuery("");
                            }}
                          >
                            <span className="demo-list-mark" aria-hidden>
                              {row.legal_form === "IP" ? "ИП" : "ОО"}
                            </span>
                            <span className="demo-list-label">
                              {row.name}
                              <small>ИНН {row.inn}</small>
                            </span>
                            {row.id === companyId ? <span className="demo-check">✓</span> : null}
                          </button>
                        </li>
                      ))}
                      {filteredCompanies.length === 0 ? (
                        <li className="demo-popover-empty">Ничего не найдено</li>
                      ) : null}
                    </ul>
                  </div>
                ) : null}
              </div>

              {viewMode === "business" && users.length > 0 ? (
                <div className={`demo-user ${userOpen ? "open" : ""}`}>
                  <button
                    type="button"
                    className="demo-user-trigger"
                    aria-haspopup="listbox"
                    aria-expanded={userOpen}
                    onClick={() => {
                      setUserOpen((value) => !value);
                      setCompanyOpen(false);
                    }}
                  >
                    <span className="demo-user-avatar" aria-hidden>
                      {initials(currentUser?.full_name ?? "П")}
                    </span>
                    <span className="demo-user-meta">
                      <span className="demo-user-name">
                        {currentUser ? shortName(currentUser.full_name) : "Пользователь"}
                      </span>
                      <span className="demo-user-role">
                        {currentUser ? roleLabel(currentUser.role) : "Роль"}
                      </span>
                    </span>
                    <span className="demo-org-chevron" aria-hidden>
                      ▾
                    </span>
                  </button>
                  {userOpen ? (
                    <div className="demo-popover demo-user-menu" role="listbox">
                      <div className="demo-popover-caption">Пользователь</div>
                      <input
                        className="demo-popover-search"
                        value={userQuery}
                        onChange={(event) => setUserQuery(event.target.value)}
                        placeholder="Имя или роль…"
                        autoFocus
                      />
                      <ul className="demo-popover-list">
                        {filteredUsers.map((user) => (
                          <li key={`${user.role}-${user.full_name}`}>
                            <button
                              type="button"
                              className={user.role === userRole ? "active" : ""}
                              onClick={() => {
                                setUserRole(user.role);
                                setUserOpen(false);
                                setUserQuery("");
                              }}
                            >
                              <span className="demo-user-avatar demo-user-avatar-sm" aria-hidden>
                                {initials(user.full_name)}
                              </span>
                              <span className="demo-list-label">
                                {user.full_name}
                                <small>{roleLabel(user.role)}</small>
                              </span>
                              {user.role === userRole ? <span className="demo-check">✓</span> : null}
                            </button>
                          </li>
                        ))}
                        {filteredUsers.length === 0 ? (
                          <li className="demo-popover-empty">Ничего не найдено</li>
                        ) : null}
                      </ul>
                    </div>
                  ) : null}
                </div>
              ) : null}

              <div className="dyn-island-theme-toggle" role="group" aria-label="Тема оформления">
                <button
                  type="button"
                  className={preference === "auto" ? "active" : ""}
                  aria-pressed={preference === "auto"}
                  onClick={() => setTheme("auto")}
                  title={`Следовать теме ОС (сейчас: ${theme === "light" ? "светлая" : "тёмная"})`}
                >
                  Авто
                </button>
                <button
                  type="button"
                  className={preference === "light" ? "active" : ""}
                  aria-pressed={preference === "light"}
                  onClick={() => setTheme("light")}
                  title="Принудительно светлая тема"
                >
                  Светлая
                </button>
                <button
                  type="button"
                  className={preference === "dark" ? "active" : ""}
                  aria-pressed={preference === "dark"}
                  onClick={() => setTheme("dark")}
                  title="Принудительно тёмная тема"
                >
                  Тёмная
                </button>
              </div>

              <div className="figma-view-toggle">
                <button
                  type="button"
                  className={viewMode === "business" ? "active" : ""}
                  onClick={() => setViewMode("business")}
                >
                  Глазами бизнеса
                </button>
                <button
                  type="button"
                  className={viewMode === "bank" ? "active" : ""}
                  onClick={() => setViewMode("bank")}
                >
                  Глазами банка
                </button>
              </div>

              <button
                type="button"
                className="dyn-island-reset-btn"
                disabled={isBusy}
                onClick={() => void handleResetAll()}
                title="Сбросить все заявки, события, балансы компаний и чаты к исходному демо-состоянию"
              >
                <span className="dyn-reset-icon" aria-hidden>
                  <ArrowCounterClockwiseIcon size={14} />
                </span>
                <span>Сброс всех сценариев</span>
              </button>

              {resetToast && open ? (
                <div className={`demo-inn-toast ${resetToast.kind}`} role="status" style={{ marginTop: 12 }}>
                  <span className="demo-inn-toast-ico" aria-hidden>
                    {resetToast.kind === "ok" ? "✓" : "!"}
                  </span>
                  <div>
                    <strong>{resetToast.title}</strong>
                    <span>{resetToast.text}</span>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        {resetToast && !open ? (
          <div className={`demo-inn-toast ${resetToast.kind} dyn-island-toast`} role="status">
            <span className="demo-inn-toast-ico" aria-hidden>
              {resetToast.kind === "ok" ? "✓" : "!"}
            </span>
            <div>
              <strong>{resetToast.title}</strong>
              <span>{resetToast.text}</span>
            </div>
          </div>
        ) : null}
      </div>
    </div>
    </>
  );
}
