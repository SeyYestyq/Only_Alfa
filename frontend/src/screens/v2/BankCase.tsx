import { useEffect, useRef, useState } from "react";
import { ChatThread } from "../../components/v2/ChatThread";
import { Kbd } from "../../components/v2/Kbd";
import { isTextField } from "../../components/v2/keys";
import { RefuseDialog } from "../../components/v2/RefuseDialog";
import { INSPECTOR_NAME } from "../../domain-ui/caseScript";
import { useApp } from "../../state/AppState";
import { useDemoStore } from "../../state/demoStore";
import { useUiStore } from "../../state/uiStore";
import { formatAge, formatMoney, formatPercent } from "../../utils/format";

type Action = "APPROVE" | "COUNTER_OFFER" | "NEED_MORE_INFO" | "REJECT";

const ACTIONS: Array<{ id: Action; title: string; hint: string }> = [
  { id: "APPROVE", title: "Одобрить как просили", hint: "Платёж в безопасном коридоре" },
  { id: "COUNTER_OFFER", title: "Встречное предложение", hint: "Клиент выберет вариант сам" },
  { id: "NEED_MORE_INFO", title: "Запросить документ", hint: "SLA на паузе, пока клиент не ответит" },
  { id: "REJECT", title: "Отказать с причиной", hint: "Код причины и что улучшить" },
];

export function BankCase() {
  const {
    application, dashboard, xray, underwriterAction, isBusy, goToScreen, companyId,
  } = useApp();
  const released = useDemoStore((state) =>
    application ? Boolean(state.released[application.application_id]) : false);
  const releaseDecision = useDemoStore((state) => state.releaseDecision);
  const lock = useDemoStore((state) => state.inspectorLock);
  const setLock = useDemoStore((state) => state.setInspectorLock);
  const docs = useDemoStore((state) => state.creditDocs);
  const [action, setAction] = useState<Action>("COUNTER_OFFER");
  const [comment, setComment] = useState("Платёж 2,5 млн не проходит в низкий сезон. Предлагаем три варианта.");
  const [refuseOpen, setRefuseOpen] = useState(false);
  const pushToast = useUiStore((state) => state.pushToast);
  const sendRef = useRef<(reason?: string) => void>(() => {});

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (isTextField(event.target)) {
        return;
      }
      const index = Number(event.key) - 1;
      if (!event.metaKey && !event.ctrlKey && index >= 0 && index < ACTIONS.length) {
        setAction(ACTIONS[index].id);
      }
      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        event.preventDefault();
        sendRef.current();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!application || !dashboard || !companyId) {
    return (
      <div className="v2-card">
        <h1 className="v2-h1">Нет заявки в работе</h1>
        <button type="button" className="v2-btn primary" onClick={() => goToScreen("bank-queue")}>К очереди</button>
      </div>
    );
  }

  const app = application;
  const caseCompanyId = companyId;
  const company = dashboard.company;
  const manual = app.status === "MANUAL_REVIEW" || app.status === "NEED_MORE_INFO";
  const alreadyCounter = app.status === "COUNTER_OFFER";
  const maxPay = app.max_payment_rub || 1;
  const asked = app.monthly_payment_rub;

  function publishCounter() {
    releaseDecision(app.application_id);
    useDemoStore.getState().pushChat(caseCompanyId, {
      author: INSPECTOR_NAME,
      side: "bank",
      text: "Ирина, добрый вечер. Полную сумму в низкий сезон не тянет касса. Выберите один из вариантов — подписать сможет только гендиректор.",
    });
    pushToast({
      tone: "success",
      title: "Отправлено клиенту",
      subtitle: `${company.name} · 3 варианта. Отмена спрячет решение.`,
      actionLabel: "Отменить",
      until: Date.now() + 10_000,
      undo: () => {
        useDemoStore.getState().unreleaseDecision(app.application_id);
        useDemoStore.getState().popChat(caseCompanyId);
      },
    });
  }

  async function send(reason?: string) {
    if (lock) {
      return;
    }
    if (action === "REJECT" && !reason) {
      setRefuseOpen(true);
      return;
    }
    if (alreadyCounter && action === "COUNTER_OFFER") {
      if (!released) {
        publishCounter();
      }
      return;
    }
    if (!manual) {
      return;
    }
    await underwriterAction(action, reason ?? comment, docs[0]);
    if (action === "COUNTER_OFFER") {
      publishCounter();
    }
  }
  sendRef.current = (reason) => {
    if (refuseOpen) {
      return;
    }
    void send(reason);
  };

  return (
    <>
      <div className="v2-crumb">Рабочий стол / Заявка {application.application_id.slice(-8)}</div>
      <div className="v2-row">
        <h1 className="v2-h1">{company.name} · {formatMoney(application.requested_amount_rub)} на {application.term_months} мес.</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" className="v2-btn" onClick={() => goToScreen("messages")}>Чат с клиентом</button>
          <button type="button" className="v2-btn" onClick={() => goToScreen("bank-queue")}>Следующая задача</button>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <span className="v2-pill warn">{application.status_label}</span>
        <span className="v2-pill">{application.risk_score} · {application.risk_score >= 650 ? "зелёный" : application.risk_score >= 520 ? "жёлтый" : "оранжевый"} коридор</span>
        {released ? <span className="v2-pill good">клиент уже видит решение</span> : <span className="v2-pill">клиент ещё видит «на проверке»</span>}
      </div>
      {lock ? (
        <div className="v2-card v2-lock" style={{ marginBottom: 12 }}>
          <strong>409 · заявку уже ведёт {INSPECTOR_NAME}</strong>
          <p className="v2-muted">Кнопки решения заблокированы. Второй инспектор видит актуальную версию и не отправляет решение повторно.</p>
          <button type="button" className="v2-btn" onClick={() => setLock(false)}>Снять показ блокировки</button>
        </div>
      ) : null}
      <div className="v2-split case">
        <div>
          <section className="v2-card">
            <div className="v2-kicker">ИНН {company.inn}</div>
            <h2>Клиент за 10 секунд</h2>
            <div className="v2-check"><span>В бизнесе</span><strong>{formatAge(company.age_months)}</strong></div>
            <div className="v2-check"><span>Адрес</span><strong>{company.address}</strong></div>
            <div className="v2-check"><span>Подписант</span><strong>{company.director_name}</strong></div>
            <div className="v2-check"><span>Выручка / мес.</span><strong>{formatMoney(company.monthly_revenue_alfa)} · {formatPercent(company.revenue_growth_pct, 0)}</strong></div>
            <div className="v2-check"><span>Свободный поток</span><strong>{formatMoney(application.fcf_rub)}</strong></div>
            <div className="v2-check"><span>Кредиты в банках</span><strong>{company.bki_overdue_days > 0 ? `просрочка ${company.bki_overdue_days} дн.` : "нет просрочки"}</strong></div>
          </section>
          <section className="v2-card" style={{ marginTop: 12 }}>
            <h2>Проверки</h2>
            <div className="v2-check"><span>ЕГРЮЛ</span><strong>{company.is_egrul_active ? "действующее" : "нет"} · {company.legal_form}</strong></div>
            <div className="v2-check"><span>ФССП</span><strong>{company.fssp_amount > 0 ? formatMoney(company.fssp_amount) : "нет"}</strong></div>
            <div className="v2-check"><span>БКИ</span><strong>{company.bki_history_months} мес. · просрочка {company.bki_overdue_days} дн.</strong></div>
            <div className="v2-check"><span>GeoScore</span><strong>{company.geo_score} · конкурентов {company.competitors_count}</strong></div>
            {application.checks.map((check) => (
              <div key={check.id} className="v2-check">
                <span>{check.code}</span>
                <strong>{check.status}</strong>
              </div>
            ))}
            <p className="v2-note">Источники — симуляторы реестров, seed = hash(ИНН). Время ответа в демо помечено как ориентир, не замер продакшена.</p>
          </section>
          <section className="v2-card" style={{ marginTop: 12 }}>
            <h2>Почему {application.risk_score}</h2>
            <div className="v2-check"><span>База</span><strong>500</strong></div>
            {(xray?.waterfall.factors ?? application.factors_breakdown).map((factor) => (
              <div key={factor.code} className="v2-check">
                <span>{factor.label}</span>
                <strong className={factor.score_delta < 0 ? "red" : "green"}>
                  {factor.score_delta > 0 ? "+" : ""}{factor.score_delta}
                </strong>
              </div>
            ))}
            <div className="v2-check"><span>Итого</span><strong>{application.risk_score}</strong></div>
          </section>
          <section className="v2-card" style={{ marginTop: 12 }}>
            <h2>Платёж против кассы</h2>
            <div className="v2-check"><span>Запрошено</span><strong>{formatMoney(asked)}</strong></div>
            <div className={`v2-bar ${asked > maxPay ? "bad" : "good"}`}>
              <span style={{ width: `${Math.min(100, (asked / (maxPay * 2.2)) * 100)}%` }} />
            </div>
            <div className="v2-check"><span>Безопасный платёж</span><strong>{formatMoney(application.max_payment_rub)}</strong></div>
            {application.counter_offers.map((offer) => (
              <div key={offer.index} className="v2-check">
                <span>{offer.label}</span>
                <strong>{formatMoney(offer.amount_rub)} · {offer.monthly_payment_rub > 0 ? formatMoney(offer.monthly_payment_rub) : "график продукта"}</strong>
              </div>
            ))}
          </section>
        </div>
        <div>
          <section className="v2-card">
            <div className="v2-kicker">Система предлагает</div>
            <h2>Решение</h2>
            {ACTIONS.map((item) => (
              <label key={item.id} className={`v2-radio ${action === item.id ? "on" : ""}`}>
                <input type="radio" name="decision" checked={action === item.id} onChange={() => setAction(item.id)} />
                <span>
                  <strong>{item.title}</strong>
                  <div className="v2-muted">{item.hint}</div>
                </span>
              </label>
            ))}
            <textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              rows={3}
              style={{ width: "100%", marginTop: 8, borderRadius: 12, background: "#101014", color: "inherit", border: "1px solid #2a2a32", padding: 8 }}
            />
            {!manual && !alreadyCounter ? (
              <p className="v2-note">Из статуса {application.status_label} инспекторские действия закрыты правилами перехода.</p>
            ) : null}
            {alreadyCounter && action !== "COUNTER_OFFER" ? (
              <p className="v2-note">Запрос документов и отказ из жёлтого коридора смотрите на заявке ИП Ковалев: она приходит в ручной разбор. Здесь система уже собрала встречные варианты.</p>
            ) : null}
            <button type="button" className="v2-btn primary wide" disabled={isBusy || lock || (alreadyCounter && action !== "COUNTER_OFFER") || (!manual && !alreadyCounter)} onClick={() => void send()}>
              {released && alreadyCounter ? "Уже отправлено клиенту" : "Отправить клиенту"}
              <Kbd>⌘↵</Kbd>
            </button>
            <button type="button" className="v2-link" onClick={() => setLock(true)}>Показать 409 второго инспектора</button>
          </section>
          <section className="v2-card" style={{ marginTop: 12 }}>
            <h2>Чат</h2>
            <ChatThread companyId={companyId} author={INSPECTOR_NAME} side="bank" />
          </section>
          <section className="v2-card" style={{ marginTop: 12 }}>
            <h2>Журнал</h2>
            {(xray?.events ?? []).slice().reverse().slice(0, 8).map((event) => (
              <div key={event.id} className="v2-check">
                <span>{event.event_type}</span>
                <strong>{event.actor_role}</strong>
              </div>
            ))}
            {docs.map((name) => <p key={name} className="v2-note">Документ клиента: {name}</p>)}
          </section>
        </div>
      </div>
      <p className="v2-hotkeys">1–4 — выбрать решение · ⌘↵ — отправить · ⌘Z — отменить отправку 10 секунд.</p>
      <RefuseDialog
        open={refuseOpen}
        companyName={company.name}
        onClose={() => setRefuseOpen(false)}
        onConfirm={(reason) => {
          setRefuseOpen(false);
          void send(reason);
        }}
      />
    </>
  );
}
