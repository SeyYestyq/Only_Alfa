import type { CashForecast } from "../../api/types";
import { formatMoney } from "../../utils/format";

/** Лёгкий SVG-прогноз кассы. Числа приходят с бэкенда. */
export function ForecastLine({ forecast }: { forecast: CashForecast }) {
  const days = forecast.days;
  if (days.length < 2) {
    return <p className="v2-muted">Прогноза пока нет — подключим выписку.</p>;
  }
  const width = 640;
  const height = 180;
  const pad = 16;
  const values = days.map((day) => day.balance_rub);
  const min = Math.min(0, ...values);
  const max = Math.max(0, ...values);
  const span = Math.max(1, max - min);
  const step = (width - pad * 2) / (days.length - 1);
  const y = (value: number) => pad + ((max - value) / span) * (height - pad * 2);
  const points = days.map((day, index) => `${pad + index * step},${y(day.balance_rub)}`).join(" ");
  const zero = y(0);
  const minIndex = values.indexOf(Math.min(...values));

  return (
    <svg className="v2-forecast" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Прогноз остатка">
      <line x1={pad} x2={width - pad} y1={zero} y2={zero} stroke="#3a3a44" strokeDasharray="4 4" />
      <polyline fill="none" stroke="#7eb6ff" strokeWidth="2.5" points={points} />
      <circle cx={pad + minIndex * step} cy={y(values[minIndex])} r="4" fill="#e2a322" />
      <text x={pad} y={height - 4} fill="#6a6a74" fontSize="11">
        мин. {formatMoney(forecast.min_balance_rub)}
      </text>
    </svg>
  );
}
