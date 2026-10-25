import type { NewsItem } from "../api/types";
import { api } from "../api/client";
import { useApp } from "../state/AppState";
import { formatDateTime } from "../utils/format";

export function NewsFeed({ items }: { items: NewsItem[] }) {
  const { goToScreen, companyId } = useApp();

  return (
    <section className="figma-panel figma-panel-sm">
      <div className="figma-panel-title">News-to-Action</div>
      <p className="muted" style={{ fontSize: 13, marginTop: 4 }}>
        Системные подсказки и офферы — переход ведёт в сценарий, а не на пустой экран.
      </p>
      <div className="news-list" style={{ marginTop: 12 }}>
        {items.map((item) => (
          <article
            key={item.id}
            className={`news-item figma-panel figma-panel-sm ${item.source === "NEWS_TO_ACTION" ? "is-new" : ""}`}
            style={{ marginBottom: 10, background: "var(--surface-2)" }}
          >
            <div className="news-title" style={{ fontWeight: 650 }}>{item.title}</div>
            <div className="news-text muted" style={{ fontSize: 13, marginTop: 6 }}>{item.text}</div>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              style={{ marginTop: 10 }}
              onClick={() => {
                const meta = item.meta ?? {};
                const actionId = meta.system_action_id as string | undefined;
                if (companyId && actionId) {
                  void api.openSystemAction(companyId, actionId);
                  void api.respondSystemAction(companyId, actionId, item.cta);
                }
                const target = (meta.target_screen as string) || "";
                if (target === "signing" || target === "decision" || target === "apply" || target === "passport") {
                  goToScreen(target);
                  return;
                }
                if (item.cluster === "PROACTIVE" || item.cta.toLowerCase().includes("загруз")) {
                  goToScreen("decision");
                } else if (item.cta.toLowerCase().includes("кредит") || item.cta.toLowerCase().includes("оффер")) {
                  goToScreen("apply");
                } else {
                  goToScreen("home");
                }
              }}
            >
              {item.cta} · {formatDateTime(item.created_at)}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
