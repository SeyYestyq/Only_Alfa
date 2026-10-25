import type { CashForecast, ProductType, RadarTrigger } from "../api/types";
import { formatMoney } from "../utils/format";

interface LiquidityOfferBannerProps {
  forecast: CashForecast;
  triggers: RadarTrigger[];
  paymentAmount: number | null;
  accountBalance: number;
  onRequest: (product: ProductType, termMonths: number) => void;
  disabled?: boolean;
}

/**
 * Показывает предложение овердрафта/кредита, если бэкенд уже зафиксировал
 * кассовый разрыв или радарный триггер. Суммы и решение — только с API.
 */
export function LiquidityOfferBanner({
  forecast,
  triggers,
  paymentAmount,
  accountBalance,
  onRequest,
  disabled,
}: LiquidityOfferBannerProps) {
  const cashGapTrigger = triggers.find((item) => item.code === "TRG_CASH_GAP");
  const isTight =
    forecast.has_gap
    || Boolean(cashGapTrigger)
    || (paymentAmount !== null && paymentAmount > accountBalance);

  if (!isTight) {
    return null;
  }

  const gapDepth = forecast.min_balance_rub < 0 ? Math.abs(forecast.min_balance_rub) : 0;
  const reason = cashGapTrigger?.value
    ?? (forecast.has_gap
      ? `Прогноз кассы: минимум ${formatMoney(forecast.min_balance_rub)} на день ${forecast.min_day}`
      : "Сумма платежа превышает остаток на счёте — возможен кассовый разрыв перед ФОТ");

  return (
    <div className="liquidity-offer" role="status">
      <div className="liquidity-offer-copy">
        <div className="liquidity-offer-eyebrow">Банк видит риск кассового разрыва</div>
        <h3 className="liquidity-offer-title">Овердрафт на короткий срок</h3>
        <p className="liquidity-offer-text">
          {reason}. Можно закрыть разрыв овердрафтом: при поступлении выручки банк спишет
          использованную сумму. Глубина минуса в прогнозе: {formatMoney(gapDepth || paymentAmount || 0)}.
        </p>
        {cashGapTrigger && (
          <p className="liquidity-offer-hint">{cashGapTrigger.action_label}</p>
        )}
      </div>
      <div className="liquidity-offer-actions">
        <button
          type="button"
          className="btn btn-primary"
          disabled={disabled}
          onClick={() => onRequest("OVERDRAFT", 3)}
        >
          Запросить овердрафт
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          disabled={disabled}
          onClick={() => onRequest("VKL", 12)}
        >
          Смотреть кредитную линию
        </button>
      </div>
    </div>
  );
}
