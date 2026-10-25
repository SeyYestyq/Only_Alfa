import { useState } from "react";
import type { InstallmentResult, Transaction } from "../api/types";
import { useApp } from "../state/AppState";
import { useBankMessagesStore } from "../state/bankMessagesStore";
import { formatDate, formatMoney } from "../utils/format";

const TERM_OPTIONS = [3, 4, 5, 6] as const;
const RATE_PRESETS = [
  { label: "14,5% · Льготная", rate: 14.5 },
  { label: "16,5% · Стандартная", rate: 16.5 },
  { label: "18,0% · Базовая", rate: 18.0 },
  { label: "21,0% · Риск-премия", rate: 21.0 },
];

/** Расчет аннуитетного платежа */
function calculatePayment(amount: number, months: number, ratePct: number) {
  const monthlyRate = ratePct / 100 / 12;
  if (monthlyRate <= 0) {
    return Math.round(amount / months);
  }
  const factor = Math.pow(1 + monthlyRate, months);
  return Math.round(amount * ((monthlyRate * factor) / (factor - 1)));
}

/**
 * Панель операций и выписки по счёту.
 * Включает модальное окно B2B-рассрочки:
 * инспектор выбирает срок (3–6 мес.) и процентную ставку, рассчитывает доход банка и одобряет выдачу.
 */
export function TransactionsPanel({ transactions }: { transactions: Transaction[] }) {
  const { runInstallment, isBusy, dashboard, viewMode } = useApp();
  const sendChatMessage = useBankMessagesStore((state) => state.sendMessage);
  const setActiveThread = useBankMessagesStore((state) => state.setActiveThread);

  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [months, setMonths] = useState<number>(6);
  const [ratePct, setRatePct] = useState<number>(16.5);
  const [result, setResult] = useState<InstallmentResult | null>(null);

  const isBank = viewMode === "bank";
  const monthlyRevenue = dashboard?.company.monthly_revenue_alfa ?? 1_800_000;

  const currentAmount = selectedTx ? Math.abs(selectedTx.amount_rub) : 0;
  const monthlyPayment = calculatePayment(currentAmount, months, ratePct);
  const totalPayment = monthlyPayment * months;
  const totalInterest = Math.max(0, totalPayment - currentAmount);
  const revenueLoadPct = monthlyRevenue > 0
    ? Math.min(100, Math.round((monthlyPayment / monthlyRevenue) * 1000) / 10)
    : 0;

  async function handleConfirmInstallment() {
    if (!selectedTx) return;
    try {
      const response = await runInstallment(selectedTx.id, months);
      setResult(response);

      // В режиме банка автоматически информируем заемщика в чате
      if (isBank && dashboard?.company) {
        const demoKey = (dashboard.company.demo_key || dashboard.company.id).replace("cmp_", "");
        setActiveThread(demoKey);
        sendChatMessage(
          `Банк одобрил B2B-рассрочку по расходу «${selectedTx.description}» на сумму ${formatMoney(currentAmount)}. ` +
          `Срок: ${months} мес., ставка: ${ratePct.toFixed(1)}% годовых, платёж: ${formatMoney(monthlyPayment)}/мес. ` +
          `Средства в размере ${formatMoney(response.restored_amount_rub)} восстановлены на ваш расчётный счёт.`
        );
      }

      setSelectedTx(null);
    } catch {
      // ошибка обрабатывается на уровне глобального баннера
    }
  }

  return (
    <section className="card">
      <div className="card-header">
        <div>
          <h2 className="card-title">Выписка по счёту</h2>
          <p className="card-subtitle">
            {isBank
              ? "Пост-транзакционная рассрочка · выбор ставки и срока пилотом банка"
              : "Пост-транзакционная рассрочка на 3–6 месяцев"}
          </p>
        </div>
        <span className="pill pill-outline">{transactions.length} операции</span>
      </div>

      <div className="card-body">
        {result && (
          <div className="alert alert-good" style={{ marginBottom: 14 }}>
            ✅ <strong>Рассрочка оформлена:</strong> {formatMoney(result.restored_amount_rub)} возвращены на счёт,
            платёж {formatMoney(result.monthly_payment_rub)}/мес. Новый баланс счёта:{" "}
            <strong>{formatMoney(result.account_balance)}</strong>.
          </div>
        )}

        <table className="table">
          <thead>
            <tr>
              <th>Дата</th>
              <th>Операция</th>
              <th>Сумма</th>
              <th style={{ textAlign: "right" }}>Рассрочка</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction) => (
              <tr key={transaction.id}>
                <td className="faint nowrap">{formatDate(transaction.occurred_at)}</td>
                <td>
                  <div>{transaction.description}</div>
                  <div className="faint" style={{ fontSize: 11 }}>
                    {transaction.category}
                  </div>
                </td>
                <td className={`mono nowrap ${transaction.direction === "IN" ? "amount-in" : "amount-out"}`}>
                  {transaction.direction === "IN" ? "+" : "−"}
                  {formatMoney(transaction.amount_rub)}
                </td>
                <td style={{ textAlign: "right" }}>
                  {transaction.installment_taken ? (
                    <span className="pill pill-good">Оформлена</span>
                  ) : transaction.can_installment ? (
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => {
                        setSelectedTx(transaction);
                        setMonths(6);
                        setRatePct(16.5);
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
      </div>

      {/* Модальное окно настройки и одобрения рассрочки (Bank Cockpit Modal) */}
      {selectedTx && (
        <div
          className="sheet-backdrop"
          role="presentation"
          onClick={() => setSelectedTx(null)}
        >
          <div
            className="sheet-card"
            role="dialog"
            aria-labelledby="bank-installment-title"
            onClick={(event) => event.stopPropagation()}
            style={{ width: "min(620px, 100%)" }}
          >
            <header className="sheet-head">
              <div>
                <span className="bank-modal-badge">
                  {isBank ? "Пилот банка · Одобрение условий" : "B2B-Рассрочка"}
                </span>
                <h2 id="bank-installment-title" style={{ marginTop: 2 }}>
                  Вернуть {formatMoney(currentAmount)} в оборот
                </h2>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                aria-label="Закрыть"
                onClick={() => setSelectedTx(null)}
              >
                ✕
              </button>
            </header>

            {/* Карточка расхода */}
            <div className="sheet-tx">
              <div>
                <strong>{selectedTx.description}</strong>
                <div className="muted">
                  {formatDate(selectedTx.occurred_at)} · {selectedTx.category}
                </div>
              </div>
              <strong style={{ color: "var(--red-text, #ef3124)", fontSize: 16 }}>
                −{formatMoney(currentAmount)}
              </strong>
            </div>

            {/* 1. Выбор срока рассрочки */}
            <div className="figma-panel-title" style={{ marginTop: 16 }}>
              Срок рассрочки: {months} мес.
            </div>
            <div className="term-cards" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
              {TERM_OPTIONS.map((option) => {
                const optPayment = calculatePayment(currentAmount, option, ratePct);
                return (
                  <button
                    key={option}
                    type="button"
                    className={`term-card ${months === option ? "active" : ""}`}
                    onClick={() => setMonths(option)}
                    style={{ padding: "10px 12px" }}
                  >
                    <strong style={{ fontSize: 13 }}>{option} мес.</strong>
                    <span style={{ fontSize: 11, color: "#fff" }}>
                      ≈ {formatMoney(optPayment)}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* 2. Выбор процентной ставки (доступно банку) */}
            <div className="figma-panel-title" style={{ marginTop: 16 }}>
              Процентная ставка банка: {ratePct.toFixed(1)}% годовых
            </div>
            <div className="bank-rate-picker">
              <div className="bank-rate-chips">
                {RATE_PRESETS.map((preset) => (
                  <button
                    key={preset.rate}
                    type="button"
                    className={`bank-rate-chip ${ratePct === preset.rate ? "active" : ""}`}
                    onClick={() => setRatePct(preset.rate)}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              <div className="bank-rate-slider-row">
                <input
                  type="range"
                  min="12.0"
                  max="26.0"
                  step="0.5"
                  value={ratePct}
                  onChange={(e) => setRatePct(Number(e.target.value))}
                  aria-label="Процентная ставка рассрочки"
                />
                <span className="bank-rate-val">{ratePct.toFixed(1)}%</span>
              </div>
            </div>

            {/* 3. Финансовый расчет условий сделки */}
            <div className="bank-installment-metrics">
              <div className="bank-calc-card">
                <span className="bank-calc-label">Вернётся на счёт</span>
                <span className="bank-calc-val good">+{formatMoney(currentAmount)}</span>
                <span className="bank-calc-sub">сразу после решения</span>
              </div>
              <div className="bank-calc-card">
                <span className="bank-calc-label">Ежемесячный платёж</span>
                <span className="bank-calc-val">{formatMoney(monthlyPayment)}</span>
                <span className="bank-calc-sub">нагрузка {revenueLoadPct}% выручки</span>
              </div>
              <div className="bank-calc-card">
                <span className="bank-calc-label">Доход банка (проценты)</span>
                <span className="bank-calc-val accent">{formatMoney(totalInterest)}</span>
                <span className="bank-calc-sub">за {months} месяцев</span>
              </div>
            </div>

            {/* Кнопки действий */}
            <div className="sheet-actions">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setSelectedTx(null)}
              >
                Отмена
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={isBusy}
                onClick={() => void handleConfirmInstallment()}
              >
                {isBank
                  ? `Одобрить и вернуть ${formatMoney(currentAmount)} на счёт →`
                  : `Оформить рассрочку на ${months} мес.`}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
