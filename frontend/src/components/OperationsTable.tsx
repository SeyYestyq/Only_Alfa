import type { Transaction } from "../api/types";
import { formatDate, formatMoney } from "../utils/format";

/** Таблица операций: дата → что произошло → сумма. Без дублирующих колонок. */
export function OperationsTable({ rows, limit = 6 }: { rows: Transaction[]; limit?: number }) {
  const visible = [...rows]
    .sort((left, right) => right.occurred_at.localeCompare(left.occurred_at))
    .slice(0, limit);

  if (visible.length === 0) {
    return <p className="muted">По счёту пока нет операций.</p>;
  }

  return (
    <table className="ops-table">
      <thead>
        <tr>
          <th>Дата</th>
          <th>Операция</th>
          <th>Тип</th>
          <th className="ops-amount">Сумма</th>
        </tr>
      </thead>
      <tbody>
        {visible.map((row) => (
          <tr key={row.id}>
            <td className="muted">{formatDate(row.occurred_at)}</td>
            <td>{row.description}</td>
            <td>
              <span className={row.direction === "IN" ? "cat-pill in" : "cat-pill"}>
                <i />
                {row.category}
              </span>
            </td>
            <td className={`ops-amount ${row.direction === "IN" ? "in" : ""}`}>
              {row.direction === "IN" ? "+" : "−"}
              {formatMoney(Math.abs(row.amount_rub))}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
