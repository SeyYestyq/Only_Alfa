import { useEffect, useRef } from "react";
import { useApp } from "../state/AppState";
import { useDemoStore, type ClientNotice } from "../state/demoStore";

function kindLabel(kind: ClientNotice["kind"]): string {
  if (kind === "approved") {
    return "Одобрено";
  }
  if (kind === "sign") {
    return "Подпись";
  }
  if (kind === "rejected") {
    return "Отказ";
  }
  if (kind === "need_docs") {
    return "Документы";
  }
  if (kind === "counter") {
    return "Условия";
  }
  return "В работе";
}

/** Колокольчик в шапке: список уведомлений по кредиту, пока ждёте банк. */
export function NoticeBell() {
  const { viewMode, openApplication, goToScreen } = useApp();
  const notices = useDemoStore((state) => state.clientNotices);
  const open = useDemoStore((state) => state.noticesOpen);
  const setOpen = useDemoStore((state) => state.setNoticesOpen);
  const dismiss = useDemoStore((state) => state.dismissClientNotice);
  const clearAll = useDemoStore((state) => state.clearClientNotices);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    function onDoc(event: MouseEvent) {
      if (!panelRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open, setOpen]);

  if (viewMode === "bank") {
    return null;
  }

  const count = notices.length;

  return (
    <div className="notice-bell" ref={panelRef}>
      <button
        type="button"
        className={`notice-bell-btn ${open ? "active" : ""}`}
        aria-label="Уведомления по кредиту"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <span className="notice-bell-ico" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 3a5 5 0 0 0-5 5v2.2c0 .7-.2 1.4-.6 2L5 14.5V16h14v-1.5l-1.4-2.3c-.4-.6-.6-1.3-.6-2V8a5 5 0 0 0-5-5Z"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            <path
              d="M10 17a2 2 0 0 0 4 0"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        </span>
        {count > 0 ? <span className="figma-nav-badge">{count > 9 ? "9+" : count}</span> : null}
      </button>

      {open && (
        <div className="notice-panel" role="dialog" aria-label="Уведомления">
          <div className="notice-panel-head">
            <strong>Уведомления</strong>
            {count > 0 ? (
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => clearAll()}>
                Очистить
              </button>
            ) : null}
          </div>
          {count === 0 ? (
            <p className="muted" style={{ padding: "12px 14px", fontSize: 13 }}>
              Пока тихо. Когда банк ответит по заявке — сюда придёт сообщение с действием.
            </p>
          ) : (
            <ul className="notice-panel-list">
              {notices.map((notice) => (
                <li key={notice.id}>
                  <button
                    type="button"
                    className="notice-panel-item"
                    onClick={() => {
                      dismiss(notice.id);
                      setOpen(false);
                      void openApplication(notice.applicationId).then(() => {
                        goToScreen(notice.targetScreen);
                      });
                    }}
                  >
                    <span className="notice-panel-kind">{kindLabel(notice.kind)}</span>
                    <strong>{notice.title}</strong>
                    <span className="muted">{notice.text}</span>
                    <span className="notice-panel-cta">{notice.primaryLabel} →</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
