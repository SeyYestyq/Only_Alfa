import { CounterOffersPanel } from "../components/CounterOffersPanel";
import { MultibankPanel } from "../components/MultibankPanel";
import { PassportPanel } from "../components/PassportPanel";
import { SigningPanel } from "../components/SigningPanel";
import { useApp } from "../state/AppState";
import { formatDateTime, formatMoney, formatMoneyExact, statusTone } from "../utils/format";

function checkTone(status: string): string {
  if (["PASS", "VERIFIED", "CLEAR", "APPROVED", "UPLOADED"].includes(status)) {
    return "pill-good";
  }
  if (["ANOMALY", "HARD_STOP", "REJECTED", "WARN"].includes(status)) {
    return "pill-risk";
  }
  return "pill-warn";
}

export function ApplicationScreen() {
  const { application, setBusinessTab, setBankTab, clearApplication } = useApp();

  if (!application) {
    return (
      <div className="empty-state">
        <h3>Заявка ещё не создана</h3>
        <p>
          Вернитесь на главную, загрузите счёт для платежа или укажите свою сумму во вкладке «Кредиты».
        </p>
        <button type="button" className="btn btn-primary" onClick={() => setBusinessTab("home")}>
          На главную
        </button>
      </div>
    );
  }

  const invoice = application.invoice as
    | {
        supplier_name?: string;
        supplier_inn?: string;
        amount_rub?: number;
        vat_rub?: number;
        purpose?: string;
        source?: string;
        antifraud?: { message?: string; egrul_status?: string };
      }
    | null;

  return (
    <>
      <div className="page-header">
        <div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
            <span className={`pill ${application.status === "FUNDED" ? "pill-good" : statusTone(application.status) === "RISK" ? "pill-risk" : "pill-warn"}`}>
              {application.status_label}
            </span>
            <span className="pill pill-outline">{application.product_label}</span>
            <span className="pill pill-outline">ID {application.application_id.slice(-8)}</span>
          </div>
          <h1 className="page-title">Заявка на финансирование</h1>
          <p className="page-subtitle">
            {application.company.name} · ИНН {application.company.inn} · создана{" "}
            {formatDateTime(application.created_at)}
          </p>
        </div>
        <div className="page-actions">
          <button type="button" className="btn btn-secondary" onClick={() => setBankTab("applications")}>
            Открыть в пилоте банка
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              clearApplication();
              setBusinessTab("credits");
            }}
          >
            Новая заявка
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => setBusinessTab("home")}>
            На главную
          </button>
        </div>
      </div>

      <PassportPanel application={application} />

      {(application.multibank.available || application.multibank.verified) && (
        <div className="section-gap">
          <MultibankPanel application={application} />
        </div>
      )}

      {application.status === "REJECTED" && (
        <div className="alert alert-risk section-gap">
          <strong>
            {application.is_hard_stop ? "Hard Stop: мгновенный отказ" : "Заявка отклонена"}
          </strong>
          <p style={{ marginTop: 4 }}>
            {application.hard_stop_reason ?? "RiskScore ниже красного коридора."}
          </p>
          <ul className="checklist">
            {application.rejection_checklist.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {application.status === "COUNTER_OFFER" && application.rejection_checklist.length > 0 && (
        <div className="alert alert-warn section-gap">
          {application.rejection_checklist.map((item) => (
            <p key={item}>{item}</p>
          ))}
        </div>
      )}

      <div className="section-gap">
        <CounterOffersPanel application={application} />
      </div>

      {application.status !== "REJECTED" && (
        <div className="section-gap">
          <SigningPanel application={application} />
        </div>
      )}

      {invoice && (
        <section className="card section-gap">
          <div className="card-header">
            <div>
              <h2 className="card-title">Счёт, с которого началась заявка</h2>
              <p className="card-subtitle">
                Источник: {invoice.source === "PDF" ? "загруженный PDF" : "демо-шаблон"} ·{" "}
                {invoice.antifraud?.egrul_status ?? "—"}
              </p>
            </div>
          </div>
          <div className="card-body">
            <div className="grid-4">
              <div>
                <div className="passport-label">Поставщик</div>
                <div style={{ fontWeight: 750 }}>{invoice.supplier_name}</div>
                <div className="faint mono" style={{ fontSize: 11 }}>
                  {invoice.supplier_inn}
                </div>
              </div>
              <div>
                <div className="passport-label">Сумма</div>
                <div style={{ fontWeight: 750 }}>{formatMoneyExact(invoice.amount_rub)}</div>
              </div>
              <div>
                <div className="passport-label">НДС</div>
                <div style={{ fontWeight: 750 }}>{formatMoneyExact(invoice.vat_rub)}</div>
              </div>
              <div>
                <div className="passport-label">Назначение</div>
                <div style={{ fontWeight: 650 }}>{invoice.purpose}</div>
              </div>
            </div>
            {invoice.antifraud?.message && (
              <p className="muted" style={{ marginTop: 10, fontSize: 12 }}>
                {invoice.antifraud.message}
              </p>
            )}
          </div>
        </section>
      )}

      <section className="card section-gap">
        <div className="card-header">
          <div>
            <h2 className="card-title">Проверки и audit trail</h2>
            <p className="card-subtitle">Каждое решение и каждая смена статуса записаны в одной транзакции</p>
          </div>
          <span className="pill pill-outline">{application.checks.length} проверок</span>
        </div>
        <div className="card-body">
          <table className="table events-table">
            <thead>
              <tr>
                <th>Проверка</th>
                <th>Статус</th>
                <th>Результат</th>
              </tr>
            </thead>
            <tbody>
              {application.checks.map((check) => (
                <tr key={check.id}>
                  <td className="event-type">{check.code}</td>
                  <td>
                    <span className={`pill ${checkTone(check.status)}`}>{check.status}</span>
                  </td>
                  <td>{check.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="muted" style={{ marginTop: 10, fontSize: 11.5 }}>
            Текущий баланс компании: {formatMoney(application.account_balance)} · заявка обновлена{" "}
            {formatDateTime(application.updated_at)}
          </p>
        </div>
      </section>
    </>
  );
}
