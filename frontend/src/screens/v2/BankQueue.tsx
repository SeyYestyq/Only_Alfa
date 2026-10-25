import { useEffect, useMemo, useState } from "react";
import type { ScreenId } from "../../api/types";
import { useApp } from "../../state/AppState";
import { useDemoStore } from "../../state/demoStore";
import { formatMoney } from "../../utils/format";

type Kind = "Заявка" | "Сообщение" | "Ранний сигнал" | "Документы" | "Сигнал" | "Предложение";

interface Task {
  id: string;
  kind: Kind;
  companyId: string;
  client: string;
  inn: string;
  what: string;
  amount: string;
  score: string;
  slaMin: number;
  sla: string;
  tone: "ok" | "warn" | "bad" | "pause";
  action: string;
  screen: ScreenId;
  demo: boolean;
}

const FILTERS: Array<{ id: string; label: string; kinds?: Kind[] }> = [
  { id: "all", label: "Все" },
  { id: "app", label: "Заявки", kinds: ["Заявка"] },
  { id: "msg", label: "Сообщения", kinds: ["Сообщение"] },
  { id: "mon", label: "Мониторинг", kinds: ["Ранний сигнал"] },
  { id: "sig", label: "Сигналы", kinds: ["Сигнал", "Предложение", "Документы"] },
];

export function BankQueue() {
  const { companies, companyId, application, selectCompany, goToScreen } = useApp();
  const offerSent = useDemoStore((state) => state.offerSent);
  const released = useDemoStore((state) => state.released);
  const monitoring = useDemoStore((state) => state.monitoring);
  const chat = useDemoStore((state) => state.chat);
  const [filter, setFilter] = useState("all");
  const [cursor, setCursor] = useState(0);

  const tasks = useMemo(() => {
    const rows: Task[] = [];
    for (const company of companies) {
      const mine = company.id === companyId;
      const phase = monitoring[company.id] ?? "none";
      if (mine && application) {
        const status = application.status;
        const isPause = status === "NEED_MORE_INFO" || (status === "COUNTER_OFFER" && released[application.application_id]);
        const waitingSign = status === "AWAITING_CEO_APPROVAL" || status === "APPROVED";
        if (status !== "FUNDED" && status !== "REJECTED") {
          rows.push({
            id: application.application_id,
            kind: "Заявка",
            companyId: company.id,
            client: company.name,
            inn: company.inn,
            what: waitingSign
              ? "Ждёт подписи гендиректора"
              : isPause
                ? "Клиент выбирает вариант или присылает документ"
                : "Решение по заявке — сумма выше предложения",
            amount: formatMoney(application.requested_amount_rub),
            score: String(application.risk_score || "стоп"),
            slaMin: isPause ? 400 : 117,
            sla: isPause ? "пауза" : "1 ч 57 мин",
            tone: isPause ? "pause" : "bad",
            action: "Решить",
            screen: "bank-xray",
            demo: false,
          });
        }
        if (status === "FUNDED" && phase === "early") {
          rows.push({
            id: `${company.id}-early`,
            kind: "Ранний сигнал",
            companyId: company.id,
            client: company.name,
            inn: company.inn,
            what: "Июль: выручка может не закрыть платёж",
            amount: formatMoney(application.approved_amount_rub),
            score: "—",
            slaMin: 220,
            sla: "3 ч 40 мин",
            tone: "warn",
            action: "Разобрать",
            screen: "bank-clients",
            demo: false,
          });
        }
      } else if (mine && !application) {
        rows.push({
          id: `${company.id}-signal`,
          kind: offerSent[company.id] ? "Предложение" : "Сигнал",
          companyId: company.id,
          client: company.name,
          inn: company.inn,
          what: offerSent[company.id] ? "Предложение отправлено, ждём заявку" : "Сигнал по выписке — подготовить предложение",
          amount: "—",
          score: "—",
          slaMin: 90,
          sla: "сегодня",
          tone: "ok",
          action: offerSent[company.id] ? "Ждём" : "Открыть",
          screen: "bank-signal",
          demo: false,
        });
      }
      if ((chat[company.id]?.length ?? 0) > 0) {
        rows.push({
          id: `${company.id}-chat`,
          kind: "Сообщение",
          companyId: company.id,
          client: company.name,
          inn: company.inn,
          what: "Новое сообщение в чате заявки",
          amount: "—",
          score: "—",
          slaMin: 14,
          sla: "14 мин",
          tone: "warn",
          action: "Ответить",
          screen: "messages",
          demo: false,
        });
      }
    }
    const extras: Array<Omit<Task, "companyId"> & { key: string }> = [
      { key: "smirnov", id: "demo-smirnov", kind: "Сообщение", client: "ИП Смирнов А.В.", inn: "", what: "Можно перенести платёж на 3 дня?", amount: "—", score: "—", slaMin: 14, sla: "14 мин", tone: "warn", action: "Ответить", screen: "bank-signal", demo: true },
      { key: "bodrost_plus", id: "demo-bodrost", kind: "Ранний сигнал", client: "ООО «Бодрость Плюс»", inn: "", what: "Новое исполнительное производство", amount: "1,5 млн", score: "стоп", slaMin: 220, sla: "3 ч 40 мин", tone: "warn", action: "Разобрать", screen: "bank-signal", demo: true },
      { key: "kovalev", id: "demo-kovalev", kind: "Документы", client: "ИП Ковалев Д.С.", inn: "", what: "Клиент загрузил выписку по запросу", amount: "200 тыс.", score: "495", slaMin: 250, sla: "4 ч 10 мин", tone: "ok", action: "Пересмотреть", screen: "bank-signal", demo: true },
      { key: "tekhnostroy", id: "demo-tekhno", kind: "Сигнал", client: "ООО «ТехноСтрой Инжиниринг»", inn: "", what: "Рост оборотов: 3 новых госконтракта", amount: "3,2 млн", score: "—", slaMin: 500, sla: "сегодня", tone: "ok", action: "Отправить", screen: "bank-signal", demo: true },
    ];
    for (const extra of extras) {
      const company = companies.find((row) => row.demo_key === extra.key);
      if (!company || rows.some((row) => row.companyId === company.id && row.kind === extra.kind)) {
        continue;
      }
      rows.push({ ...extra, companyId: company.id, inn: company.inn });
    }
    return rows.sort((a, b) => a.slaMin - b.slaMin);
  }, [application, chat, companies, companyId, monitoring, offerSent, released]);

  const visible = tasks.filter((task) => {
    const rule = FILTERS.find((item) => item.id === filter);
    return !rule?.kinds || rule.kinds.includes(task.kind);
  });

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA"].includes(target.tagName)) {
        return;
      }
      if (event.key === "j" || event.key === "J") {
        setCursor((value) => Math.min(visible.length - 1, value + 1));
      }
      if (event.key === "k" || event.key === "K") {
        setCursor((value) => Math.max(0, value - 1));
      }
      if (event.key === "Enter" && visible[cursor]) {
        void open(visible[cursor]);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  async function open(task: Task) {
    if (task.companyId !== companyId) {
      await selectCompany(task.companyId, { nextScreen: task.screen });
      return;
    }
    goToScreen(task.screen);
  }

  return (
    <>
      <div className="v2-row">
        <div>
          <h1 className="v2-h1">Очередь задач</h1>
          <p className="v2-lead">Всё, что ждёт вашего действия, — в одном списке, срочное сверху.</p>
        </div>
        <button type="button" className="v2-btn primary" onClick={() => visible[0] && void open(visible[0])}>
          Взять следующую
        </button>
      </div>
      <div className="v2-filters">
        {FILTERS.map((item) => (
          <button key={item.id} type="button" className={filter === item.id ? "on" : ""} onClick={() => setFilter(item.id)}>
            {item.label} {item.id === "all" ? tasks.length : tasks.filter((task) => item.kinds?.includes(task.kind)).length}
          </button>
        ))}
      </div>
      <section className="v2-card" style={{ padding: 0 }}>
        <table className="v2-table">
          <thead>
            <tr>
              <th>Тип</th><th>Клиент</th><th>Что нужно сделать</th><th>Сумма</th><th>Оценка</th><th>SLA</th><th></th>
            </tr>
          </thead>
          <tbody>
            {visible.map((task, index) => (
              <tr key={task.id} className={index === cursor ? "active" : ""}>
                <td><span className={`v2-pill ${task.tone === "bad" ? "bad" : task.tone === "warn" ? "warn" : task.tone === "pause" ? "info" : "good"}`}>{task.kind}</span></td>
                <td>
                  {task.client}
                  <div className="v2-muted">ИНН {task.inn}{task.demo ? " · демо-данные" : ""}</div>
                </td>
                <td>{task.what}</td>
                <td>{task.amount}</td>
                <td>{task.score}</td>
                <td className={task.tone === "bad" ? "red" : task.tone === "ok" ? "green" : undefined}>{task.sla}</td>
                <td><button type="button" className="v2-btn" onClick={() => void open(task)}>{task.action}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <p className="v2-hotkeys">J / K — по списку · Enter — открыть. Сортировка по SLA. Пока ждём клиента, таймер на паузе.</p>
    </>
  );
}
