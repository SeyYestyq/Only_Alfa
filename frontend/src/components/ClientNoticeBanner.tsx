import { useApp } from "../state/AppState";
import { useDemoStore } from "../state/demoStore";

/** Уведомление клиенту: одобрение / отказ / документы — клик ведёт на решение. */
export function ClientNoticeBanner() {
  const { viewMode, openApplication, goToScreen } = useApp();
  const notices = useDemoStore((state) => state.clientNotices);
  const dismiss = useDemoStore((state) => state.dismissClientNotice);

  if (viewMode === "bank" || notices.length === 0) {
    return null;
  }

  const notice = notices[0];
  const tone =
    notice.kind === "approved"
      ? "banner-good"
      : notice.kind === "rejected"
        ? "banner-error"
        : "banner-info";

  return (
    <div className={`banner ${tone} client-notice-banner`} role="status">
      <button
        type="button"
        className="client-notice-main"
        onClick={() => {
          dismiss(notice.id);
          void openApplication(notice.applicationId).then(() => {
            goToScreen("decision");
          });
        }}
      >
        <strong>{notice.title}</strong>
        <span>{notice.text}</span>
        <span className="client-notice-cta">Открыть решение →</span>
      </button>
      <button
        type="button"
        className="banner-close"
        onClick={() => dismiss(notice.id)}
        aria-label="Закрыть"
      >
        ×
      </button>
    </div>
  );
}
