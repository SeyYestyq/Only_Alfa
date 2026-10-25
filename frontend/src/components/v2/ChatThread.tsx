import { useState } from "react";
import { useDemoStore, type ChatLine } from "../../state/demoStore";

const EMPTY_CHAT: ChatLine[] = [];

export function ChatThread({
  companyId,
  author,
  side,
  placeholder = "Написать…",
}: {
  companyId: string;
  author: string;
  side: "client" | "bank";
  placeholder?: string;
}) {
  const lines = useDemoStore((state) => state.chat[companyId] ?? EMPTY_CHAT);
  const pushChat = useDemoStore((state) => state.pushChat);
  const [draft, setDraft] = useState("");

  function send() {
    const text = draft.trim();
    if (!text) {
      return;
    }
    pushChat(companyId, { author, side, text });
    setDraft("");
  }

  return (
    <div>
      <div className="v2-chat">
        {lines.length === 0 ? (
          <p className="v2-muted">Переписка внутри кабинета. Сообщение увидит другая сторона.</p>
        ) : (
          lines.map((line) => (
            <div key={line.id} className={`v2-bubble ${line.side}`}>
              <div className="meta">{line.author} · {line.at}</div>
              {line.text}
            </div>
          ))
        )}
      </div>
      <div className="v2-composer">
        <input
          value={draft}
          placeholder={placeholder}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              send();
            }
          }}
        />
        <button type="button" className="v2-btn primary" onClick={send}>
          Отправить
        </button>
      </div>
    </div>
  );
}
