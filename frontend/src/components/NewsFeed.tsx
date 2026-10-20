import type { NewsItem } from "../api/types";
import { formatDateTime } from "../utils/format";

export function NewsFeed({ items }: { items: NewsItem[] }) {
  return (
    <section className="card">
      <div className="card-header">
        <div>
          <h2 className="card-title">News-to-Action</h2>
          <p className="card-subtitle">Лента перестраивается после каждого поискового запроса</p>
        </div>
      </div>
      <div className="card-body">
        <div className="news-list">
          {items.map((item) => (
            <article key={item.id} className={`news-item ${item.source === "NEWS_TO_ACTION" ? "is-new" : ""}`}>
              <div className="news-title">{item.title}</div>
              <div className="news-text">{item.text}</div>
              <div className="news-cta">
                {item.cta} · {formatDateTime(item.created_at)}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
