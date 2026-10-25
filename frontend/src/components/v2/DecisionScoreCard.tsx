import type { Application } from "../../api/types";
import { getCorridor, scoreCorridorLabel } from "../RiskScoreGauge";
import { formatMoney } from "../../utils/format";

const SCORE_MAX = 1000;

export interface DecisionNextStep {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}

interface DecisionScoreCardProps {
  application: Application;
  onInspect?: () => void;
  next?: DecisionNextStep;
}

/** Итог оценки на решении клиента: балл, лимит и один статус, без второй пустой карточки. */
export function DecisionScoreCard({ application, onInspect, next }: DecisionScoreCardProps) {
  const score = application.risk_score;
  const corridor = getCorridor(score);
  const tone = corridor.code === "GREEN" ? "good" : corridor.code === "YELLOW" ? "warn" : "bad";
  const fill = Math.max(0, Math.min(100, (score / SCORE_MAX) * 100));
  const counter = application.status === "COUNTER_OFFER";

  return (
    <section className="v2-score-card">
      <div className="v2-score-grid">
        <div className="v2-score-meter">
          <div className="v2-score-num">{score}</div>
          <div className="v2-score-of">из {SCORE_MAX}</div>
          <div className={`v2-score-track ${tone}`} aria-hidden="true">
            <span style={{ width: `${fill}%` }} />
          </div>
        </div>
        <div className="v2-score-copy">
          <div className="v2-score-head">
            <strong>Итог кредитной оценки</strong>
            <span className={`v2-pill ${tone}`}>{scoreCorridorLabel(score)}</span>
            <span className="v2-pill">{application.status_label}</span>
          </div>
          <p className="v2-score-reason">{verdict(application)}</p>
          <div className="v2-score-facts">
            <div>
              <span>Запрошено</span>
              <strong>{formatMoney(application.requested_amount_rub)}</strong>
            </div>
            <div>
              <span>Лимит</span>
              <strong>{formatMoney(application.limit_rub)}</strong>
            </div>
            <div>
              <span>Срок</span>
              <strong>{application.term_months} мес.</strong>
            </div>
            <div>
              <span>{counter ? "Платёж по запросу" : "Платёж"}</span>
              <strong>≈ {formatMoney(application.monthly_payment_rub)}</strong>
            </div>
          </div>
        </div>
        {onInspect ? (
          <button type="button" className="v2-btn" onClick={onInspect}>
            Что проверяли
          </button>
        ) : null}
      </div>
      {next ? (
        <div className="v2-score-next">
          <div>
            <div className="v2-kicker">Следующий шаг</div>
            <strong>{next.title}</strong>
          </div>
          {next.actionLabel && next.onAction ? (
            <button type="button" className="v2-btn" onClick={next.onAction}>
              {next.actionLabel}
            </button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function verdict(application: Application): string {
  if (application.status === "COUNTER_OFFER") {
    return "Клиент надёжный, но запрошенная сумма выше сезонной кассы — банк предлагает меньший лимит и другие варианты.";
  }
  if (application.status === "APPROVED" || application.status === "AWAITING_CEO_APPROVAL") {
    return "Сумма проходит по кассе. Дальше — подпись договора.";
  }
  if (application.status === "FUNDED") {
    return "Договор подписан, деньги зачислены на счёт.";
  }
  if (application.status === "REJECTED") {
    return application.hard_stop_reason || "Сейчас выдать эту сумму нельзя.";
  }
  if (application.status === "NEED_MORE_INFO") {
    return "Чтобы продолжить, нужен документ. Срок банка на паузе.";
  }
  return "Инспектор сверяет платёж с сезонной кассой. Решение появится здесь.";
}
