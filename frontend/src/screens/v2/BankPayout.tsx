import { useApp } from "../../state/AppState";
import { formatMoney } from "../../utils/format";

export function BankPayout() {
  const { application, xray, goToScreen, companyId } = useApp();

  if (!application) {
    return (
      <div className="v2-card">
        <h1 className="v2-h1">Выдача</h1>
        <p className="v2-muted">Выдачи ещё нет.</p>
        <button type="button" className="v2-btn primary" onClick={() => goToScreen("bank-queue")}>К очереди</button>
      </div>
    );
  }

  const funded = application.status === "FUNDED";
  const amount = application.approved_amount_rub || application.requested_amount_rub;

  return (
    <>
      <div className="v2-crumb">Клиенты / {application.company.name}</div>
      <div className="v2-row">
        <div>
          <h1 className="v2-h1">Выдача</h1>
          <p className="v2-lead">{funded ? `Выдано ${formatMoney(amount)}` : "Ждём подпись, деньги ещё не ушли"}</p>
        </div>
        <button type="button" className="v2-btn" onClick={() => goToScreen("bank-clients")}>В портфель</button>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <span className="v2-pill good">{application.status}</span>
        <span className="v2-pill demo">демо-прогон</span>
      </div>
      <div className="v2-split">
        <section className="v2-card">
          <h2>Путь сделки</h2>
          <ol className="v2-muted">
            <li>Сигнал по оборудованию → предложение клиенту</li>
            <li>Клиент отправил заявку, инспектор видит задачу</li>
            <li>Встречные варианты ушли в кабинет</li>
            <li>Бухгалтер выбрал вариант, подпись — у гендиректора</li>
            <li>ПЭП → деньги на счёте одной операцией</li>
          </ol>
        </section>
        <section className="v2-card">
          <h2>Выдача</h2>
          <div className="v2-check"><span>Сумма</span><strong>{formatMoney(amount)}</strong></div>
          <div className="v2-check"><span>Остаток клиента</span><strong>{formatMoney(application.account_balance)}</strong></div>
          <div className="v2-check"><span>Ключ</span><strong>payout-{application.application_id.slice(-6)}</strong></div>
          <p className="v2-note">Повторный запрос с тем же ключом возвращает прежний результат, деньги не уходят второй раз.</p>
          <p className="v2-note">
            Повторная подпись гендиректора из FUNDED отвечает 409. Кнопка «Повторить подпись» стоит на экране выдачи у клиента.
          </p>
        </section>
      </div>
      <section className="v2-card" style={{ marginTop: 12 }}>
        <h2>Журнал</h2>
        {(xray?.events ?? []).slice().reverse().map((event) => (
          <div key={event.id} className="v2-check">
            <span>{event.created_at?.slice(0, 16) ?? ""} · {event.event_type}</span>
            <strong>{event.actor_role} · {event.details}</strong>
          </div>
        ))}
        {!xray ? <p className="v2-muted">Журнал подгружается вместе с рентгеном заявки.</p> : null}
        <p className="v2-muted">Компания {companyId}</p>
      </section>
    </>
  );
}
