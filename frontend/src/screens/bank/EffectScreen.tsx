import { useState } from "react";
import { BankPnlStrip } from "../../components/BankPnlStrip";
import { BankEmptyState, EffectSkeleton } from "../../components/Skeleton";
import { useApp } from "../../state/AppState";

/** Б5 — Эффект / P&L кабинета для банка (BRD Экран 3). */
export function EffectScreen() {
  const { isReady, companies } = useApp();
  const [period, setPeriod] = useState<"october" | "quarter">("october");

  if (!isReady || companies.length === 0) {
    return <EffectSkeleton />;
  }

  return (
    <>
      <div className="bank-page-head">
        <div>
          <div className="figma-eyebrow">Показатели · МСП · демо BRD</div>
          <h1 className="figma-h1">Показатели банка</h1>
          <p className="figma-lead">
            Time-to-Yes, спасённые заявки и время инспектора — то, что жюри смотрит на защите.
          </p>
        </div>
        <div className="bank-filters">
          <button
            type="button"
            className={`bank-chip ${period === "october" ? "active" : ""}`}
            onClick={() => setPeriod("october")}
          >
            Октябрь
          </button>
          <button
            type="button"
            className={`bank-chip ${period === "quarter" ? "active" : ""}`}
            onClick={() => setPeriod("quarter")}
          >
            Квартал
          </button>
        </div>
      </div>

      <BankPnlStrip variant="full" />

      {period === "quarter" ? (
        <BankEmptyState
          title="За период нет данных"
          text="Метрики появятся после первых 30 заявок через кабинет. Октябрь уже заполнен демо-цифрами."
        />
      ) : (
        <>
          <section className="figma-panel figma-panel-sm" style={{ marginTop: 16 }}>
            <div className="figma-panel-title">Воронка: сигнал → выдача</div>
            <div className="figma-panel-heading">61 выдача на 38,6 млн ₽ из 412 сигналов</div>
            <div className="funnel">
              {[
                ["Сигналы в платежах", "412"],
                ["Предложения отправлены", "268 · 65%"],
                ["Клиент посмотрел", "191 · 71%"],
                ["Создана заявка", "74 · 39%"],
                ["Выдано", "61 · 82%"],
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
              <div className="figma-panel-title">Типы сигналов</div>
              <ul className="check-list" style={{ marginTop: 12 }}>
                <li>37% · Оборудование</li>
                <li>29% · Кассовый разрыв</li>
                <li>18% · Сезонный спад</li>
                <li>16% · Госконтракт / B2B</li>
              </ul>
            </section>
            <section className="figma-panel figma-panel-sm">
              <div className="figma-panel-title">Время инспектора</div>
              <div className="score-hero">
                <strong>186 ч</strong>
                <span className="muted">сэкономлено · 338 заявок</span>
              </div>
              <div className="kv-list">
                <div className="meta-row">
                  <span>Было (конвейер)</span>
                  <strong>42 мин</strong>
                </div>
                <div className="meta-row">
                  <span>Стало (кабинет)</span>
                  <strong>9 мин</strong>
                </div>
                <div className="meta-row">
                  <span>Ранний NPL</span>
                  <strong className="green">ниже за счёт MaxPayment</strong>
                </div>
              </div>
            </section>
          </div>

          <div className="figma-grid-2" style={{ marginTop: 16 }}>
            <section className="figma-panel figma-panel-sm">
              <div className="figma-panel-title">Встречные предложения · +24%</div>
              <div className="figma-panel-heading">96 выдано · 23 приняты вместо отказа</div>
              <ul className="check-list" style={{ marginTop: 12 }}>
                <li>41% · Меньше сумма, дольше срок</li>
                <li>27% · Лестница лимитов</li>
                <li>19% · Платёж от выручки / эквайринг</li>
                <li>13% · Оплата поставщику / лизинг</li>
              </ul>
            </section>
            <section className="figma-panel figma-panel-sm">
              <div className="figma-panel-title">Итог решений</div>
              <div className="figma-panel-heading">338 заявок за октябрь</div>
              <div className="decision-bars">
                {[
                  ["Одобрено", 52, "pill-good"],
                  ["Встречное", 28, "pill-warn"],
                  ["Ручная проверка", 12, "pill-neutral"],
                  ["Отказ", 8, "pill-risk"],
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
      )}
    </>
  );
}
