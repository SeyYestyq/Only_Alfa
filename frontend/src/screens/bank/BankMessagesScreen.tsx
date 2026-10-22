import { useState } from "react";
import { BankEmptyState, InboxSkeleton } from "../../components/Skeleton";
import { useApp } from "../../state/AppState";
import { formatMoney } from "../../utils/format";

type InboxFilter = "unassigned" | "mine" | "all";

/** Б4 — Входящие инспектора (copy 7 + состояния copy 12–13). */
export function BankMessagesScreen() {
  const { application, companies, selectCompany, goToScreen, isBusy } = useApp();
  const [filter, setFilter] = useState<InboxFilter>("unassigned");
  const [taken, setTaken] = useState(false);

  const threads = [
    {
      id: "rosters",
      initials: "РК",
      title: "ООО «Ростерс Кафе»",
      time: "23:05",
      preview: "Тема: кредит на оборудование · «Хотим взять ещё на второй ростер…»",
      unassigned: true,
    },
    {
      id: "kovalev",
      initials: "ИК",
      title: "ИП Ковалев",
      time: "22:31",
      preview: "«Можно ли перенести платёж на неделю?» · без заявки",
      unassigned: true,
    },
    {
      id: "tekhnostroy",
      initials: "ТС",
      title: "ООО «ТехноСтрой Инжиниринг»",
      time: "20:14",
      preview: "Мультибанк подключён, ждём выписки",
      unassigned: false,
    },
  ];

  const visible = threads.filter((thread) => {
    if (filter === "unassigned") {
      return thread.unassigned;
    }
    if (filter === "mine") {
      return !thread.unassigned || taken;
    }
    return true;
  });

  if (isBusy) {
    return <InboxSkeleton />;
  }

  return (
    <div className="bank-messages-shell">
      <aside className="chat-list">
        <div className="chat-list-head">
          <h1>Входящие</h1>
          <div className="bank-filters" style={{ marginTop: 12 }}>
            {(
              [
                ["unassigned", "Без исполнителя"],
                ["mine", "Мои"],
                ["all", "Все"],
              ] as Array<[InboxFilter, string]>
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={`bank-chip ${filter === id ? "active" : ""}`}
                onClick={() => setFilter(id)}
              >
                {label}
                {id === "all" ? <span>{threads.length}</span> : null}
              </button>
            ))}
          </div>
        </div>
        {visible.length === 0 ? (
          <div style={{ padding: 16 }}>
            <BankEmptyState
              title="Новых сообщений нет"
              text="Сообщения клиентов без исполнителя появятся здесь."
            />
          </div>
        ) : null}
        {visible.map((thread) => (
          <button
            key={thread.id}
            type="button"
            className="chat-thread-item active"
            onClick={() => {
              const company = companies.find((row) => row.demo_key === thread.id);
              if (company) {
                void selectCompany(company.id, { nextScreen: "bank-messages" });
              }
            }}
          >
            <span className="chat-avatar">{thread.initials}</span>
            <span className="chat-thread-body">
              <span className="chat-thread-top">
                <strong>{thread.title}</strong>
                <span className="muted">{thread.time}</span>
              </span>
              <span className="chat-thread-preview">{thread.preview}</span>
            </span>
          </button>
        ))}
      </aside>

      <section className="chat-pane">
        <header className="chat-pane-head">
          <span className="chat-avatar">АВ</span>
          <div style={{ flex: 1 }}>
            <strong>Алексей Воронов · ООО «Ростерс Кафе»</strong>
            <div className="muted">Тема: кредит на оборудование · заявка не привязана</div>
          </div>
          {!taken && (
            <button type="button" className="btn btn-primary btn-sm" onClick={() => setTaken(true)}>
              Взять в работу
            </button>
          )}
        </header>

        <div className="chat-stream">
          <div className="chat-system">Диалог без исполнителя · клиент ждёт ответа 18 минут. Норматив — 30 минут.</div>
          <div className="chat-bubble in">
            <div className="chat-bubble-meta">Алексей Воронов</div>
            <p>
              Добрый вечер! Мы взяли ростер на 2 500 000 ₽, но хотим второй — для доставки. Можно ли увеличить
              сумму по текущей заявке или нужна новая?
            </p>
            <p style={{ marginTop: 8 }}>И ещё: можно ли платить меньше летом?</p>
            <div className="chat-time">23:06</div>
          </div>
          {!taken && (
            <div className="alert alert-warn">Возьмите диалог в работу, чтобы ответить.</div>
          )}
          {application && (
            <div className="chat-card offer">
              <div className="figma-panel-title">Связать с заявкой</div>
              <strong>
                № {application.application_id.slice(-8).toUpperCase()} · {formatMoney(application.requested_amount_rub)}
              </strong>
              <p>{application.status_label}</p>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ marginTop: 10 }}
                onClick={() => goToScreen("bank-xray")}
              >
                Открыть рентген
              </button>
            </div>
          )}
          <div className="chat-card">
            <div className="figma-panel-title">Подсказка</div>
            <p>«Платёж от выручки» снижает платёж в низкий сезон — 9% эквайринга.</p>
          </div>
        </div>

        {taken && (
          <form className="chat-compose" onSubmit={(event) => event.preventDefault()}>
            <button type="button" className="chat-attach">
              +
            </button>
            <input placeholder="Ответ клиенту…" />
            <button type="submit" className="btn btn-primary btn-sm">
              ↑
            </button>
          </form>
        )}
      </section>

      <aside className="bank-client-card">
        <div className="figma-panel-title">Клиент</div>
        <div className="kv-list">
          <div className="meta-row">
            <span>ИНН</span>
            <strong>{application?.company.inn ?? "7704561238"}</strong>
          </div>
          <div className="meta-row">
            <span>Выручка / мес.</span>
            <strong>2,1 млн ₽</strong>
          </div>
          <div className="meta-row">
            <span>RiskScore</span>
            <strong>{application?.risk_score ?? 610}</strong>
          </div>
        </div>
      </aside>
    </div>
  );
}
