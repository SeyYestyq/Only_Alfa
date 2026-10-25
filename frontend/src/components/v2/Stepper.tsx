const STEPS = ["Условия", "Проверка и решение банка", "Подпись гендиректора", "Деньги на счёте"];

export function Stepper({ active }: { active: number }) {
  return (
    <div className="v2-steps">
      {STEPS.map((label, index) => {
        const number = index + 1;
        const cls = number < active ? "done" : number === active ? "on" : "";
        return (
          <span key={label} className={cls}>
            <span className="n">{number < active ? "✓" : number}</span>
            {label}
            {index < STEPS.length - 1 ? "  —  " : ""}
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
