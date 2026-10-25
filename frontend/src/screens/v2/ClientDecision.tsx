import { useState } from "react";
import { ChatThread } from "../../components/v2/ChatThread";
import { DecisionScoreCard } from "../../components/v2/DecisionScoreCard";
import { Stepper, stepForStatus } from "../../components/v2/Stepper";
import { INSPECTOR_NAME, ROSTERS_SUMMER_SAFE } from "../../domain-ui/caseScript";
import { useApp } from "../../state/AppState";
import { useDemoStore } from "../../state/demoStore";
import { formatMoney, formatPercent, shortPerson } from "../../utils/format";

export function ClientDecision() {
  const { application, dashboard, acceptOffer, uploadDocument, isBusy, goToScreen, userRole, companyId } = useApp();
  const docs = useDemoStore((state) => state.creditDocs);
  const [contest, setContest] = useState("");
  const [uploadError, setUploadError] = useState<string | null>(null);

  if (!application || !companyId) {
    return (
      <div className="v2-card">
        <h1 className="v2-h1">Решение</h1>
        <p className="v2-muted">Сначала отправьте заявку.</p>
        <button type="button" className="v2-btn primary" onClick={() => goToScreen("apply")}>К заявке</button>
      </div>
    );
  }

  const user = application.company.users.find((row) => row.role === userRole);
  const waiting = application.status === "MANUAL_REVIEW" || application.status === "ANOMALY_VERIFICATION";
  const showOffers = application.status === "COUNTER_OFFER";
  const requestedDoc = application.checks.find((check) => check.code === "DOCUMENT_REQUEST");
  const docName = String(requestedDoc?.details.document_name ?? "договор аренды");
  const subtitle = waiting
    ? "На проверке · ответ до 00:44"
    : application.status === "REJECTED"
      ? "Сейчас выдать эту сумму нельзя"
        : application.status === "NEED_MORE_INFO"
        ? "Нужен документ"
        : application.status === "MANUAL_REVIEW" || application.status === "ANOMALY_VERIFICATION"
          ? "Инспектор смотрит заявку"
          : "Есть другие условия";

  const primary = application.counter_offers.filter((_, index) => index !== 1).slice(0, 3);
  const revenue = application.counter_offers[1];

  return (
    <>
      <div className="v2-crumb">Кредит / Решение</div>
      <div className="v2-row">
        <div>
          <h1 className="v2-h1">Решение</h1>
          <p className="v2-lead">{subtitle}</p>
        </div>
        <button type="button" className="v2-link" onClick={() => goToScreen("apply")}>Новая заявка</button>
      </div>
      <Stepper active={stepForStatus(application.status)} />

      {waiting ? (
        <section className="v2-score-card">
          <strong>Ждём инспектора</strong>
          <p className="v2-score-reason">Когда решение уйдёт вам, здесь появятся балл, лимит и варианты.</p>
        </section>
      ) : (
        <DecisionScoreCard
          application={application}
          onInspect={() => document.getElementById("decision-why")?.scrollIntoView({ behavior: "smooth", block: "start" })}
          next={
            showOffers
              ? { title: "Выберите один из вариантов ниже", actionLabel: "К вариантам", onAction: focusVariants }
              : application.status === "NEED_MORE_INFO"
                ? { title: "Загрузите документ. Пока ждём вас, срок банка на паузе", actionLabel: "К документу", onAction: () => document.getElementById("decision-why")?.scrollIntoView({ behavior: "smooth", block: "start" }) }
                : application.status === "REJECTED"
                  ? { title: "Прочитайте, что изменить, и подайте заявку снова", actionLabel: "К объяснению", onAction: () => document.getElementById("decision-why")?.scrollIntoView({ behavior: "smooth", block: "start" }) }
                  : { title: "Дальше — подпись. Писать руководителю не нужно.", actionLabel: "К подписи", onAction: () => goToScreen("signing") }
          }
        />
      )}

      {showOffers ? (
        <div className="v2-variants" id="offer-variants">
          {primary.map((offer, index) => (
            <article key={offer.index} className={`v2-variant ${index === 0 ? "pick" : ""}`}>
              <span className={`v2-pill ${index === 0 ? "good" : "info"}`}>{index === 0 ? "Рекомендуем" : offer.label}</span>
              <div className="sum">{formatMoney(offer.amount_rub)}</div>
              <div className="v2-check"><span>Срок</span><strong>{offer.term_months} мес.</strong></div>
              <div className="v2-check"><span>Ставка</span><strong>{formatPercent(offer.rate_pct)}</strong></div>
              <div className="v2-check">
                <span>Платёж</span>
                <strong>{offer.monthly_payment_rub > 0 ? `≈ ${formatMoney(offer.monthly_payment_rub)} / мес` : "по графику продукта"}</strong>
              </div>
              <p className="v2-muted">{offer.features.slice(1, 3).join(" · ")}</p>
              <button
                type="button"
                className={`v2-btn ${index === 0 ? "primary" : ""} wide`}
                disabled={isBusy}
                onClick={() => void acceptOffer(offer.index)}
              >
                {index === 0 ? "Выбрать этот вариант" : "Выбрать"}
              </button>
            </article>
          ))}
        </div>
      ) : null}

      {showOffers && revenue ? (
        <p className="v2-note">
          Ещё вариант: {revenue.label}. {revenue.features.slice(1, 3).join(" · ")}{" "}
          <button type="button" className="v2-link" disabled={isBusy} onClick={() => void acceptOffer(revenue.index)}>
            Выбрать платёж от выручки
          </button>
        </p>
      ) : null}

      <div className="v2-split" style={{ marginTop: 12 }}>
        <section className="v2-card" id="decision-why">
          <h2 title="Решение принял инспектор, расчёты — по операциям в банке">Почему не {formatMoney(application.requested_amount_rub)}</h2>
          <div className="v2-check">
            <span>Платёж по запросу</span>
            <strong>≈ {formatMoney(application.monthly_payment_rub)} при безопасном {formatMoney(application.max_payment_rub)}</strong>
          </div>
          {application.factors_breakdown.filter((factor) => factor.score_delta < 0).map((factor) => (
            <div key={factor.code} className="v2-check">
              <span>{factor.label}</span>
              <strong>{factor.score_delta}</strong>
            </div>
          ))}
          {dashboard?.company.demo_key === "rosters" ? (
            <div className="v2-check">
              <span>Летом выручка ниже</span>
              <strong>безопасно около {formatMoney(ROSTERS_SUMMER_SAFE)}</strong>
            </div>
          ) : null}
          {application.rejection_checklist.map((line) => (
            <p key={line} className="v2-note">{line}</p>
          ))}
          {application.status === "NEED_MORE_INFO" ? (
            <div style={{ marginTop: 12 }}>
              <p className="v2-muted">Банк просит: {docName}. Загрузка вернёт заявку на проверку.</p>
              <label className="v2-btn primary" style={{ marginTop: 8, display: "inline-flex" }}>
                Загрузить документ
                <input
                  type="file"
                  hidden
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) {
                      return;
                    }
                    setUploadError(null);
                    void uploadDocument(file).then((ok) => {
                      if (!ok) {
                        setUploadError("Не получилось загрузить");
                      }
                    });
                  }}
                />
              </label>
              {uploadError ? <p className="v2-note">{uploadError}</p> : null}
            </div>
          ) : null}
          {docs.length > 0 ? <p className="v2-note">В этой сессии: {docs.join(", ")}</p> : null}
          {application.status === "REJECTED" ? (
            <button type="button" className="v2-btn primary" style={{ marginTop: 12 }} onClick={() => goToScreen("apply")}>
              Подать снова, когда будет что изменить
            </button>
          ) : null}
          <div style={{ marginTop: 12 }}>
            <h3>Возражение</h3>
            <div className="v2-composer">
              <input value={contest} placeholder="Обороты во втором банке не учтены…" onChange={(event) => setContest(event.target.value)} />
              <button
                type="button"
                className="v2-btn"
                onClick={() => {
                  if (!contest.trim()) {
                    return;
                  }
                  useDemoStore.getState().pushChat(companyId, {
                    author: shortPerson(user?.full_name),
                    side: "client",
                    text: contest.trim(),
                  });
                  setContest("");
                }}
              >
                Оспорить
              </button>
            </div>
          </div>
        </section>
        <section className="v2-card">
          <div className="v2-row">
            <h2>{INSPECTOR_NAME}</h2>
            <span className="v2-pill">кредитный инспектор</span>
          </div>
          <div style={{ marginTop: 12 }}>
            <ChatThread
              companyId={companyId}
              author={shortPerson(user?.full_name)}
              side="client"
              placeholder="Ответить или прикрепить файл…"
            />
          </div>
        </section>
      </div>
    </>
  );
}

function focusVariants(): void {
  const root = document.getElementById("offer-variants");
  root?.scrollIntoView({ behavior: "smooth", block: "start" });
  const button = root?.querySelector("button");
  if (button instanceof HTMLElement) {
    button.focus();
  }
}
