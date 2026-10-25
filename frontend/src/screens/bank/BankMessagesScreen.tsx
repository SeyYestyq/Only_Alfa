import { useState, useRef, useEffect } from "react";
import { useApp } from "../../state/AppState";
import {
  useBankMessagesStore,
  type ChatThread,
} from "../../state/bankMessagesStore";
import { formatMoney } from "../../utils/format";
import "../../styles/bank-messages.css";

const DEMO_SCENARIOS: Record<string, any> = {
  rosters: {
    product_type: "INVEST_LEASING",
    requested_amount_rub: 2_500_000,
    term_months: 12,
    declared_monthly_revenue: 2_100_000,
  },
  tekhnostroy: {
    product_type: "VKL",
    requested_amount_rub: 3_200_000,
    term_months: 24,
    declared_monthly_revenue: 6_000_000,
  },
  kovalev: {
    product_type: "OVERDRAFT",
    requested_amount_rub: 200_000,
    term_months: 12,
    declared_monthly_revenue: 680_000,
  },
  smirnov: {
    product_type: "INVEST_LEASING",
    requested_amount_rub: 900_000,
    term_months: 24,
    declared_monthly_revenue: 1_450_000,
  },
  bodrost: {
    product_type: "INVEST_LEASING",
    requested_amount_rub: 1_500_000,
    term_months: 12,
    declared_monthly_revenue: 400_000,
  },
  bodrost_plus: {
    product_type: "INVEST_LEASING",
    requested_amount_rub: 1_500_000,
    term_months: 12,
    declared_monthly_revenue: 400_000,
  },
};

/**
 * Экран «Чаты кредитного инспектора» (со стороны банка по референсу index.html).
 * Позволяет вести переписку с заёмщиками, отправлять контр-офферы, запрашивать документы
 * и в 1 клик переходить в стол разбора заявки или досье 360°.
 */
export function BankMessagesScreen() {
  const {
    companies,
    selectCompany,
    openBankCase,
    goToScreen,
  } = useApp();

  const threads = useBankMessagesStore((state) => state.threads);
  const activeThreadId = useBankMessagesStore((state) => state.activeThreadId);
  const isTyping = useBankMessagesStore((state) => state.isTyping);
  const filter = useBankMessagesStore((state) => state.filter);
  const setActiveThread = useBankMessagesStore((state) => state.setActiveThread);
  const setFilter = useBankMessagesStore((state) => state.setFilter);
  const sendMessage = useBankMessagesStore((state) => state.sendMessage);
  const sendQuickAction = useBankMessagesStore((state) => state.sendQuickAction);

  const [inputVal, setInputVal] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const streamEndRef = useRef<HTMLDivElement | null>(null);

  const activeThread: ChatThread =
    threads.find((t) => t.id === activeThreadId) ?? threads[0];

  // Автоскролл к последнему сообщению
  useEffect(() => {
    streamEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeThread?.messages.length, isTyping]);

  const filteredThreads = threads.filter((t) => {
    const q = searchQuery.trim().toLowerCase();
    const matchQuery =
      !q || `${t.companyName} ${t.inn} ${t.directorName}`.toLowerCase().includes(q);
    if (!matchQuery) return false;

    if (filter === "attention") return t.unreadCount > 0;
    if (filter === "with_app") return t.requestedAmountRub > 0;
    return true;
  });

  const handleSelectThread = (thread: ChatThread) => {
    setActiveThread(thread.id);
    const company = companies.find(
      (c) => c.id === thread.companyId || c.demo_key === thread.demoKey,
    );
    if (company) {
      void selectCompany(company.id, { nextScreen: "bank-messages" });
    }
  };

  const handleOpenDesk = () => {
    if (!activeThread) return;
    const company = companies.find(
      (c) => c.id === activeThread.companyId || c.demo_key === activeThread.demoKey,
    );
    const targetId = company?.id ?? activeThread.companyId;
    const scenario = DEMO_SCENARIOS[activeThread.demoKey] ?? {
      product_type: "INVEST_LEASING",
      requested_amount_rub: activeThread.requestedAmountRub || 1_000_000,
      term_months: 12,
      declared_monthly_revenue: 1_500_000,
    };
    void openBankCase(targetId, scenario);
  };

  const handleOpenProfile = () => {
    if (!activeThread) return;
    const company = companies.find(
      (c) => c.id === activeThread.companyId || c.demo_key === activeThread.demoKey,
    );
    const targetId = company?.id ?? activeThread.companyId;
    void selectCompany(targetId, { nextScreen: "bank-clients" });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    sendMessage(inputVal.trim());
    setInputVal("");
  };

  const handleAttachDocument = () => {
    const sampleDocs = [
      {
        name: `Проект_договора_лизинга_${activeThread.initials}.pdf`,
        size: "1.6 МБ",
        type: "pdf" as const,
      },
      {
        name: `Расчет_контр_оффера_${activeThread.initials}.xlsx`,
        size: "2.1 МБ",
        type: "xlsx" as const,
      },
      {
        name: `Форма_согласия_на_залог_${activeThread.initials}.pdf`,
        size: "950 КБ",
        type: "pdf" as const,
      },
    ];
    const picked = sampleDocs[Math.floor(Math.random() * sampleDocs.length)];
    sendMessage(`Направляем официальный документ банка: ${picked.name}`, picked);
  };

  return (
    <div className="bank-messages-page">
      <div className="bank-page-head">
        <div>
          <div className="figma-eyebrow">Пилот банка · Коммуникации</div>
          <h1 className="figma-h1">Чаты с клиентами</h1>
          <p className="figma-lead">
            Прямая переписка с заемщиками по кредитным заявкам · запросы документов и контр-офферы
          </p>
        </div>
      </div>

      <div className="bank-chat-shell">
        {/* Левая колонка: список диалогов */}
        <aside className="bank-chat-sidebar">
          <div className="bank-chat-sidebar-head">
            <div className="bank-chat-sidebar-title-row">
              <h2 className="bank-chat-sidebar-title">Диалоги ({threads.length})</h2>
            </div>

            <div className="bank-chat-filter-chips">
              <button
                type="button"
                className={`bank-chat-filter-chip ${filter === "all" ? "active" : ""}`}
                onClick={() => setFilter("all")}
              >
                Все ({threads.length})
              </button>
              <button
                type="button"
                className={`bank-chat-filter-chip ${filter === "attention" ? "active" : ""}`}
                onClick={() => setFilter("attention")}
              >
                Новые ({threads.filter((t) => t.unreadCount > 0).length})
              </button>
              <button
                type="button"
                className={`bank-chat-filter-chip ${filter === "with_app" ? "active" : ""}`}
                onClick={() => setFilter("with_app")}
              >
                С заявками (4)
              </button>
            </div>

            <input
              type="text"
              className="bank-chat-search"
              placeholder="Поиск по клиенту или ИНН…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Поиск диалога"
            />
          </div>

          <ul className="bank-chat-thread-list">
            {filteredThreads.map((thread) => {
              const isActive = thread.id === activeThread.id;
              return (
                <li key={thread.id}>
                  <button
                    type="button"
                    className={`bank-chat-thread-item ${isActive ? "active" : ""}`}
                    onClick={() => handleSelectThread(thread)}
                  >
                    <div className={`bank-chat-thread-avatar dot-${thread.tagColor}`}>
                      {thread.initials}
                    </div>
                    <div className="bank-chat-thread-body">
                      <div className="bank-chat-thread-header">
                        <strong>{thread.companyName}</strong>
                        <span className="bank-chat-thread-time">{thread.lastTime}</span>
                      </div>
                      <div className="bank-chat-thread-sub">
                        {thread.directorName} · ИНН {thread.inn}
                      </div>
                      <div className="bank-chat-thread-preview">
                        {thread.lastMessageSnippet}
                      </div>
                      <div className="bank-chat-thread-tags">
                        <span className="bank-chat-pill">{thread.statusLabel}</span>
                        {thread.unreadCount > 0 && (
                          <span className="bank-chat-unread-dot">
                            {thread.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        {/* Правая колонка: активный чат с клиентом */}
        <main className="bank-chat-pane">
          <header className="bank-chat-pane-head">
            <div className="bank-chat-pane-left">
              <div className={`bank-chat-thread-avatar dot-${activeThread.tagColor}`}>
                {activeThread.initials}
              </div>
              <div>
                <h2 className="bank-chat-pane-title">
                  {activeThread.companyName} · {activeThread.directorName}
                </h2>
                <div className="bank-chat-pane-sub">
                  ИНН {activeThread.inn} · {activeThread.statusLabel} · Сумма заявки:{" "}
                  {formatMoney(activeThread.requestedAmountRub)} · Риск-скоринг:{" "}
                  {activeThread.score || "Стоп-фактор"}
                </div>
              </div>
            </div>

            <div className="bank-chat-pane-actions">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleOpenProfile}
                title="Открыть финансовое досье 360°"
              >
                360° Досье
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleOpenDesk}
                title="Перейти к столу разбора и принятия решения"
              >
                Стол разбора заявки →
              </button>
            </div>
          </header>

          {/* Стрим сообщений */}
          <div className="bank-chat-stream">
            {activeThread.messages.map((msg) => {
              if (msg.sender === "system") {
                return (
                  <div key={msg.id} className="bank-chat-system-event">
                    {msg.text}
                  </div>
                );
              }

              const isBank = msg.sender === "bank";

              return (
                <div
                  key={msg.id}
                  className={`bank-chat-bubble ${isBank ? "out" : "in"}`}
                >
                  <div className="bank-chat-bubble-author">{msg.senderName}</div>
                  <p className="bank-chat-bubble-text">{msg.text}</p>

                  {/* Вложение документа */}
                  {msg.attachment && (
                    <div className="bank-chat-attachment-card">
                      <div className="bank-chat-doc-icon">
                        {msg.attachment.type.toUpperCase()}
                      </div>
                      <div>
                        <div className="bank-chat-doc-name">
                          {msg.attachment.name}
                        </div>
                        <div className="bank-chat-doc-meta">
                          {msg.attachment.size} · Документ заемщика
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Карточка предложения / контр-оффера */}
                  {msg.offerCard && (
                    <div className="bank-chat-offer-card">
                      <div className="bank-chat-offer-head">
                        <strong>{msg.offerCard.title}</strong>
                        {msg.offerCard.badge && (
                          <span className="status-tag is-good">
                            {msg.offerCard.badge}
                          </span>
                        )}
                      </div>
                      <div className="bank-chat-offer-body">
                        {msg.offerCard.body}
                      </div>
                      <div className="bank-chat-offer-metrics">
                        <span>Сумма: {msg.offerCard.amount}</span>
                        <span>Срок: {msg.offerCard.term}</span>
                      </div>
                    </div>
                  )}

                  <div className="bank-chat-bubble-time">{msg.time}</div>
                </div>
              );
            })}

            {isTyping && (
              <div className="bank-chat-typing">
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span>{activeThread.directorName} печатает ответ…</span>
              </div>
            )}

            <div ref={streamEndRef} />
          </div>

          {/* Быстрые шаблоны ответов кредитного инспектора */}
          <div className="bank-chat-quick-actions">
            <span className="bank-quick-label">Быстрые запросы:</span>
            <button
              type="button"
              className="bank-quick-btn"
              onClick={() => sendQuickAction("request_lease")}
            >
              📄 Запросить договор аренды
            </button>
            <button
              type="button"
              className="bank-quick-btn"
              onClick={() => sendQuickAction("send_counter")}
            >
              ⚖️ Контр-оффер (1,8 млн ₽)
            </button>
            <button
              type="button"
              className="bank-quick-btn"
              onClick={() => sendQuickAction("request_multibank")}
            >
              🔍 Запросить Мультибанк
            </button>
            <button
              type="button"
              className="bank-quick-btn"
              onClick={() => sendQuickAction("adjust_schedule")}
            >
              📅 Согласовать график
            </button>
            <button
              type="button"
              className="bank-quick-btn"
              onClick={() => sendQuickAction("confirm_docs")}
            >
              ✅ Принять документы
            </button>
          </div>

          {/* Форма ввода сообщения */}
          <form className="bank-chat-compose" onSubmit={handleSubmit}>
            <button
              type="button"
              className="bank-chat-attach-btn"
              title="Прикрепить проект договора или расчет"
              onClick={handleAttachDocument}
            >
              +
            </button>
            <input
              type="text"
              className="bank-chat-input"
              placeholder={`Написать сообщение ${activeThread.directorName} (${activeThread.companyName})…`}
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
            />
            <button
              type="submit"
              className="bank-chat-send-btn"
              disabled={!inputVal.trim()}
            >
              Отправить ↵
            </button>
          </form>
        </main>
      </div>
    </div>
  );
}
