import type { Factor } from "../api/types";

const WIDTH = 840;
const HEIGHT = 300;
const PAD = { left: 18, right: 18, top: 38, bottom: 66 };

function shortLabel(factor: Factor): string {
  if (factor.code === "BASE_SCORE") {
    return "База";
  }
  return factor.label.length > 20 ? `${factor.label.slice(0, 19)}…` : factor.label;
}

export function WaterfallChart({
  factors,
  finalScore,
  rawScore,
}: {
  factors: Factor[];
  finalScore: number;
  rawScore: number;
}) {
  const series = factors.map((factor) => ({ factor, start: 0, end: 0, running: 0 }));
  let running = 0;
  for (const item of series) {
    item.start = running;
    item.end = running + item.factor.score_delta;
    item.running = item.end;
    running = item.end;
  }

  const maxValue = Math.max(1000, finalScore, running);
  const plotWidth = WIDTH - PAD.left - PAD.right;
  const plotHeight = HEIGHT - PAD.top - PAD.bottom;
  const slot = plotWidth / (series.length + 1);
  const barWidth = Math.min(64, slot * 0.6);
  const y = (value: number) => PAD.top + ((maxValue - value) / maxValue) * plotHeight;

  function xFor(index: number): number {
    return PAD.left + slot * index + slot / 2;
  }

  return (
    <div className="waterfall-wrap">
      <svg
        className="waterfall-svg"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label="Waterfall декомпозиции RiskScore"
      >
        {[0, 250, 500, 750, 1000].map((tick) => (
          <g key={tick}>
            <line
              x1={PAD.left}
              x2={WIDTH - PAD.right}
              y1={y(tick)}
              y2={y(tick)}
              stroke="#e3e8ef"
              strokeDasharray={tick === 0 ? "0" : "4 5"}
            />
            <text x={PAD.left} y={y(tick) - 4} fontSize="9.5" fill="#8b95a3">
              {tick}
            </text>
          </g>
        ))}

        {series.map((item, index) => {
          const isBase = item.factor.code === "BASE_SCORE";
          const top = y(Math.max(item.start, item.end));
          const bottom = y(Math.min(item.start, item.end));
          const barHeight = Math.max(2, bottom - top);
          const color = isBase ? "#1a1d24" : item.factor.score_delta >= 0 ? "#15945f" : "#ef3124";
          const previous = series[index - 1];
          return (
            <g key={item.factor.code}>
              {previous && (
                <line
                  x1={xFor(index - 1) + barWidth / 2}
                  x2={xFor(index) - barWidth / 2}
                  y1={y(previous.running)}
                  y2={y(previous.running)}
                  stroke="#cfd7e3"
                  strokeDasharray="3 3"
                />
              )}
              <rect
                x={xFor(index) - barWidth / 2}
                y={top}
                width={barWidth}
                height={barHeight}
                rx={4}
                fill={color}
                opacity={0.92}
              />
              <text
                x={xFor(index)}
                y={top - 7}
                textAnchor="middle"
                fontSize="10.5"
                fontWeight="800"
                fill={color}
              >
                {item.factor.score_delta > 0 ? "+" : ""}
                {item.factor.score_delta}
              </text>
              <text x={xFor(index)} y={HEIGHT - 44} textAnchor="middle" fontSize="9.5" fill="#5f6875">
                {shortLabel(item.factor)}
              </text>
              <text x={xFor(index)} y={HEIGHT - 31} textAnchor="middle" fontSize="9" fill="#8b95a3">
                {item.factor.code === "BASE_SCORE" ? "G0" : item.factor.group}
              </text>
            </g>
          );
        })}

        <rect
          x={xFor(series.length) - barWidth / 2}
          y={y(finalScore)}
          width={barWidth}
          height={Math.max(2, y(0) - y(finalScore))}
          rx={4}
          fill="#ef3124"
        />
        <text
          x={xFor(series.length)}
          y={y(finalScore) - 7}
          textAnchor="middle"
          fontSize="11"
          fontWeight="850"
          fill="#ef3124"
        >
          {finalScore}
        </text>
        <text x={xFor(series.length)} y={HEIGHT - 44} textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#161a21">
          Итог
        </text>
        <text x={xFor(series.length)} y={HEIGHT - 31} textAnchor="middle" fontSize="9" fill="#8b95a3">
          clamp 0…1000
        </text>
      </svg>
      <p className="muted" style={{ fontSize: 11, marginTop: 2 }}>
        Сырая сумма факторов: {rawScore} → после clamp: {finalScore}. Отрицательный сырой балл
        отображается как 0.
      </p>
    </div>
  );
}
