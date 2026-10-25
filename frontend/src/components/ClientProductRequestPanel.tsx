import { useState } from "react";
import type { Application, ProductType } from "../api/types";
import { PRODUCT_LABELS } from "../api/client";
import { useApp } from "../state/AppState";
import { formatMoney } from "../utils/format";

const PRODUCT_OPTIONS: ProductType[] = ["OVERDRAFT", "VKL", "INVEST_LEASING", "VKL_SEC"];

export function ClientProductRequestPanel({ application }: { application: Application }) {
  const { submitClientProductRequest, uploadSupplement, isBusy, effectiveRole } = useApp();
  const [product, setProduct] = useState<ProductType>("OVERDRAFT");
  const [amount, setAmount] = useState(Math.round(application.requested_amount_rub * 0.6));
  const [term, setTerm] = useState(application.term_months);
  const [comment, setComment] = useState("");

  const state = application.client_product_request;

  async function onSubmit() {
    await submitClientProductRequest({
      product_type: product,
      requested_amount_rub: amount,
      term_months: term,
      comment,
    });
  }

  async function onUpload(code: string) {
    await uploadSupplement({
      document_code: code as "MULTIBANK_STATEMENT",
      file_name: "demo-upload.pdf",
    });
  }

  if (state) {
    return (
      <section className="figma-panel figma-panel-sm" style={{ marginBottom: 24 }}>
        <div className="figma-panel-title">Ваш встречный запрос в банке</div>
        <p className="muted" style={{ marginTop: 8 }}>
          {PRODUCT_LABELS[state.request.product_type]} · {formatMoney(state.request.requested_amount_rub)} ·{" "}
          {state.request.term_months} мес.
        </p>
        {state.request.comment && <p style={{ marginTop: 6 }}>{state.request.comment}</p>}
        <div className={`alert ${state.verdict.is_acceptable ? "alert-good" : "alert-warn"}`} style={{ marginTop: 12 }}>
          <strong>{state.verdict.summary}</strong>
          <ul className="checklist" style={{ marginTop: 8 }}>
            {state.verdict.reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </div>
        {state.status === "WAITING_CLIENT_DOCS" && state.requested_document && (
          <div style={{ marginTop: 12 }}>
            <p>Банк запросил: <strong>{state.requested_document.label}</strong></p>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              disabled={isBusy}
              onClick={() => void onUpload(state.requested_document!.code)}
            >
              Загрузить демо-файл
            </button>
          </div>
        )}
        {application.score_changes && application.score_changes.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <div className="figma-panel-title">Пересчёт после загрузки</div>
            {application.score_changes.map((change) => (
              <p key={change.document_code} className="muted">
                {change.document_label}: {change.previous_score} → {change.new_score} (
                {change.score_delta >= 0 ? "+" : ""}
                {change.score_delta})
              </p>
            ))}
          </div>
        )}
      </section>
    );
  }

  return (
    <section className="figma-panel figma-panel-sm" style={{ marginBottom: 24 }}>
      <div className="figma-panel-title">Условия не подходят — попросить другой продукт</div>
      <p className="muted" style={{ marginTop: 6, fontSize: 13 }}>
        Это отдельный запрос внутри заявки, не путать с четырьмя готовыми вариантами банка.
      </p>
      <div className="apply-grid" style={{ marginTop: 12 }}>
        <label>
          Продукт
          <select value={product} onChange={(e) => setProduct(e.target.value as ProductType)}>
            {PRODUCT_OPTIONS.map((option) => (
              <option key={option} value={option}>{PRODUCT_LABELS[option]}</option>
            ))}
          </select>
        </label>
        <label>
          Сумма, ₽
          <input
            type="number"
            value={amount}
            min={100_000}
            step={10_000}
            onChange={(e) => setAmount(Number(e.target.value))}
          />
        </label>
        <label>
          Срок, мес.
          <input type="number" value={term} min={3} max={60} onChange={(e) => setTerm(Number(e.target.value))} />
        </label>
      </div>
      <label style={{ display: "block", marginTop: 12 }}>
        Комментарий
        <textarea
          rows={2}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Например: нужен овердрафт на закупку зерна до сезона"
        />
      </label>
      <button
        type="button"
        className="btn btn-secondary"
        style={{ marginTop: 12 }}
        disabled={isBusy || effectiveRole === "UNDERWRITER"}
        onClick={() => void onSubmit()}
      >
        Отправить запрос в банк
      </button>
    </section>
  );
}
