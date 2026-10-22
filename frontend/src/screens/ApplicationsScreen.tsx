import { useEffect } from "react";
import { useApp } from "../state/AppState";
import { formatDateTime, formatMoney, statusTone } from "../utils/format";

const TONE_CLASS = {
  GOOD: "pill-good",
  WARN: "pill-warn",
  RISK: "pill-risk",
  NEUTRAL: "pill-neutral",
} as const;

/** Список заявок: после согласия на кредит здесь виден статус, который вернул банк. */
export function ApplicationsScreen() {
  const { applications, loadApplications, openApplication, goToScreen, isBusy } = useApp();

  useEffect(() => {
    void loadApplications();
  }, [loadApplications]);

  return (
    <>
      <div className="page-header">
        <div>
          <div className="figma-eyebrow">Кредитный путь</div>
          <h1 className="figma-h1">Заявки</h1>
          <p className="figma-lead">
            Здесь статус каждой заявки. Откройте строку, чтобы продолжить проверки, решение или подпись.
          </p>
        </div>
      </div>

      {applications.length === 0 ? (
        <div className="empty-state">
          <h3>Заявок пока нет</h3>
          <p>Они появляются, когда при оплате счёта вы соглашаетесь оформить кредит.</p>
          <button type="button" className="btn btn-primary" onClick={() => goToScreen("invoice")}>
            К оплате счёта
          </button>
        </div>
      ) : (
        <section className="figma-panel figma-panel-sm">
          <table className="table">
            <thead>
              <tr>
                <th>Заявка</th>
                <th>Сумма</th>
                <th>Продукт</th>
                <th>Статус</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {applications.map((row) => (
                <tr key={row.application_id}>
                  <td>
                    <div className="mono">{row.application_id.slice(-8).toUpperCase()}</div>
                    <div className="faint" style={{ fontSize: 12 }}>
                      {row.created_at ? formatDateTime(row.created_at) : "—"}
                    </div>
                  </td>
                  <td>{formatMoney(row.requested_amount_rub)}</td>
                  <td>{row.product_label || row.product_type}</td>
                  <td>
                    <span className={`pill ${TONE_CLASS[statusTone(row.status)]}`}>
                      {row.status_label || row.status}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      disabled={isBusy}
                      onClick={() => void openApplication(row.application_id)}
                    >
                      Открыть
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </>
  );
}
