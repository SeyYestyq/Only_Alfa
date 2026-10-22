import { useMemo, useState } from "react";
import { useApp } from "../state/AppState";
import { formatDateTime, formatMoney } from "../utils/format";

type ThreadId = "application" | "offer" | "news";

/** К6 — сообщения: список диалогов и переписка по заявке. */
export function MessagesScreen() {
  const { dashboard, application, goToScreen } = useApp();
  const news = dashboard?.news_feed ?? [];
  const [active, setActive] = useState<ThreadId>(application ? "application" : "offer");
  const [draft, setDraft] = useState("");
  const [sentFailed, setSentFailed] = useState(false);

  const threads = useMemo(() => {
    const rows: Array<{
      id: ThreadId;
      initials: string;
      title: string;
      preview: string;
      time: string;
      unread?: number;
    }> = [];
    if (application) {
      rows.push({
        id: "application",
        initials: "ЕО",
        title: `Заявка № ${application.application_id.slice(-8).toUpperCase()}`,
        preview: `Статус: ${application.status_label}`,
        time: application.updated_at ? formatDateTime(application.updated_at).split(", ")[1] ?? "—" : "—",
        unread: application.status === "NEED_MORE_INFO" || application.status === "COUNTER_OFFER" ? 1 : undefined,
      });
    }
    rows.push({
      id: "offer",
      initials: "А",
      title: "Предложение банка",
      preview: "Кредит на развитие · 900 000 ₽ — по сигналу о покупке оборудования",
      time: "18.10",
    });
    if (news[0]) {
      rows.push({
        id: "news",
        initials: "ИП",
        title: news[0].title,
        preview: news[0].text.slice(0, 80),
        time: formatDateTime(news[0].created_at).split(", ")[0] ?? "",
      });
    }
    return rows;
  }, [application, news]);

  function sendDraft() {
    if (!draft.trim()) {
      return;
    }
    setSentFailed(true);
  }

  return (
    <div className="chat-shell">
      <aside className="chat-list">
        <div className="chat-list-head">
          <h1>Сообщения</h1>
        </div>
        {threads.map((thread) => (
          <button
            key={thread.id}
            type="button"
            className={`chat-thread-item ${active === thread.id ? "active" : ""}`}
            onClick={() => {
              setActive(thread.id);
              setSentFailed(false);
            }}
          >
            <span className="chat-avatar">{thread.initials}</span>
            <span className="chat-thread-body">
              <span className="chat-thread-top">
                <strong>{thread.title}</strong>
                <span className="muted">{thread.time}</span>
              </span>
              <span className="chat-thread-preview">
                {thread.preview}
                {thread.unread ? <span className="figma-nav-badge">{thread.unread}</span> : null}
              </span>
            </span>
          </button>
        ))}
      </aside>

      <section className="chat-pane">
        {active === "application" && application ? (
          <>
            <header className="chat-pane-head">
              <span className="chat-avatar">ЕО</span>
              <div>
                <strong>Елена Орлова</strong>
                <div className="muted">
                  Кредитный инспектор · Заявка № {application.application_id.slice(-8).toUpperCase()}
                </div>
              </div>
            </header>

            <div className="chat-stream">
              <div className="chat-system">
                {application.created_at ? formatDateTime(application.created_at) : "—"} · Заявка отправлена на
                рассмотрение
              </div>
              <div className="chat-system">Статус: {application.status_label}</div>

              {(application.status === "NEED_MORE_INFO" || application.status === "COUNTER_OFFER") && (
                <div className="chat-bubble in">
                  <div className="chat-bubble-meta">Елена Орлова</div>
                  <p>
                    Чтобы рассмотреть сумму ближе к {formatMoney(application.requested_amount_rub)}, пришлите
                    выписку по счёту в другом банке за 6 месяцев — часть выручки может идти туда.
                  </p>
                  <div className="chat-time">22:57</div>
                </div>
              )}

              {application.status === "NEED_MORE_INFO" && (
                <div className="chat-card">
                  <div className="figma-panel-title">Запрос документов</div>
                  <p>Выписка по расчётному счёту в другом банке · 6 мес. · PDF</p>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ marginTop: 12 }}
                    onClick={() => goToScreen("decision")}
                  >
                    Открыть заявку
                  </button>
                </div>
              )}

              {application.status === "COUNTER_OFFER" && application.counter_offers[2] && (
                <div className="chat-card offer">
                  <div className="figma-panel-title">Предложение в чате</div>
                  <strong>{application.counter_offers[2].label}</strong>
                  <p>
                    {formatMoney(application.counter_offers[2].amount_rub)} ·{" "}
                    {application.counter_offers[2].term_months} мес. ·{" "}
                    {application.counter_offers[2].features[0] ?? application.product_label}
                  </p>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    style={{ marginTop: 12 }}
                    onClick={() => goToScreen("decision")}
                  >
                    Смотреть варианты
                  </button>
                </div>
              )}

              {sentFailed && (
                <div className="chat-bubble out failed">
                  <p>{draft || "Загружаю выписку, посмотрите, пожалуйста, сегодня."}</p>
                  <div className="chat-time">
                    Не отправлено ·{" "}
                    <button type="button" className="linkish" onClick={() => setSentFailed(false)}>
                      Повторить
                    </button>
                  </div>
                </div>
              )}

              <div className="chat-typing">Елена печатает…</div>
            </div>

            <form
              className="chat-compose"
              onSubmit={(event) => {
                event.preventDefault();
                sendDraft();
              }}
            >
              <button type="button" className="chat-attach" aria-label="Вложение">
                +
              </button>
              <input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder={`Сообщение по заявке № ${application.application_id.slice(-8).toUpperCase()}`}
              />
              <button type="submit" className="btn btn-primary btn-sm" aria-label="Отправить">
                ↑
              </button>
            </form>
          </>
        ) : active === "offer" ? (
          <>
            <header className="chat-pane-head">
              <span className="chat-avatar">А</span>
              <div>
                <strong>Предложение банка</strong>
                <div className="muted">Сигнал по кассе и закупке оборудования</div>
              </div>
            </header>
            <div className="chat-stream">
              <div className="chat-bubble in">
                <p>
                  Кредит на развитие · 900 000 ₽ на 24 мес. — вернуть деньги после закупки оборудования и
                  закрыть разрыв.
                </p>
              </div>
              <button type="button" className="btn btn-primary" onClick={() => goToScreen("apply")}>
                Оформить заявку
              </button>
            </div>
          </>
        ) : (
          <>
            <header className="chat-pane-head">
              <span className="chat-avatar">ИП</span>
              <div>
                <strong>{news[0]?.title ?? "Сообщение"}</strong>
                <div className="muted">{news[0]?.cluster}</div>
              </div>
            </header>
            <div className="chat-stream">
              <div className="chat-bubble in">
                <p>{news[0]?.text ?? "Новых сообщений нет."}</p>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
