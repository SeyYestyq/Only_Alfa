import { useState } from "react";
import { Stepper } from "../../components/v2/Stepper";
import {
  APPLY_PRESET,
  ROSTERS_OFFER_AMOUNT,
  ROSTERS_OFFER_TERM,
  ROSTERS_SAFE_PAYMENT,
  ROSTERS_SUMMER_SAFE,
} from "../../domain-ui/caseScript";
import { useApp } from "../../state/AppState";
import { formatAge, formatMoney, formatPercent, roughAnnuity } from "../../utils/format";

export function ClientApply() {
  const { dashboard, createApplication, isBusy, goToScreen } = useApp();
  const preset = APPLY_PRESET[dashboard?.company.demo_key ?? ""] ?? APPLY_PRESET.rosters;
  const [amount, setAmount] = useState(preset.amount);
  const [term, setTerm] = useState(preset.term);
  const [source, setSource] = useState<"own" | "offer">("own");
  const [consent, setConsent] = useState(true);
  const company = dashboard?.company;
  const isRosters = company?.demo_key === "rosters";
  const payment = roughAnnuity(amount, term, isRosters ? 0.18 : 0.18);
  const safe = isRosters ? ROSTERS_SAFE_PAYMENT : null;
  const ratio = safe ? payment / safe : null;
  const hot = ratio !== null && ratio > 1.3;

  if (!company) {
    return null;
  }

  const director = company.users.find((user) => user.role === "CEO_OWNER" || user.role === "IP_OWNER");
  const changed = isRosters && amount !== ROSTERS_OFFER_AMOUNT;

  return (
    <>
      <div className="v2-crumb">Кредит / Заявка</div>
      <h1 className="v2-h1">Заявка</h1>
      <p className="v2-lead">Сумма, срок и платёж</p>
      <div className="v2-period" role="group" aria-label="Откуда сумма">
        <button type="button" className={source === "own" ? "on" : ""} onClick={() => setSource("own")}>
          Своя сумма
        </button>
        <button
          type="button"
          className={source === "offer" ? "on" : ""}
          onClick={() => {
            setSource("offer");
            setAmount(isRosters ? ROSTERS_OFFER_AMOUNT : preset.amount);
            setTerm(isRosters ? ROSTERS_OFFER_TERM : preset.term);
          }}
        >
          По предложению банка
        </button>
        <button type="button" onClick={() => goToScreen("invoice")}>По счёту поставщика</button>
      </div>
      <Stepper active={1} />
      <div className="v2-split case">
        <div>
          <section className="v2-card">
            <h2 title="Данные компании, обороты и цель уже заполнены из операций">Сумма и срок</h2>
            <div className="v2-row" style={{ marginTop: 16 }}>
              <div>
                <div className="v2-kpi-label">Сумма</div>
                <div className="v2-amount">{formatMoney(amount)}</div>
                {changed ? <span className="v2-pill warn">изменено с {formatMoney(ROSTERS_OFFER_AMOUNT)}</span> : null}
              </div>
              <div className="v2-terms">
                {[6, 12, 24, 36].map((months) => (
                  <button key={months} type="button" className={term === months ? "on" : ""} onClick={() => setTerm(months)}>
                    {months} мес.
                  </button>
                ))}
              </div>
            </div>
            <input
              className="v2-slider"
              type="range"
              min={300_000}
              max={Math.max(preset.amount, 2_500_000)}
              step={50_000}
              value={amount}
              onChange={(event) => {
                setSource("own");
                setAmount(Number(event.target.value));
              }}
            />
            <p className="v2-muted">Цель · из выписки</p>
            <p>{preset.purpose}</p>
          </section>

          <section className="v2-card" style={{ marginTop: 12 }}>
            <div className="v2-row">
              <h2>Платёж</h2>
              {hot ? <span className="v2-pill warn">платёж выше безопасного в {ratio?.toFixed(1).replace(".", ",")} раза</span> : <span className="v2-pill good">ориентир</span>}
            </div>
            {safe ? (
              <p className="v2-muted" title="Ориентир до ответа банка. Точный платёж придёт в решении">
                Безопасный платёж сейчас {formatMoney(safe)}, летом {formatMoney(ROSTERS_SUMMER_SAFE)}.
              </p>
            ) : null}
            <div className="v2-row" style={{ marginTop: 10 }}>
              <span>Ваш платёж · {formatPercent(18, 0)}</span>
              <strong>≈ {formatMoney(payment)} / мес</strong>
            </div>
            <div className={`v2-bar ${hot ? "bad" : "good"}`}>
              <span style={{ width: `${Math.min(100, safe ? (payment / (safe * 2.2)) * 100 : 40)}%` }} />
            </div>
            {safe ? (
              <>
                <div className="v2-check"><span>Безопасный платёж (контроль движка)</span><strong>{formatMoney(safe)} / мес</strong></div>
                <div className="v2-check"><span>Безопасный платёж в июле–августе, прогноз</span><strong>{formatMoney(ROSTERS_SUMMER_SAFE)} / мес</strong></div>
              </>
            ) : null}
            <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
              <button type="button" className="v2-btn" onClick={() => { setAmount(1_200_000); setTerm(24); }}>1 200 000 ₽ · 24 мес.</button>
              <button type="button" className="v2-btn" onClick={() => { setAmount(2_500_000); setTerm(36); }}>Лизинг 36 мес.</button>
              <button type="button" className="v2-btn" onClick={() => { setAmount(ROSTERS_OFFER_AMOUNT); setTerm(24); }}>900 000 ₽ · как в предложении</button>
            </div>
          </section>
        </div>

        <div>
          <section className="v2-card">
            <div className="v2-row">
              <h2>Готовность</h2>
              <span className="v2-pill">{consent ? "4 из 5" : "3 из 5"}</span>
            </div>
            <div className="v2-check"><span>Данные компании</span><strong>ЕГРЮЛ, {formatAge(company.age_months)}</strong></div>
            <div className="v2-check"><span>Обороты за 12 мес.</span><strong>{formatMoney(company.monthly_revenue_alfa)} / мес</strong></div>
            <div className="v2-check"><span>Цель и счёт</span><strong>из выписки</strong></div>
            <label className="v2-check">
              <span>Согласие на проверку в БКИ</span>
              <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} />
            </label>
            <div className="v2-check">
              <span>Подписант</span>
              <strong>{director?.full_name ?? "руководитель"} подпишет после решения</strong>
            </div>
            <div className="v2-check"><span>Сумма</span><strong>{formatMoney(amount)}</strong></div>
            <div className="v2-check"><span>Срок</span><strong>{term} мес.</strong></div>
            <div className="v2-check"><span>Ставка, формула</span><strong>ключ + продукт + риск</strong></div>
            <button
              type="button"
              className="v2-btn primary wide"
              style={{ marginTop: 12 }}
              disabled={!consent || isBusy}
              onClick={() => void createApplication({
                product_type: preset.product,
                requested_amount_rub: amount,
                term_months: term,
                declared_monthly_revenue: company.declared_monthly_revenue,
              }, "decision")}
            >
              {isBusy ? "Отправляем…" : "Отправить в банк"}
            </button>
            <p className="v2-note">Дальше — проверки и скоринг. Статус появится здесь и у инспектора.</p>
            <button type="button" className="v2-link" onClick={() => goToScreen("home")}>На главную</button>
          </section>
        </div>
      </div>
    </>
  );
}
