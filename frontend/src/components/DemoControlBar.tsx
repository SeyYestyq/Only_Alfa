import { useState, type FormEvent } from "react";
import type { ActorRole } from "../api/types";
import { useApp } from "../state/AppState";
import { roleLabel } from "../utils/format";
import { formatMoney } from "../utils/format";

export function DemoControlBar() {
  const {
    companies,
    companyId,
    dashboard,
    userRole,
    effectiveRole,
    viewMode,
    cbrRate,
    isBusy,
    selectCompany,
    lookupInn,
    setUserRole,
    setViewMode,
  } = useApp();
  const [inn, setInn] = useState("");

  const users = dashboard?.company.users ?? [];
  const bankMode = viewMode === "bank";

  async function handleLookup(event: FormEvent) {
    event.preventDefault();
    if (!inn.trim()) {
      return;
    }
    await lookupInn(inn.trim());
    setInn("");
  }

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <div className="topbar-main">
          <div className="brand">
            <div className="brand-mark">A</div>
            <div>
              <div className="brand-title">Умный кредитный кабинет</div>
              <div className="brand-sub">Альфа-Банк · Only_Alfa</div>
            </div>
          </div>

          <div className="control-group" style={{ minWidth: 320 }}>
            <label className="control-label" htmlFor="company-select">
              Демо-компания
            </label>
            <select
              id="company-select"
              className="control-select"
              value={companyId ?? ""}
              disabled={isBusy}
              onChange={(event) => void selectCompany(event.target.value)}
            >
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name} · ИНН {company.inn}
                </option>
              ))}
            </select>
          </div>

          <form className="control-group" onSubmit={handleLookup}>
            <label className="control-label" htmlFor="inn-input">
              Поиск любого ИНН
            </label>
            <div className="control-row">
              <input
                id="inn-input"
                className="control-input"
                placeholder="10 или 12 цифр"
                inputMode="numeric"
                maxLength={12}
                value={inn}
                onChange={(event) => setInn(event.target.value.replace(/\D/g, ""))}
              />
              <button className="btn btn-primary btn-sm" type="submit" disabled={isBusy || inn.length < 10}>
                Найти
              </button>
            </div>
          </form>

          <div className="topbar-spacer" />

          <div className="topbar-metrics" style={{ display: "flex", gap: 8 }}>
            <div className="metric-chip">
              <span>Остаток на счёте</span>
              <span className="mono">{formatMoney(dashboard?.account_balance ?? 0)}</span>
            </div>
            <div className="metric-chip">
              <span>Ключевая ставка ЦБ</span>
              <span className="mono">{cbrRate === null ? "—" : `${cbrRate.toFixed(1)}%`}</span>
            </div>
          </div>
        </div>

        <div className="control-bar">
          <div className="control-group">
            <span className="control-label">Роль в системе</span>
            <select
              className="control-select"
              style={{ minWidth: 230 }}
              value={bankMode ? "UNDERWRITER" : userRole}
              disabled={bankMode}
              onChange={(event) => setUserRole(event.target.value as ActorRole)}
            >
              {bankMode ? (
                <option value="UNDERWRITER">Кредитный инспектор банка</option>
              ) : (
                users.map((user) => (
                  <option key={user.id} value={user.role}>
                    {user.full_name} · {user.role_label}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="control-group">
            <span className="control-label">Режим просмотра</span>
            <div className="segmented">
              <button
                type="button"
                className={`segment ${viewMode === "business" ? "active" : ""}`}
                onClick={() => setViewMode("business")}
              >
                Глазами бизнеса
              </button>
              <button
                type="button"
                className={`segment ${viewMode === "bank" ? "active" : ""}`}
                onClick={() => setViewMode("bank")}
              >
                Глазами банка
              </button>
            </div>
          </div>

          <div className="metric-chip" style={{ minWidth: 150 }}>
            <span>Действующая роль</span>
            <span style={{ fontSize: 12 }}>{roleLabel(effectiveRole)}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
