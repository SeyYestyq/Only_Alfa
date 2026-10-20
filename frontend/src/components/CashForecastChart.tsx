import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CashForecast } from "../api/types";
import { formatMoney, formatNumber } from "../utils/format";

const ALFA_RED = "#EF3124";
const ANTHRACITE = "#1A1D24";
const MUTED = "#8b95a3";

function axisLabel(value: number): string {
  if (Math.abs(value) >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1).replace(".", ",")} млн`;
  }
  if (Math.abs(value) >= 1_000) {
    return `${Math.round(value / 1_000)} тыс`;
  }
  return formatNumber(value);
}

interface ChartPoint {
  day: number;
  date: string;
  balance_rub: number;
  trigger: string | null;
}

function CashTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: ChartPoint }>;
}) {
  if (!active || !payload?.[0]) {
    return null;
  }
  const point = payload[0].payload;
  return (
    <div className="recharts-custom-tooltip">
      <strong>День {point.day}</strong>
      <div>{point.date}</div>
      <div className={point.balance_rub < 0 ? "red" : ""}>{formatMoney(point.balance_rub)}</div>
      {point.trigger && <div className="muted">Триггер: {point.trigger}</div>}
    </div>
  );
}

export function CashForecastChart({ forecast }: { forecast: CashForecast }) {
  const days = forecast.days;
  if (days.length === 0) {
    return <p className="muted">Нет данных прогноза.</p>;
  }

  const data: ChartPoint[] = days.map((day) => ({
    day: day.day,
    date: day.date,
    balance_rub: day.balance_rub,
    trigger: day.trigger,
  }));

  const negativeDays = data.filter((day) => day.balance_rub < 0);
  const gapStart = negativeDays[0]?.day;
  const gapEnd = negativeDays[negativeDays.length - 1]?.day;
  const minBalance = Math.min(...data.map((day) => day.balance_rub), 0);

  return (
    <div className="chart-wrap">
      <div className="chart-canvas" role="img" aria-label="Прогноз остатка на счёте на 60 дней">
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={data} margin={{ top: 16, right: 12, left: 8, bottom: 8 }}>
            <defs>
              <linearGradient id="cashSplit" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={ANTHRACITE} stopOpacity={0.22} />
                <stop offset="55%" stopColor={ANTHRACITE} stopOpacity={0.06} />
                <stop offset="100%" stopColor={ALFA_RED} stopOpacity={0.18} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#e3e8ef" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="day"
              tick={{ fill: MUTED, fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: "#e3e8ef" }}
              ticks={[1, 15, 30, 45, 60]}
              tickFormatter={(value: number) => `${value} дн.`}
            />
            <YAxis
              tick={{ fill: MUTED, fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={64}
              tickFormatter={(value: number) => axisLabel(value)}
            />
            <Tooltip content={<CashTooltip />} />
            <ReferenceLine
              y={0}
              stroke="#575B5F"
              strokeDasharray="3 3"
              label={{ value: "нулевой остаток", position: "insideTopRight", fill: ALFA_RED, fontSize: 10 }}
            />
            {forecast.has_gap && gapStart !== undefined && gapEnd !== undefined && (
              <ReferenceArea
                x1={gapStart}
                x2={gapEnd}
                y1={minBalance}
                y2={0}
                fill={ALFA_RED}
                fillOpacity={0.14}
                ifOverflow="extendDomain"
              />
            )}
            <Area
              type="monotone"
              dataKey="balance_rub"
              stroke={ANTHRACITE}
              strokeWidth={2.4}
              fill="url(#cashSplit)"
              dot={(props) => {
                const { cx, cy, payload } = props as {
                  cx?: number;
                  cy?: number;
                  payload?: ChartPoint;
                };
                if (cx === undefined || cy === undefined || !payload || payload.balance_rub >= 0) {
                  return <g key={`dot-${payload?.day ?? "x"}`} />;
                }
                return <circle key={`neg-${payload.day}`} cx={cx} cy={cy} r={2.6} fill={ALFA_RED} />;
              }}
              activeDot={{ r: 5, fill: ALFA_RED, stroke: "#fff", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-meta">
        <div className="chart-stat">
          <span>Минимальный остаток</span>
          <span className={forecast.min_balance_rub < 0 ? "red" : "green"}>
            {formatMoney(forecast.min_balance_rub)}
          </span>
        </div>
        <div className="chart-stat">
          <span>{forecast.has_gap ? "День разрыва" : "День минимума"}</span>
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
