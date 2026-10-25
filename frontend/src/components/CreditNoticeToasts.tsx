import { useApp } from "../state/AppState";
import { noticesForRole, useDemoStore, type ClientNotice } from "../state/demoStore";

function toneClass(kind: ClientNotice["kind"]): string {
  if (kind === "approved" || kind === "sign") {
    return "credit-toast--good";
  }
  if (kind === "rejected") {
    return "credit-toast--risk";
  }
  if (kind === "need_docs" || kind === "counter") {
    return "credit-toast--warn";
  }
  return "credit-toast--info";
}

function kindMeta(kind: ClientNotice["kind"]): string {
  if (kind === "approved" || kind === "sign") {
    return "Кредит";
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
  return "Статус";
}

/** Плавающие тосты: пользователь ушёл с заявки — может открыть, подписать, прикрепить. */
export function CreditNoticeToasts() {
  const { viewMode, screen, userRole, openApplication, goToScreen } = useApp();
  const allNotices = useDemoStore((state) => state.clientNotices);
  const notices = noticesForRole(allNotices, userRole);
  const dismiss = useDemoStore((state) => state.dismissClientNotice);

  if (viewMode === "bank" || notices.length === 0) {
    return null;
  }

  /** Не дублируем тост, если пользователь уже на целевом экране этого уведомления. */
  const visible = notices.filter((notice) => {
    if (notice.targetScreen === "signing" && screen === "signing") {
      return false;
    }
    if (notice.targetScreen === "decision" && screen === "decision") {
      return false;
    }
    return true;
  });

  if (visible.length === 0) {
    return null;
  }

  async function act(notice: ClientNotice) {
    dismiss(notice.id);
    await openApplication(notice.applicationId);
    goToScreen(notice.targetScreen);
  }

  return (
    <div className="credit-toast-stack" aria-live="polite">
      {visible.slice(0, 3).map((notice) => (
        <article key={notice.id} className={`credit-toast ${toneClass(notice.kind)}`}>
          <header className="credit-toast-head">
            <strong>{notice.title}</strong>
            <span className="credit-toast-meta">| {kindMeta(notice.kind)}</span>
            <button
              type="button"
              className="credit-toast-x"
              onClick={() => dismiss(notice.id)}
              aria-label="Закрыть"
            >
              ×
            </button>
          </header>
          <p className="credit-toast-text">{notice.text}</p>
          <div className="credit-toast-actions">
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => dismiss(notice.id)}
            >
              {notice.secondaryLabel}
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => void act(notice)}
            >
              {notice.primaryLabel}
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
