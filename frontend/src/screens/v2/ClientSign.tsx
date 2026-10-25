import { useState } from "react";
import { ForecastLine } from "../../components/v2/ForecastLine";
import { Stepper } from "../../components/v2/Stepper";
import { INSPECTOR_NAME, PEP_CODE } from "../../domain-ui/caseScript";
import { useApp } from "../../state/AppState";
import { useDemoStore } from "../../state/demoStore";
import { formatMoney, formatPercent, shortPerson } from "../../utils/format";

export function ClientSign() {
  const { application, dashboard, signApplication, isBusy, goToScreen, userRole, setUserRole, companyId } = useApp();
  const pushChat = useDemoStore((state) => state.pushChat);
  const [digits, setDigits] = useState(PEP_CODE.split(""));
  const [docNote, setDocNote] = useState<string | null>(null);
  const [score, setScore] = useState<number | null>(null);

  if (!application || !companyId) {
    return (
      <div className="v2-card">
        <h1 className="v2-h1">Нечего подписывать</h1>
        <button type="button" className="v2-btn primary" onClick={() => goToScreen("decision")}>К решению</button>
      </div>
    );
  }

  const legalForm = application.company.legal_form;
  const canSign = legalForm === "OOO" ? userRole === "CEO_OWNER" : userRole === "IP_OWNER";
  const funded = application.status === "FUNDED";
  const director = application.company.users.find((user) => user.role === "CEO_OWNER" || user.role === "IP_OWNER");
  const amount = application.approved_amount_rub || application.requested_amount_rub;
  const codeOk = digits.join("") === PEP_CODE;
  const was = Math.max(0, application.account_balance - (funded ? amount : 0));

  if (funded) {
    return (
      <>
        <div className="v2-crumb">Кредиты / Деньги на счёте</div>
        <Stepper active={4} />
        <div className="v2-split">
          <section className="v2-card v2-green-hero">
            <span className="v2-pill good">Договор подписан</span>
            <div className="sum">+{formatMoney(amount)}</div>
            <p className="v2-muted">зачислено на расчётный счёт</p>
            <p style={{ marginTop: 12 }}>
              <s>{formatMoney(was)}</s> → <strong>{formatMoney(application.account_balance)}</strong>
            </p>
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button type="button" className="v2-btn primary" onClick={() => goToScreen("payments")}>Оплатить ростер со счёта</button>
              <button type="button" className="v2-btn" onClick={() => goToScreen("home")}>К главной</button>
            </div>
          </section>
          <section className="v2-card">
            <div className="v2-row">
              <h2>Касса снова в плюсе</h2>
              <span className="v2-pill demo">прогноз</span>
            </div>
            {dashboard ? <ForecastLine forecast={dashboard.cash_forecast} /> : null}
            <p className="v2-note">
              Платёж {formatMoney(application.monthly_payment_rub)} спишется по графику. Прогноз пересчитан с новым остатком.
            </p>
          </section>
        </div>
        <div className="v2-split" style={{ marginTop: 12 }}>
          <section className="v2-card">
            <h2>График платежей</h2>
            <p className="v2-muted">Первые 5 из {application.term_months}. Сумма платежа — из решения банка.</p>
            <table className="v2-table">
              <thead>
                <tr><th>Дата</th><th>Платёж</th></tr>
              </thead>
              <tbody>
                {schedule(application.term_months, application.monthly_payment_rub).slice(0, 5).map((row) => (
                  <tr key={row.date}><td>{row.date}</td><td>{formatMoney(row.amount)}</td></tr>
                ))}
              </tbody>
            </table>
          </section>
          <section className="v2-card">
            <h2>Что дальше</h2>
            <p className="v2-muted">Следим за кассой. Если лето просядет, предложим платёж от выручки раньше просрочки.</p>
            <p className="v2-note">Инспектор: {INSPECTOR_NAME}. Документы остаются в этом кабинете.</p>
            <div className="v2-row" style={{ marginTop: 12 }}>
              <span>Как вам процесс?</span>
              <span>
                {[1, 2, 3, 4, 5].map((value) => (
                  <button key={value} type="button" className={`v2-btn ${score === value ? "primary" : ""}`} onClick={() => setScore(value)}>
                    {value}
                  </button>
                ))}
              </span>
            </div>
            {score ? <p className="v2-note">Спасибо, это демо и никуда не отправляется.</p> : null}
            {canSign ? (
              <>
                <button type="button" className="v2-btn" style={{ marginTop: 12 }} disabled={isBusy} onClick={() => void signApplication()}>
                  Повторить подпись
                </button>
                <p className="v2-note">Повтор из статуса FUNDED получает 409: деньги не уходят второй раз.</p>
              </>
            ) : null}
          </section>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="v2-crumb">Кредиты / Подпись</div>
      <div className="v2-row">
        <h1 className="v2-h1">Подпишите договор — деньги придут сразу</h1>
        <span className="v2-pill warn">{canSign ? "Ждёт вашей подписи" : "Нет права подписи"}</span>
      </div>
      <Stepper active={3} />
      <div className="v2-split case">
        <div>
          <section className="v2-card">
            <div className="v2-kicker">Что вы подписываете</div>
            <div className="v2-row">
              <div>
                <div className="v2-kpi-label">Сумма</div>
                <div className="v2-amount">{formatMoney(amount)}</div>
              </div>
              <div>
                <div className="v2-kpi-label">Платёж</div>
                <div className="v2-amount" style={{ fontSize: 28 }}>{formatMoney(application.monthly_payment_rub)} / мес</div>
              </div>
            </div>
            <div className="v2-check"><span>Срок</span><strong>{application.term_months} мес.</strong></div>
            <div className="v2-check"><span>Ставка</span><strong>{formatPercent(application.final_rate_pct)} · ключ + продукт + риск</strong></div>
          </section>
          <section className="v2-card" style={{ marginTop: 12 }}>
            <h2>Документы</h2>
            {["Кредитный договор", "График платежей", "Заявление на выдачу"].map((name) => (
              <div key={name} className="v2-check">
                <span>PDF · {name}</span>
                <button type="button" className="v2-link" onClick={() => setDocNote(`${name}: в демо файл не скачивается, состав описан на экране.`)}>
                  Открыть
                </button>
              </div>
            ))}
            {docNote ? <p className="v2-note">{docNote}</p> : null}
          </section>
        </div>
        <div>
          {canSign ? (
            <section className="v2-card">
              <div className="v2-kicker">Простая электронная подпись</div>
              <h2>Подпись ПЭП</h2>
              <p className="v2-muted">Код показан здесь: в рабочей версии его присылает удостоверяющий центр. Эмуляция.</p>
              <div className="v2-otp">
                {digits.map((digit, index) => (
                  <input
                    key={index}
                    className={index === digits.length - 1 ? "on" : ""}
                    value={digit}
                    maxLength={1}
                    onChange={(event) => {
                      const next = [...digits];
                      next[index] = event.target.value.replace(/\D/g, "").slice(-1);
                      setDigits(next);
                    }}
                  />
                ))}
              </div>
              <button
                type="button"
                className="v2-btn primary wide"
                disabled={isBusy || !codeOk || !["APPROVED", "AWAITING_CEO_APPROVAL"].includes(application.status)}
                onClick={() => void signApplication()}
              >
                {isBusy ? "Подписываем…" : "Подписать и получить деньги"}
              </button>
              {!codeOk ? <p className="v2-note">Код демо: {PEP_CODE}</p> : null}
              <p className="v2-note">Повторное нажатие после выдачи не создаст второй перевод.</p>
            </section>
          ) : (
            <section className="v2-card v2-lock">
              <span className="v2-pill bad">403 · нет права подписи</span>
              <h2 style={{ marginTop: 10 }}>Подписать может только {legalForm === "OOO" ? "гендиректор" : "сам предприниматель"}</h2>
              <p className="v2-muted">
                {shortPerson(director?.full_name)} получит задачу. Вы остаётесь в переписке.
              </p>
              <button
                type="button"
                className="v2-btn primary"
                onClick={() => {
                  if (director) {
                    setUserRole(director.role);
                  }
                  pushChat(companyId, {
                    author: "Кабинет",
                    side: "client",
                    text: "Бухгалтер передал договор на подпись руководителю.",
                  });
                }}
              >
                Передать {director ? shortPerson(director.full_name).split(" ")[0] : "руководителю"}
              </button>
            </section>
          )}
          {canSign && legalForm === "OOO" ? (
            <section className="v2-card v2-lock" style={{ marginTop: 12 }}>
              <span className="v2-pill bad">403 · так этот экран видит бухгалтер</span>
              <p className="v2-muted">Кнопка подписи скрыта. Есть передача гендиректору и чат с банком.</p>
            </section>
          ) : null}
        </div>
      </div>
    </>
  );
}

function schedule(term: number, payment: number): Array<{ date: string; amount: number }> {
  const start = new Date(2026, 10, 20);
  return Array.from({ length: term }, (_, index) => {
    const date = new Date(start);
    date.setMonth(start.getMonth() + index);
    return {
      date: date.toLocaleDateString("ru-RU"),
      amount: payment,
    };
  });
}
