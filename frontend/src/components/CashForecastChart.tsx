import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CashForecast } from "../api/types";
import { formatMoney, formatNumber } from "../utils/format";

const ALFA_RED = "#EF3124";
const BAR = "#3a3a42";
const MUTED = "#6b6b74";

function axisLabel(value: number): string {
  if (Math.abs(value) >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1).replace(".", ",")} млн`;
  }
  if (Math.abs(value) >= 1_000) {
    return `${Math.round(value / 1_000)} тыс`;
  }
  return formatNumber(value);
}

function CashTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: { day: number; balance_rub: number; date: string } }>;
}) {
  if (!active || !payload?.[0]) {
    return null;
  }
  const point = payload[0].payload;
  return (
    <div className="recharts-custom-tooltip">
      <strong>День {point.day}</strong>
      <div>{point.date}</div>
      <div className={point.balance_rub < 0 ? "red" : undefined}>
        {formatMoney(point.balance_rub)}
      </div>
    </div>
  );
}

/** Прогноз кассы в стиле Figma К1 — столбцы с красной зоной разрыва. */
export function CashForecastChart({ forecast }: { forecast: CashForecast }) {
  const data = forecast.days.map((day) => ({
    day: day.day,
    date: day.date,
    balance_rub: day.balance_rub,
  }));

  return (
    <div className="chart-wrap">
      <div className="chart-canvas" style={{ minHeight: 220 }}>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#232327" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="day"
              tick={{ fill: MUTED, fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: "#232327" }}
              ticks={[1, 15, 30, 45, 60]}
              tickFormatter={(value: number) => `${value}`}
            />
            <YAxis
              tick={{ fill: MUTED, fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={56}
              tickFormatter={(value: number) => axisLabel(value)}
            />
            <Tooltip content={<CashTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
            <ReferenceLine y={0} stroke="#575B5F" strokeDasharray="3 3" />
            <Bar dataKey="balance_rub" radius={[3, 3, 0, 0]} maxBarSize={10}>
              {data.map((entry) => (
                <Cell
                  key={`cell-${entry.day}`}
                  fill={entry.balance_rub < 0 ? ALFA_RED : BAR}
                  opacity={entry.balance_rub < 0 ? 0.9 : 0.85}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {forecast.has_gap && (
        <div
          className="pill pill-risk"
          style={{ marginTop: 8 }}
          title="Кассовый разрыв из ответа API"
        >
          Разрыв · мин. {formatMoney(forecast.min_balance_rub)} · день {forecast.min_day}
        </div>
      )}
    </div>
  );
}
