import type { Dashboard } from "../api/types";

export function DnaPanel({ dashboard }: { dashboard: Dashboard }) {
  return (
    <section className="card">
      <div className="card-header">
        <div>
          <h2 className="card-title">360°-ДНК бизнеса</h2>
          <p className="card-subtitle">
            Пять независимых блоков · полнота профиля {dashboard.business_dna.completeness_pct}%
          </p>
        </div>
        <div className="card-actions">
          <span className="pill pill-neutral">{dashboard.okved_cluster}</span>
        </div>
      </div>
      <div className="card-body">
        <div className="dna-grid">
          {dashboard.business_dna.blocks.map((block) => (
            <article key={block.code} className={`dna-card ${block.status}`}>
              <div className="dna-title">{block.title}</div>
              <div className="dna-value">{block.value}</div>
              <div className="dna-desc">{block.description}</div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
