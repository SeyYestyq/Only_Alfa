import { useEffect, useState } from "react";
import { api } from "../../api/client";
import type { Dashboard, NewsItem } from "../../api/types";
import { FeedColumn } from "../../components/v2/FeedColumn";
import { useApp } from "../../state/AppState";

export function FeedsScreen() {
  const { companies, goToScreen, selectCompany } = useApp();
  const [rows, setRows] = useState<Dashboard[]>([]);

  useEffect(() => {
    const keys = ["rosters", "tekhnostroy", "smirnov"];
    const targets = keys
      .map((key) => companies.find((company) => company.demo_key === key))
      .filter((company) => company !== undefined);
    let cancel = false;
    void Promise.all(targets.map((company) => api.getDashboard(company.id))).then((payload) => {
      if (!cancel) {
        setRows(payload);
      }
    });
    return () => {
      cancel = true;
    };
  }, [companies]);

  function onCta(dashboard: Dashboard, item: NewsItem) {
    const cta = item.cta.toLowerCase();
    const screen = cta.includes("чат") ? "messages" : cta.includes("заяв") || cta.includes("услови") ? "apply" : "home";
    void selectCompany(dashboard.company.id, { nextScreen: screen });
  }

  return (
    <>
      <div className="v2-row">
        <div>
          <h1 className="v2-h1">3 клиента — 3 ленты</h1>
          <p className="v2-lead">
            Одна механика. Лента собирается из отрасли, адреса, операций и роли. Переключатель компании меняет ленту на главной.
          </p>
        </div>
        <span className="v2-pill demo">демо-данные</span>
      </div>
      {rows.length === 0 ? <p className="v2-muted">Собираем ленты…</p> : null}
      <div className="v2-feeds">
        {rows.map((dashboard) => (
          <FeedColumn key={dashboard.company.id} dashboard={dashboard} onCta={(item) => onCta(dashboard, item)} />
        ))}
      </div>
      <button type="button" className="v2-link" onClick={() => goToScreen("home")}>На главную выбранной компании</button>
    </>
  );
}
