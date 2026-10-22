/** Статический барчарт выручки как на К1 в Figma (синтетика для демо-визуала). */
const MONTHS = ["ноя", "дек", "янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт"];

/** Относительные высоты prev/curr из макета (px → %). */
const SERIES: Array<{ prev: number; curr: number; season?: boolean }> = [
  { prev: 71, curr: 81 },
  { prev: 83, curr: 96 },
  { prev: 67, curr: 75 },
  { prev: 69, curr: 79 },
  { prev: 73, curr: 83 },
  { prev: 77, curr: 88 },
  { prev: 75, curr: 86 },
  { prev: 63, curr: 71 },
  { prev: 54, curr: 59, season: true },
  { prev: 52, curr: 56, season: true },
  { prev: 78, curr: 90 },
  { prev: 88, curr: 100 },
];

export function RevenueBars() {
  return (
    <div>
      <div className="revenue-bars">
        {SERIES.map((point, index) => (
          <div key={MONTHS[index]} className="revenue-pair">
            <div className="bar prev" style={{ height: `${point.prev}%` }} />
            <div
              className={`bar curr${point.season ? " season" : ""}`}
              style={{ height: `${point.curr}%` }}
            />
          </div>
        ))}
      </div>
      <div className="revenue-labels">
        {MONTHS.map((month) => (
          <span key={month}>{month}</span>
        ))}
      </div>
    </div>
  );
}
