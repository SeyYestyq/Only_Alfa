import type { ScreenId } from "../api/types";
import { useApp } from "../state/AppState";

export type FlowStepId = "offer" | "apply" | "checks" | "decision" | "sign" | "funded";

const STEPS: Array<{ id: FlowStepId; label: string; screen: ScreenId }> = [
  { id: "offer", label: "Предложение", screen: "home" },
  { id: "apply", label: "Заявка", screen: "apply" },
  { id: "checks", label: "Проверки", screen: "passport" },
  { id: "decision", label: "Решение", screen: "decision" },
  { id: "sign", label: "Подпись", screen: "signing" },
  { id: "funded", label: "Выдача", screen: "signing" },
];

const ORDER: FlowStepId[] = STEPS.map((step) => step.id);

export function stepFromStatus(status: string | undefined, screen: string): FlowStepId {
  if (screen === "apply") {
    return "apply";
  }
  if (screen === "passport") {
    return "checks";
  }
  if (screen === "decision") {
    return "decision";
  }
  if (screen === "signing") {
    return status === "FUNDED" ? "funded" : "sign";
  }
  if (status === "FUNDED") {
    return "funded";
  }
  if (
    status === "APPROVED" ||
    status === "AWAITING_CEO_APPROVAL" ||
    status === "CONTRACT_SIGNING" ||
    status === "COUNTER_OFFER" ||
    status === "REJECTED" ||
    status === "NEED_MORE_INFO" ||
    status === "MANUAL_REVIEW"
  ) {
    return "decision";
  }
  if (status === "ANOMALY_VERIFICATION" || status === "DRAFT_BY_EMPLOYEE") {
    return "checks";
  }
  return "offer";
}

/** Stepper как на К2–К5. Будущие шаги не кликабельны — нельзя «пролететь» вперёд. */
export function FlowStepper({ active }: { active: FlowStepId }) {
  const { goToScreen, application } = useApp();
  const activeIndex = ORDER.indexOf(active);

  function canOpen(index: number, step: (typeof STEPS)[number]): boolean {
    if (index < activeIndex) {
      return true;
    }
    if (index === activeIndex) {
      return false;
    }
    // Вперёд — только если заявка уже есть и шаг логически доступен по статусу
    if (!application) {
      return false;
    }
    const byStatus = stepFromStatus(application.status, step.screen);
    return ORDER.indexOf(byStatus) >= index;
  }

  return (
    <nav className="figma-stepper" aria-label="Этапы заявки">
      {STEPS.map((step, index) => {
        const state = index < activeIndex ? "done" : index === activeIndex ? "active" : "";
        const openable = canOpen(index, step);
        return (
          <button
            key={step.id}
            type="button"
            className={`figma-step ${state}`}
            disabled={!openable && index !== activeIndex}
            aria-current={index === activeIndex ? "step" : undefined}
            onClick={() => {
              if (openable) {
                goToScreen(step.screen);
              }
            }}
          >
            <span className="n">{index + 1}</span>
            <span>{step.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
