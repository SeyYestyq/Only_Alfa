import type { Transaction } from "../api/types";
import { formatDate, formatMoney } from "../utils/format";

function categoryClass(row: Transaction): string {
  return row.direction === "IN" ? "cat-pill in" : "cat-pill";
}

/** Таблица операций со счёта. Суммы приходят из API. */
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
          <th>Контрагент</th>
          <th>Назначение</th>
          <th>Категория</th>
          <th className="ops-amount">Сумма</th>
        </tr>
      </thead>
      <tbody>
        {visible.map((row) => (
          <tr key={row.id}>
            <td className="muted">{formatDate(row.occurred_at)}</td>
            <td>{row.description}</td>
            <td className="muted">{row.category}</td>
            <td>
              <span className={categoryClass(row)}>
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
