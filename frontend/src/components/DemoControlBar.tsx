import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import type { ActorRole } from "../api/types";
import { useApp } from "../state/AppState";
import { roleLabel } from "../utils/format";

type InnToast =
  | { kind: "ok"; title: string; text: string }
  | { kind: "err"; title: string; text: string }
  | null;

/** К0 — демо-полоса: компания, ИНН, роль (Figma frames copy 15–18). */
export function DemoControlBar() {
  const {
    companies,
    companyId,
    dashboard,
    userRole,
    viewMode,
    isBusy,
    selectCompany,
    lookupInn,
    setUserRole,
    setViewMode,
  } = useApp();

  const [inn, setInn] = useState("");
  const [innToast, setInnToast] = useState<InnToast>(null);
  const [companyOpen, setCompanyOpen] = useState(false);
  const [roleOpen, setRoleOpen] = useState(false);
  const [companyQuery, setCompanyQuery] = useState("");
  const [roleQuery, setRoleQuery] = useState("");
  const barRef = useRef<HTMLDivElement>(null);

  const company = dashboard?.company ?? companies.find((row) => row.id === companyId);
  const users = dashboard?.company.users ?? company?.users ?? [];

  const roles = useMemo(() => {
    const fromUsers = users.map((user) => user.role);
    const fallback: ActorRole[] = ["CEO_OWNER", "IP_OWNER", "ACCOUNTANT"];
    const list = (fromUsers.length > 0 ? fromUsers : fallback).filter(
      (role, index, all) => all.indexOf(role) === index,
    );
    return list;
  }, [users]);

  const filteredCompanies = companies.filter((row) => {
    const hay = `${row.name} ${row.inn}`.toLowerCase();
    return !companyQuery.trim() || hay.includes(companyQuery.trim().toLowerCase());
  });

  const filteredRoles = roles.filter((role) => {
    const label = roleLabel(role).toLowerCase();
    return !roleQuery.trim() || label.includes(roleQuery.trim().toLowerCase());
  });

  useEffect(() => {
    function onDocClick(event: MouseEvent) {
      if (!barRef.current?.contains(event.target as Node)) {
        setCompanyOpen(false);
        setRoleOpen(false);
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

  const companyShort =
    company?.name.replace(/^ООО\s+/i, "").replace(/^ИП\s+/i, "ИП ") ?? "Компания";

  return (
    <div className="figma-demo" ref={barRef}>
      <span className="figma-demo-badge">ДЕМО</span>

      {/* copy 18 — компания + поиск */}
      <div className={`demo-org ${companyOpen ? "open" : ""}`}>
        <button
          type="button"
          className="demo-org-trigger"
          disabled={isBusy}
          onClick={() => {
            setCompanyOpen((open) => !open);
            setRoleOpen(false);
          }}
        >
          <span className="demo-org-icon" aria-hidden>
            ◇
          </span>
          <span className="demo-org-name">{companyShort}</span>
          <span className="demo-org-search-hint" aria-hidden>
            ⌕
          </span>
          <span className="demo-org-search-label">Search…</span>
        </button>
        {companyOpen && (
          <div className="demo-popover demo-org-menu" role="listbox">
            <input
              className="demo-popover-search"
              value={companyQuery}
              onChange={(event) => setCompanyQuery(event.target.value)}
              placeholder="Search…"
              autoFocus
            />
            <div className="demo-popover-org">
              <span className="demo-popover-org-mark">А</span>
              <div>
                <strong>Альфа</strong>
                <span>Organization</span>
              </div>
            </div>
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
                    <span className="demo-role-ico" aria-hidden>
                      {row.legal_form === "IP" ? "ИП" : "ОО"}
                    </span>
                    <span className="demo-role-label">
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
        )}
      </div>

      {/* copy 16–17 — проверка ИНН + тосты */}
      <div className="demo-inn">
        <form className="demo-inn-form" onSubmit={(event) => void handleLookup(event)}>
          <div className="demo-inn-field">
            <input
              value={inn}
              onChange={(event) => setInn(event.target.value.replace(/\D/g, "").slice(0, 12))}
              placeholder="0123456789"
              inputMode="numeric"
              disabled={isBusy}
              aria-label="ИНН"
            />
            {isBusy ? <span className="demo-inn-spinner" aria-hidden /> : null}
          </div>
          <button type="submit" className="demo-inn-btn" disabled={isBusy || inn.trim().length < 10}>
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

      <div className="figma-demo-spacer" />

      {/* copy 15 — роль */}
      <div className={`demo-role ${roleOpen ? "open" : ""}`}>
        <button
          type="button"
          className="demo-role-trigger"
          onClick={() => {
            setRoleOpen((open) => !open);
            setCompanyOpen(false);
          }}
        >
          <span className="demo-role-trigger-ico" aria-hidden>
            ◎
          </span>
          Роль
        </button>
        {roleOpen && (
          <div className="demo-popover demo-role-menu" role="listbox">
            <input
              className="demo-popover-search"
              value={roleQuery}
              onChange={(event) => setRoleQuery(event.target.value)}
              placeholder="Search by name…"
              autoFocus
            />
            <div className="demo-popover-org">
              <span className="demo-popover-org-mark">А</span>
              <div>
                <strong>Альфа</strong>
                <span>Organization</span>
              </div>
            </div>
            <ul className="demo-popover-list">
              {filteredRoles.map((role) => (
                <li key={role}>
                  <button
                    type="button"
                    className={role === userRole ? "active" : ""}
                    onClick={() => {
                      setUserRole(role);
                      setRoleOpen(false);
                      setRoleQuery("");
                    }}
                  >
                    <span className="demo-role-ico" aria-hidden>
                      ◇
                    </span>
                    <span className="demo-role-label">{roleLabel(role)}</span>
                    {role === userRole ? <span className="demo-check">✓</span> : null}
                  </button>
                </li>
              ))}
              {filteredRoles.length === 0 ? (
                <li className="demo-popover-empty">Ничего не найдено</li>
              ) : null}
            </ul>
          </div>
        )}
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
    </div>
  );
}
