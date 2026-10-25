import { useEffect } from "react";
import { Kbd } from "../../components/v2/Kbd";
import { isTextField } from "../../components/v2/keys";
import { EQUIPMENT_LINES, EQUIPMENT_TOTAL, signalFor } from "../../domain-ui/caseScript";
import { useApp } from "../../state/AppState";
import { useDemoStore } from "../../state/demoStore";
import { formatMoney, roughAnnuity } from "../../utils/format";

export function BankSignal() {
  const { dashboard, companyId, goToScreen } = useApp();
  const markOfferSent = useDemoStore((state) => state.markOfferSent);
  const sent = useDemoStore((state) => (companyId ? Boolean(state.offerSent[companyId]) : false));
  const signal = signalFor(dashboard?.company.demo_key);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (!companyId || isTextField(event.target)) {
        return;
      }
      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        event.preventDefault();
        if (signal.quiet || sent || !signal.offerAmount) {
          return;
        }
        markOfferSent(companyId);
        goToScreen("bank-queue");
      }
      if ((event.key === "x" || event.key === "X") && !event.metaKey && !event.ctrlKey) {
        goToScreen("bank-queue");
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!dashboard || !companyId) {
    return null;
  }
  const company = dashboard.company;
  const payment = signal.offerAmount && signal.offerTerm
    ? roughAnnuity(signal.offerAmount, signal.offerTerm, company.demo_key === "rosters" ? 0.18 : 0.16)
    : null;
  const equipment = company.demo_key === "rosters"
    ? dashboard.transactions.filter((row) => row.category === "Оборудование")
    : [];

  function sendOffer() {
    if (!companyId || signal.quiet || sent || !signal.offerAmount) {
      return;
    }
    markOfferSent(companyId);
    goToScreen("bank-queue");
  }

  return (
    <>
      <div className="v2-crumb">Рабочий стол / Сигнал {signal.code}</div>
      <div className="v2-row">
        <div>
          <h1 className="v2-h1">Сигнал</h1>
          <p className="v2-lead">{company.name}</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" className="v2-btn ghost" onClick={() => goToScreen("bank-queue")}>Не предлагать <Kbd>X</Kbd></button>
          <button
            type="button"
            className="v2-btn primary"
            disabled={signal.quiet || sent || !signal.offerAmount}
            onClick={sendOffer}
          >
            {sent ? "Предложение отправлено" : "Отправить предложение"}
            {sent ? null : <Kbd>⌘↵</Kbd>}
          </button>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, margin: "8px 0 14px" }}>
        <span className="v2-pill warn">{signal.code}</span>
        <span className="v2-pill">кредитов нет</span>
        {company.demo_key === "rosters" ? <span className="v2-pill bad">касса может уйти в минус</span> : null}
      </div>
      <div className="v2-grid-3">
        <section className="v2-card">
          <h2>Выписка</h2>
          {equipment.length > 0 ? equipment.map((row) => (
            <div key={row.id} className="v2-check">
              <span>{row.description}</span>
              <strong>{formatMoney(row.amount_rub)}</strong>
            </div>
          )) : signal.lines.map((line) => <p key={line} className="v2-note">{line}</p>)}
          {company.demo_key === "rosters" ? (
            <>
              <div className="v2-check"><span>Итого из оборота</span><strong>{formatMoney(EQUIPMENT_TOTAL)}</strong></div>
              <div className="v2-check"><span>Остаток на счёте</span><strong>{formatMoney(dashboard.account_balance)}</strong></div>
              <ul className="v2-note">
                {EQUIPMENT_LINES.map((line) => <li key={line.date}>{line.date} · {line.title}</li>)}
              </ul>
            </>
          ) : null}
        </section>
        <section className="v2-card">
          <h2 title="Сумму можно поправить перед отправкой">{signal.quiet ? "Без предложения" : "Предложение"}</h2>
          {signal.offerAmount ? (
            <>
              <div className="v2-amount">{formatMoney(signal.offerAmount)}</div>
              <p className="v2-muted">{signal.offerTerm} мес.{payment ? ` · ориентир ${formatMoney(payment)} / мес` : ""}</p>
            </>
          ) : (
            <p className="v2-muted">{signal.lines.join(" ")}</p>
          )}
        </section>
        <section className="v2-card">
          <h2>У клиента</h2>
          {sent ? (
            <p>Карточка предложения уже на главной. Задача ушла в очередь «ждёт клиента».</p>
          ) : signal.quiet ? (
            <p>На главной нет кредитного оффера. Лента — про кассу и налоги. Кнопка «подать самому» остаётся.</p>
          ) : (
            <p>После отправки на главной появится следующий шаг и карточка с суммой. Задача вернётся в очередь, когда клиент отправит заявку.</p>
          )}
          <button type="button" className="v2-link" onClick={() => goToScreen("bank-queue")}>К очереди</button>
        </section>
      </div>
    </>
  );
}
