import { useState } from "react";
import { BankEmptyState, InboxSkeleton } from "../../components/Skeleton";
import { useApp } from "../../state/AppState";
import { useDemoStore } from "../../state/demoStore";
import { formatMoney } from "../../utils/format";

type InboxFilter = "unassigned" | "mine" | "all";

/** Б4 — Входящие: клиент, стадия кредита, приложенные документы. */
export function BankMessagesScreen() {
  const { application, companies, selectCompany, goToScreen, isBusy, dashboard } = useApp();
  const creditDocs = useDemoStore((state) => state.creditDocs);
  const [filter, setFilter] = useState<InboxFilter>("unassigned");
  const [taken, setTaken] = useState(false);
  const [reply, setReply] = useState("");
  const [sent, setSent] = useState<string[]>([]);

  const threads = [
    {
      id: "rosters",
      initials: "РК",
      title: "ООО «Ростерс Кафе»",
      time: "23:05",
      preview: application
        ? `Заявка № ${application.application_id.slice(-8).toUpperCase()} · ${application.status_label}`
        : "Тема: кредит на оборудование · «Хотим взять ещё…»",
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

  const company = dashboard?.company ?? application?.company;
  const contactName =
    dashboard?.company.director_name ??
    application?.company.users.find((user) => user.role === "CEO_OWNER" || user.role === "IP_OWNER")
      ?.full_name ??
    application?.company.users[0]?.full_name ??
    "Клиент";
  const companyName = company?.name ?? application?.company.name ?? "Компания";
  const stage = application?.status_label ?? "Заявка не привязана";

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
              const row = companies.find((item) => item.demo_key === thread.id);
              if (row) {
                void selectCompany(row.id, { nextScreen: "bank-messages" });
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
            <strong>
              {contactName} · {companyName}
            </strong>
            <div className="muted">
              {application
                ? `Кредит · № ${application.application_id.slice(-8).toUpperCase()} · ${stage}`
                : "Диалог без привязанной заявки"}
            </div>
          </div>
          {!taken && (
            <button type="button" className="btn btn-primary" onClick={() => setTaken(true)}>
              Взять в работу
            </button>
          )}
        </header>

        {application ? (
          <div className="bank-msg-case">
            <div>
              <strong>
                {companyName} · № {application.application_id.slice(-8).toUpperCase()} ·{" "}
                {formatMoney(application.requested_amount_rub)}
              </strong>
              <div className="ops-row-meta" style={{ marginTop: 8, justifyContent: "flex-start" }}>
                <span className="status-tag is-warn">{stage}</span>
                <span
                  className={`status-tag ${
                    application.risk_score === 0 || application.risk_score < 520
                      ? "is-risk"
                      : application.risk_score >= 750
                        ? "is-good"
                        : "is-info"
                  }`}
                >
                  Риск {application.risk_score || "стоп"}
                </span>
              </div>
            </div>
            <button type="button" className="btn btn-primary btn-sm" onClick={() => goToScreen("bank-xray")}>
              К разбору заявки
            </button>
          </div>
        ) : (
          <div className="bank-msg-case">
            <div>
              <strong>Заявка не привязана</strong>
              <span className="muted">Ответьте клиенту или выберите диалог слева</span>
            </div>
          </div>
        )}

        <div className="chat-stream">
          <div className="chat-system">
            {application
              ? `Что сделать: ответить по стадии «${stage}» · сумма ${formatMoney(application.requested_amount_rub)}`
              : "Диалог без исполнителя · клиент ждёт ответа."}
          </div>
          <div className="chat-bubble in">
            <div className="chat-bubble-meta">{contactName}</div>
            <p>
              {application?.status === "NEED_MORE_INFO"
                ? "Добрый день! Загружаю документы, которые вы запросили. Подскажите, всё ли на месте?"
                : "Добрый вечер! Подскажите статус по кредиту и можно ли чуть снизить платёж летом?"}
            </p>
            <div className="chat-time">23:06</div>
          </div>

          {creditDocs.map((doc) => (
            <div key={doc} className="chat-card">
              <div className="figma-panel-title">Документ от клиента</div>
              <strong>PDF · {doc}</strong>
              <p>Прикреплён к заявке — виден в карточке справа.</p>
            </div>
          ))}

          {sent.map((text) => (
            <div key={text} className="chat-bubble out">
              <p>{text}</p>
              <div className="chat-time">сейчас</div>
            </div>
          ))}

          {!taken && (
            <div className="alert alert-warn">Возьмите диалог в работу, чтобы ответить.</div>
          )}

          {application && (
            <div className="chat-card offer">
              <div className="figma-panel-title">Заявка в работе</div>
              <strong>
                № {application.application_id.slice(-8).toUpperCase()} ·{" "}
                {formatMoney(application.requested_amount_rub)}
              </strong>
              <p className="muted" style={{ marginTop: 6 }}>
                {application.status_label} · риск {application.risk_score || "стоп"} · кнопка разбора — в шапке
                чата
              </p>
            </div>
          )}
        </div>

        {taken && (
          <form
            className="chat-compose"
            onSubmit={(event) => {
              event.preventDefault();
              if (!reply.trim()) {
                return;
              }
              setSent((prev) => [...prev, reply.trim()]);
              setReply("");
            }}
          >
            <button type="button" className="chat-attach" aria-label="Вложение">
              +
            </button>
            <input
              value={reply}
              onChange={(event) => setReply(event.target.value)}
              placeholder="Ответ клиенту…"
            />
            <button type="submit" className="btn btn-primary btn-sm">
              ↑
            </button>
          </form>
        )}
      </section>

      <aside className="bank-client-card">
        <div className="figma-panel-title">Контекст кейса</div>
        <div className="kv-list">
          <div className="meta-row">
            <span>Клиент</span>
            <strong>{companyName}</strong>
          </div>
          <div className="meta-row">
            <span>ИНН</span>
            <strong>{company?.inn ?? application?.company.inn ?? "—"}</strong>
          </div>
          <div className="meta-row">
            <span>Стадия</span>
            <strong>{stage}</strong>
          </div>
          {application && (
            <div className="meta-row">
              <span>Сумма</span>
              <strong>{formatMoney(application.requested_amount_rub)}</strong>
            </div>
          )}
          <div className="meta-row">
            <span>Риск</span>
            <strong>{application?.risk_score || "—"}</strong>
          </div>
          <div className="meta-row">
            <span>Выручка / мес.</span>
            <strong>
              {formatMoney(
                application?.monthly_revenue_alfa ??
                  dashboard?.company.monthly_revenue_alfa ??
                  0,
              )}
            </strong>
          </div>
        </div>

        {company || application ? (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            style={{ marginTop: 12, width: "100%" }}
            onClick={() => goToScreen("bank-profile")}
          >
            Портрет 360°
          </button>
        ) : null}

        <div className="figma-panel-title" style={{ marginTop: 20 }}>
          Документы по заявке
        </div>
        {creditDocs.length === 0 ? (
          <p className="muted" style={{ marginTop: 8, fontSize: 13 }}>
            Клиент ещё ничего не приложил. Файлы из чата появятся здесь.
          </p>
        ) : (
          <ul className="bank-doc-list">
            {creditDocs.map((doc) => (
              <li key={doc}>
                <span className="apply-invoice pdf" style={{ width: 36, height: 36, fontSize: 10 }}>
                  PDF
                </span>
                <span>{doc}</span>
              </li>
            ))}
          </ul>
        )}
      </aside>
    </div>
  );
}
