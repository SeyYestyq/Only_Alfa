type BankPnlStripProps = {
  /** Компактная полоска в кейсе vs полный блок на «Эффект». */
  variant?: "compact" | "full";
};

const METRICS = [
  {
    id: "tty",
    label: "Time-to-Yes",
    value: "5 сек",
    compare: "было 3 дня",
    tone: "good" as const,
  },
  {
    id: "drop",
    label: "Drop-off",
    value: "−38%",
    compare: "отсев до выдачи",
    tone: "good" as const,
  },
  {
    id: "saved",
    label: "Спасённые заявки",
    value: "+24%",
    compare: "через контр-офферы",
    tone: "good" as const,
  },
  {
    id: "ops",
    label: "Время инспектора",
    value: "9 мин",
    compare: "было 42 мин / заявку",
    tone: "info" as const,
  },
];

/**
 * P&L-эффект кабинета для Альфа-Банка (BRD Экран 3).
 * Цифры — демо-метрики из BRD/SRS, не live-отчётность.
 */
export function BankPnlStrip({ variant = "full" }: BankPnlStripProps) {
  return (
    <section
      className={`bank-pnl-strip ${variant === "compact" ? "is-compact" : ""}`}
      aria-label="Эффект для банка"
    >
      <div className="bank-pnl-strip-head">
        <span className="status-tag is-info">P&L банка</span>
        {variant === "full" ? (
          <p className="muted">
            Разбор заявки за секунды вместо дней · контр-офферы спасают «серую зону»
          </p>
        ) : (
          <span className="muted">Эффект кабинета · демо BRD</span>
        )}
      </div>
      <div className="bank-pnl-metrics">
        {METRICS.map((metric) => (
          <div key={metric.id} className={`bank-pnl-metric is-${metric.tone}`}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
            <small>{metric.compare}</small>
          </div>
        ))}
      </div>
    </section>
  );
}
