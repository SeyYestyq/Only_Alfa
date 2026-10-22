import { useState } from "react";
import { BankEmptyState, EffectSkeleton } from "../../components/Skeleton";
import { useApp } from "../../state/AppState";

/** Б5 — Эффект кредитного кабинета (copy 8 + состояния copy 14). */
export function EffectScreen() {
  const { isReady, companies } = useApp();
  const [period, setPeriod] = useState<"october" | "quarter">("october");

  if (!isReady || companies.length === 0) {
    return <EffectSkeleton />;
  }

  if (period === "quarter") {
    return (
      <>
        <div className="figma-eyebrow">Малый бизнес · Москва · октябрь 2026 · демо-данные</div>
        <h1 className="figma-h1" style={{ fontSize: 32, lineHeight: "40px" }}>
          Эффект кредитного кабинета
        </h1>
        <p className="figma-lead">
          Сравнение с классическим конвейером МСП. Все цифры — синтетические демо-данные, согласованы с BRD
          v3.3.
        </p>
        <div className="bank-filters" style={{ marginTop: 16 }}>
          <button type="button" className="bank-chip" onClick={() => setPeriod("october")}>
            Октябрь
          </button>
          <button type="button" className="bank-chip active" onClick={() => setPeriod("quarter")}>
            Квартал
          </button>
        </div>
        <BankEmptyState
          title="За период нет данных"
          text="Метрики появятся после первых 30 заявок через кабинет."
        />
      </>
    );
  }

  return (
    <>
      <div className="figma-eyebrow">Малый бизнес · Москва · октябрь 2026 · демо-данные</div>
      <h1 className="figma-h1" style={{ fontSize: 32, lineHeight: "40px" }}>
        Эффект кредитного кабинета
      </h1>
      <p className="figma-lead">
        Сравнение с классическим конвейером МСП. Все цифры — синтетические демо-данные, согласованы с BRD
        v3.3.
      </p>

      <div className="bank-filters" style={{ marginTop: 16 }}>
        <button type="button" className="bank-chip active" onClick={() => setPeriod("october")}>
          Октябрь
        </button>
        <button type="button" className="bank-chip" onClick={() => setPeriod("quarter")}>
          Квартал
        </button>
      </div>

      <section className="figma-panel figma-panel-sm" style={{ marginTop: 16 }}>
        <div className="figma-panel-title">Сигналы → предложения → выдачи</div>
        <div className="figma-panel-heading">61 выдача на 38,6 млн ₽ из 412 сигналов</div>
        <div className="funnel">
          {[
            ["Сигналы в платежах", "412"],
            ["Предложения отправлены", "268 · 65%"],
            ["Просмотрены клиентом", "191 · 71%"],
            ["Приняты → заявка", "74 · 39%"],
            ["Выдано (FUNDED)", "61 · 82%"],
          ].map(([label, value]) => (
            <div key={label} className="funnel-row">
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
      </section>

      <div className="figma-grid-2" style={{ marginTop: 16 }}>
        <section className="figma-panel figma-panel-sm">
          <div className="figma-panel-title">Доля сигналов по типам</div>
          <ul className="check-list" style={{ marginTop: 12 }}>
            <li>37% · TRG_CAPEX_EXP · оборудование</li>
            <li>29% · Кассовый разрыв</li>
            <li>18% · Сезонный спад</li>
            <li>16% · Госконтракт / B2B</li>
          </ul>
        </section>
        <section className="figma-panel figma-panel-sm">
          <div className="figma-panel-title">Время инспектора на заявку</div>
          <div className="score-hero">
            <strong>186 ч</strong>
            <span className="muted">сэкономлено за октябрь · 338 заявок</span>
          </div>
          <div className="kv-list">
            <div className="meta-row">
              <span>Классический конвейер</span>
              <strong>42 мин</strong>
            </div>
            <div className="meta-row">
              <span>Умный кабинет</span>
              <strong>9 мин</strong>
            </div>
          </div>
        </section>
      </div>

      <div className="figma-grid-2" style={{ marginTop: 16 }}>
        <section className="figma-panel figma-panel-sm">
          <div className="figma-panel-title">Встречные предложения</div>
          <div className="figma-panel-heading">96 выдано · 23 приняты вместо отказа</div>
          <ul className="check-list" style={{ marginTop: 12 }}>
            <li>41% · Меньше сумма, дольше срок</li>
            <li>27% · Лестница лимитов</li>
            <li>19% · Платёж от выручки</li>
            <li>13% · Оплата поставщику / лизинг</li>
          </ul>
        </section>
        <section className="figma-panel figma-panel-sm">
          <div className="figma-panel-title">Решения Decision Engine</div>
          <div className="figma-panel-heading">338 заявок за октябрь</div>
          <div className="decision-bars">
            {[
              ["APPROVED", 52, "pill-good"],
              ["COUNTER_OFFER", 28, "pill-warn"],
              ["MANUAL_REVIEW", 12, "pill-neutral"],
              ["REJECTED", 8, "pill-risk"],
            ].map(([label, pct, tone]) => (
              <div key={label as string} className="decision-bar">
                <div className="meta-row" style={{ border: "none", padding: 0 }}>
                  <span className={`pill ${tone}`}>{label}</span>
                  <strong>{pct}%</strong>
                </div>
                <div className="track">
                  <div className="fill" style={{ width: `${pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
