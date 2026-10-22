const STEPS: Array<{ label: string; statuses: string[] }> = [
  { label: "Черновик", statuses: ["DRAFT_BY_EMPLOYEE"] },
  { label: "Сверка выручки", statuses: ["ANOMALY_VERIFICATION"] },
  { label: "Проверки и отрасль", statuses: ["MANUAL_REVIEW", "NEED_MORE_INFO"] },
  { label: "Решение", statuses: ["APPROVED", "COUNTER_OFFER", "REJECTED"] },
  { label: "Ожидает гендиректора", statuses: ["AWAITING_CEO_APPROVAL"] },
  { label: "Подписание", statuses: ["CONTRACT_SIGNING"] },
  { label: "Выдано", statuses: ["FUNDED"] },
];

/** Путь заявки по статусу, который вернул банк. Подписи не считаются на клиенте. */
export function StatusTrack({ status }: { status: string }) {
  const active = STEPS.findIndex((step) => step.statuses.includes(status));

  return (
    <section className="figma-panel figma-panel-sm">
      <div className="figma-panel-title">Все статусы заявки</div>
      <ul className="status-track">
        {STEPS.map((step, index) => {
          const state = active < 0 ? "" : index < active ? "done" : index === active ? "now" : "";
          return (
            <li key={step.label} className={state}>
              <i />
              <span>{step.label}</span>
              <span className="mono faint">{step.statuses.join(" · ")}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
