import { useState, type FormEvent } from "react";
import type { ActorRole } from "../api/types";
import { useApp } from "../state/AppState";
import { roleLabel } from "../utils/format";

/** К0 — компактная демо-полоса как в Figma DemoBar. */
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
  const [expanded, setExpanded] = useState(false);

  const company = dashboard?.company ?? companies.find((row) => row.id === companyId);
  const users = dashboard?.company.users ?? [];

  async function handleLookup(event: FormEvent) {
    event.preventDefault();
    if (!inn.trim()) {
      return;
    }
    await lookupInn(inn.trim());
    setInn("");
  }

  return (
    <div className="figma-demo">
      <span className="figma-demo-badge">ДЕМО</span>

      <label className="figma-pill" style={{ cursor: "pointer" }}>
        <span className="tag">{company?.legal_form === "IP" ? "ИП" : "ООО"}</span>
        <select
          value={companyId ?? ""}
          disabled={isBusy}
          onChange={(event) => void selectCompany(event.target.value)}
          style={{
            border: "none",
            background: "transparent",
            color: "inherit",
            font: "inherit",
            maxWidth: 220,
            outline: "none",
          }}
        >
          {companies.map((row) => (
            <option key={row.id} value={row.id}>
              {row.name}
            </option>
          ))}
        </select>
        <span className="muted">
          {company?.okved_code ?? "—"} · {company?.okved_cluster ?? ""}
        </span>
      </label>

      <form className="figma-pill" onSubmit={handleLookup}>
        <span className="muted">⌕</span>
        <input
          value={inn}
          onChange={(event) => setInn(event.target.value)}
          placeholder="Проверить любой ИНН"
          style={{
            border: "none",
            background: "transparent",
            color: "inherit",
            font: "inherit",
            width: 140,
            outline: "none",
          }}
        />
        {expanded && (
          <button type="submit" className="btn btn-primary btn-sm" disabled={isBusy}>
            OK
          </button>
        )}
      </form>

      <div className="figma-demo-spacer" />

      <label className="figma-pill">
        <span className="muted">Роль:</span>
        <select
          value={userRole}
          onChange={(event) => setUserRole(event.target.value as ActorRole)}
          style={{
            border: "none",
            background: "transparent",
            color: "inherit",
            font: "inherit",
            outline: "none",
          }}
        >
          {(users.length > 0 ? users.map((user) => user.role) : (["CEO_OWNER", "ACCOUNTANT"] as ActorRole[]))
            .filter((role, index, all) => all.indexOf(role) === index)
            .map((role) => (
              <option key={role} value={role}>
                {roleLabel(role)}
              </option>
            ))}
        </select>
      </label>

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

      <button type="button" className="figma-demo-link" onClick={() => setExpanded((value) => !value)}>
        {expanded ? "▴ Свернуть" : "▾ Ещё"}
      </button>
    </div>
  );
}
