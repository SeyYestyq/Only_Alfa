import { useEffect, useState } from "react";
import { isTextField } from "./keys";
import { useUiStore, type ToastItem, type ToastTone } from "../../state/uiStore";

function Icon({ tone }: { tone: ToastTone }) {
  const label = tone === "success" ? "✓" : tone === "warning" ? "!" : tone === "error" ? "!" : "…";
  const toneClass = tone === "success" ? "good" : tone === "warning" ? "warn" : tone === "error" ? "bad" : "load";
  return <span className={`v2-toast-icon ${toneClass}`} aria-hidden>{label}</span>;
}

export function ToastView({
  item,
  now,
  inline = false,
  onUndo,
  onClose,
}: {
  item: ToastItem;
  now: number;
  inline?: boolean;
  onUndo?: () => void;
  onClose?: () => void;
}) {
  const left = item.until ? Math.max(0, Math.ceil((item.until - now) / 1000)) : null;
  return (
    <article className={`v2-toast ${inline ? "inline" : ""}`} role="status">
      <Icon tone={item.tone} />
      <div>
        <h3>{item.title}</h3>
        <p>{item.subtitle}</p>
      </div>
      <div className="v2-toast-actions">
        {item.actionLabel && onUndo ? (
          <button type="button" className="v2-text-btn" onClick={onUndo}>
            {item.actionLabel}{left !== null ? ` · ${left} с` : ""}
          </button>
        ) : null}
        {onClose ? (
          <button type="button" className="v2-text-btn" aria-label="Закрыть уведомление" onClick={onClose}>✕</button>
        ) : null}
      </div>
    </article>
  );
}

export function Toasts() {
  const items = useUiStore((state) => state.toasts);
  const dismissToast = useUiStore((state) => state.dismissToast);
  const undoLatest = useUiStore((state) => state.undoLatest);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    for (const item of items) {
      if (item.until && item.until <= now) {
        dismissToast(item.id);
      }
    }
  }, [dismissToast, items, now]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== "z" || event.shiftKey) {
        return;
      }
      if (isTextField(event.target)) {
        return;
      }
      event.preventDefault();
      undoLatest();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undoLatest]);

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="v2-toast-stack" aria-live="polite">
      {items.map((item) => (
        <ToastView
          key={item.id}
          item={item}
          now={now}
          onUndo={item.undo ? () => { item.undo?.(); dismissToast(item.id); } : undefined}
          onClose={() => dismissToast(item.id)}
        />
      ))}
    </div>
  );
}
