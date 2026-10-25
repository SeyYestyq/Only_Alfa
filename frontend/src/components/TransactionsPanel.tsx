import { useState } from "react";
import type { InstallmentResult, Transaction } from "../api/types";
import { useApp } from "../state/AppState";
import { useBankMessagesStore } from "../state/bankMessagesStore";
import { useDemoStore, type BankInstallmentVariant, type InstallmentOffer } from "../state/demoStore";
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
  { label: "16,0% · Оптимальная", rate: 16.0 },
  { label: "18,0% · Рыночная", rate: 18.0 },
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
 * Реализует утверждённый дизайн и сценарий:
 * 1. Клиент видит модальное окно рассрочки с двумя вариантами от банка (например, 3 мес. и 6 мес.).
 * 2. Клиент может выбрать один из вариантов банка и нажать «Оформить рассрочку» (деньги сразу вернутся на счёт).
 * 3. Клиент может включить «Настроить свои условия» (встречное предложение): выбрать желаемый срок, ставку, комментарий,
 *    и отправить в банк — банку поступит уведомление на рассмотрение.
 * 4. Пилот банка со своей стороны может настраивать оба варианта оффера, а также согласовывать условия заёмщика.
 */
export function TransactionsPanel({
  transactions,
  variant = "figma",
  initialLimit = 6,
}: {
  transactions: Transaction[];
  variant?: "figma" | "bank";
  initialLimit?: number;
}) {
  const { runInstallment, isBusy, dashboard, viewMode } = useApp();
  const sendChatMessage = useBankMessagesStore((state) => state.sendMessage);
  const setActiveThread = useBankMessagesStore((state) => state.setActiveThread);

  const installmentOffers = useDemoStore((state) => state.installmentOffers);
  const setInstallmentOffer = useDemoStore((state) => state.setInstallmentOffer);
  const pushClientNotice = useDemoStore((state) => state.pushClientNotice);
  const pushBankNotice = useDemoStore((state) => state.pushBankNotice);

  const [showAll, setShowAll] = useState<boolean>(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<1 | 2>(2);
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);

  // Состояние вариантов банка (для пилота)
  const [bankVar1Months, setBankVar1Months] = useState<number>(3);
  const [bankVar1Rate, setBankVar1Rate] = useState<number>(18.0);
  const [bankVar2Months, setBankVar2Months] = useState<number>(6);
  const [bankVar2Rate, setBankVar2Rate] = useState<number>(18.0);

  // Состояние встречного предложения клиента
  const [customMonths, setCustomMonths] = useState<number>(6);
  const [customRate, setCustomRate] = useState<number>(14.0);
  const [clientComment, setClientComment] = useState<string>("");

  const [result, setResult] = useState<InstallmentResult | null>(null);
  const [toastAlert, setToastAlert] = useState<{ kind: "good" | "info"; text: string } | null>(null);

  const isBank = viewMode === "bank";
  const currentAmount = selectedTx ? Math.abs(selectedTx.amount_rub) : 0;
  const currentOffer: InstallmentOffer | undefined = selectedTx
    ? installmentOffers[selectedTx.id]
    : undefined;

  const sortedTransactions = [...transactions].sort((a, b) =>
    b.occurred_at.localeCompare(a.occurred_at),
  );
  const visibleTransactions =
    variant === "figma" && !showAll
      ? sortedTransactions.slice(0, initialLimit)
      : sortedTransactions;

  const demoKey = (dashboard?.company.demo_key || dashboard?.company.id || "rosters").replace("cmp_", "");

  // Вычисляемые варианты банка
  const variant1: BankInstallmentVariant = currentOffer?.variant1 || {
    months: bankVar1Months,
    ratePct: bankVar1Rate,
    monthlyPayment: calculatePayment(currentAmount, bankVar1Months, bankVar1Rate),
    totalInterest: Math.max(0, calculatePayment(currentAmount, bankVar1Months, bankVar1Rate) * bankVar1Months - currentAmount),
  };

  const variant2: BankInstallmentVariant = currentOffer?.variant2 || {
    months: bankVar2Months,
    ratePct: bankVar2Rate,
    monthlyPayment: calculatePayment(currentAmount, bankVar2Months, bankVar2Rate),
    totalInterest: Math.max(0, calculatePayment(currentAmount, bankVar2Months, bankVar2Rate) * bankVar2Months - currentAmount),
  };

  const activeVariant = selectedVariant === 1 ? variant1 : variant2;

  // Вычисляемые параметры встречного предложения заёмщика
  const customPayment = calculatePayment(currentAmount, customMonths, customRate);
  const customInterest = Math.max(0, customPayment * customMonths - currentAmount);

  function handleOpenModal(tx: Transaction) {
    setSelectedTx(tx);
    const existing = installmentOffers[tx.id];
    if (existing) {
      setBankVar1Months(existing.variant1.months);
      setBankVar1Rate(existing.variant1.ratePct);
      setBankVar2Months(existing.variant2.months);
      setBankVar2Rate(existing.variant2.ratePct);
      setSelectedVariant(existing.selectedVariantIndex ?? 2);
      setCustomMonths(existing.clientCounterMonths ?? 6);
      setCustomRate(existing.clientCounterRatePct ?? 14.0);
      setClientComment(existing.clientComment ?? "");
      setIsCustomMode(existing.status === "COUNTER_OFFERED" && !isBank);
    } else {
      setBankVar1Months(3);
      setBankVar1Rate(18.0);
      setBankVar2Months(6);
      setBankVar2Rate(18.0);
      setSelectedVariant(2);
      setCustomMonths(6);
      setCustomRate(14.0);
      setClientComment("");
      setIsCustomMode(false);
    }
  }

  // 1. Клиент принимает один из двух вариантов банка
  async function handleClientAcceptVariant(variantIndex: 1 | 2) {
    if (!selectedTx) return;
    try {
      const chosen = variantIndex === 1 ? variant1 : variant2;
      const response = await runInstallment(selectedTx.id, chosen.months);
      setResult(response);

      if (currentOffer) {
        setInstallmentOffer({ ...currentOffer, selectedVariantIndex: variantIndex, status: "ACCEPTED" });
      }

      setActiveThread(demoKey);
      sendChatMessage(
        `Клиент оформил B2B-рассрочку по операции «${selectedTx.description}» на ${chosen.months} мес. ` +
        `под ${chosen.ratePct.toFixed(1)}% годовых (платёж ${formatMoney(chosen.monthlyPayment)}/мес). ` +
        `${formatMoney(currentAmount)} возвращены на расчётный счёт.`
      );

      pushBankNotice({
        kind: "new_app",
        title: `Рассрочка оформлена: ${formatMoney(currentAmount)}`,
        text: `${dashboard?.company.name ?? "Клиент"} выбрал вариант на ${chosen.months} мес. под ${chosen.ratePct.toFixed(1)}%`,
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
      // ошибка всплывает в глобальном баннере
    }
  }

  // 2. Клиент настраивает свои условия и отправляет в банк на рассмотрение
  function handleClientSendCustomConditions() {
    if (!selectedTx) return;
    const payment = calculatePayment(currentAmount, customMonths, customRate);

    const baseOffer: InstallmentOffer = currentOffer || {
      txId: selectedTx.id,
      txDescription: selectedTx.description,
      amountRub: currentAmount,
      variant1,
      variant2,
      status: "OFFERED",
      offeredAt: "Только что",
    };

    const updatedOffer: InstallmentOffer = {
      ...baseOffer,
      status: "COUNTER_OFFERED",
      clientCounterMonths: customMonths,
      clientCounterRatePct: customRate,
      clientCounterMonthlyPayment: payment,
      clientComment: clientComment.trim() || "Просим предоставить индивидуальные условия для снижения нагрузки на кассу.",
    };

    setInstallmentOffer(updatedOffer);
    setActiveThread(demoKey);

    sendChatMessage(
      `Клиент настроил свои условия по рассрочке «${selectedTx.description}» (${formatMoney(currentAmount)}): ` +
      `запрошен срок ${customMonths} мес. и ставка ${customRate.toFixed(1)}% годовых ` +
      `(желаемый платёж ${formatMoney(payment)}/мес). ` +
      `Комментарий заёмщика: «${clientComment.trim() || "Просим пересмотреть условия"}». ` +
      `Запрос передан на рассмотрение кредитному инспектору.`
    );

    pushBankNotice({
      kind: "manual_review",
      title: `Запрос на свои условия: ${formatMoney(currentAmount)}`,
      text: `${dashboard?.company.name ?? "Клиент"} настроил свои условия: ${customMonths} мес. под ${customRate.toFixed(1)}% (на рассмотрении)`,
      companyId: dashboard?.company.id ?? "cmp_rosters",
      companyName: dashboard?.company.name ?? "ООО «Ростерс Кафе»",
      demoKey,
      amountLabel: formatMoney(currentAmount),
      targetScreen: "bank-messages",
      primaryLabel: "Рассмотреть",
      time: "Только что",
    });

    setToastAlert({
      kind: "info",
      text: "Ваши условия рассрочки направлены кредитному инспектору банка на рассмотрение. Ответ поступит в чат в течение 5 минут.",
    });
    setSelectedTx(null);
  }

  // 3. Пилот банка направляет два варианта клиенту
  function handleBankSendTwoVariants() {
    if (!selectedTx) return;
    const v1Payment = calculatePayment(currentAmount, bankVar1Months, bankVar1Rate);
    const v1Interest = Math.max(0, v1Payment * bankVar1Months - currentAmount);

    const v2Payment = calculatePayment(currentAmount, bankVar2Months, bankVar2Rate);
    const v2Interest = Math.max(0, v2Payment * bankVar2Months - currentAmount);

    const offer: InstallmentOffer = {
      txId: selectedTx.id,
      txDescription: selectedTx.description,
      amountRub: currentAmount,
      variant1: {
        months: bankVar1Months,
        ratePct: bankVar1Rate,
        monthlyPayment: v1Payment,
        totalInterest: v1Interest,
      },
      variant2: {
        months: bankVar2Months,
        ratePct: bankVar2Rate,
        monthlyPayment: v2Payment,
        totalInterest: v2Interest,
      },
      selectedVariantIndex: 2,
      status: "OFFERED",
      offeredAt: "Только что",
    };

    setInstallmentOffer(offer);
    setActiveThread(demoKey);

    sendChatMessage(
      `Банк сформировал 2 варианта B2B-рассрочки по расходу «${selectedTx.description}» на сумму ${formatMoney(currentAmount)}: ` +
      `Вариант 1 — ${bankVar1Months} мес. под ${bankVar1Rate.toFixed(1)}% (${formatMoney(v1Payment)}/мес); ` +
      `Вариант 2 — ${bankVar2Months} мес. под ${bankVar2Rate.toFixed(1)}% (${formatMoney(v2Payment)}/мес). ` +
      `Вы можете выбрать подходящий вариант в кабинете или настроить свои условия.`
    );

    pushClientNotice({
      kind: "approved",
      title: `Вам предложено 2 варианта рассрочки: ${formatMoney(currentAmount)}`,
      text: `На 3 или 6 месяцев от ${Math.min(bankVar1Rate, bankVar2Rate).toFixed(1)}% годовых. Нажмите «Рассрочка», чтобы выбрать или настроить свои параметры.`,
      applicationId: selectedTx.id,
      targetScreen: "home",
      primaryLabel: "Открыть варианты",
      secondaryLabel: "Позже",
    });

    setToastAlert({
      kind: "good",
      text: `Банк успешно направил 2 варианта рассрочки клиенту (${bankVar1Months} мес. и ${bankVar2Months} мес.).`,
    });
    setSelectedTx(null);
  }

  // 4. Пилот банка одобряет встречные условия заёмщика
  async function handleBankAcceptCustomConditions() {
    if (!selectedTx || !currentOffer) return;
    try {
      const term = currentOffer.clientCounterMonths ?? 6;
      const rate = currentOffer.clientCounterRatePct ?? 14.0;
      const response = await runInstallment(selectedTx.id, term);
      setResult(response);

      setInstallmentOffer({ ...currentOffer, status: "ACCEPTED" });
      setActiveThread(demoKey);

      sendChatMessage(
        `Банк рассмотрел и согласовал ваши индивидуальные условия по рассрочке «${selectedTx.description}»: ` +
        `срок ${term} мес., ставка ${rate.toFixed(1)}% годовых. ` +
        `Сумма ${formatMoney(currentAmount)} перечислена на ваш расчётный счёт!`
      );

      pushClientNotice({
        kind: "approved",
        title: "Индивидуальные условия согласованы банком!",
        text: `Банк утвердил рассрочку на ${term} мес. под ${rate.toFixed(1)}%. Деньги возвращены на счёт компании.`,
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

  function renderActionCell(transaction: Transaction, offer?: InstallmentOffer) {
    if (transaction.installment_taken || offer?.status === "ACCEPTED") {
      return <span className="pill pill-good">Оформлена</span>;
    }
    if (isBank) {
      if (offer) {
        if (offer.status === "COUNTER_OFFERED") {
          return (
            <button
              type="button"
              className="btn btn-warning btn-sm dyn-counter-btn"
              title="Клиент направил свои условия на рассмотрение"
              onClick={() => handleOpenModal(transaction)}
            >
              Свои условия ⚠️
            </button>
          );
        }
        return (
          <button
            type="button"
            className="btn btn-primary btn-sm dyn-offer-btn"
            title="Оффер с 2 вариантами отправлен клиенту"
            onClick={() => handleOpenModal(transaction)}
          >
            Оффер отправлен ✓
          </button>
        );
      }
      if (transaction.can_installment) {
        return (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            title="Предложить 2 варианта рассрочки клиенту"
            onClick={() => handleOpenModal(transaction)}
          >
            + Рассрочка
          </button>
        );
      }
      return null;
    }

    /* ДЛЯ КЛИЕНТА (ПРЕДПРИНИМАТЕЛЯ): видит кнопку ТОЛЬКО когда банк оставил предложение! */
    if (offer) {
      if (offer.status === "COUNTER_OFFERED") {
        return (
          <button
            type="button"
            className="btn btn-warning btn-sm dyn-counter-btn"
            title="Ваши условия на рассмотрении в банке"
            onClick={() => handleOpenModal(transaction)}
          >
            На рассмотрении ⏳
          </button>
        );
      }
      return (
        <button
          type="button"
          className="btn btn-primary btn-sm dyn-offer-btn"
          title="Банк одобрил рассрочку! Выберите вариант"
          onClick={() => handleOpenModal(transaction)}
        >
          Рассрочка
        </button>
      );
    }
    return null;
  }

  if (variant === "figma") {
    return (
      <section className="figma-panel home-section clarity-rise clarity-rise-d5">
        <div className="ops-head">
          <div>
            <div className="figma-panel-title">Движения по счёту</div>
            <div className="figma-panel-heading" style={{ marginTop: 4, fontSize: 18 }}>
              {isBank ? "Операции компании (рассрочка)" : "Последние операции"}
            </div>
          </div>
          {transactions.length > initialLimit && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setShowAll((prev) => !prev)}
            >
              {showAll ? `Свернуть (${initialLimit}) ↑` : `Все (${transactions.length}) →`}
            </button>
          )}
        </div>

        {toastAlert && (
          <div className={`alert alert-${toastAlert.kind}`} style={{ marginTop: 12, marginBottom: 12 }}>
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
          <div className="alert alert-good" style={{ marginTop: 12, marginBottom: 12 }}>
            ✅ <strong>Рассрочка оформлена:</strong> {formatMoney(result.restored_amount_rub)} возвращены на счёт,
            платёж {formatMoney(result.monthly_payment_rub)}/мес. Новый баланс счёта:{" "}
            <strong>{formatMoney(result.account_balance)}</strong>.
          </div>
        )}

        <table className="ops-table" style={{ marginTop: 8 }}>
          <thead>
            <tr>
              <th>Дата</th>
              <th>Операция</th>
              <th>Категория</th>
              <th className="ops-amount">Сумма</th>
              <th style={{ textAlign: "right" }}>Рассрочка</th>
            </tr>
          </thead>
          <tbody>
            {visibleTransactions.map((transaction) => {
              const offer = installmentOffers[transaction.id];
              return (
                <tr key={transaction.id}>
                  <td className="muted" style={{ whiteSpace: "nowrap" }}>
                    {formatDate(transaction.occurred_at)}
                  </td>
                  <td>
                    <strong>{transaction.description}</strong>
                  </td>
                  <td>
                    <span className={`cat-pill ${transaction.direction === "IN" ? "in" : ""}`}>
                      <i />
                      {transaction.category}
                    </span>
                  </td>
                  <td className={`ops-amount ${transaction.direction === "IN" ? "in" : ""}`}>
                    {transaction.direction === "IN" ? "+" : "−"}
                    {formatMoney(Math.abs(transaction.amount_rub))}
                  </td>
                  <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                    {renderActionCell(transaction, offer)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Модальное окно B2B-рассрочки по эталонному макету */}
        {selectedTx && (
          <div
            className="sheet-backdrop"
            role="presentation"
            onClick={() => setSelectedTx(null)}
          >
            <div
              className="sheet-card installment-modal-card"
              role="dialog"
              aria-labelledby="installment-title"
              onClick={(event) => event.stopPropagation()}
            >
              {renderModalContent()}
            </div>
          </div>
        )}
      </section>
    );
  }

  return (
    <section className="card">
      <div className="card-header">
        <div>
          <h2 className="card-title">Выписка по счёту</h2>
          <p className="card-subtitle">
            {isBank
              ? "Пост-транзакционная рассрочка · банк может предлагать 2 варианта и рассматривать запросы клиента"
              : "Пост-транзакционная рассрочка · выбор из 2 вариантов банка или настройка своих условий"}
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
            {visibleTransactions.map((transaction) => {
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
                    {renderActionCell(transaction, offer)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Модальное окно B2B-рассрочки по эталонному макету */}
      {selectedTx && (
        <div
          className="sheet-backdrop"
          role="presentation"
          onClick={() => setSelectedTx(null)}
        >
          <div
            className="sheet-card installment-modal-card"
            role="dialog"
            aria-labelledby="installment-title"
            onClick={(event) => event.stopPropagation()}
          >
            {renderModalContent()}
          </div>
        </div>
      )}
    </section>
  );

  function renderModalContent() {
    if (!selectedTx) return null;
    return (
      <>
        {/* 1. Header */}
        <header className="installment-modal-header">
          <div>
            <span className="installment-modal-badge">
                  {isBank ? "ПИЛОТ БАНКА · НАСТРОЙКА И ОДОБРЕНИЕ" : "РАССРОЧКА НА ОПЛАЧЕННЫЙ РАСХОД"}
                </span>
                <h2 id="installment-title" className="installment-modal-title">
                  Вернуть {formatMoney(currentAmount)} в оборот
                </h2>
              </div>
              <button
                type="button"
                className="installment-close-btn"
                aria-label="Закрыть"
                onClick={() => setSelectedTx(null)}
              >
                ✕
              </button>
            </header>

            {/* 2. Transaction Details Card */}
            <div className="installment-expense-card">
              <div className="installment-expense-info">
                <div className="installment-expense-title">
                  {formatDate(selectedTx.occurred_at).slice(0, 5)} · {selectedTx.description}
                </div>
                <div className="installment-expense-category">
                  {selectedTx.category}
                </div>
              </div>
              <div className="installment-expense-amount">
                {formatMoney(currentAmount)}
              </div>
            </div>

            {/* ═══════════ РЕЖИМ ПИЛОТА БАНКА ═══════════ */}
            {isBank ? (
              <div className="bank-pilot-cockpit">
                {/* Если клиент прислал свои условия на рассмотрение */}
                {currentOffer?.status === "COUNTER_OFFERED" && (
                  <div className="bank-counter-alert" style={{ marginBottom: 16 }}>
                    <div className="bank-counter-head">
                      <span className="badge-warning">Запрос клиента на свои условия (на рассмотрении) ⚠️</span>
                      <span className="bank-counter-time">Встречный оффер</span>
                    </div>
                    <div className="bank-counter-grid">
                      <div className="bank-counter-item">
                        <span className="bank-counter-lbl">Срок заёмщика:</span>
                        <strong>{currentOffer.clientCounterMonths} мес.</strong>
                      </div>
                      <div className="bank-counter-item">
                        <span className="bank-counter-lbl">Ставка заёмщика:</span>
                        <strong>{currentOffer.clientCounterRatePct}% годовых</strong>
                      </div>
                      <div className="bank-counter-item">
                        <span className="bank-counter-lbl">Желаемый платёж:</span>
                        <strong className="good">
                          ≈ {formatMoney(currentOffer.clientCounterMonthlyPayment ?? 0)} / мес.
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
                        onClick={() => void handleBankAcceptCustomConditions()}
                      >
                        ✓ Одобрить условия клиента
                      </button>
                      <span className="muted" style={{ fontSize: 12 }}>
                        или перенастройте 2 варианта банка ниже
                      </span>
                    </div>
                  </div>
                )}

                <div className="figma-panel-title" style={{ marginTop: 8 }}>
                  2 Варианта оффера, предлагаемые клиенту:
                </div>

                {/* Настройка Варианта 1 */}
                <div className="bank-variant-config-box">
                  <div className="bank-variant-config-head">
                    <strong>Вариант 1 ({bankVar1Months} мес. · {bankVar1Rate}%):</strong>
                    <span className="good">≈ {formatMoney(calculatePayment(currentAmount, bankVar1Months, bankVar1Rate))} / мес.</span>
                  </div>
                  <div className="bank-variant-config-row">
                    <label>Срок:</label>
                    <div className="bank-mini-chips">
                      {TERM_OPTIONS.map((m) => (
                        <button
                          key={m}
                          type="button"
                          className={`bank-mini-chip ${bankVar1Months === m ? "active" : ""}`}
                          onClick={() => setBankVar1Months(m)}
                        >
                          {m} мес.
                        </button>
                      ))}
                    </div>
                    <label style={{ marginLeft: 12 }}>Ставка:</label>
                    <input
                      type="range"
                      min="12.0"
                      max="24.0"
                      step="0.5"
                      value={bankVar1Rate}
                      onChange={(e) => setBankVar1Rate(Number(e.target.value))}
                      style={{ flex: 1, accentColor: "var(--accent)" }}
                    />
                    <span style={{ fontWeight: 700, minWidth: 46 }}>{bankVar1Rate.toFixed(1)}%</span>
                  </div>
                </div>

                {/* Настройка Варианта 2 */}
                <div className="bank-variant-config-box" style={{ marginTop: 10 }}>
                  <div className="bank-variant-config-head">
                    <strong>Вариант 2 ({bankVar2Months} мес. · {bankVar2Rate}%):</strong>
                    <span className="good">≈ {formatMoney(calculatePayment(currentAmount, bankVar2Months, bankVar2Rate))} / мес.</span>
                  </div>
                  <div className="bank-variant-config-row">
                    <label>Срок:</label>
                    <div className="bank-mini-chips">
                      {TERM_OPTIONS.map((m) => (
                        <button
                          key={m}
                          type="button"
                          className={`bank-mini-chip ${bankVar2Months === m ? "active" : ""}`}
                          onClick={() => setBankVar2Months(m)}
                        >
                          {m} мес.
                        </button>
                      ))}
                    </div>
                    <label style={{ marginLeft: 12 }}>Ставка:</label>
                    <input
                      type="range"
                      min="12.0"
                      max="24.0"
                      step="0.5"
                      value={bankVar2Rate}
                      onChange={(e) => setBankVar2Rate(Number(e.target.value))}
                      style={{ flex: 1, accentColor: "var(--accent)" }}
                    />
                    <span style={{ fontWeight: 700, minWidth: 46 }}>{bankVar2Rate.toFixed(1)}%</span>
                  </div>
                </div>

                {/* Кнопки пилота */}
                <div className="installment-modal-actions">
                  <button
                    type="button"
                    className="installment-cancel-btn"
                    onClick={() => setSelectedTx(null)}
                  >
                    Отмена
                  </button>
                  <button
                    type="button"
                    className="installment-submit-btn"
                    disabled={isBusy}
                    onClick={handleBankSendTwoVariants}
                  >
                    Направить 2 варианта клиенту →
                  </button>
                </div>
              </div>
            ) : (
              /* ═══════════ РЕЖИМ ПРЕДПРИНИМАТЕЛЯ (КЛИЕНТ) ═══════════ */
              <div className="client-installment-view">
                {/* 3. Section: СРОК РАССРОЧКИ */}
                <div className="installment-section-lbl">
                  СРОК РАССРОЧКИ
                </div>

                {/* 4. Два варианта банка (карточки рядом как на макете) */}
                <div className="installment-variant-cards">
                  {/* Карточка 1 */}
                  <button
                    type="button"
                    className={`installment-variant-card ${selectedVariant === 1 && !isCustomMode ? "selected" : ""}`}
                    onClick={() => {
                      setSelectedVariant(1);
                      setIsCustomMode(false);
                    }}
                  >
                    <div className="installment-variant-term">{variant1.months} месяца</div>
                    <div className="installment-variant-payment">
                      ≈ {formatMoney(variant1.monthlyPayment)} / мес.
                    </div>
                    <div className="installment-variant-overpay">
                      Переплата {formatMoney(variant1.totalInterest)} · ориентир
                    </div>
                  </button>

                  {/* Карточка 2 */}
                  <button
                    type="button"
                    className={`installment-variant-card ${selectedVariant === 2 && !isCustomMode ? "selected" : ""}`}
                    onClick={() => {
                      setSelectedVariant(2);
                      setIsCustomMode(false);
                    }}
                  >
                    <div className="installment-variant-term">{variant2.months} месяца</div>
                    <div className="installment-variant-payment">
                      ≈ {formatMoney(variant2.monthlyPayment)} / мес.
                    </div>
                    <div className="installment-variant-overpay">
                      Переплата {formatMoney(variant2.totalInterest)} · ориентир
                    </div>
                  </button>
                </div>

                {/* 5. Переключатель: Настроить свои условия */}
                <div className="installment-custom-toggle-wrap">
                  <button
                    type="button"
                    className={`installment-custom-toggle-btn ${isCustomMode ? "active" : ""}`}
                    onClick={() => setIsCustomMode((v) => !v)}
                  >
                    <span>
                      ⚙️ {isCustomMode
                        ? "Вернуться к выбору вариантов банка"
                        : "Настроить свои условия (если варианты банка не подходят)"}
                    </span>
                    <span className="toggle-chevron">{isCustomMode ? "▴" : "▾"}</span>
                  </button>
                </div>

                {/* 6. Блок настройки своих условий (если включен) */}
                {isCustomMode && (
                  <div className="installment-custom-box">
                    <div className="figma-panel-title" style={{ marginTop: 0 }}>
                      Желаемый срок рассрочки: {customMonths} мес.
                    </div>
                    <div className="term-cards" style={{ gridTemplateColumns: "repeat(4, 1fr)", margin: "8px 0 12px" }}>
                      {TERM_OPTIONS.map((m) => (
                        <button
                          key={m}
                          type="button"
                          className={`term-card ${customMonths === m ? "active" : ""}`}
                          onClick={() => setCustomMonths(m)}
                          style={{ padding: "8px 10px", textAlign: "center" }}
                        >
                          <strong>{m} мес.</strong>
                        </button>
                      ))}
                    </div>

                    <div className="figma-panel-title">
                      Желаемая процентная ставка: {customRate.toFixed(1)}% годовых
                    </div>
                    <div className="bank-rate-picker" style={{ margin: "6px 0 12px" }}>
                      <div className="bank-rate-chips">
                        {CLIENT_COUNTER_RATES.map((preset) => (
                          <button
                            key={preset.rate}
                            type="button"
                            className={`bank-rate-chip ${customRate === preset.rate ? "active" : ""}`}
                            onClick={() => setCustomRate(preset.rate)}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="installment-custom-preview">
                      <span>
                        Ваш расчётный платёж: <strong>{formatMoney(customPayment)} / мес.</strong>
                      </span>
                      <span className="muted"> (переплата {formatMoney(customInterest)})</span>
                    </div>

                    <div style={{ marginTop: 10 }}>
                      <label className="installment-field-lbl" htmlFor="custom-comment">
                        Комментарий или пожелание для банка
                      </label>
                      <textarea
                        id="custom-comment"
                        className="counter-comment-box"
                        rows={2}
                        placeholder="Например: просим снизить платёж до 15 000 ₽/мес в связи с закупкой партии сырья..."
                        value={clientComment}
                        onChange={(e) => setClientComment(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {/* 7. Таблица метрик (строго как на фото) */}
                <div className="installment-metrics-table">
                  <div className="installment-metric-row">
                    <div className="installment-metric-col">
                      <span className="installment-metric-lbl">Вернётся на счёт</span>
                      <span className="installment-metric-val">
                        <strong>{formatMoney(currentAmount)}</strong> · сразу после подписи
                      </span>
                    </div>
                    <div className="installment-metric-col" style={{ textAlign: "right" }}>
                      <span className="installment-metric-lbl">Ставка</span>
                      <span className="installment-metric-val">
                        <strong>{(isCustomMode ? customRate : activeVariant.ratePct).toFixed(1)}%</strong> годовых
                      </span>
                    </div>
                  </div>

                  <div className="installment-metric-divider" />

                  <div className="installment-metric-row">
                    <div className="installment-metric-col">
                      <span className="installment-metric-lbl">Платёж</span>
                      <span className="installment-metric-val">
                        {isCustomMode
                          ? `≈ ${formatMoney(customPayment)} / мес. (запрос заёмщика)`
                          : `≈ ${formatMoney(activeVariant.monthlyPayment)} / мес.`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 8. Кнопки действий (Отмена | Оформить рассрочку / Отправить в банк) */}
                <div className="installment-modal-actions">
                  <button
                    type="button"
                    className="installment-cancel-btn"
                    onClick={() => setSelectedTx(null)}
                  >
                    Отмена
                  </button>

                  {isCustomMode ? (
                    <button
                      type="button"
                      className="installment-submit-btn"
                      disabled={isBusy}
                      onClick={handleClientSendCustomConditions}
                    >
                      Отправить на рассмотрение в банк 📨
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="installment-submit-btn"
                      disabled={isBusy}
                      onClick={() => void handleClientAcceptVariant(selectedVariant)}
                    >
                      Оформить рассрочку
                    </button>
                  )}
                </div>
              </div>
            )}

      </>
    );
  }
}

