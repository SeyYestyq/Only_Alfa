import type { Dashboard, NewsItem } from "../../api/types";
import { signalFor } from "../../domain-ui/caseScript";
import { formatMoney, formatPercent } from "../../utils/format";

export function FeedColumn({
  dashboard,
  onCta,
}: {
  dashboard: Dashboard;
  onCta: (item: NewsItem) => void;
}) {
  const company = dashboard.company;
  const signal = signalFor(company.demo_key);
  return (
    <div className="v2-card">
      <div className="v2-row">
        <strong>{company.name}</strong>
        <span className={`v2-pill ${signal.quiet ? "good" : "warn"}`}>{signal.code}</span>
      </div>
      <p className="v2-muted" style={{ margin: "6px 0 12px" }}>
        ИНН {company.inn} · выручка {formatMoney(company.monthly_revenue_alfa)}
        {company.revenue_growth_pct ? ` · ${formatPercent(company.revenue_growth_pct, 0)}` : ""}
      </p>
      <div className="v2-feed">
        {dashboard.news_feed.map((item) => (
          <article key={item.id} className="v2-feed-card">
            <span className="v2-pill">{item.cluster}</span>
            <h3 style={{ marginTop: 8 }}>{item.title}</h3>
            <div className="why">
              <span>Почему вы это видите</span>
              {item.text}
            </div>
            <button type="button" className="v2-link" onClick={() => onCta(item)}>
              {item.cta} →
            </button>
          </article>
        ))}
      </div>
      <div className="v2-signal-strip">
        Банк в это время видит <strong>{signal.code}</strong> — {signal.title}. {signal.lines[0]}
      </div>
    </div>
  );
}
