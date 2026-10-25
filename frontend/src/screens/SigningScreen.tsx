import { COLLATERAL_LABELS, COLLATERAL_STATUS_LABELS } from "../api/client";
import { FlowStepper, stepFromStatus } from "../components/FlowStepper";
import { SigningPanel } from "../components/SigningPanel";
import { useApp } from "../state/AppState";
import { formatMoney } from "../utils/format";

/** К5 — Подписание ПЭП и выдача (макет Figma 56:1009). */
export function SigningScreen() {
  const { application, goToScreen } = useApp();

  if (!application) {
    return (
      <div className="empty-state">
        <h3>Нечего подписывать</h3>
        <p>Сначала дойдите до одобрения или выберите встречный оффер.</p>
        <button type="button" className="btn btn-primary" onClick={() => goToScreen("apply")}>
          К заявке
        </button>
      </div>
    );
  }

  return (
    <>
      <h1 className="figma-h1">Подпись</h1>
      <p className="figma-lead">
        {application.status === "FUNDED" ? "Деньги зачислены" : "Деньги придут сразу после подписи"}
      </p>
      <FlowStepper active={stepFromStatus(application.status, "signing")} />

      {application.collateral_type !== "NONE" && (
        <div className="figma-offer-card" style={{ marginBottom: 20 }}>
          <strong>Предмет залога</strong>
          <p>
            {COLLATERAL_LABELS[application.collateral_type]} на{" "}
            {formatMoney(application.collateral_value_rub)} ·{" "}
            {COLLATERAL_STATUS_LABELS[application.collateral_status] ?? application.collateral_status}
            {application.status === "FUNDED" ? " · зарегистрирован (демо)" : ""}
          </p>
        </div>
      )}

      <SigningPanel application={application} />
    </>
  );
}
