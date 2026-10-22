import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { PRODUCT_LABELS } from "../api/client";
import type { CollateralType, ProductType } from "../api/types";
import { CollateralPicker } from "../components/CollateralPicker";
import { FlowStepper, stepFromStatus } from "../components/FlowStepper";
import { useApp } from "../state/AppState";
import { useDemoStore } from "../state/demoStore";
import { formatMoney, formatPercent, roleLabel } from "../utils/format";

function suggestedCollateral(amount: number): number {
  return Math.max(amount, 3_000_000);
}

/** Границы формы до отправки. API принимает шире, эти пороги — подсказка клиенту. */
const FORM_MIN_AMOUNT = 100_000;
const FORM_MIN_TERM = 3;
const FORM_MAX_TERM = 60;

function issuePhrase(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) {
    return `${count} поле требует исправления`;
  }
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return `${count} поля требуют исправления`;
  }
  return `${count} полей требуют исправления`;
}

/** К2 — Заявка (Figma 50:249): форма + нагрузка платежа + обеспечение. */
export function ApplyScreen() {
  const {
    dashboard,
    searchResult,
    createApplication,
    isBusy,
    application,
    goToScreen,
    invoiceResult,
    userRole,
  } = useApp();

  const company = dashboard?.company;
  const [amount, setAmount] = useState(2_500_000);
  const [term, setTerm] = useState(12);
  const [product, setProduct] = useState<ProductType>("INVEST_LEASING");
  const [purpose, setPurpose] = useState("Покупка оборудования");
  const applyIntent = useDemoStore((state) => state.applyIntent);
  const prefillCollateral = useDemoStore((state) => state.prefillCollateral);
  const setApplyIntent = useDemoStore((state) => state.setApplyIntent);
  const [collateralType, setCollateralType] = useState<CollateralType>(
    applyIntent === "collateral" ? "REAL_ESTATE" : "NONE",
  );
  const [collateralValue, setCollateralValue] = useState(3_000_000);
  const [amountError, setAmountError] = useState<string | null>(null);
  const [termError, setTermError] = useState<string | null>(null);
  const [collateralError, setCollateralError] = useState<string | null>(null);
  const [issueCount, setIssueCount] = useState(0);
  const amountRef = useRef<HTMLInputElement>(null);
  const termRef = useRef<HTMLInputElement>(null);
  const seededCollateral = useRef(false);

  useEffect(() => {
    if (!company || applyIntent === "collateral") {
      return;
    }
    const badge = searchResult?.credit_badge;
    const fromInvoice = invoiceResult?.invoice.amount_rub;
    setAmount(fromInvoice ?? badge?.amount_rub ?? 2_500_000);
    setTerm(badge?.term_months ?? 12);
    setProduct(badge?.product_type ?? "INVEST_LEASING");
    if (invoiceResult?.invoice.purpose) {
      setPurpose(invoiceResult.invoice.purpose);
    }
  }, [company?.id, searchResult, invoiceResult, applyIntent]);

  useEffect(() => {
    if (seededCollateral.current || !prefillCollateral || !application) {
      return;
    }
    seededCollateral.current = true;
    setAmount(application.requested_amount_rub);
    setTerm(application.term_months);
    setCollateralType(
      application.collateral_type === "NONE" ? "REAL_ESTATE" : application.collateral_type,
    );
    setCollateralValue(
      application.collateral_value_rub > 0
        ? application.collateral_value_rub
        : suggestedCollateral(application.requested_amount_rub),
    );
  }, [prefillCollateral, application]);

  const loadPreview = useMemo(() => {
    const maxPayment =
      application?.max_payment_rub ?? searchResult?.credit_badge?.max_payment_rub ?? 110_500;
    const seasonal = Math.round(maxPayment * 0.692); // ≈ 76 500 при 110 500
    // Ориентир аннуитета на UI до ответа API (не решение банка)
    const roughPayment = Math.round((amount * (0.18 / 12)) / (1 - (1 + 0.18 / 12) ** -term));
    return { maxPayment, seasonal, roughPayment };
  }, [amount, term, application?.max_payment_rub, searchResult?.credit_badge?.max_payment_rub]);

  const bankSuggested = searchResult?.credit_badge?.amount_rub ?? 900_000;
  const invoice = invoiceResult?.invoice;

  if (!company) {
    return (
      <div className="empty-state">
        <h3>Компания не выбрана</h3>
        <p>Выберите демо-профиль в полосе ДЕМО.</p>
      </div>
    );
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!company) {
      return;
    }
    const problems: Array<() => void> = [];
    if (amount < FORM_MIN_AMOUNT) {
      setAmountError(`Минимум ${formatMoney(FORM_MIN_AMOUNT)}`);
      problems.push(() => amountRef.current?.focus());
    } else {
      setAmountError(null);
    }
    if (term < FORM_MIN_TERM || term > FORM_MAX_TERM) {
      setTermError(
        term > FORM_MAX_TERM
          ? `Максимум ${FORM_MAX_TERM} месяцев`
          : `Минимум ${FORM_MIN_TERM} месяца`,
      );
      problems.push(() => termRef.current?.focus());
    } else {
      setTermError(null);
    }
    if (collateralType !== "NONE" && collateralValue <= 0) {
      setCollateralError("Укажите оценочную стоимость залога");
      problems.push(() => undefined);
    } else {
      setCollateralError(null);
    }
    setIssueCount(problems.length);
    if (problems.length > 0) {
      problems[0]?.();
      return;
    }
    await createApplication({
      product_type: collateralType === "NONE" ? product : "VKL_SEC",
      requested_amount_rub: amount,
      term_months: term,
      declared_monthly_revenue: company.declared_monthly_revenue,
      collateral_type: collateralType,
      collateral_value_rub: collateralType === "NONE" ? 0 : collateralValue,
      draft_application_id: invoiceResult?.draft.application_id,
    });
  }

  function chooseSafe() {
    setAmount(1_200_000);
    setTerm(24);
    setCollateralType("NONE");
    setCollateralError(null);
    setApplyIntent("standard");
  }

  function setSecured(enabled: boolean) {
    setCollateralError(null);
    if (!enabled) {
      setCollateralType("NONE");
      setApplyIntent("standard");
      return;
    }
    setApplyIntent("collateral");
    setCollateralType((current) => (current === "NONE" ? "REAL_ESTATE" : current));
    setCollateralValue((current) => (current > 0 ? current : suggestedCollateral(amount)));
  }

  const maxBar = Math.max(loadPreview.roughPayment, loadPreview.maxPayment, 1);
  const paymentIsHigh = loadPreview.roughPayment > loadPreview.maxPayment;

  return (
    <>
      <div className="page-header">
        <div>
          <div className="figma-eyebrow">Заявки и предложения · кредит на развитие бизнеса</div>
          <h1 className="figma-h1">Сколько нужно бизнесу?</h1>
          <p className="figma-lead">
            Мы подставили данные из выписки{invoice ? " и счёта поставщика" : ""}. Проверьте сумму и
            срок — ориентир платежа обновится сразу. Решение считает банк.
          </p>
        </div>
      </div>
      <FlowStepper active={stepFromStatus(application?.status, "apply")} />

      <div className="figma-grid-2">
        <form className="figma-panel figma-panel-sm" noValidate onSubmit={handleSubmit}>
          {issueCount > 0 && (
            <button
              type="button"
              className="issue-banner"
              onClick={() => (amountError ? amountRef : termRef).current?.focus()}
            >
              <span>{issuePhrase(issueCount)}</span>
              <span>К первому →</span>
            </button>
          )}
          <div className="figma-panel-title">Счёт поставщика</div>
          {invoice ? (
            <div className="apply-invoice">
              <span className="pdf">PDF</span>
              <div>
                <strong>{invoice.supplier_name}</strong>
                <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
                  ИНН {invoice.supplier_inn} · {invoice.purpose}
                </div>
                <div style={{ marginTop: 8, fontWeight: 650 }}>{formatMoney(invoice.amount_rub)}</div>
              </div>
            </div>
          ) : (
            <div className="apply-invoice">
              <span className="pdf">PDF</span>
              <div>
                <strong>Счёт ещё не приложен</strong>
                <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
                  Можно указать сумму вручную или разобрать счёт поставщика.
                </div>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  style={{ marginTop: 8 }}
                  onClick={() => goToScreen("invoice")}
                >
                  Разобрать счёт
                </button>
              </div>
            </div>
          )}

          <div className="figma-panel-title" style={{ marginTop: 24 }}>
            Условия
          </div>
          <div className="form-grid" style={{ marginTop: 12 }}>
            <label className="field">
              <span className="field-label">Сумма</span>
              <input
                ref={amountRef}
                className={`field-input field-lg ${amountError ? "is-invalid" : ""}`}
                type="number"
                min={FORM_MIN_AMOUNT}
                step={1_000}
                value={amount}
                onChange={(event) => {
                  setAmount(Number(event.target.value));
                  setAmountError(null);
                  setIssueCount(0);
                }}
                required
              />
              <span className="faint" style={{ fontSize: 12 }}>
                Банк предлагал {formatMoney(bankSuggested)}
              </span>
              {amountError && (
                <span className="red" style={{ fontSize: 12 }}>
                  {amountError}
                </span>
              )}
            </label>
            <label className="field">
              <span className="field-label">Срок</span>
              <input
                ref={termRef}
                className={`field-input field-lg ${termError ? "is-invalid" : ""}`}
                type="number"
                min={FORM_MIN_TERM}
                max={FORM_MAX_TERM}
                value={term}
                onChange={(event) => {
                  setTerm(Number(event.target.value));
                  setTermError(null);
                  setIssueCount(0);
                }}
                required
              />
              <span className={termError ? "red" : "faint"} style={{ fontSize: 12 }}>
                {termError ?? `от ${FORM_MIN_TERM} до ${FORM_MAX_TERM} месяцев`}
              </span>
            </label>
            <label className="field">
              <span className="field-label">Цель</span>
              <input
                className="field-input field-lg"
                value={purpose}
                onChange={(event) => setPurpose(event.target.value)}
              />
              <span className="faint" style={{ fontSize: 12 }}>
                {invoice ? "из счёта поставщика" : "своими словами"}
              </span>
            </label>
            <label className="field">
              <span className="field-label">Обеспечение</span>
              <select
                className="field-select field-lg"
                value={collateralType === "NONE" ? "NONE" : collateralType}
                onChange={(event) => {
                  const next = event.target.value as CollateralType;
                  if (next === "NONE") {
                    setSecured(false);
                    return;
                  }
                  setSecured(true);
                  setCollateralType(next);
                }}
              >
                <option value="NONE">Без залога</option>
                <option value="REAL_ESTATE">Недвижимость</option>
                <option value="VEHICLE">Транспорт</option>
                <option value="EQUIPMENT">Оборудование</option>
              </select>
              <span className="faint" style={{ fontSize: 12 }}>
                залог расширяет лимит
              </span>
            </label>
          </div>

          {collateralType !== "NONE" && (
            <div style={{ marginTop: 16 }}>
              <CollateralPicker
                enabled
                type={collateralType}
                value={collateralValue}
                requestedAmount={amount}
                error={collateralError}
                onEnabledChange={setSecured}
                onTypeChange={(next) => {
                  setCollateralError(null);
                  setCollateralType(next);
                }}
                onValueChange={(next) => {
                  setCollateralError(null);
                  setCollateralValue(next);
                }}
              />
            </div>
          )}

          {collateralType === "NONE" && (
            <label className="field" style={{ marginTop: 16 }}>
              <span className="field-label">Продукт без залога</span>
              <select
                className="field-select field-lg"
                value={product}
                onChange={(event) => setProduct(event.target.value as ProductType)}
              >
                {(Object.keys(PRODUCT_LABELS) as ProductType[])
                  .filter((key) => key !== "VKL_SEC")
                  .map((key) => (
                    <option key={key} value={key}>
                      {PRODUCT_LABELS[key]}
                    </option>
                  ))}
              </select>
            </label>
          )}

          <div className="figma-panel-title" style={{ marginTop: 28 }}>
            Данные компании — подставлены автоматически
          </div>
          <div className="kv-list">
            <div className="meta-row">
              <span>Компания</span>
              <strong>
                {company.name} · ИНН {company.inn}
              </strong>
            </div>
            <div className="meta-row">
              <span>Подписант</span>
              <strong>{company.director_name}</strong>
            </div>
            <div className="meta-row">
              <span>Подготовила заявку</span>
              <strong>{roleLabel(userRole)}</strong>
            </div>
            <div className="meta-row">
              <span>Среднемесячная выручка</span>
              <strong>{formatMoney(company.monthly_revenue_alfa)} · из выписки</strong>
            </div>
          </div>
        </form>

        <aside className="figma-panel figma-panel-sm">
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "flex-start" }}>
            <div>
              <div className="figma-panel-title">Нагрузка по платежу</div>
              <div className="pay-figure">≈ {formatMoney(loadPreview.roughPayment)}</div>
            </div>
            <span className={`pill ${paymentIsHigh ? "pill-warn" : "pill-good"}`}>
              {paymentIsHigh ? "Платёж выше безопасного" : "Платёж безопасен"}
            </span>
          </div>

          <div className="load-bars">
            <div className="load-bar">
              <span>Безопасный средний за год</span>
              <span>до {formatMoney(loadPreview.maxPayment)}</span>
              <div className="track">
                <div
                  className="fill"
                  style={{ width: `${Math.min(100, (loadPreview.maxPayment / maxBar) * 100)}%` }}
                />
              </div>
            </div>
            <div className="load-bar warn">
              <span>Безопасный в июле–августе</span>
              <span>до {formatMoney(loadPreview.seasonal)}</span>
              <div className="track">
                <div
                  className="fill"
                  style={{ width: `${Math.min(100, (loadPreview.seasonal / maxBar) * 100)}%` }}
                />
              </div>
            </div>
            <div className="load-bar risk">
              <span>Ваш платёж</span>
              <span>{formatMoney(loadPreview.roughPayment)}</span>
              <div className="track">
                <div
                  className="fill"
                  style={{ width: `${Math.min(100, (loadPreview.roughPayment / maxBar) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          <ul style={{ margin: "14px 0 0", paddingLeft: 18, color: "var(--text-secondary)", fontSize: 13, lineHeight: 1.45 }}>
            <li>Летом выручка кофеен ниже на ~31% — платёж съест свободный поток.</li>
            <li>
              Рядом {company.competitors_count || 9} кофеен · запас прочности небольшой при падении
              трафика.
            </li>
          </ul>

          <div className="figma-offer-card" style={{ marginTop: 16 }}>
            <strong>Безопасный вариант</strong>
            <p>
              {collateralType === "NONE"
                ? "1 200 000 ₽ на 24 мес. ≈ 59 900 ₽ / мес."
                : "Либо оставьте полную сумму с залогом и отправьте её на рассмотрение."}
            </p>
            {searchResult?.credit_badge && (
              <p style={{ marginBottom: 12 }}>
                Ставка поиска: {formatPercent(searchResult.credit_badge.rate_pct)}
              </p>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <button type="button" className="btn btn-primary btn-block" disabled={isBusy} onClick={chooseSafe}>
                Выбрать безопасный вариант
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-block"
                disabled={isBusy}
                onClick={(event) => {
                  event.preventDefault();
                  const form = document.querySelector("form.figma-panel") as HTMLFormElement | null;
                  form?.requestSubmit();
                }}
              >
                {collateralType === "NONE"
                  ? `Отправить ${formatMoney(amount)} на рассмотрение`
                  : `Отправить ${formatMoney(amount)} под залог`}
              </button>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
