import type { Application } from "../api/types";
import { PRODUCT_LABELS } from "../api/client";
import { useApp } from "../state/AppState";
import { formatMoney } from "../utils/format";
import { OfferLetterPanel } from "./OfferLetterPanel";

export function PilotClientRequestCard({ application }: { application: Application }) {
  const { decideClientProductRequest, isBusy } = useApp();
  const state = application.client_product_request;
  if (!state) {
    return null;
  }

  const letter = application.offer_letters?.[application.offer_letters.length - 1];

  return (
    <section className="figma-panel app-desk-block" id="desk-client-request" style={{ marginBottom: 20, borderRadius: 20 }}>
      <div className="figma-panel-title">Встречный запрос клиента (разбор готов)</div>
      <p style={{ marginTop: 8 }}>
        <strong>{PRODUCT_LABELS[state.request.product_type]}</strong> · {formatMoney(state.request.requested_amount_rub)} ·{" "}
        {state.request.term_months} мес.
      </p>
      {state.request.comment && <p className="muted">{state.request.comment}</p>}
      <div className={`alert ${state.verdict.is_acceptable ? "alert-good" : "alert-warn"}`} style={{ marginTop: 12 }}>
        <strong>Вердикт системы: {state.verdict.summary}</strong>
        <ul className="checklist">
          {state.verdict.reasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      </div>
      {!state.verdict.is_acceptable && state.verdict.suggested_supplements.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <div className="figma-panel-title">Что запросить у клиента</div>
          <ul className="checklist">
            {state.verdict.suggested_supplements.map((item) => (
              <li key={item.code}>
                {item.label} (+{item.score_delta} баллов) — {item.reason}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
        {state.verdict.is_acceptable && (
          <button
            type="button"
            className="btn btn-primary btn-sm"
            disabled={isBusy}
            onClick={() => void decideClientProductRequest("APPROVE")}
          >
            Одобрить как есть
          </button>
        )}
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          disabled={isBusy}
          onClick={() =>
            void decideClientProductRequest(
              "REQUEST_DATA",
              undefined,
              state.verdict.suggested_supplements[0]?.code ?? "MULTIBANK_STATEMENT",
            )
          }
        >
          Запросить данные
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          disabled={isBusy}
          onClick={() => void decideClientProductRequest("SEND_COUNTER")}
        >
          Отправить свой вариант
        </button>
      </div>
      {letter && (
        <div style={{ marginTop: 16 }}>
          <OfferLetterPanel letter={letter} compact />
        </div>
      )}
    </section>
  );
}
