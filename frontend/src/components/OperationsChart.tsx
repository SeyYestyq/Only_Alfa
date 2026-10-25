import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Transaction } from "../api/types";
import { formatDate, formatMoney, formatNumber } from "../utils/format";

const IN_COLOR = "#15945f";
const OUT_COLOR = "#ef3124";

interface DayBucket {
  key: string;
  label: string;
  inflow: number;
  outflow: number;
}

function bucketTransactions(transactions: Transaction[]): DayBucket[] {
  const map = new Map<string, DayBucket>();
  for (const tx of [...transactions].sort(
    (a, b) => new Date(a.occurred_at).getTime() - new Date(b.occurred_at).getTime(),
  )) {
    const key = tx.occurred_at.slice(0, 10);
    const current = map.get(key) ?? {
      key,
      label: formatDate(tx.occurred_at),
      inflow: 0,
      outflow: 0,
    };
    if (tx.direction === "IN") {
      current.inflow += tx.amount_rub;
    } else {
      current.outflow += tx.amount_rub;
    }
    map.set(key, current);
  }
  return Array.from(map.values());
}

function axisLabel(value: number): string {
  if (Math.abs(value) >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1).replace(".", ",")} млн`;
  }
  if (Math.abs(value) >= 1_000) {
    return `${Math.round(value / 1_000)} тыс`;
  }
  return formatNumber(value);
}

function OpsTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) {
    return null;
  }
  return (
    <div className="recharts-custom-tooltip">
      <strong>{label}</strong>
      {payload.map((item) => (
        <div key={item.name} style={{ color: item.color }}>
          {item.name}: {formatMoney(item.value)}
        </div>
      ))}
    </div>
  );
}

export function OperationsChart({ transactions }: { transactions: Transaction[] }) {
  const data = bucketTransactions(transactions);

  if (data.length === 0) {
    return <p className="muted">Пока нет операций для графика.</p>;
  }

  return (
    <div className="chart-wrap">
      <div className="chart-canvas" role="img" aria-label="График поступлений и платежей">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} margin={{ top: 12, right: 8, left: 4, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e3e8ef" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: "#8b95a3", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis
              tickFormatter={axisLabel}
              tick={{ fill: "#8b95a3", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={56}
            />
            <Tooltip content={<OpsTooltip />} cursor={{ fill: "rgba(26, 29, 36, 0.04)" }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="inflow" name="Поступления" fill={IN_COLOR} radius={[4, 4, 0, 0]} maxBarSize={28} />
            <Bar dataKey="outflow" name="Платежи" fill={OUT_COLOR} radius={[4, 4, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
