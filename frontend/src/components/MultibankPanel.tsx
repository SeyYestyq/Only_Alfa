import type { Application } from "../api/types";
import { useApp } from "../state/AppState";
import { formatMoney } from "../utils/format";

export function MultibankPanel({ application }: { application: Application }) {
  const { verifyMultibank, isBusy, multibankResult } = useApp();

  if (application.multibank.verified) {
    return (
      <div className="alert alert-good" style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap", justifyContent: "space-between" }}>
        <div style={{ maxWidth: 780 }}>
          <strong>Выписки из других банков подтверждены</strong>
          <p style={{ marginTop: 4 }}>
            Подтверждённый оборот: {formatMoney(application.multibank.external_revenue_rub)}/мес. Фактор
            CF_MULTIBANK_VERIFIED применён, расчётный лимит пересчитан с бонусом +25%.
          </p>
          {multibankResult && (
            <p style={{ marginTop: 4, fontSize: 12 }}>
              Балл: {multibankResult.previousScore} → <strong>{multibankResult.newScore}</strong> (
              {multibankResult.scoreDelta > 0 ? "+" : ""}
              {multibankResult.scoreDelta}). Расчётный лимит:{" "}
              {formatMoney(multibankResult.previousLimit)} → <strong>{formatMoney(multibankResult.newLimit)}</strong>.
            </p>
          )}
        </div>
        <div style={{ textAlign: "right" }}>
          <span className="pill pill-good">Мультибанк ✓</span>
          <div className="faint" style={{ fontSize: 11, marginTop: 4 }}>
            Одобрено: {formatMoney(application.approved_amount_rub)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="alert alert-warn" style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap", justifyContent: "space-between" }}>
      <div style={{ maxWidth: 760 }}>
        <strong>Аномалия выручки: нужно подтверждение из других банков</strong>
        <p style={{ marginTop: 4 }}>
          {application.anomaly?.message ??
            "Заявленная выручка расходится с оборотом в Альфа-Банке более чем на 50%."}
        </p>
        <p style={{ marginTop: 4, fontSize: 12 }}>
          Мультибанк подтянет выписки Сбер / Т-Банк / ВТБ, применит фактор CF_MULTIBANK_VERIFIED и пересчитает
          балл и лимит с бонусом +25%. Все цифры считает бэкенд.
        </p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => void verifyMultibank()}
          disabled={isBusy}
        >
          Подтянуть выписки из других банков
        </button>
      </div>
    </div>
  );
}
