import type { Xray } from "../api/types";
import { formatMoney, formatPercent } from "../utils/format";

type BankDealEconomicsProps = {
  xray: Xray | null;
  productLabel: string;
};

/**
 * Экономика сделки + ценность PDF/кассы для инспектора (BRD Экран 3).
 */
export function BankDealEconomics({ xray, productLabel }: BankDealEconomicsProps) {
  const pnl = xray?.bank_pnl;

  return (
    <section className="bank-deal-econ">
      <div className="bank-deal-econ-head">
        <div>
          <div className="figma-panel-title" title={`${productLabel} · доход, риск и маржа до выдачи`}>Экономика сделки</div>
        </div>
        {pnl ? (
          <span className={`status-tag ${pnl.margin_pct >= 8 ? "is-good" : pnl.margin_pct >= 4 ? "is-warn" : "is-risk"}`}>
            Маржа {formatPercent(pnl.margin_pct, 1)}
          </span>
        ) : (
          <span className="status-tag is-info">Считаем…</span>
        )}
      </div>

      {pnl ? (
        <div className="limit-trio bank-deal-trio">
          <div>
            <span>Процентный доход</span>
            <strong>{formatMoney(pnl.expected_interest_income_rub)}</strong>
          </div>
          <div>
            <span>Стоимость риска (PD)</span>
            <strong>{formatMoney(pnl.risk_cost_rub)}</strong>
          </div>
          <div>
            <span>Маржа / LTV</span>
            <strong>
              {formatMoney(pnl.expected_margin_rub)} · {formatMoney(pnl.ltv_rub)}
            </strong>
          </div>
        </div>
      ) : (
        <p className="muted" style={{ fontSize: 13 }}>
          Откройте заявку — система посчитает доход, фондирование, PD и маржу.
        </p>
      )}

      <div className="bank-value-cards">
        <article>
          <h3>PDF-счёт → целевое назначение</h3>
          <p>
            ИНН поставщика и сумма из счёта снижают риск нецелевого использования. Антифрод видит, кому
            уходят деньги до выдачи.
          </p>
        </article>
        <article>
          <h3>Прогноз кассы 60 дней</h3>
          <p>
            Красная зона разрыва показывает, выдержит ли клиент платёж в низкий сезон — до того, как банк
            зафиксирует NPL.
          </p>
        </article>
        {pnl ? (
          <article>
            <h3>Вероятность одобрения</h3>
            <p>
              Экранная оценка ≈ {pnl.approval_probability_pct}% при текущем RiskScore. Не заменяет решение
              инспектора.
            </p>
          </article>
        ) : null}
      </div>
    </section>
  );
}
