import type { CashForecast } from "../api/types";
import { formatMoney, formatNumber } from "../utils/format";

const WIDTH = 760;
const HEIGHT = 250;
const PAD = { left: 64, right: 16, top: 18, bottom: 30 };

function axisLabel(value: number): string {
  if (Math.abs(value) >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1).replace(".", ",")} млн`;
  }
  if (Math.abs(value) >= 1_000) {
    return `${Math.round(value / 1_000)} тыс`;
  }
  return formatNumber(value);
}

export function CashForecastChart({ forecast }: { forecast: CashForecast }) {
  const days = forecast.days;
  if (days.length === 0) {
    return <p className="muted">Нет данных прогноза.</p>;
  }

  const balances = days.map((day) => day.balance_rub);
  const rawMin = Math.min(0, ...balances);
  const rawMax = Math.max(0, ...balances);
  const span = rawMax - rawMin || 1;
  const minValue = rawMin - span * 0.08;
  const maxValue = rawMax + span * 0.08;

  const innerWidth = WIDTH - PAD.left - PAD.right;
  const innerHeight = HEIGHT - PAD.top - PAD.bottom;
  const x = (index: number) => PAD.left + (index / Math.max(1, days.length - 1)) * innerWidth;
  const y = (value: number) => PAD.top + ((maxValue - value) / (maxValue - minValue)) * innerHeight;
  const zeroY = y(0);

  const line = days
    .map((day, index) => `${index === 0 ? "M" : "L"} ${x(index).toFixed(1)} ${y(day.balance_rub).toFixed(1)}`)
    .join(" ");
  const area = `${line} L ${x(days.length - 1).toFixed(1)} ${HEIGHT - PAD.bottom} L ${PAD.left} ${HEIGHT - PAD.bottom} Z`;

  const gridValues = Array.from({ length: 5 }, (_, index) => minValue + ((maxValue - minValue) / 4) * index);
  const minPoint = days.reduce((worst, day) => (day.balance_rub < worst.balance_rub ? day : worst), days[0]);
  const minIndex = days.indexOf(minPoint);
  const hasGap = forecast.has_gap;

  return (
    <div className="chart-wrap">
      <svg className="chart-svg" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label="Прогноз остатка на счёте на 60 дней">
        <defs>
          <linearGradient id="cashFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1a1d24" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#1a1d24" stopOpacity="0.01" />
          </linearGradient>
          <linearGradient id="gapFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ef3124" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#ef3124" stopOpacity="0.16" />
          </linearGradient>
        </defs>

        {hasGap && (
          <rect
            x={PAD.left}
            y={zeroY}
            width={innerWidth}
            height={Math.max(0, HEIGHT - PAD.bottom - zeroY)}
            fill="url(#gapFill)"
          />
        )}

        {gridValues.map((value) => (
          <g key={value}>
            <line
              x1={PAD.left}
              x2={WIDTH - PAD.right}
              y1={y(value)}
              y2={y(value)}
              stroke="#e3e8ef"
              strokeWidth="1"
            />
            <text x={PAD.left - 8} y={y(value) + 3} textAnchor="end" fontSize="10" fill="#8b95a3">
              {axisLabel(value)}
            </text>
          </g>
        ))}

        <line
          x1={PAD.left}
          x2={WIDTH - PAD.right}
          y1={zeroY}
          y2={zeroY}
          stroke="#ef3124"
          strokeWidth="1"
          strokeDasharray="5 4"
          opacity="0.7"
        />
        <text x={WIDTH - PAD.right} y={zeroY - 5} textAnchor="end" fontSize="9.5" fill="#ef3124">
          нулевой остаток
        </text>

        <path d={area} fill="url(#cashFill)" />
        <path d={line} fill="none" stroke="#1a1d24" strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" />

        {days.map((day, index) =>
          day.balance_rub < 0 ? (
            <circle key={day.day} cx={x(index)} cy={y(day.balance_rub)} r="2.4" fill="#ef3124" />
          ) : null,
        )}

        <circle cx={x(minIndex)} cy={y(minPoint.balance_rub)} r="4.5" fill="#fff" stroke="#ef3124" strokeWidth="2.4" />
        <text
          x={Math.min(x(minIndex) + 8, WIDTH - PAD.right - 120)}
          y={Math.max(y(minPoint.balance_rub) - 9, PAD.top + 10)}
          fontSize="10.5"
          fontWeight="700"
          fill="#ef3124"
        >
          {minPoint.balance_rub < 0 ? "разрыв " : "минимум "}
          {formatMoney(minPoint.balance_rub)}
        </text>

        {[1, 15, 30, 45, 60].map((dayNumber) => {
          const index = Math.min(days.length - 1, Math.max(0, dayNumber - 1));
          return (
            <text
              key={dayNumber}
              x={x(index)}
              y={HEIGHT - 10}
              textAnchor="middle"
              fontSize="10"
              fill="#8b95a3"
            >
              {dayNumber} дн.
            </text>
          );
        })}
      </svg>

      <div className="chart-meta">
        <div className="chart-stat">
          <span>Минимальный остаток</span>
          <span className={forecast.min_balance_rub < 0 ? "red" : "green"}>
            {formatMoney(forecast.min_balance_rub)}
          </span>
        </div>
        <div className="chart-stat">
          <span>День разрыва</span>
          <span>{forecast.min_day} дн.</span>
        </div>
        <div className="chart-stat">
          <span>Дней в минусе</span>
          <span>{forecast.days_negative}</span>
        </div>
        <div className="chart-stat">
          <span>Статус</span>
          <span className={forecast.has_gap ? "red" : "green"}>
            {forecast.has_gap ? "Кассовый разрыв" : "Разрыва нет"}
          </span>
        </div>
      </div>
    </div>
  );
}
