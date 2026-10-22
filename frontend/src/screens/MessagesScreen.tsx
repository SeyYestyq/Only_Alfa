import { useApp } from "../state/AppState";

/** Сообщения кабинета: лента новостей и сигналов из ответа дашборда. */
export function MessagesScreen() {
  const { dashboard, application, goToScreen } = useApp();
  const news = dashboard?.news_feed ?? [];

  return (
    <>
      <div className="figma-eyebrow">Сообщения</div>
      <h1 className="figma-h1">Входящие</h1>
      <p className="figma-lead">То, что банк и кабинет уже посчитали по вашей компании.</p>
      <div className="figma-check-grid" style={{ marginTop: 24 }}>
        {application && (
          <article className="figma-check-card">
            <header>
              <h3>Заявка {application.application_id.slice(-8).toUpperCase()}</h3>
              <span className="pill pill-warn">{application.status_label}</span>
            </header>
            <p className="muted" style={{ fontSize: 14, lineHeight: 1.45 }}>
              {application.product_label}. Откройте решение, чтобы выбрать вариант или подписать договор.
            </p>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ marginTop: 12 }}
              onClick={() => goToScreen("decision")}
            >
              Открыть заявку
            </button>
          </article>
        )}
        {news.map((item) => (
          <article key={item.created_at + item.title} className="figma-check-card">
            <header>
              <h3>{item.title}</h3>
              <span className="pill pill-outline">{item.cluster}</span>
            </header>
            <p className="muted" style={{ fontSize: 14, lineHeight: 1.45 }}>{item.text}</p>
          </article>
        ))}
        {news.length === 0 && !application && (
          <article className="figma-check-card">
            <h3>Пока пусто</h3>
            <p className="muted">Новые сообщения появятся вместе с сигналами по счёту.</p>
          </article>
        )}
      </div>
    </>
  );
}
