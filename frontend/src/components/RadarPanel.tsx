import type { RadarTrigger } from "../api/types";

function signalWord(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) {
    return "сигнал";
  }
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return "сигнала";
  }
  return "сигналов";
}

export function RadarPanel({ triggers }: { triggers: RadarTrigger[] }) {
  return (
    <section className="card">
      <div className="card-header">
        <div>
          <h2 className="card-title">Финансовый радар</h2>
          <p className="card-subtitle">Триггеры, которые банк видит до заявки</p>
        </div>
        <span className="pill pill-outline">
          {triggers.length} {signalWord(triggers.length)}
        </span>
      </div>
      <div className="card-body">
        {triggers.length === 0 ? (
          <div className="alert alert-good">Радар не видит угроз: касса стабильна, нагрузка в норме.</div>
        ) : (
          <div className="radar-list">
            {triggers.map((trigger) => (
              <article key={trigger.code} className="radar-item">
                <span className={`radar-dot ${trigger.severity}`} />
                <div>
                  <div className="radar-title">{trigger.title}</div>
                  <div className="radar-value">{trigger.value}</div>
                  <div className="radar-action">{trigger.action_label}</div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
