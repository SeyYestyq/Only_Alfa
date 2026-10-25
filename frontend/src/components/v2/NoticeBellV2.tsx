import { useEffect, useState } from "react";
import { api } from "../../api/client";
import type { ScreenId } from "../../api/types";
import { useApp } from "../../state/AppState";
import { noticesForRole, useDemoStore } from "../../state/demoStore";

interface ServerNotice {
  id: string;
  audience: string;
  title: string;
  text: string;
}

interface BellRow {
  id: string;
  title: string;
  text: string;
  screen: ScreenId;
}

/** Колокольчик шапки: серверные уведомления по заявке и локальные о подписи. */
export function NoticeBellV2() {
  const { companyId, viewMode, application, userRole, goToScreen } = useApp();
  const local = useDemoStore((state) => state.clientNotices);
  const [server, setServer] = useState<ServerNotice[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!companyId) {
      return;
    }
    let cancelled = false;
    api.notifications(companyId)
      .then((response) => {
        if (!cancelled) {
          setServer(response.notifications);
          setLoaded(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setServer([]);
          setLoaded(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [companyId, application?.application_id, application?.status]);

  useEffect(() => {
    if (!open) {
      return;
    }
    function onDoc(event: MouseEvent) {
      const node = document.getElementById("v2-bell");
      if (node && !node.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const audience = viewMode === "bank" ? "bank" : "client";
  const serverRows: BellRow[] = loaded
    ? server
        .filter((row) => row.audience === audience)
        .map((row) => ({
          id: row.id,
          title: row.title,
          text: row.text,
          screen: viewMode === "bank" ? "bank-xray" : "decision",
        }))
    : [];
  const localRows: BellRow[] = viewMode === "business"
    ? noticesForRole(local, userRole)
        .filter((row) => !loaded || row.kind === "sign" || row.kind === "approved" || row.kind === "rejected")
        .map((row) => ({
          id: row.id,
          title: row.title,
          text: row.text,
          screen: row.targetScreen,
        }))
    : [];
  const rows = [...serverRows, ...localRows];

  return (
    <div className="notice-bell" id="v2-bell">
      <button
        type="button"
        className={`notice-bell-btn ${open ? "active" : ""}`}
        aria-label="Уведомления"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="notice-bell-ico" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 3a5 5 0 0 0-5 5v2.2c0 .7-.2 1.4-.6 2L5 14.5V16h14v-1.5l-1.4-2.3c-.4-.6-.6-1.3-.6-2V8a5 5 0 0 0-5-5Z"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            <path d="M10 17a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </span>
        {rows.length > 0 ? <span className="figma-nav-badge">{rows.length > 9 ? "9+" : rows.length}</span> : null}
      </button>
      {open ? (
        <div className="notice-panel" role="dialog" aria-label="Уведомления">
          <div className="notice-panel-head">
            <strong>Уведомления</strong>
          </div>
          {rows.length === 0 ? (
            <p className="v2-muted" style={{ padding: "12px 14px" }}>Уведомлений нет</p>
          ) : (
            <ul className="notice-panel-list">
              {rows.map((row) => (
                <li key={row.id}>
                  <button
                    type="button"
                    className="notice-panel-item"
                    onClick={() => {
                      setOpen(false);
                      goToScreen(row.screen);
                    }}
                  >
                    <strong>{row.title}</strong>
                    <span>{row.text}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
