import { useState } from "react";
import type { InstallmentResult, Transaction } from "../api/types";
import { useApp } from "../state/AppState";
import { formatDate, formatMoney } from "../utils/format";

export function TransactionsPanel({ transactions }: { transactions: Transaction[] }) {
  const { runInstallment, isBusy } = useApp();
  const [openId, setOpenId] = useState<string | null>(null);
  const [months, setMonths] = useState(6);
  const [result, setResult] = useState<InstallmentResult | null>(null);

  async function submit(transaction: Transaction) {
    try {
      const response = await runInstallment(transaction.id, months);
      setResult(response);
      setOpenId(null);
    } catch {
      // ошибка уже показана глобальным баннером
    }
  }

  return (
    <section className="card">
      <div className="card-header">
        <div>
          <h2 className="card-title">Все операции</h2>
          <p className="card-subtitle">Дата · контрагент · сумма · быстрый возврат денег в оборот</p>
        </div>
        <span className="pill pill-outline">{transactions.length} операции</span>
      </div>
      <div className="card-body">
        {result && (
          <div className="alert alert-good" style={{ marginBottom: 10 }}>
            Деньги возвращены в оборот: {formatMoney(result.restored_amount_rub)} снова на счёте,
            платёж {formatMoney(result.monthly_payment_rub)}/мес. Остаток:{" "}
            {formatMoney(result.account_balance)}.
          </div>
        )}
        <table className="table">
          <thead>
            <tr>
              <th>Дата</th>
              <th>Кому / от кого</th>
              <th>Сумма</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction) => (
              <tr key={transaction.id}>
                <td className="faint nowrap">{formatDate(transaction.occurred_at)}</td>
                <td>
                  <div>{transaction.description}</div>
                  <div className="faint" style={{ fontSize: 11 }}>
                    {transaction.direction === "IN" ? "Поступление" : "Платёж"} · {transaction.category}
                  </div>
                </td>
                <td className={`mono nowrap ${transaction.direction === "IN" ? "amount-in" : "amount-out"}`}>
                  {transaction.direction === "IN" ? "+" : "−"}
                  {formatMoney(transaction.amount_rub)}
                </td>
                <td style={{ textAlign: "right" }}>
                  {transaction.installment_taken ? (
                    <span className="pill pill-good">В обороте</span>
                  ) : transaction.can_installment ? (
                    openId === transaction.id ? (
                      <div className="installment-control">
                        <select
                          className="installment-select"
                          value={months}
                          onChange={(event) => setMonths(Number(event.target.value))}
                        >
                          {[3, 4, 5, 6].map((value) => (
                            <option key={value} value={value}>
                              {value} мес.
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          disabled={isBusy}
                          onClick={() => void submit(transaction)}
                        >
                          Вернуть
                        </button>
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOpenId(null)}>
                          ×
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => setOpenId(transaction.id)}
                        title="Рассрочка возвращает сумму платежа на счёт"
                      >
                        Вернуть в оборот
                      </button>
                    )
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
