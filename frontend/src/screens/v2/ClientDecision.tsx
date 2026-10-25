import { useState } from "react";
import { ChatThread } from "../../components/v2/ChatThread";
import { Stepper, stepForStatus } from "../../components/v2/Stepper";
import { INSPECTOR_NAME, ROSTERS_SUMMER_SAFE } from "../../domain-ui/caseScript";
import { useApp } from "../../state/AppState";
import { useDemoStore } from "../../state/demoStore";
import { formatMoney, formatPercent, shortPerson } from "../../utils/format";

export function ClientDecision() {
  const { application, dashboard, acceptOffer, isBusy, goToScreen, userRole, companyId } = useApp();
  const released = useDemoStore((state) =>
    application ? Boolean(state.released[application.application_id]) : false);
  const addCreditDoc = useDemoStore((state) => state.addCreditDoc);
  const docs = useDemoStore((state) => state.creditDocs);
  const [contest, setContest] = useState("");

  if (!application || !companyId) {
    return (
      <div className="v2-card">
        <h1 className="v2-h1">Решения ещё нет</h1>
        <p className="v2-muted">Сначала отправьте заявку.</p>
        <button type="button" className="v2-btn primary" onClick={() => goToScreen("apply")}>К заявке</button>
      </div>
    );
  }

  const user = application.company.users.find((row) => row.role === userRole);
  const waiting = application.status === "COUNTER_OFFER" && !released;
  const showOffers = application.status === "COUNTER_OFFER" && released;
  const title = waiting
    ? "Заявка на проверке"
    : application.status === "REJECTED"
      ? "Сейчас выдать не можем"
      : application.status === "NEED_MORE_INFO"
        ? "Банк просит документ"
        : application.status === "MANUAL_REVIEW" || application.status === "ANOMALY_VERIFICATION"
          ? "Инспектор смотрит заявку"
          : "Банк предлагает другие условия";

  const primary = application.counter_offers.filter((_, index) => index !== 1).slice(0, 3);
  const revenue = application.counter_offers[1];

  return (
    <>
      <div className="v2-crumb">Кредиты / Заявка {application.application_id.slice(-8)}</div>
      <div className="v2-row">
        <h1 className="v2-h1">{title}</h1>
        <span className="v2-pill warn">{application.status_label}</span>
      </div>
      <Stepper active={stepForStatus(application.status, released)} />

      <section className="v2-next">
        <div>
          <div className="kicker">Следующий шаг</div>
          <strong>
            {waiting
              ? "Ждём инспектора. Когда решение уйдёт вам, здесь появятся варианты"
              : showOffers
                ? "Выберите вариант — затем заявка уйдёт гендиректору на подпись"
                : application.status === "NEED_MORE_INFO"
                  ? "Загрузите документ. Пока ждём вас, SLA банка на паузе"
                  : application.status === "REJECTED"
                    ? "Прочитайте, что изменить, и подайте заявку снова"
                    : "Следите за статусом — банк напишет в этот чат"}
          </strong>
        </div>
        {showOffers ? <span className="v2-pill">Сравнить варианты</span> : null}
      </section>

      {showOffers ? (
        <div className="v2-variants">
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
        <section className="v2-card">
          <div className="v2-kicker">Объяснение решения</div>
          <h2>Почему не {formatMoney(application.requested_amount_rub)}</h2>
          <p className="v2-muted">Решение принял инспектор, расчёты сделала система — по вашим операциям в банке.</p>
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
            <label className="v2-btn" style={{ marginTop: 12, display: "inline-flex" }}>
              Загрузить PDF
              <input
                type="file"
                hidden
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    addCreditDoc(file.name);
                  }
                }}
              />
            </label>
          ) : null}
          {docs.length > 0 ? <p className="v2-note">В заявке: {docs.join(", ")}. Инспектор увидит имена файлов.</p> : null}
          {application.status === "REJECTED" ? (
            <button type="button" className="v2-btn primary" style={{ marginTop: 12 }} onClick={() => goToScreen("apply")}>
              Подать снова, когда будет что изменить
            </button>
          ) : null}
          <div style={{ marginTop: 12 }}>
            <div className="v2-kicker">Если не согласны</div>
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
