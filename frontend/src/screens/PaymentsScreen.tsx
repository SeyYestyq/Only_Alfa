import { useState } from "react";
import type { InstallmentResult, Transaction } from "../api/types";
import { useApp } from "../state/AppState";
import { formatDate, formatMoney, roughAnnuity } from "../utils/format";

/** К — Выручка и платежи: операции и пост-транзакционная рассрочка. */
export function PaymentsScreen() {
  const { dashboard, goToScreen, runInstallment, isBusy } = useApp();
  const [selected, setSelected] = useState<Transaction | null>(null);
  const [months, setMonths] = useState<3 | 6>(3);
  const [result, setResult] = useState<InstallmentResult | null>(null);

  if (!dashboard) {
    return (
      <div className="empty-state">
        <h3>Сводка ещё не загружена</h3>
      </div>
    );
  }

  const rows = [...dashboard.transactions].sort((a, b) =>
    b.occurred_at.localeCompare(a.occurred_at),
  );

  async function confirmInstallment() {
    if (!selected) {
      return;
    }
    try {
      const response = await runInstallment(selected.id, months);
      setResult(response);
      setSelected(null);
    } catch {
      // ошибка в глобальном баннере
    }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="figma-h1">Деньги</h1>
          <p className="figma-lead">Операции по счёту и рассрочка</p>
        </div>
        <button type="button" className="btn btn-ghost" onClick={() => goToScreen("home")}>
          ← На главную
        </button>
      </div>

      {result && (
        <div className="alert alert-good" style={{ marginBottom: 16 }}>
          Рассрочка оформлена: на счёт вернулось {formatMoney(result.restored_amount_rub)}, платёж{" "}
          {formatMoney(result.monthly_payment_rub)}/мес. Остаток: {formatMoney(result.account_balance)}.
        </div>
      )}

      <section className="figma-panel">
        <table className="ops-table">
          <thead>
            <tr>
              <th>Дата</th>
              <th>Операция</th>
              <th>Тип</th>
              <th className="ops-amount">Сумма</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="muted">{formatDate(row.occurred_at)}</td>
                <td>{row.description}</td>
                <td>
                  <span className={`cat-pill ${row.direction === "IN" ? "in" : ""}`}>
                    <i />
                    {row.category}
                  </span>
                </td>
                <td className={`ops-amount ${row.direction === "IN" ? "in" : ""}`}>
                  {row.direction === "IN" ? "+" : "−"}
                  {formatMoney(Math.abs(row.amount_rub))}
                </td>
                <td style={{ textAlign: "right" }}>
                  {row.installment_taken ? (
                    <span className="pill pill-good">Оформлена</span>
                  ) : row.can_installment ? (
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => {
                        setSelected(row);
                        setMonths(3);
                      }}
                    >
                      Рассрочка
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {selected && (
        <div className="sheet-backdrop" role="presentation" onClick={() => setSelected(null)}>
          <div
            className="sheet-card"
            role="dialog"
            aria-labelledby="installment-title"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="sheet-head">
              <div>
                <div className="figma-panel-title">Рассрочка</div>
                <h2 id="installment-title">Вернуть {formatMoney(Math.abs(selected.amount_rub))} в оборот</h2>
              </div>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSelected(null)}>
                ✕
              </button>
            </header>

            <div className="sheet-tx">
              <div>
                <strong>
                  {formatDate(selected.occurred_at)} · {selected.description}
                </strong>
                <div className="muted">{selected.category}</div>
              </div>
              <strong>{formatMoney(Math.abs(selected.amount_rub))}</strong>
            </div>

            <div className="figma-panel-title" style={{ marginTop: 16 }}>
              Срок рассрочки
            </div>
            <div className="term-cards">
              {([3, 6] as const).map((option) => {
                const payment = roughAnnuity(Math.abs(selected.amount_rub), option);
                const overpay = payment * option - Math.abs(selected.amount_rub);
                return (
                  <button
                    key={option}
                    type="button"
                    className={`term-card ${months === option ? "active" : ""}`}
                    onClick={() => setMonths(option)}
                  >
                    <strong>{option} месяца</strong>
                    <span>≈ {formatMoney(payment)} / мес.</span>
                    <span className="muted">Переплата {formatMoney(overpay)} · ориентир</span>
                  </button>
                );
              })}
            </div>

            <div className="kv-list" style={{ marginTop: 16 }}>
              <div className="meta-row">
                <span>Вернётся на счёт</span>
                <strong>{formatMoney(Math.abs(selected.amount_rub))} · сразу после подписи</strong>
              </div>
              <div className="meta-row">
                <span>Ставка</span>
                <strong>18,0% годовых</strong>
              </div>
              <div className="meta-row">
                <span>Платёж</span>
                <strong>посчитает банк при оформлении</strong>
              </div>
            </div>

            <div className="sheet-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setSelected(null)}>
                Отмена
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={isBusy}
                onClick={() => void confirmInstallment()}
              >
                Оформить рассрочку
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
