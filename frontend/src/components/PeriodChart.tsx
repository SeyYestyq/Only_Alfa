import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatMoney } from "../utils/format";

export type ChartPeriod = "week" | "month" | "quarter";
type ChartType = "line" | "bar";

const PERIODS: Array<{ id: ChartPeriod; label: string }> = [
  { id: "week", label: "Неделя" },
  { id: "month", label: "Месяц" },
  { id: "quarter", label: "Квартал" },
];

const CHART_TYPES: Array<{ id: ChartType; label: string }> = [
  { id: "line", label: "Линия" },
  { id: "bar", label: "Столбцы" },
];

const CHART_TYPE_STORAGE_KEY = "period-chart-type";

const ALFA_RED = "#EF3124";
const SERIES_STROKE = "#E8E8ED";
const BAR_FILL = "#3a3a42";
const MUTED = "#6b6b74";
const GRID = "#232327";

type SeriesPoint = {
  label: string;
  /** Полная подпись даты для тултипа. */
  date: string;
  value: number;
};

/** Относительные уровни → переводятся в рубли для оси. */
const WEEK_SERIES: SeriesPoint[] = [
  { label: "пн", date: "Пн, 20 окт", value: 72 },
  { label: "вт", date: "Вт, 21 окт", value: 78 },
  { label: "ср", date: "Ср, 22 окт", value: 81 },
  { label: "чт", date: "Чт, 23 окт", value: 69 },
  { label: "пт", date: "Пт, 24 окт", value: 94 },
  { label: "сб", date: "Сб, 25 окт", value: 88 },
  { label: "вс", date: "Вс, 26 окт", value: 61 },
];

/** Дни месяца: подписи оси — число календаря 1…31. */
const MONTH_DAY_LEVELS = [
  62, 65, 70, 68, 74, 71, 78, 80, 76, 82, 79, 85, 88, 84, 90, 87, 92, 89, 94, 91, 86, 83,
  80, 77, 74, 72, 70, 68, 73, 75, 77,
];

const MONTH_SERIES: SeriesPoint[] = MONTH_DAY_LEVELS.map((value, index) => {
  const day = index + 1;
  return {
    label: String(day),
    date: `${day} октября`,
    value,
  };
});

const QUARTER_SERIES: SeriesPoint[] = [
  { label: "авг", date: "Август", value: 56 },
  { label: "сен", date: "Сентябрь", value: 84 },
  { label: "окт", date: "Октябрь", value: 100 },
];

const SERIES: Record<ChartPeriod, SeriesPoint[]> = {
  week: WEEK_SERIES,
  month: MONTH_SERIES,
  quarter: QUARTER_SERIES,
};

const HEADINGS: Record<ChartPeriod, { title: string; subtitle: string }> = {
  week: { title: "Выручка за неделю", subtitle: "Пик обычно в пятницу" },
  month: { title: "Выручка за месяц", subtitle: "По календарным дням" },
  quarter: { title: "Выручка за квартал", subtitle: "Август — низкий сезон" },
};

type ChartRow = {
  label: string;
  date: string;
  amount: number;
};

function readStoredChartType(): ChartType {
  try {
    const raw = localStorage.getItem(CHART_TYPE_STORAGE_KEY);
    if (raw === "line" || raw === "bar") {
      return raw;
    }
  } catch {
    /* private mode / недоступен storage */
  }
  return "line";
}

function axisMoney(value: number): string {
  if (Math.abs(value) >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1).replace(".", ",")} млн`;
  }
  if (Math.abs(value) >= 1_000) {
    return `${Math.round(value / 1_000)} тыс`;
  }
  return String(value);
}

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: ChartRow }>;
}) {
  if (!active || !payload?.[0]) {
    return null;
  }
  const point = payload[0].payload;
  return (
    <div className="period-chart-tooltip" role="tooltip">
      <div className="period-chart-tooltip__date">{point.date}</div>
      <div className="period-chart-tooltip__row">
        <span className="period-chart-tooltip__dot" aria-hidden />
        <span className="period-chart-tooltip__label">Выручка</span>
        <strong className="period-chart-tooltip__value">{formatMoney(point.amount)}</strong>
      </div>
    </div>
  );
}

function AxisTick({
  x = 0,
  y = 0,
  payload,
  activeLabel,
}: {
  x?: number;
  y?: number;
  payload?: { value?: string };
  activeLabel: string | null;
}) {
  const value = payload?.value ?? "";
  const isActive = activeLabel !== null && value === activeLabel;
  const pillWidth = Math.max(36, value.length * 7.2 + 18);

  if (isActive) {
    return (
      <g transform={`translate(${x},${y})`}>
        <rect
          x={-pillWidth / 2}
          y={6}
          width={pillWidth}
          height={20}
          rx={10}
          fill="var(--text-primary)"
        />
        <text
          textAnchor="middle"
          y={20}
          fill="var(--bg-base)"
          fontSize={11}
          fontWeight={600}
          fontFamily="var(--font)"
        >
          {value}
        </text>
      </g>
    );
  }

  return (
    <text
      x={x}
      y={y + 14}
      textAnchor="middle"
      fill={MUTED}
      fontSize={11}
      fontFamily="var(--font)"
    >
      {value}
    </text>
  );
}

/** Для месяца с 31 днём показываем каждый 5-й день + края, чтобы ось читалась. */
function monthAxisTicks(labels: string[]): string[] {
  return labels.filter((_, index) => {
    const day = index + 1;
    return day === 1 || day === labels.length || day % 5 === 0;
  });
}

/** Единый график выручки: неделя / месяц / квартал. Ось — в рублях. */
export function PeriodChart({
  monthlyRevenue = 2_100_000,
}: {
  monthlyRevenue?: number;
}) {
  const [period, setPeriod] = useState<ChartPeriod>("month");
  const [chartType, setChartType] = useState<ChartType>(readStoredChartType);
  const [activeLabel, setActiveLabel] = useState<string | null>(null);
  const heading = HEADINGS[period];

  const data = useMemo(() => {
    const series = SERIES[period];
    const base =
      period === "week"
        ? monthlyRevenue / 4
        : period === "month"
          ? monthlyRevenue
          : monthlyRevenue * 3;
    const weightSum = series.reduce((sum, point) => sum + point.value, 0);
    return series.map((point) => ({
      label: point.label,
      date: point.date,
      amount: Math.round((base * point.value) / weightSum),
    }));
  }, [monthlyRevenue, period]);

  const total = data.reduce((sum, row) => sum + row.amount, 0);
  const gradientId = `period-chart-fill-${period}`;
  const xTicks =
    period === "month" ? monthAxisTicks(data.map((row) => row.label)) : undefined;
  const isLine = chartType === "line";

  function selectChartType(next: ChartType) {
    setChartType(next);
    setActiveLabel(null);
    try {
      localStorage.setItem(CHART_TYPE_STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }

  const sharedAxes = (
    <>
      <CartesianGrid stroke={GRID} strokeDasharray="3 3" vertical={false} />
      <XAxis
        dataKey="label"
        tick={<AxisTick activeLabel={activeLabel} />}
        tickLine={false}
        axisLine={{ stroke: GRID }}
        interval={0}
        height={32}
        ticks={xTicks}
      />
      <YAxis
        dataKey="amount"
        tick={{ fill: MUTED, fontSize: 11 }}
        tickLine={false}
        axisLine={false}
        width={56}
        tickFormatter={(value: number) => axisMoney(value)}
      />
      <Tooltip
        content={<ChartTooltip />}
        cursor={
          isLine
            ? {
                stroke: "rgba(255,255,255,0.88)",
                strokeWidth: 1,
              }
            : { fill: "rgba(255,255,255,0.04)" }
        }
        isAnimationActive={false}
        offset={18}
      />
    </>
  );

  const mouseHandlers = {
    onMouseMove: (state: { activeLabel?: string | number }) => {
      const next = state?.activeLabel != null ? String(state.activeLabel) : null;
      setActiveLabel(next);
    },
    onMouseLeave: () => setActiveLabel(null),
  };

  return (
    <section className="figma-panel period-chart">
      <div className="period-chart-head">
        <div>
          <div className="figma-panel-title">Динамика выручки</div>
          <div className="figma-panel-heading">{heading.title}</div>
          <p className="muted" style={{ marginTop: 6, fontSize: 13 }}>
            {formatMoney(total)} · {heading.subtitle}
          </p>
        </div>
        <div className="period-chart-controls">
          <div className="segmented" role="tablist" aria-label="Тип графика">
            {CHART_TYPES.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={chartType === item.id}
                className={`segment ${chartType === item.id ? "active" : ""}`}
                onClick={() => selectChartType(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="segmented" role="tablist" aria-label="Период графика">
            {PERIODS.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={period === item.id}
                className={`segment ${period === item.id ? "active" : ""}`}
                onClick={() => {
                  setPeriod(item.id);
                  setActiveLabel(null);
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="chart-wrap" style={{ marginTop: 16 }}>
        <div className="chart-canvas period-chart-canvas" style={{ minHeight: 220 }}>
          <ResponsiveContainer width="100%" height={220}>
            {isLine ? (
              <AreaChart
                data={data}
                margin={{ top: 12, right: 12, left: 4, bottom: 4 }}
                {...mouseHandlers}
              >
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={ALFA_RED} stopOpacity={0.38} />
                    <stop offset="55%" stopColor={ALFA_RED} stopOpacity={0.1} />
                    <stop offset="100%" stopColor={ALFA_RED} stopOpacity={0} />
                  </linearGradient>
                </defs>
                {sharedAxes}
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke={SERIES_STROKE}
                  strokeWidth={2}
                  fill={`url(#${gradientId})`}
                  activeDot={{
                    r: 5,
                    fill: "#fff",
                    stroke: ALFA_RED,
                    strokeWidth: 2,
                  }}
                  dot={{
                    r: 3,
                    fill: SERIES_STROKE,
                    stroke: "#111113",
                    strokeWidth: 1,
                  }}
                  isAnimationActive={false}
                />
              </AreaChart>
            ) : (
              <BarChart
                data={data}
                margin={{ top: 12, right: 12, left: 4, bottom: 4 }}
                {...mouseHandlers}
              >
                {sharedAxes}
                <Bar
                  dataKey="amount"
                  fill={BAR_FILL}
                  radius={[3, 3, 0, 0]}
                  maxBarSize={period === "month" ? 12 : 36}
                  activeBar={{ fill: ALFA_RED }}
                  isAnimationActive={false}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}
