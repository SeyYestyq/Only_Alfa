import { BankEmptyState, SignalSkeleton } from "../../components/Skeleton";
import { useApp } from "../../state/AppState";
import { formatMoney } from "../../utils/format";

const CAPEX_ROWS = [
  { date: "02.10", purpose: "Предоплата: ростер Giesen W6A", counterparty: "ООО «Кофе-Техника» · ИНН 7716482315", amount: 186_000 },
  { date: "09.10", purpose: "Кофемолка Mahlkönig EK43", counterparty: "ООО «Кофе-Техника» · ИНН 7716482315", amount: 142_600 },
  { date: "16.10", purpose: "Монтаж и пусконаладка", counterparty: "ООО «Кофе-Техника» · ИНН 7716482315", amount: 90_000 },
];

/** Б2 — Сигнал в платежах (copy 5 + состояния copy 11–12). */
export function SignalScreen() {
  const { dashboard, goToScreen, isBusy } = useApp();

  if (isBusy && !dashboard) {
    return <SignalSkeleton />;
  }

  if (!dashboard) {
    return (
      <BankEmptyState
        title="Новых сигналов нет"
        text="Система проверяет платежи клиентов каждые 15 минут. Последняя проверка — 23:30."
      />
    );
  }

  const company = dashboard.company;
  const capex = dashboard.radar_triggers.find((t) => t.code.includes("CAPEX"));
  const total = CAPEX_ROWS.reduce((sum, row) => sum + row.amount, 0);
  const hasSignals = dashboard.radar_triggers.length > 0;

  if (!hasSignals && !isBusy) {
    return (
      <>
        <div className="figma-eyebrow">Сигналы · {company.name}</div>
        <h1 className="figma-h1" style={{ fontSize: 32, lineHeight: "40px" }}>
          Сигналы
        </h1>
        <BankEmptyState
          title="Новых сигналов нет"
          text="Система проверяет платежи клиентов каждые 15 минут. Последняя проверка — 23:30."
        />
      </>
    );
  }

  return (
    <>
      <div className="figma-eyebrow">
        Сигналы · {company.name} · {capex?.code ?? "TRG_CAPEX_EXP"}
      </div>
      <h1 className="figma-h1" style={{ fontSize: 32, lineHeight: "40px" }}>
        Клиент покупает оборудование
      </h1>
      <p className="figma-lead">
        За 15 дней — три платежа поставщику кофейного оборудования. Остаток на счёте снизился на 57%.
      </p>

      <div className="figma-grid-2" style={{ marginTop: 24 }}>
        <section className="figma-panel figma-panel-sm">
          <div className="figma-panel-title">Платежи поставщику</div>
          <table className="ops-table" style={{ marginTop: 12 }}>
            <thead>
              <tr>
                <th>Дата</th>
                <th>Назначение</th>
                <th className="ops-amount">Сумма</th>
              </tr>
            </thead>
            <tbody>
              {CAPEX_ROWS.map((row) => (
                <tr key={row.date + row.purpose}>
                  <td className="muted">{row.date}</td>
                  <td>
                    {row.purpose}
                    <div className="muted" style={{ fontSize: 12 }}>
                      {row.counterparty}
                    </div>
                  </td>
                  <td className="ops-amount">{formatMoney(row.amount)}</td>
                </tr>
              ))}
              <tr>
                <td colSpan={2}>
                  <strong>Итого за 15 дней</strong>
                </td>
                <td className="ops-amount">
                  <strong>{formatMoney(total)}</strong>
                </td>
              </tr>
            </tbody>
          </table>
          <div className="kv-list" style={{ marginTop: 16 }}>
            <div className="meta-row">
              <span>Остаток 01.10</span>
              <strong>728 000 ₽</strong>
            </div>
            <div className="meta-row">
              <span>Остаток 21.10</span>
              <strong>310 000 ₽</strong>
            </div>
            <div className="meta-row">
              <span>Свободный поток</span>
              <strong>260 000 ₽ / мес.</strong>
            </div>
          </div>
        </section>

        <aside className="figma-offer-card" style={{ marginTop: 0 }}>
          <div className="figma-panel-title">Система рекомендует</div>
          <strong style={{ marginTop: 8 }}>Кредит на развитие бизнеса</strong>
          <div className="offer-metrics" style={{ marginTop: 12 }}>
            <div>
              <span>Сумма</span>
              <strong>900 000 ₽</strong>
            </div>
            <div>
              <span>Платёж</span>
              <strong>≈ 44 930 ₽</strong>
            </div>
            <div>
              <span>Срок</span>
              <strong>24 мес.</strong>
            </div>
            <div>
              <span>Ставка</span>
              <strong>18,0% · КС 14 + 1,5 + 2,5</strong>
            </div>
          </div>
          <p>Безопасный платёж до 110 500 ₽. Платёж — 41% от безопасного: запас на низкий сезон.</p>
          <ul className="check-list">
            <li>Оборудование уже частично оплачено — деньги нужны на остаток и оборотку</li>
            <li>Альфа-Лизинг оборудования · аванс от 0%</li>
            <li>Овердрафт 300 000 ₽ закрывает разрыв 26–30 ноября</li>
          </ul>
          <p className="muted" style={{ fontSize: 12, margin: "12px 0" }}>
            Клиент увидит предложение на главной и в чате. Действует 14 дней.
          </p>
          <button type="button" className="btn btn-primary btn-block" onClick={() => goToScreen("bank-messages")}>
            Отправить предложение клиенту
          </button>
        </aside>
      </div>

      <section className="figma-panel figma-panel-sm" style={{ marginTop: 16 }}>
        <div className="figma-panel-title">Статусы предложения</div>
        <ul className="status-track">
          <li className="done">
            <i />
            <span>Сформирован системой</span>
            <span className="mono faint">18.10 · 10:12</span>
          </li>
          <li className="done">
            <i />
            <span>Клиент получил уведомление</span>
            <span className="mono faint">18.10 · 10:12</span>
          </li>
          <li className="now">
            <i />
            <span>Бухгалтер открыл карточку</span>
            <span className="mono faint">18.10 · 12:40</span>
          </li>
          <li>
            <i />
            <span>Создана заявка / отказ / истекло</span>
            <span className="mono faint">—</span>
          </li>
        </ul>
      </section>
    </>
  );
}
