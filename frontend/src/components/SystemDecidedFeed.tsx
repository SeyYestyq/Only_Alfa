import { useEffect, useState } from "react";
import { api } from "../api/client";
import type { SystemAction } from "../api/types";
import { useApp } from "../state/AppState";

export function SystemDecidedFeed() {
  const { companyId, viewMode } = useApp();
  const [actions, setActions] = useState<SystemAction[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!companyId || viewMode !== "bank") {
      return;
    }
    void api.getSystemActions(companyId).then((payload) => setActions(payload.actions));
  }, [companyId, viewMode]);

  if (viewMode !== "bank" || actions.length === 0) {
    return null;
  }

  async function publish(id: string) {
    if (!companyId) return;
    setBusyId(id);
    try {
      await api.publishSystemAction(companyId, id);
      const payload = await api.getSystemActions(companyId);
      setActions(payload.actions);
    } finally {
      setBusyId(null);
    }
  }

  async function cancel(id: string) {
    if (!companyId) return;
    setBusyId(id);
    try {
      await api.cancelSystemAction(companyId, id);
      const payload = await api.getSystemActions(companyId);
      setActions(payload.actions);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="figma-panel figma-panel-sm" style={{ marginBottom: 20 }}>
      <div className="figma-panel-title">Система решила</div>
      <p className="muted" style={{ fontSize: 13, marginTop: 4 }}>
        Что заметила автоматика, какое правило сработало и что ушло клиенту.
      </p>
      <div className="system-decided-list" style={{ marginTop: 12, display: "grid", gap: 12 }}>
        {actions.map((action) => (
          <article key={action.id} className="figma-panel figma-panel-sm" style={{ background: "var(--surface-2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
              <strong>{action.title}</strong>
              <span className="pill pill-outline">{action.status}</span>
            </div>
            <p className="muted" style={{ fontSize: 13, marginTop: 6 }}>{action.explanation}</p>
            <p style={{ fontSize: 13, marginTop: 8 }}>Клиенту: {action.client_text}</p>
            {action.status === "PENDING" && (
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  disabled={busyId === action.id}
                  onClick={() => void publish(action.id)}
                >
                  Отправить клиенту
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  disabled={busyId === action.id}
                  onClick={() => void cancel(action.id)}
                >
                  Остановить
                </button>
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
