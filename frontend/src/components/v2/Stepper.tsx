import type { ScreenId } from "../../api/types";

const STEPS = ["Условия", "Проверка и решение банка", "Подпись гендиректора", "Деньги на счёте"];

/** Экран кабинета для шага кредитного процесса. */
export function screenForCreditStep(step: number): ScreenId {
  if (step <= 1) {
    return "apply";
  }
  if (step === 2) {
    return "decision";
  }
  return "signing";
}

export function Stepper({
  active,
  view,
  onGo,
}: {
  /** Самый далёкий доступный шаг по статусу заявки. */
  active: number;
  /** Какой шаг сейчас открыт на экране. */
  view?: number;
  onGo?: (step: number) => void;
}) {
  const shown = view ?? active;
  return (
    <div className="v2-steps" role="navigation" aria-label="Шаги заявки">
      {STEPS.map((label, index) => {
        const number = index + 1;
        const reached = number <= active;
        const isView = number === shown;
        const cls = [
          number < active || (number === active && !isView) ? "done" : "",
          isView ? "on" : "",
          reached && onGo ? "go" : "",
        ]
          .filter(Boolean)
          .join(" ");
        const mark = number < active ? "✓" : number;
        if (reached && onGo) {
          return (
            <button
              key={label}
              type="button"
              className={cls}
              aria-current={isView ? "step" : undefined}
              onClick={() => onGo(number)}
            >
              <span className="n">{mark}</span>
              {label}
              {index < STEPS.length - 1 ? <span className="v2-steps-sep" aria-hidden="true">—</span> : null}
            </button>
          );
        }
        return (
          <span key={label} className={cls}>
            <span className="n">{mark}</span>
            {label}
            {index < STEPS.length - 1 ? <span className="v2-steps-sep" aria-hidden="true">—</span> : null}
          </span>
        );
      })}
    </div>
  );
}

export function stepForStatus(status: string | undefined): number {
  if (!status) {
    return 1;
  }
  if (status === "FUNDED") {
    return 4;
  }
  if (status === "AWAITING_CEO_APPROVAL" || status === "APPROVED") {
    return 3;
  }
  if (["COUNTER_OFFER", "NEED_MORE_INFO", "REJECTED", "MANUAL_REVIEW", "ANOMALY_VERIFICATION"].includes(status)) {
    return 2;
  }
  return 1;
}
