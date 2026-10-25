import { BALANCE_BEFORE_EQUIPMENT } from "../domain-ui/caseScript";
import { formatMoney } from "../utils/format";

export const CAPEX_PAYMENT_ROWS = [
  {
    date: "02.10",
    purpose: "Предоплата: ростер Giesen W6A",
    counterparty: "ООО «Кофе-Техника» · ИНН 7716482315",
    amount: 186_000,
  },
  {
    date: "09.10",
    purpose: "Кофемолка Mahlkönig EK43",
    counterparty: "ООО «Кофе-Техника» · ИНН 7716482315",
    amount: 142_600,
  },
  {
    date: "16.10",
    purpose: "Монтаж и пусконаладка",
    counterparty: "ООО «Кофе-Техника» · ИНН 7716482315",
    amount: 90_000,
  },
] as const;

const OFFER_STATUSES = [
  { label: "Сформирован системой, можно изменить", tone: "idle" as const },
  { label: "18.10 · 10:12 · клиент получил уведомление", tone: "done" as const },
  { label: "18.10 · 12:40 · бухгалтер открыл карточку", tone: "now" as const },
  { label: "Создана заявка № 2026-10-0417", tone: "idle" as const },
  { label: "Клиент указал причину: «нужна сумма больше»", tone: "idle" as const },
  { label: "Через 14 дней без ответа", tone: "faint" as const },
];

interface BankCapexSignalPanelProps {
  onSendOffer?: () => void;
  showStatuses?: boolean;
}

/** Макет Figma «Сигнал CAPEX»: платежи слева, рекомендация справа (без верхней панели). */
export function BankCapexSignalPanel({
  onSendOffer,
  showStatuses = true,
}: BankCapexSignalPanelProps) {
  const total = CAPEX_PAYMENT_ROWS.reduce((sum, row) => sum + row.amount, 0);

  return (
    <div className="signal-figma">
      <div className="signal-figma-grid">
        <section className="figma-panel figma-panel-sm signal-payments">
          <h2 className="figma-h3 signal-panel-heading">Платежи поставщику</h2>
          <table className="ops-table signal-pay-table">
            <thead>
              <tr>
                <th>Дата</th>
                <th>Назначение</th>
                <th className="ops-amount">Сумма</th>
              </tr>
            </thead>
            <tbody>
              {CAPEX_PAYMENT_ROWS.map((row) => (
                <tr key={row.date + row.purpose}>
                  <td className="mono muted">{row.date}</td>
                  <td>
                    <div className="signal-pay-purpose">{row.purpose}</div>
                    <div className="muted" style={{ fontSize: 13 }}>
                      {row.counterparty}
                    </div>
                  </td>
                  <td className="ops-amount">{formatMoney(row.amount)}</td>
                </tr>
              ))}
              <tr className="signal-pay-total">
                <td colSpan={2}>
                  <strong>Итого за 15 дней</strong>
                </td>
                <td className="ops-amount">
                  <strong>{formatMoney(total)}</strong>
                </td>
              </tr>
            </tbody>
          </table>

          <div className="signal-balance-row">
            <div>
              <span>Остаток 01.10</span>
              <strong>{formatMoney(BALANCE_BEFORE_EQUIPMENT)}</strong>
            </div>
            <div>
              <span>Остаток 21.10</span>
              <strong className="amber">310 000 ₽</strong>
            </div>
            <div>
              <span>Свободный поток</span>
              <strong>260 000 ₽ / мес.</strong>
            </div>
          </div>
        </section>

        <aside className="figma-panel figma-panel-sm signal-recommend">
          <div className="figma-panel-title">Система рекомендует</div>
          <h2 className="figma-h3 signal-panel-heading">Кредит на развитие бизнеса</h2>

          <div className="signal-offer-hero">
            <div>
              <span>Сумма</span>
              <strong>900 000 ₽</strong>
            </div>
            <div>
              <span>Платёж</span>
              <strong>≈ 44 930 ₽</strong>
            </div>
          </div>

          <div className="signal-offer-rows">
            <div>
              <span>Срок</span>
              <strong>24 мес.</strong>
            </div>
            <div>
              <span>Ставка</span>
              <strong>18,0% · КС 14 + 1,5 + 2,5</strong>
            </div>
            <div>
              <span>Безопасный платёж</span>
              <strong>до 110 500 ₽</strong>
            </div>
          </div>

          <ul className="signal-bullets">
            <li>
              <i className="is-good" />
              <span>Платёж — 41% от безопасного: запас на низкий сезон</span>
            </li>
            <li>
              <i />
              <span>Оборудование уже частично оплачено — деньги нужны на остаток и оборотку</span>
            </li>
          </ul>

          <div className="figma-panel-title" style={{ marginTop: 8 }}>
            Другие варианты
          </div>
          <div className="signal-alt-list">
            <div className="signal-alt-card">
              <strong>Альфа-Лизинг оборудования</strong>
              <span>ростер как предмет лизинга, аванс от 0%</span>
            </div>
            <div className="signal-alt-card">
              <strong>Овердрафт 300 000 ₽</strong>
              <span>закрывает разрыв 26–30 ноября</span>
            </div>
          </div>

          {onSendOffer ? (
            <button type="button" className="btn btn-primary primary-cta" onClick={onSendOffer}>
              Отправить предложение клиенту
            </button>
          ) : null}

          <p className="signal-footnote">
            Клиент увидит его на главной и в чате. Предложение действует 14 дней.
          </p>
        </aside>
      </div>

      {showStatuses ? (
        <section className="figma-panel figma-panel-sm signal-statuses">
          <div className="signal-statuses-head">
            <h2 className="figma-h3 signal-panel-heading">Статусы предложения</h2>
            <span className="muted">Видны инспектору в карточке клиента</span>
          </div>
          <div className="signal-status-cards">
            {OFFER_STATUSES.map((item) => (
              <div key={item.label} className={`signal-status-card tone-${item.tone}`}>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
