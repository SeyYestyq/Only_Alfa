import { useEffect, useState } from "react";
import { api } from "../api/client";
import type { BankQueueItem } from "../api/types";
import { useApp } from "../state/AppState";
import { formatDateTime, formatMoney, statusTone } from "../utils/format";
import { InspectorScreen } from "../screens/InspectorScreen";

export function BankApplicationsPanel() {
  const { companies, application, openApplication, clearApplication, isBusy } = useApp();
  const [queue, setQueue] = useState<BankQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const batches = await Promise.all(
          companies.map(async (company) => {
            const response = await api.getCompanyApplications(company.id);
            return response.applications.map((item) => ({ ...item, company }));
          }),
        );
        if (cancelled) {
          return;
        }
        const flat = batches.flat().sort((a, b) => {
          const left = a.created_at ? new Date(a.created_at).getTime() : 0;
          const right = b.created_at ? new Date(b.created_at).getTime() : 0;
          return right - left;
        });
        setQueue(flat);
      } catch (cause) {
        if (!cancelled) {
          setLoadError(cause instanceof Error ? cause.message : String(cause));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [companies, application?.application_id, application?.status, application?.updated_at]);

  if (application) {
    return (
      <>
        <div className="bank-app-toolbar">
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => clearApplication()}>
            ← К списку заявок
          </button>
          <span className="faint">
            Аналитика бизнеса и условия заявки · действия пилота банка ниже
          </span>
        </div>
        <InspectorScreen />
      </>
    );
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Заявки на кредит</h1>
          <p className="page-subtitle">
            Очередь по всем клиентам · откройте заявку: аналитика → условия → решение пилота
          </p>
        </div>
      </div>

      <section className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">Очередь</h2>
            <p className="card-subtitle">Данные с GET /companies/&#123;id&#125;/applications</p>
          </div>
          <span className="pill pill-outline">{queue.length}</span>
        </div>
        <div className="card-body">
          {loading && (
            <div className="loading">
              <span className="spinner" /> Собираем заявки портфеля…
            </div>
          )}
          {loadError && <div className="alert alert-risk">{loadError}</div>}
          {!loading && !loadError && queue.length === 0 && (
            <div className="empty-state" style={{ padding: 24 }}>
              <h3>Заявок пока нет</h3>
              <p>Создайте заявку глазами бизнеса — она появится в этой очереди.</p>
            </div>
          )}
          {!loading && queue.length > 0 && (
            <table className="table">
              <thead>
                <tr>
                  <th>Клиент</th>
                  <th>Сумма</th>
                  <th>Балл</th>
                  <th>Статус</th>
                  <th>Создана</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {queue.map((item) => (
                  <tr key={item.application_id}>
                    <td>
                      <div>{item.company.name}</div>
                      <div className="faint mono" style={{ fontSize: 11 }}>
                        {item.application_id.slice(-8)}
                      </div>
                    </td>
                    <td className="mono">{formatMoney(item.requested_amount_rub)}</td>
                    <td className="mono">{item.risk_score}</td>
                    <td>
                      <span
                        className={`pill ${
                          statusTone(item.status) === "GOOD"
                            ? "pill-good"
                            : statusTone(item.status) === "RISK"
                              ? "pill-risk"
                              : "pill-warn"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="faint nowrap">{formatDateTime(item.created_at)}</td>
                    <td style={{ textAlign: "right" }}>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        disabled={isBusy}
                        onClick={() => void openApplication(item.application_id)}
                      >
                        Открыть
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </>
  );
}
