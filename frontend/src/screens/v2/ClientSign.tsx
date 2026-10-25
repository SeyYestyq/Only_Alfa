import { useEffect, useRef, useState } from "react";
import { CodeCells } from "../../components/v2/CodeCells";
import { ForecastLine } from "../../components/v2/ForecastLine";
import { Kbd } from "../../components/v2/Kbd";
import { Stepper } from "../../components/v2/Stepper";
import { INSPECTOR_NAME, PEP_CODE, ROSTERS_PSK_LABEL } from "../../domain-ui/caseScript";
import { useApp } from "../../state/AppState";
import { useDemoStore } from "../../state/demoStore";
import { useUiStore } from "../../state/uiStore";
import { familyName, formatMoney, formatPercent } from "../../utils/format";

export function ClientSign() {
  const { application, dashboard, signApplication, isBusy, goToScreen, userRole, setUserRole, companyId } = useApp();
  const pushToast = useUiStore((state) => state.pushToast);
  const markCeoNotified = useDemoStore((state) => state.markCeoNotified);
  const notifiedAt = useDemoStore((state) =>
    application ? state.ceoNotifiedAt[application.application_id] : undefined);
  const [digits, setDigits] = useState(PEP_CODE.split(""));
  const [activeCell, setActiveCell] = useState(PEP_CODE.length - 1);
  const [attemptsLeft, setAttemptsLeft] = useState(3);
  const [codeWrong, setCodeWrong] = useState(false);
  const [docNote, setDocNote] = useState<string | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const signRef = useRef<() => void>(() => {});

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        event.preventDefault();
        signRef.current();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!application) {
      return;
    }
    const signer = application.company.legal_form === "OOO" ? "CEO_OWNER" : "IP_OWNER";
    const waiting = ["APPROVED", "AWAITING_CEO_APPROVAL"].includes(application.status) && userRole !== signer;
    if (waiting) {
      markCeoNotified(application.application_id, signer);
    }
  }, [application, markCeoNotified, userRole]);

  if (!application || !companyId) {
    return (
      <div className="v2-card">
        <h1 className="v2-h1">Подпись</h1>
        <button type="button" className="v2-btn primary" onClick={() => goToScreen("decision")}>К решению</button>
      </div>
    );
  }

  const legalForm = application.company.legal_form;
  const canSign = legalForm === "OOO" ? userRole === "CEO_OWNER" : userRole === "IP_OWNER";
  const funded = application.status === "FUNDED";
  const director = application.company.users.find((user) => user.role === "CEO_OWNER" || user.role === "IP_OWNER");
  const amount = application.approved_amount_rub || application.requested_amount_rub;
  const was = Math.max(0, application.account_balance - (funded ? amount : 0));
  signRef.current = () => {
    if (!canSign || funded || isBusy || attemptsLeft === 0) {
      return;
    }
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      pushToast({
        tone: "warning",
        title: "Нет соединения",
        subtitle: "Черновик сохранён. Поля на месте, ничего не отправлено.",
        actionLabel: "Повторить",
        undo: () => signRef.current(),
      });
      return;
    }
    if (digits.join("") !== PEP_CODE) {
      setCodeWrong(true);
      setAttemptsLeft((value) => Math.max(0, value - 1));
      return;
    }
    if (!["APPROVED", "AWAITING_CEO_APPROVAL"].includes(application.status)) {
      return;
    }
    void signApplication();
  };

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
                <tr><th>Дата</th><th className="num">Платёж</th></tr>
              </thead>
              <tbody>
                {schedule(application.term_months, application.monthly_payment_rub).slice(0, 5).map((row) => (
                  <tr key={row.date}><td>{row.date}</td><td className="num">{formatMoney(row.amount)}</td></tr>
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
                  <button key={value} type="button" className={`v2-btn v2-choice ${score === value ? "on" : ""}`} onClick={() => setScore(value)}>
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
        <div>
          <h1 className="v2-h1">Подпись</h1>
          <p className="v2-lead">
            {canSign
              ? "Деньги придут сразу после подписи"
              : legalForm === "OOO"
                ? "Ждёт подписи гендиректора"
                : "Ждёт подписи предпринимателя"}
          </p>
        </div>
        <span className={`v2-pill ${canSign ? "warn" : "good"}`}>
          {canSign ? "Ждёт вашей подписи" : "Уведомление отправлено"}
        </span>
      </div>
      <Stepper active={3} />
      <div className="v2-split case">
        <div>
          <section className="v2-card">
            <h2>Договор</h2>
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
              <h2 title="Код показан здесь: в рабочей версии его присылает удостоверяющий центр">Подпись ПЭП</h2>
              {notifiedAt ? <p className="v2-note">Уведомление пришло в {notifiedAt}.</p> : null}
              <CodeCells
                digits={digits}
                active={activeCell}
                invalid={codeWrong}
                onFocusIndex={setActiveCell}
                onChange={(index, value) => {
                  const next = [...digits];
                  next[index] = value;
                  setDigits(next);
                  setCodeWrong(false);
                  if (value && index < digits.length - 1) {
                    setActiveCell(index + 1);
                  }
                }}
              />
              {codeWrong ? (
                <p className="v2-note" style={{ color: "var(--red-text)" }}>
                  Код не подошёл — осталось {attemptsLeft} {attemptsLeft === 1 ? "попытка" : "попытки"}. Цифры не стираем.
                </p>
              ) : null}
              <div className="v2-amber">
                <strong>Подпись необратима</strong>
                Вы подписываете {formatMoney(amount)} на {application.term_months} мес. · {formatMoney(application.monthly_payment_rub)} / мес · ПСК {ROSTERS_PSK_LABEL}. Деньги зачислят сразу после подписи. Если что-то не так — верните Ирине, ничего не подписывая.
              </div>
              <button
                type="button"
                className="v2-btn primary wide"
                disabled={isBusy || attemptsLeft === 0 || !["APPROVED", "AWAITING_CEO_APPROVAL"].includes(application.status)}
                onClick={() => signRef.current()}
              >
                {isBusy ? "Подписываем…" : "Подписать и получить деньги"}
                <Kbd>⌘↵</Kbd>
              </button>
              <button type="button" className="v2-btn ghost wide" style={{ marginTop: 8 }} onClick={() => setUserRole("ACCOUNTANT")}>
                Вернуть Ирине с комментарием
              </button>
              <p className="v2-note">Повторное нажатие после выдачи не создаст второй перевод.</p>
            </section>
          ) : (
            <section className="v2-card">
              <h2>
                Ждёт подписи {legalForm === "OOO" ? "гендиректора" : "предпринимателя"} · {familyName(director?.full_name)} получил уведомление
              </h2>
              <p className="v2-muted" style={{ marginTop: 8 }}>
                {notifiedAt ? `Отправлено в ${notifiedAt}.` : "Уведомление уходит само, как только заявка доходит до подписи."} Подписать может только {legalForm === "OOO" ? "гендиректор" : "предприниматель"}.
              </p>
            </section>
          )}
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
