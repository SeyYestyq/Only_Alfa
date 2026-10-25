import { useState } from "react";
import type { InstallmentResult, Transaction } from "../api/types";
import { useApp } from "../state/AppState";
import { useBankMessagesStore } from "../state/bankMessagesStore";
import { useDemoStore, type InstallmentOffer } from "../state/demoStore";
import { formatDate, formatMoney } from "../utils/format";

const TERM_OPTIONS = [3, 4, 5, 6] as const;

const BANK_RATE_PRESETS = [
  { label: "14,5% · Льготная", rate: 14.5 },
  { label: "16,5% · Стандартная", rate: 16.5 },
  { label: "18,0% · Базовая", rate: 18.0 },
  { label: "21,0% · Риск-премия", rate: 21.0 },
];

const CLIENT_COUNTER_RATES = [
  { label: "12,0% · Льготная", rate: 12.0 },
  { label: "14,0% · Комфортная", rate: 14.0 },
  { label: "15,0% · Оптимальная", rate: 15.0 },
  { label: "16,0% · Рыночная", rate: 16.0 },
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
 * Реализует двухсторонний сценарий B2B-рассрочки:
 * 1. Пилот банка настраивает и одобряет условия (ставка и срок), отправляя оффер клиенту.
 * 2. Клиент в личном кабинете видит условия банка, может принять их в один клик
 *    или отправить встречное предложение (контр-оффер с желаемым сроком/ставкой/комментарием).
 * 3. Пилот банка видит встречное предложение и может согласовать его.
 */
export function TransactionsPanel({ transactions }: { transactions: Transaction[] }) {
  const { runInstallment, isBusy, dashboard, viewMode } = useApp();
  const sendChatMessage = useBankMessagesStore((state) => state.sendMessage);
  const setActiveThread = useBankMessagesStore((state) => state.setActiveThread);

  const installmentOffers = useDemoStore((state) => state.installmentOffers);
  const setInstallmentOffer = useDemoStore((state) => state.setInstallmentOffer);
  const pushClientNotice = useDemoStore((state) => state.pushClientNotice);
  const pushBankNotice = useDemoStore((state) => state.pushBankNotice);

  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [months, setMonths] = useState<number>(6);
  const [ratePct, setRatePct] = useState<number>(16.5);
  const [counterMonths, setCounterMonths] = useState<number>(6);
  const [counterRate, setCounterRate] = useState<number>(14.0);
  const [clientComment, setClientComment] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"bank_offer" | "counter_offer">("bank_offer");
  const [result, setResult] = useState<InstallmentResult | null>(null);
  const [toastAlert, setToastAlert] = useState<{ kind: "good" | "info"; text: string } | null>(null);

  const isBank = viewMode === "bank";
  const monthlyRevenue = dashboard?.company.monthly_revenue_alfa ?? 1_800_000;
  const currentAmount = selectedTx ? Math.abs(selectedTx.amount_rub) : 0;

  const currentOffer: InstallmentOffer | undefined = selectedTx
    ? installmentOffers[selectedTx.id]
    : undefined;

  const monthlyPayment = calculatePayment(currentAmount, months, ratePct);
  const totalPayment = monthlyPayment * months;
  const totalInterest = Math.max(0, totalPayment - currentAmount);
  const revenueLoadPct = monthlyRevenue > 0
    ? Math.min(100, Math.round((monthlyPayment / monthlyRevenue) * 1000) / 10)
    : 0;

  const counterMonthlyPayment = calculatePayment(currentAmount, counterMonths, counterRate);
  const demoKey = (dashboard?.company.demo_key || dashboard?.company.id || "rosters").replace("cmp_", "");

  function handleOpenModal(tx: Transaction) {
    setSelectedTx(tx);
    const existing = installmentOffers[tx.id];
    if (existing) {
      setMonths(existing.months);
      setRatePct(existing.ratePct);
      setCounterMonths(existing.clientCounterMonths ?? (existing.months === 6 ? 4 : 6));
      setCounterRate(existing.clientCounterRatePct ?? 14.0);
      setClientComment(existing.clientComment ?? "");
      setActiveTab(existing.status === "COUNTER_OFFERED" && !isBank ? "counter_offer" : "bank_offer");
    } else {
      setMonths(6);
      setRatePct(16.5);
      setCounterMonths(6);
      setCounterRate(14.0);
      setClientComment("");
      setActiveTab("bank_offer");
    }
  }

  // 1. Пилот банка отправляет предложение клиенту
  function handleBankSendOffer() {
    if (!selectedTx) return;
    const payment = calculatePayment(currentAmount, months, ratePct);
    const interest = Math.max(0, payment * months - currentAmount);

    const newOffer: InstallmentOffer = {
      txId: selectedTx.id,
      txDescription: selectedTx.description,
      amountRub: currentAmount,
      months,
      ratePct,
      monthlyPayment: payment,
      totalInterest: interest,
      status: "OFFERED",
      offeredAt: "Только что",
    };

    setInstallmentOffer(newOffer);
    setActiveThread(demoKey);

    sendChatMessage(
      `Банк сформировал персональные условия B2B-рассрочки по операции «${selectedTx.description}» ` +
      `на сумму ${formatMoney(currentAmount)}: срок ${months} мес., ставка ${ratePct.toFixed(1)}% годовых, ` +
      `платёж ${formatMoney(payment)}/мес. Условия доступны к принятию в личном кабинете.`
    );

    pushClientNotice({
      kind: "approved",
      title: `Одобрена рассрочка: ${formatMoney(currentAmount)}`,
      text: `Срок ${months} мес. под ${ratePct.toFixed(1)}% годовых. Нажмите «Рассрочка», чтобы принять или предложить свои условия.`,
      applicationId: selectedTx.id,
      targetScreen: "home",
      primaryLabel: "Посмотреть условия",
      secondaryLabel: "Позже",
    });

    setToastAlert({
      kind: "good",
      text: `Условия рассрочки (${months} мес., ${ratePct.toFixed(1)}%) направлены клиенту. Ожидаем решения заёмщика.`,
    });
    setSelectedTx(null);
  }

  // 2. Клиент принимает предложение банка
  async function handleClientAcceptBankOffer() {
    if (!selectedTx) return;
    try {
      const effMonths = currentOffer ? currentOffer.months : months;
      const effRate = currentOffer ? currentOffer.ratePct : ratePct;
      const response = await runInstallment(selectedTx.id, effMonths);
      setResult(response);

      if (currentOffer) {
        setInstallmentOffer({ ...currentOffer, status: "ACCEPTED" });
      }

      setActiveThread(demoKey);
      sendChatMessage(
        `Клиент принял предложение банка по рассрочке «${selectedTx.description}» ` +
        `на ${effMonths} мес. под ${effRate.toFixed(1)}%. ` +
        `Средства в размере ${formatMoney(currentAmount)} возвращены на расчётный счёт.`
      );

      pushBankNotice({
        kind: "new_app",
        title: `Рассрочка оформлена: ${formatMoney(currentAmount)}`,
        text: `${dashboard?.company.name ?? "Клиент"} принял условия на ${effMonths} мес. под ${effRate.toFixed(1)}%`,
        companyId: dashboard?.company.id ?? "cmp_rosters",
        companyName: dashboard?.company.name ?? "ООО «Ростерс Кафе»",
        demoKey,
        amountLabel: formatMoney(currentAmount),
        targetScreen: "bank-messages",
        primaryLabel: "В чат",
        time: "Только что",
      });

      setSelectedTx(null);
    } catch {
      // ошибка всплывает на глобальном баннере
    }
  }

  // 3. Клиент отправляет встречное предложение (Контр-оффер)
  function handleClientSendCounterOffer() {
    if (!selectedTx) return;
    const payment = calculatePayment(currentAmount, counterMonths, counterRate);

    const baseOffer = currentOffer || {
      txId: selectedTx.id,
      txDescription: selectedTx.description,
      amountRub: currentAmount,
      months,
      ratePct,
      monthlyPayment,
      totalInterest,
      offeredAt: "Только что",
    };

    const updated: InstallmentOffer = {
      ...baseOffer,
      status: "COUNTER_OFFERED",
      clientCounterMonths: counterMonths,
      clientCounterRatePct: counterRate,
      clientCounterMonthlyPayment: payment,
      clientComment: clientComment.trim() || "Просим пересмотреть условия для снижения финансовой нагрузки на кассу.",
    };

    setInstallmentOffer(updated);
    setActiveThread(demoKey);

    sendChatMessage(
      `Встречное предложение от клиента по рассрочке «${selectedTx.description}» (${formatMoney(currentAmount)}): ` +
      `заёмщик просит срок ${counterMonths} мес. и ставку ${counterRate.toFixed(1)}% годовых ` +
      `(желаемый платёж ${formatMoney(payment)}/мес). ` +
      `Комментарий: «${clientComment.trim() || "Просим пересмотреть условия"}»`
    );

    pushBankNotice({
      kind: "manual_review",
      title: `Встречное предложение: ${formatMoney(currentAmount)}`,
      text: `${dashboard?.company.name ?? "Клиент"} просит ${counterMonths} мес. под ${counterRate.toFixed(1)}% (комментарий в чате)`,
      companyId: dashboard?.company.id ?? "cmp_rosters",
      companyName: dashboard?.company.name ?? "ООО «Ростерс Кафе»",
      demoKey,
      amountLabel: formatMoney(currentAmount),
      targetScreen: "bank-messages",
      primaryLabel: "В чат",
      time: "Только что",
    });

    setToastAlert({
      kind: "info",
      text: "Встречное предложение направлено вашему кредитному менеджеру. Ответ поступит в чат в течение 5 минут.",
    });
    setSelectedTx(null);
  }

  // 4. Пилот банка одобряет встречные условия клиента
  async function handleBankAcceptCounterOffer() {
    if (!selectedTx || !currentOffer) return;
    try {
      const term = currentOffer.clientCounterMonths ?? months;
      const rate = currentOffer.clientCounterRatePct ?? ratePct;
      const response = await runInstallment(selectedTx.id, term);
      setResult(response);

      setInstallmentOffer({ ...currentOffer, status: "ACCEPTED" });
      setActiveThread(demoKey);

      sendChatMessage(
        `Банк согласовал ваши встречные условия по рассрочке «${selectedTx.description}»: ` +
        `срок ${term} мес., ставка ${rate.toFixed(1)}% годовых. ` +
        `${formatMoney(currentAmount)} зачислены на ваш расчётный счёт!`
      );

      pushClientNotice({
        kind: "approved",
        title: "Встречные условия согласованы банком!",
        text: `Банк утвердил рассрочку на ${term} мес. под ${rate.toFixed(1)}%. ${formatMoney(currentAmount)} зачислены на счёт.`,
        applicationId: selectedTx.id,
        targetScreen: "home",
        primaryLabel: "В кабинет",
        secondaryLabel: "Закрыть",
      });

      setSelectedTx(null);
    } catch {
      // ошибка обрабатывается на верхнем уровне
    }
  }

  return (
    <section className="card">
      <div className="card-header">
        <div>
          <h2 className="card-title">Выписка по счёту</h2>
          <p className="card-subtitle">
            {isBank
              ? "Пост-транзакционная B2B-рассрочка · настройка условий и согласование контр-офферов"
              : "Пост-транзакционная рассрочка · возможность принять условия банка или предложить свои"}
          </p>
        </div>
        <span className="pill pill-outline">{transactions.length} операции</span>
      </div>

      <div className="card-body">
        {toastAlert && (
          <div className={`alert alert-${toastAlert.kind}`} style={{ marginBottom: 14 }}>
            <span>{toastAlert.text}</span>
            <button
              type="button"
              className="banner-close"
              onClick={() => setToastAlert(null)}
              style={{ float: "right", border: "none", background: "none", cursor: "pointer", color: "inherit" }}
            >
              ×
            </button>
          </div>
        )}

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
            {transactions.map((transaction) => {
              const offer = installmentOffers[transaction.id];
              return (
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
                    {transaction.installment_taken || offer?.status === "ACCEPTED" ? (
                      <span className="pill pill-good">Оформлена</span>
                    ) : offer ? (
                      offer.status === "COUNTER_OFFERED" ? (
                        <button
                          type="button"
                          className="btn btn-warning btn-sm dyn-counter-btn"
                          title="Клиент направил встречное предложение"
                          onClick={() => handleOpenModal(transaction)}
                        >
                          Контр-оффер ⚠️
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-primary btn-sm dyn-offer-btn"
                          title={`Одобрено банком: ${offer.ratePct}% годовых`}
                          onClick={() => handleOpenModal(transaction)}
                        >
                          Оффер {offer.ratePct}%
                        </button>
                      )
                    ) : transaction.can_installment ? (
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => handleOpenModal(transaction)}
                      >
                        Рассрочка
                      </button>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Модальное окно настройки / принятия / встречного предложения рассрочки */}
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
            style={{ width: "min(640px, 100%)" }}
          >
            <header className="sheet-head">
              <div>
                <span className="bank-modal-badge">
                  {isBank
                    ? currentOffer?.status === "COUNTER_OFFERED"
                      ? "Пилот банка · Встречное предложение клиента"
                      : "Пилот банка · Настройка и одобрение условий"
                    : currentOffer
                    ? "Условия B2B-рассрочки от Альфа-Банка"
                    : "B2B-Рассрочка по операции"}
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

            {/* ════════ РЕЖИМ ПИЛОТА БАНКА ════════ */}
            {isBank ? (
              <div className="bank-cockpit-flow">
                {/* Если клиент прислал встречное предложение */}
                {currentOffer?.status === "COUNTER_OFFERED" && (
                  <div className="bank-counter-alert">
                    <div className="bank-counter-head">
                      <span className="badge-warning">Встречное предложение клиента ⚠️</span>
                      <span className="bank-counter-time">Запрос на согласование</span>
                    </div>
                    <div className="bank-counter-grid">
                      <div className="bank-counter-item">
                        <span className="bank-counter-lbl">Запрошенный срок:</span>
                        <strong>{currentOffer.clientCounterMonths} мес.</strong>
                        <small className="muted"> (банк предлагал {currentOffer.months} мес.)</small>
                      </div>
                      <div className="bank-counter-item">
                        <span className="bank-counter-lbl">Запрошенная ставка:</span>
                        <strong>{currentOffer.clientCounterRatePct}% годовых</strong>
                        <small className="muted"> (банк предлагал {currentOffer.ratePct}%)</small>
                      </div>
                      <div className="bank-counter-item">
                        <span className="bank-counter-lbl">Желаемый платёж:</span>
                        <strong className="good">
                          ≈ {formatMoney(currentOffer.clientCounterMonthlyPayment ?? 0)}/мес.
                        </strong>
                      </div>
                    </div>
                    {currentOffer.clientComment && (
                      <div className="bank-counter-comment">
                        <em>Пожелание клиента:</em> «{currentOffer.clientComment}»
                      </div>
                    )}
                    <div className="bank-counter-actions">
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        disabled={isBusy}
                        onClick={() => void handleBankAcceptCounterOffer()}
                      >
                        ✓ Одобрить встречные условия клиента
                      </button>
                      <span className="muted" style={{ fontSize: 12 }}>
                        или скорректируйте параметры ниже
                      </span>
                    </div>
                  </div>
                )}

                {/* Выбор срока рассрочки банком */}
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

                {/* Выбор процентной ставки банком */}
                <div className="figma-panel-title" style={{ marginTop: 16 }}>
                  Процентная ставка банка: {ratePct.toFixed(1)}% годовых
                </div>
                <div className="bank-rate-picker">
                  <div className="bank-rate-chips">
                    {BANK_RATE_PRESETS.map((preset) => (
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

                {/* Финансовый расчет сделки */}
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

                {/* Кнопки действий пилота банка */}
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
                    onClick={handleBankSendOffer}
                  >
                    {currentOffer?.status === "COUNTER_OFFERED"
                      ? `Отправить обновленный оффер клиенту →`
                      : `Отправить предложение клиенту (${formatMoney(currentAmount)}) →`}
                  </button>
                </div>
              </div>
            ) : (
              /* ════════ РЕЖИМ КЛИЕНТА (ПРЕДПРИНИМАТЕЛЬ) ════════ */
              <div className="client-flow">
                {currentOffer ? (
                  <>
                    <div className="client-modal-tabs">
                      <button
                        type="button"
                        className={`client-modal-tab ${activeTab === "bank_offer" ? "active" : ""}`}
                        onClick={() => setActiveTab("bank_offer")}
                      >
                        1. Предложение банка ({currentOffer.ratePct}%)
                      </button>
                      <button
                        type="button"
                        className={`client-modal-tab ${activeTab === "counter_offer" ? "active" : ""}`}
                        onClick={() => setActiveTab("counter_offer")}
                      >
                        2. Встречное предложение (Контр-оффер)
                      </button>
                    </div>

                    {activeTab === "bank_offer" ? (
                      <div className="client-offer-view">
                        <div className="client-offer-hero">
                          <span className="pill pill-good" style={{ display: "inline-block", marginBottom: 8 }}>
                            Одобрено Альфа-Банком
                          </span>
                          <h3>Банк готов вернуть {formatMoney(currentAmount)} на ваш счёт</h3>
                          <p className="muted" style={{ fontSize: 13, margin: "4px 0 16px" }}>
                            Деньги зачислятся на расчётный счёт сразу после подтверждения. Погашение равными платежами.
                          </p>

                          <div className="bank-installment-metrics">
                            <div className="bank-calc-card">
                              <span className="bank-calc-label">Срок рассрочки</span>
                              <span className="bank-calc-val">{currentOffer.months} мес.</span>
                              <span className="bank-calc-sub">график платежей</span>
                            </div>
                            <div className="bank-calc-card">
                              <span className="bank-calc-label">Ставка банка</span>
                              <span className="bank-calc-val accent">{currentOffer.ratePct}%</span>
                              <span className="bank-calc-sub">годовых</span>
                            </div>
                            <div className="bank-calc-card">
                              <span className="bank-calc-label">Ежемесячный платёж</span>
                              <span className="bank-calc-val good">{formatMoney(currentOffer.monthlyPayment)}</span>
                              <span className="bank-calc-sub">переплата {formatMoney(currentOffer.totalInterest)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="sheet-actions" style={{ marginTop: 24 }}>
                          <button
                            type="button"
                            className="btn btn-ghost"
                            onClick={() => setActiveTab("counter_offer")}
                          >
                            Условия не подходят? Предложить свои →
                          </button>
                          <button
                            type="button"
                            className="btn btn-primary"
                            disabled={isBusy}
                            onClick={() => void handleClientAcceptBankOffer()}
                          >
                            Принять условия и вернуть {formatMoney(currentAmount)} на счёт →
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Вкладка встречного предложения клиента */
                      <div className="client-counter-view">
                        <p className="muted" style={{ fontSize: 13, margin: "6px 0 14px" }}>
                          Не подходят ставка или срок? Выберите комфортные для вашего бизнеса параметры
                          и отправьте запрос вашему кредитному менеджеру.
                        </p>

                        <div className="figma-panel-title">Желаемый срок рассрочки: {counterMonths} мес.</div>
                        <div className="term-cards" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
                          {TERM_OPTIONS.map((option) => (
                            <button
                              key={option}
                              type="button"
                              className={`term-card ${counterMonths === option ? "active" : ""}`}
                              onClick={() => setCounterMonths(option)}
                              style={{ padding: "10px 12px" }}
                            >
                              <strong style={{ fontSize: 13 }}>{option} мес.</strong>
                            </button>
                          ))}
                        </div>

                        <div className="figma-panel-title" style={{ marginTop: 16 }}>
                          Желаемая процентная ставка: {counterRate.toFixed(1)}% годовых
                        </div>
                        <div className="bank-rate-picker">
                          <div className="bank-rate-chips">
                            {CLIENT_COUNTER_RATES.map((preset) => (
                              <button
                                key={preset.rate}
                                type="button"
                                className={`bank-rate-chip ${counterRate === preset.rate ? "active" : ""}`}
                                onClick={() => setCounterRate(preset.rate)}
                              >
                                {preset.label}
                              </button>
                            ))}
                          </div>
                          <div className="bank-rate-slider-row">
                            <input
                              type="range"
                              min="10.0"
                              max="20.0"
                              step="0.5"
                              value={counterRate}
                              onChange={(e) => setCounterRate(Number(e.target.value))}
                              aria-label="Желаемая процентная ставка"
                            />
                            <span className="bank-rate-val">{counterRate.toFixed(1)}%</span>
                          </div>
                        </div>

                        {/* Сравнение предложения банка и встречного запроса */}
                        <div className="counter-compare-card">
                          <div className="counter-compare-col">
                            <span className="muted" style={{ fontSize: 11 }}>Предложение банка</span>
                            <div>
                              <strong>{currentOffer.months} мес.</strong> под <strong>{currentOffer.ratePct}%</strong>
                            </div>
                            <span className="accent" style={{ fontWeight: 600 }}>
                              {formatMoney(currentOffer.monthlyPayment)}/мес.
                            </span>
                          </div>
                          <div className="counter-compare-arrow">→</div>
                          <div className="counter-compare-col active">
                            <span className="muted" style={{ fontSize: 11 }}>Ваше встречное предложение</span>
                            <div>
                              <strong>{counterMonths} мес.</strong> под <strong>{counterRate.toFixed(1)}%</strong>
                            </div>
                            <span className="good" style={{ fontWeight: 600 }}>
                              {formatMoney(counterMonthlyPayment)}/мес.
                            </span>
                          </div>
                        </div>

                        {/* Поле комментария клиента */}
                        <div style={{ marginTop: 14 }}>
                          <label className="figma-panel-title" htmlFor="client-counter-comment">
                            Пожелание банку (необязательно)
                          </label>
                          <textarea
                            id="client-counter-comment"
                            className="counter-comment-box"
                            rows={2}
                            placeholder="Например: Просим увеличить срок и снизить платёж в связи с закупкой партии сырья..."
                            value={clientComment}
                            onChange={(e) => setClientComment(e.target.value)}
                          />
                        </div>

                        <div className="sheet-actions" style={{ marginTop: 20 }}>
                          <button
                            type="button"
                            className="btn btn-ghost"
                            onClick={() => setActiveTab("bank_offer")}
                          >
                            Назад к предложению банка
                          </button>
                          <button
                            type="button"
                            className="btn btn-primary"
                            disabled={isBusy}
                            onClick={handleClientSendCounterOffer}
                          >
                            Отправить встречное предложение в банк 📨
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  /* Если банк ещё не выставлял оффер по этому чеку */
                  <div className="client-no-offer">
                    <p className="muted" style={{ fontSize: 13, margin: "10px 0 16px" }}>
                      По этой операции доступна B2B-рассрочка на 3–6 месяцев.
                      Вы можете запросить индивидуальные условия у кредитного менеджера банка.
                    </p>
                    <div className="figma-panel-title">Желаемый срок рассрочки: {months} мес.</div>
                    <div className="term-cards" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
                      {TERM_OPTIONS.map((option) => (
                        <button
                          key={option}
                          type="button"
                          className={`term-card ${months === option ? "active" : ""}`}
                          onClick={() => setMonths(option)}
                          style={{ padding: "10px 12px" }}
                        >
                          <strong style={{ fontSize: 13 }}>{option} мес.</strong>
                        </button>
                      ))}
                    </div>

                    <div className="sheet-actions" style={{ marginTop: 24 }}>
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
                        onClick={handleClientSendCounterOffer}
                      >
                        Запросить рассрочку у банка 📨
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
