import { useState } from "react";
import type { Application, ProductType } from "../api/types";
import { PRODUCT_LABELS } from "../api/client";
import { useApp } from "../state/AppState";
import { formatMoney } from "../utils/format";
import { ArrowsDownUpIcon, ArticleIcon } from "./icons";

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
      <section className="cpr-card" style={{ marginBottom: 24 }}>
        <div className="cpr-header">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span className="cpr-icon">
              <ArticleIcon size={20} />
            </span>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <h3 className="cpr-title">Ваш встречный запрос в банке</h3>
                <span className="pill pill-good" style={{ fontSize: 11, padding: "2px 8px" }}>
                  На рассмотрении
                </span>
              </div>
              <p className="cpr-subtitle">
                {PRODUCT_LABELS[state.request.product_type]} · {formatMoney(state.request.requested_amount_rub)} ·{" "}
                {state.request.term_months} мес.
              </p>
            </div>
          </div>
        </div>

        {state.request.comment && (
          <div
            style={{
              padding: "10px 14px",
              background: "rgba(255, 255, 255, 0.04)",
              borderRadius: 8,
              fontSize: 13,
              marginBottom: 12,
            }}
          >
            <strong>Комментарий:</strong> {state.request.comment}
          </div>
        )}

        <div className={`alert ${state.verdict.is_acceptable ? "alert-good" : "alert-warn"}`}>
          <strong>{state.verdict.summary}</strong>
          <ul className="checklist" style={{ marginTop: 8 }}>
            {state.verdict.reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </div>

        {state.status === "WAITING_CLIENT_DOCS" && state.requested_document && (
          <div style={{ marginTop: 14, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <p style={{ margin: 0, fontSize: 13 }}>
              Банк запросил: <strong>{state.requested_document.label}</strong>
            </p>
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
          <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid rgba(255, 255, 255, 0.08)" }}>
            <div className="figma-panel-title" style={{ fontSize: 13 }}>Пересчёт после загрузки</div>
            {application.score_changes.map((change) => (
              <p key={change.document_code} className="muted" style={{ fontSize: 12, margin: "4px 0 0" }}>
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
    <section className="cpr-card" style={{ marginBottom: 24 }}>
      <div className="cpr-header">
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
          <span className="cpr-icon">
            <ArrowsDownUpIcon size={20} />
          </span>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <h3 className="cpr-title">Условия не подходят — попросить другой продукт</h3>
              <span className="pill pill-neutral" style={{ fontSize: 10.5, padding: "2px 8px" }}>
                Индивидуальный андеррайтинг
              </span>
            </div>
            <p className="cpr-subtitle">
              Укажите желаемые параметры. Кредитный инспектор банка выполнит индивидуальный пересчёт в течение 15 минут.
            </p>
          </div>
        </div>
      </div>

      <div className="cpr-grid">
        <div className="cpr-field">
          <label className="cpr-label">Продукт финансирования</label>
          <div className="cpr-select-wrap">
            <select
              className="cpr-select"
              value={product}
              onChange={(e) => setProduct(e.target.value as ProductType)}
            >
              {PRODUCT_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {PRODUCT_LABELS[option]}
                </option>
              ))}
            </select>
            <span className="cpr-select-chevron" aria-hidden>▼</span>
          </div>
        </div>

        <div className="cpr-field">
          <label className="cpr-label">Сумма финансирования</label>
          <div className="cpr-input-wrap">
            <input
              type="number"
              className="cpr-input"
              value={amount}
              min={100_000}
              step={10_000}
              onChange={(e) => setAmount(Number(e.target.value))}
            />
            <span className="cpr-suffix">₽</span>
          </div>
        </div>

        <div className="cpr-field">
          <label className="cpr-label">Срок договора</label>
          <div className="cpr-input-wrap">
            <input
              type="number"
              className="cpr-input"
              value={term}
              min={3}
              max={60}
              onChange={(e) => setTerm(Number(e.target.value))}
            />
            <span className="cpr-suffix">мес.</span>
          </div>
        </div>
      </div>

      <div className="cpr-field" style={{ marginTop: 12 }}>
        <label className="cpr-label">Комментарий для кредитного инспектора</label>
        <textarea
          className="cpr-textarea"
          rows={2}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Например: нужен овердрафт на закупку зерна до сезона или лизинг оборудования..."
        />
      </div>

      <div className="cpr-footer">
        <span className="cpr-sla-note">
          <span>⚡</span>
          <span>Запрос не отменяет готовые варианты банка, а направляется на разбор инспектору</span>
        </span>

        <button
          type="button"
          className="cpr-submit-btn"
          disabled={isBusy || effectiveRole === "UNDERWRITER"}
          onClick={() => void onSubmit()}
        >
          <span>{isBusy ? "Отправка…" : "Отправить запрос в банк"}</span>
        </button>
      </div>
    </section>
  );
}
