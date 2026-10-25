import { useEffect, useRef, type ReactNode } from "react";

export function AlertDialog({
  open,
  title,
  description,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const panel = panelRef.current;
    const initial = panel?.querySelector<HTMLElement>("[data-autofocus]");
    initial?.focus();

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !panel) {
        return;
      }
      const nodes = [...panel.querySelectorAll<HTMLElement>("button, [href], input, select, textarea")].filter(
        (node) => !node.hasAttribute("disabled"),
      );
      if (nodes.length === 0) {
        return;
      }
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("keydown", onKey, true);
      opener.current?.focus();
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className="v2-dialog-back" onMouseDown={(event) => event.preventDefault()}>
      <div
        ref={panelRef}
        className="v2-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="v2-dialog-title"
        aria-describedby={description ? "v2-dialog-desc" : undefined}
      >
        <h2 id="v2-dialog-title">{title}</h2>
        {description ? <p id="v2-dialog-desc" className="v2-muted">{description}</p> : null}
        {children}
      </div>
    </div>
  );
}
