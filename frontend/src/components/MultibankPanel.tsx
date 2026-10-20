import type { Application } from "../api/types";
import { useApp } from "../state/AppState";
import { formatMoney } from "../utils/format";

export function MultibankPanel({ application }: { application: Application }) {
  const { verifyMultibank, isBusy } = useApp();

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
          лимит. Балл и лимит рассчитывает бэкенд.
        </p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => void verifyMultibank()}
          disabled={isBusy || !application.multibank.available}
        >
          Подтянуть выписки из других банков
        </button>
        {application.multibank.verified && (
          <span className="pill pill-good">
            Подтверждено: +{formatMoney(application.multibank.external_revenue_rub)}
          </span>
        )}
      </div>
    </div>
  );
}
