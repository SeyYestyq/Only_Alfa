import { useEffect, useId, useRef, useState } from "react";
import type { Application } from "../api/types";
import { useDemoStore } from "../state/demoStore";
import { formatMoney } from "../utils/format";

type ChatRole = "bank" | "client" | "system";

interface ChatMessage {
  id: string;
  role: ChatRole;
  author: string;
  text: string;
  time: string;
  attachment?: string;
}

function nowLabel(): string {
  return new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

function seedMessages(application: Application): ChatMessage[] {
  const idTail = application.application_id.slice(-8).toUpperCase();
  const rows: ChatMessage[] = [
    {
      id: "sys-1",
      role: "system",
      author: "Система",
      text: `Заявка № ${idTail} · ${application.status_label}`,
      time: nowLabel(),
    },
  ];

  if (application.status === "NEED_MORE_INFO" || application.status === "COUNTER_OFFER") {
    rows.push({
      id: "bank-1",
      role: "bank",
      author: "Елена Орлова · Альфа-Банк",
      text:
        application.status === "NEED_MORE_INFO"
          ? `Чтобы рассмотреть сумму ближе к ${formatMoney(application.requested_amount_rub)}, пришлите выписку по счёту в другом банке за 6 месяцев и пояснение по кассовому разрыву.`
          : `Можем одобрить на других условиях. Откройте решение по заявке № ${idTail} или задайте вопрос здесь.`,
      time: "09:14",
    });
  } else if (application.status === "REJECTED") {
    rows.push({
      id: "bank-1",
      role: "bank",
      author: "Альфа-Банк",
      text:
        application.hard_stop_reason ??
        "По текущим данным одобрить не можем. Ниже — что можно усилить за 90 дней. Вопросы — в этом чате.",
      time: "10:02",
    });
  } else if (application.status === "AWAITING_CEO_APPROVAL") {
    rows.push({
      id: "bank-1",
      role: "bank",
      author: "Альфа-Банк",
      text: "Условия готовы к подписи. Напоминание уйдёт гендиректору — можно написать сюда, если нужна правка.",
      time: "11:20",
    });
  } else {
    rows.push({
      id: "bank-1",
      role: "bank",
      author: "Альфа-Банк",
      text: `По заявке № ${idTail} можно уточнить статус, документы или условия. Отвечает кредитный инспектор.`,
      time: "12:00",
    });
  }

  return rows;
}

/** Модальный чат с банком по конкретной кредитной заявке + вложения. */
export function CreditChatModal({
  application,
  onClose,
  initialDraft = "",
}: {
  application: Application;
  onClose: () => void;
  initialDraft?: string;
}) {
  const titleId = useId();
  const endRef = useRef<HTMLDivElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const addCreditDoc = useDemoStore((state) => state.addCreditDoc);
  const [messages, setMessages] = useState<ChatMessage[]>(() => seedMessages(application));
  const [draft, setDraft] = useState(initialDraft);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function pushClient(text: string, attachment?: string) {
    setMessages((prev) => [
      ...prev,
      {
        id: `client-${Date.now()}`,
        role: "client",
        author: "Вы",
        text,
        time: nowLabel(),
        attachment,
      },
    ]);
    setIsTyping(true);
    window.setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: `bank-${Date.now()}`,
          role: "bank",
          author: "Елена Орлова · Альфа-Банк",
          text: attachment
            ? "Документ получили. Проверим в течение рабочего дня и обновим статус заявки."
            : "Приняли. Если понадобятся уточнения — напишем сюда же.",
          time: nowLabel(),
        },
      ]);
      setIsTyping(false);
    }, 1400);
  }

  function sendDraft() {
    const text = draft.trim();
    if (!text) {
      return;
    }
    setDraft("");
    pushClient(text);
  }

  function onPickFile(file: File | undefined) {
    if (!file) {
      return;
    }
    addCreditDoc(file.name);
    pushClient(`Прикрепил(а) документ: ${file.name}`, file.name);
  }

  const needsDocs = application.status === "NEED_MORE_INFO";

  return (
    <div className="sheet-backdrop" role="presentation" onClick={onClose}>
      <div
        className="sheet-card credit-chat-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="sheet-head">
          <div>
            <div className="figma-panel-title">Переписка с банком</div>
            <h2 id={titleId}>
              Кредит · заявка № {application.application_id.slice(-8).toUpperCase()}
            </h2>
            <p className="muted" style={{ marginTop: 4, fontSize: 13 }}>
              {application.status_label} · отвечает кредитный инспектор
            </p>
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Закрыть">
            ✕
          </button>
        </header>

        {needsDocs && (
          <div className="credit-chat-banner">
            <div>
              <strong>Нужны документы</strong>
              <p>Прикрепите выписку или файл — инспектор увидит его в этом же чате.</p>
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => fileRef.current?.click()}
            >
              Прикрепить документы
            </button>
          </div>
        )}

        <div className="credit-chat-stream">
          {messages.map((message) =>
            message.role === "system" ? (
              <div key={message.id} className="chat-system">
                {message.text}
              </div>
            ) : (
              <div
                key={message.id}
                className={`chat-bubble ${message.role === "client" ? "out" : "in"}`}
              >
                {message.role === "bank" && (
                  <div className="chat-bubble-meta">{message.author}</div>
                )}
                <p>{message.text}</p>
                {message.attachment && (
                  <div className="credit-chat-file">PDF · {message.attachment}</div>
                )}
                <div className="chat-time">{message.time}</div>
              </div>
            ),
          )}
          {isTyping && <div className="chat-typing">Елена печатает…</div>}
          <div ref={endRef} />
        </div>

        <form
          className="chat-compose"
          onSubmit={(event) => {
            event.preventDefault();
            sendDraft();
          }}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            hidden
            onChange={(event) => {
              onPickFile(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
          <button
            type="button"
            className="chat-attach"
            aria-label="Прикрепить файл"
            onClick={() => fileRef.current?.click()}
          >
            +
          </button>
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Сообщение банку…"
          />
          <button type="submit" className="btn btn-primary btn-sm" aria-label="Отправить">
            ↑
          </button>
        </form>
      </div>
    </div>
  );
}
