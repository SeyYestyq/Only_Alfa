import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Factor } from "../api/types";

const ALFA_RED = "#EF3124";
const ANTHRACITE = "#1A1D24";
const GREEN = "#10B981";
const MUTED = "#8b95a3";

interface WaterfallBar {
  key: string;
  label: string;
  group: string;
  delta: number;
  range: [number, number];
  fill: string;
  condition: string;
  isTotal: boolean;
}

function shortLabel(factor: Factor): string {
  if (factor.code === "BASE_SCORE") {
    return "База";
  }
  return factor.label.length > 18 ? `${factor.label.slice(0, 17)}…` : factor.label;
}

function barColor(factor: Factor): string {
  if (factor.code === "BASE_SCORE") {
    return ANTHRACITE;
  }
  return factor.score_delta >= 0 ? GREEN : ALFA_RED;
}

function WaterfallTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: WaterfallBar }>;
}) {
  if (!active || !payload?.[0]) {
    return null;
  }
  const item = payload[0].payload;
  const signed = item.delta > 0 ? `+${item.delta}` : String(item.delta);
  return (
    <div className="recharts-custom-tooltip">
      <strong>{item.label}</strong>
      <div>
        {item.isTotal ? `Итог: ${item.delta}` : `${signed} · ${item.group}`}
      </div>
      {!item.isTotal && item.condition && <div className="muted">{item.condition}</div>}
    </div>
  );
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
  const bars: WaterfallBar[] = [];
  let running = 0;

  for (const factor of factors) {
    const start = running;
    const end = running + factor.score_delta;
    bars.push({
      key: factor.code,
      label: shortLabel(factor),
      group: factor.code === "BASE_SCORE" ? "G0" : factor.group,
      delta: factor.score_delta,
      range: [Math.min(start, end), Math.max(start, end)],
      fill: barColor(factor),
      condition: factor.condition,
      isTotal: false,
    });
    running = end;
  }

  bars.push({
    key: "TOTAL",
    label: "Итог",
    group: "clamp",
    delta: finalScore,
    range: [0, Math.max(0, finalScore)],
    fill: ALFA_RED,
    condition: "clamp 0…1000",
    isTotal: true,
  });

  return (
    <div className="waterfall-wrap">
      <div className="waterfall-canvas" role="img" aria-label="Waterfall декомпозиции RiskScore">
        <ResponsiveContainer width="100%" height={300} minWidth={640}>
          <BarChart data={bars} margin={{ top: 28, right: 12, left: 4, bottom: 8 }}>
            <CartesianGrid stroke="#e3e8ef" strokeDasharray="4 5" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: MUTED, fontSize: 10 }}
              interval={0}
              height={48}
              tickLine={false}
              axisLine={{ stroke: "#e3e8ef" }}
            />
            <YAxis
              domain={[0, 1000]}
              ticks={[0, 250, 500, 750, 1000]}
              tick={{ fill: MUTED, fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              width={40}
            />
            <Tooltip content={<WaterfallTooltip />} cursor={{ fill: "rgba(26, 29, 36, 0.04)" }} />
            <Bar dataKey="range" radius={[4, 4, 0, 0]} maxBarSize={56}>
              {bars.map((bar) => (
                <Cell key={bar.key} fill={bar.fill} fillOpacity={0.92} />
              ))}
              <LabelList
                dataKey="delta"
                position="top"
                formatter={(value) => {
                  const num = typeof value === "number" ? value : Number(value);
                  if (Number.isNaN(num)) {
                    return "";
                  }
                  return num > 0 ? `+${num}` : String(num);
                }}
                style={{ fontSize: 11, fontWeight: 800, fill: ANTHRACITE }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="muted" style={{ fontSize: 11, marginTop: 2 }}>
        Сырая сумма факторов: {rawScore} → после clamp: {finalScore}. Отрицательный сырой балл
        отображается как 0. График: recharts (floating Bar).
      </p>
    </div>
  );
}
