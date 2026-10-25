import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useApp } from "../state/AppState";
import { useDemoStore } from "../state/demoStore";
import { formatMoney, roleLabel } from "../utils/format";

type InnToast =
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
    lookupInn,
    setUserRole,
    setViewMode,
  } = useApp();

  const noticeCount = useDemoStore((state) => state.clientNotices.length);
  const [open, setOpen] = useState(false);
  const [flash, setFlash] = useState(false);
  const [inn, setInn] = useState("");
  const [innToast, setInnToast] = useState<InnToast>(null);
  const [companyOpen, setCompanyOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [companyQuery, setCompanyQuery] = useState("");
  const [userQuery, setUserQuery] = useState("");
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

  useEffect(() => {
    if (!innToast) {
      return;
    }
    const timer = window.setTimeout(() => setInnToast(null), 5000);
    return () => window.clearTimeout(timer);
  }, [innToast]);

  useEffect(() => {
    if (viewMode !== "business") {
      setUserOpen(false);
    }
  }, [viewMode]);

  useEffect(() => {
    if (isBusy || error) {
      setOpen(true);
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

  async function handleLookup(event: FormEvent) {
    event.preventDefault();
    const value = inn.trim();
    if (!value) {
      return;
    }
    setInnToast(null);
    const result = await lookupInn(value);
    if (result.ok) {
      setInnToast({ kind: "ok", title: "ИНН найден", text: result.name });
      setInn(value);
    } else {
      setInnToast({
        kind: "err",
        title: "ИНН не найден",
        text: result.message || "Проверьте корректность номера",
      });
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
    <div className="dyn-island-anchor" aria-live="polite">
      <div className={islandClass} ref={islandRef}>
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
          <span className="dyn-island-chevron" aria-hidden>
            {open ? "▴" : "▾"}
          </span>
        </button>

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

              <div className="demo-inn">
                <form className="demo-inn-form" onSubmit={(event) => void handleLookup(event)}>
                  <div className="demo-inn-field">
                    <input
                      value={inn}
                      onChange={(event) => setInn(event.target.value.replace(/\D/g, "").slice(0, 12))}
                      placeholder="ИНН"
                      inputMode="numeric"
                      disabled={isBusy}
                      aria-label="ИНН"
                    />
                    {isBusy ? <span className="demo-inn-spinner" aria-hidden /> : null}
                  </div>
                  <button
                    type="submit"
                    className="demo-inn-btn"
                    disabled={isBusy || inn.trim().length < 10}
                  >
                    Проверить
                  </button>
                </form>
                {innToast ? (
                  <div className={`demo-inn-toast ${innToast.kind}`} role="status">
                    <span className="demo-inn-toast-ico" aria-hidden>
                      {innToast.kind === "ok" ? "✓" : "!"}
                    </span>
                    <div>
                      <strong>{innToast.title}</strong>
                      <span>{innToast.text}</span>
                    </div>
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
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
