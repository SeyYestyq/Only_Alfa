import type { NewsItem } from "../../api/types";
import { ForecastLine } from "../../components/v2/ForecastLine";
import { SkeletonLines } from "../../components/v2/ScreenState";
import { signalFor } from "../../domain-ui/caseScript";
import {
  EQUIPMENT_TOTAL,
  JULY_REVENUE_FORECAST,
  LIMIT_UP_AMOUNT,
  RESTRUCTURE_PAYMENT,
  ROSTERS_OBLIGATIONS,
  ROSTERS_OBLIGATIONS_TOTAL,
  ROSTERS_OFFER_AMOUNT,
  ROSTERS_OFFER_TERM,
  ROSTERS_SUMMER_SAFE,
} from "../../domain-ui/caseScript";
import { useApp } from "../../state/AppState";
import { useDemoStore } from "../../state/demoStore";
import { familyName, formatMoney, formatPercent, roughAnnuity } from "../../utils/format";

function fcfFromDna(value: string | undefined): number | null {
  if (!value) {
    return null;
  }
  const digits = value.replace(/\s/g, "").match(/(\d+)/);
  return digits ? Number(digits[1]) : null;
}

export function ClientHome() {
  const { dashboard, application, userRole, goToScreen, setViewMode, companyId } = useApp();
  const offerSent = useDemoStore((state) => (companyId ? state.offerSent[companyId] : false));
  const phase = useDemoStore((state) => (companyId ? state.monitoring[companyId] ?? "none" : "none"));
  const restructureOn = useDemoStore((state) => (companyId ? Boolean(state.restructureOn[companyId]) : false));
  const notifiedAt = useDemoStore((state) =>
    application ? state.ceoNotifiedAt[application.application_id] : undefined);

  if (!dashboard || !companyId) {
    return <SkeletonLines lines={5} />;
  }

  const company = dashboard.company;
  const isRosters = company.demo_key === "rosters";
  const offerVisible = Boolean(offerSent) || Boolean(application);
  const fcf = fcfFromDna(dashboard.business_dna.blocks.find((block) => block.code === "CASHFLOW")?.value);
  const offerPayment = roughAnnuity(ROSTERS_OFFER_AMOUNT, ROSTERS_OFFER_TERM, 0.18);
  const quiet = company.demo_key === "smirnov";

  let nextTitle = "Касса и платежи на виду — банк увидит сигнал, если выручка не закроет обязательства";
  let nextText = "Одно следующее действие. Остальное можно сделать позже.";
  let nextCta = "Нужны деньги";
  let nextGo = () => goToScreen("apply");

  if (phase === "limit") {
    nextTitle = `Лимит можно поднять до ${formatMoney(LIMIT_UP_AMOUNT)}`;
    nextText = "Шесть платежей в срок. Новая заявка не нужна, чтобы просто посмотреть условия.";
    nextCta = "Посмотреть условия";
    nextGo = () => goToScreen("signing");
  } else if (phase === "restructure" && application?.status === "FUNDED") {
    const signer = application.company.legal_form === "OOO" ? userRole === "CEO_OWNER" : userRole === "IP_OWNER";
    const director = application.company.users.find((user) => user.role === "CEO_OWNER" || user.role === "IP_OWNER");
    nextTitle = restructureOn
      ? "Платёж от выручки включён на июль–август"
      : signer
        ? "Подпишите допсоглашение о платеже"
        : `Ждёт подписи ${familyName(director?.full_name)}`;
    nextText = `Около ${formatMoney(RESTRUCTURE_PAYMENT)} вместо графика. Демо · без API.`;
    nextCta = !restructureOn && signer ? "К подписи" : "";
    nextGo = () => goToScreen("signing");
  } else if (application?.status === "FUNDED") {
    nextTitle = "Деньги на счёте. График платежей уже в кабинете";
    nextText = "Банк следит за кассой и напишет раньше просрочки.";
    nextCta = "К выдаче";
    nextGo = () => goToScreen("signing");
  } else if (application?.status === "AWAITING_CEO_APPROVAL" || application?.status === "APPROVED") {
    const signer = application.company.legal_form === "OOO" ? userRole === "CEO_OWNER" : userRole === "IP_OWNER";
    const director = application.company.users.find((user) => user.role === "CEO_OWNER" || user.role === "IP_OWNER");
    if (signer) {
      nextTitle = "Подпишите договор — деньги придут сразу";
      nextText = notifiedAt ? `Уведомление пришло в ${notifiedAt}.` : "Договор уже в кабинете.";
      nextCta = "К подписи";
      nextGo = () => goToScreen("signing");
    } else {
      const who = application.company.legal_form === "OOO" ? "гендиректора" : "предпринимателя";
      nextTitle = `Ждёт подписи ${who} · ${familyName(director?.full_name)} получил уведомление`;
      nextText = notifiedAt ? `Отправлено в ${notifiedAt}. Писать руководителю не нужно.` : "Уведомление уходит само.";
      nextCta = "";
      nextGo = () => undefined;
    }
  } else if (application?.status === "COUNTER_OFFER") {
    nextTitle = "Банк предлагает другие условия";
    nextText = "После выбора заявка уйдёт гендиректору на подпись.";
    nextCta = "Выбрать условия";
    nextGo = () => goToScreen("decision");
  } else if (application?.status === "NEED_MORE_INFO") {
    nextTitle = "Банк просит договор аренды";
    nextText = "Пока вы отвечаете, таймер решения у банка на паузе.";
    nextCta = "Загрузить";
    nextGo = () => goToScreen("decision");
  } else if (application?.status === "REJECTED") {
    nextTitle = "Банк не одобрил";
    nextText = "Причина и план на 90 дней — на экране решения.";
    nextCta = "Смотреть план";
    nextGo = () => goToScreen("decision");
  } else if (application?.status === "MANUAL_REVIEW" || application?.status === "ANOMALY_VERIFICATION") {
    nextTitle = "На проверке, ответ до 00:44";
    nextText = "Инспектор Елена Орлова смотрит заявку.";
    nextCta = "";
    nextGo = () => goToScreen("decision");
  } else if (application) {
    nextTitle = "Заявка у инспектора";
    nextText = "Решение появится здесь и в чате.";
    nextCta = "";
    nextGo = () => goToScreen("decision");
  } else if (offerVisible && isRosters) {
    nextTitle = `Банк подготовил для вас предложение — ${formatMoney(ROSTERS_OFFER_AMOUNT)} на оборудование`;
    nextText = "Закроет минус 28.10 и вернёт деньги в оборот. Анкета не нужна — данные уже у банка.";
    nextCta = "Посмотреть условия";
    nextGo = () => goToScreen("apply");
  } else if (quiet) {
    nextTitle = "Кредитов не предлагаем — касса в плюсе";
    nextText = "Если деньги всё же нужны, заявку можно подать самим.";
    nextCta = "Подать заявку самому";
    nextGo = () => goToScreen("apply");
  } else if (!offerSent) {
    nextTitle = "Банк видит операции по счёту";
    nextText = "Предложение появится здесь, когда инспектор его отправит.";
    nextCta = "Глазами банка";
    nextGo = () => setViewMode("bank");
  }

  function onNews(item: NewsItem) {
    const cta = item.cta.toLowerCase();
    if (cta.includes("чат")) {
      goToScreen("messages");
      return;
    }
    if (cta.includes("оплат") || cta.includes("выпис") || cta.includes("прогноз")) {
      goToScreen("payments");
      return;
    }
    if (cta.includes("заяв") || cta.includes("услови") || cta.includes("рассроч") || cta.includes("оффер")) {
      goToScreen("apply");
      return;
    }
    goToScreen("feeds");
  }

  const season = phase === "restructure" || phase === "limit" || phase === "early";

  return (
    <>
      <div className="v2-row">
        <div>
          <h1 className="v2-h1">Обзор</h1>
          <p className="v2-lead">
            {season
              ? "Данные на 22.06.2027, 10:15"
              : `${company.demo_key === "rosters" ? "Ростерс Кафе" : company.name} · на счёте ${formatMoney(dashboard.account_balance)}`}
          </p>
        </div>
      </div>

      <section className="v2-next">
        <div>
          <strong>{nextTitle}</strong>
          <p>{nextText}</p>
        </div>
        {nextCta ? (
          <button type="button" className="v2-btn primary" onClick={nextGo}>
            {nextCta}
          </button>
        ) : (
          <button type="button" className="v2-link" onClick={nextGo}>Статус</button>
        )}
      </section>

      {(phase === "restructure" || phase === "limit" || phase === "early") && application?.status === "FUNDED" ? (
        <p className="v2-pill demo" style={{ marginBottom: 12 }}>Демо · без API</p>
      ) : null}
      {(phase === "restructure" || phase === "limit") && application?.status === "FUNDED" ? (
        <section className="v2-grid-3">
          <article className="v2-card">
            <span className="v2-pill good">платежи в срок</span>
            <h2 style={{ marginTop: 8 }}>Кредит на оборудование</h2>
            <div className="v2-amount" style={{ fontSize: 32 }}>{formatMoney(application.approved_amount_rub)}</div>
            <p className="v2-muted">Платёж по графику {formatMoney(application.monthly_payment_rub)}. Это выданная сумма из API, не новый расчёт.</p>
          </article>
          <article className="v2-card">
            <span className="v2-pill demo">прогноз</span>
            <h2 style={{ marginTop: 8 }}>Касса в июле</h2>
            <p className="v2-muted">
              Выручка июля, прогноз {formatMoney(JULY_REVENUE_FORECAST)}. Платёж 3% от этой выручки ≈ {formatMoney(RESTRUCTURE_PAYMENT)}.
              {restructureOn ? " Включено на июль–август." : " Ещё не включено."}
            </p>
          </article>
          <article className="v2-card">
            <span className="v2-pill info">Лестница лимита</span>
            <h2 style={{ marginTop: 8 }}>Лимит до {formatMoney(LIMIT_UP_AMOUNT)}</h2>
            <p className="v2-muted">
              {phase === "limit"
                ? "Банк предложил рост лимита. Новая выдача не создаётся, пока вы сами не отправите заявку."
                : "Появится после нескольких платежей без просрочек."}
            </p>
          </article>
        </section>
      ) : null}

      <section className="v2-kpis">
        <article className="v2-card">
          <div className="v2-kpi-label">На счёте</div>
          <div className="v2-kpi-value">{formatMoney(dashboard.account_balance)}</div>
          <div className="v2-kpi-sub">
            {isRosters ? `после оплаты оборудования на ${formatMoney(EQUIPMENT_TOTAL)}` : "расчётный счёт"}
          </div>
        </article>
        <article className="v2-card">
          <div className="v2-kpi-label">Выручка</div>
          <div className="v2-kpi-value">{formatMoney(company.monthly_revenue_alfa)}</div>
          <div className="v2-kpi-sub" style={{ color: "var(--status-success)" }}>
            {formatPercent(company.revenue_growth_pct, 0)} к прошлому году
          </div>
        </article>
        <article className="v2-card">
          <div className="v2-kpi-label">Свободный поток</div>
          <div className="v2-kpi-value">{fcf === null ? "—" : formatMoney(fcf)}</div>
          <div className="v2-kpi-sub">из ДНК бизнеса, считает бэкенд</div>
        </article>
        <article className="v2-card">
          <div className="v2-kpi-label">{isRosters ? "Обязательства до 30.11" : "Исходящие в выписке"}</div>
          <div className="v2-kpi-value">
            {formatMoney(isRosters ? ROSTERS_OBLIGATIONS_TOTAL : dashboard.transactions.filter((row) => row.direction === "OUT").reduce((sum, row) => sum + row.amount_rub, 0))}
          </div>
          <div className="v2-kpi-sub">{isRosters ? "5 платежей · ближайший 25.10" : "по загруженным операциям"}</div>
        </article>
      </section>

      <section className="v2-split">
        <article className="v2-card">
          <div className="v2-row">
            <div>
              <h2 title="Минимум кассы отмечен на графике">Прогноз кассы</h2>
            </div>
            <span className="v2-pill demo">прогноз</span>
          </div>
          <ForecastLine forecast={dashboard.cash_forecast} />
          <p className="v2-note">
            Минимум {formatMoney(dashboard.cash_forecast.min_balance_rub)} на дне {dashboard.cash_forecast.min_day}.
            {isRosters ? ` Летом безопасный ориентир ${formatMoney(ROSTERS_SUMMER_SAFE)} — сезонный прогноз, не лимит.` : ""}
          </p>
        </article>
        {offerVisible && isRosters && !application ? (
          <article className="v2-card" style={{ borderColor: "#5a3030" }}>
            <span className="v2-pill bad">Для вас</span>
            <h2 style={{ fontSize: 28, margin: "10px 0" }}>{formatMoney(ROSTERS_OFFER_AMOUNT)} на оборудование</h2>
            <p className="v2-muted">
              ≈ {formatMoney(offerPayment)} / мес · {ROSTERS_OFFER_TERM} мес. · 18%
            </p>
            <p className="v2-note">
              Ставка 18% = ключевая 14% + 1,5 п.п. продукт + 2,5 п.п. риск. Ориентир платежа до решения банка.
            </p>
            <button type="button" className="v2-link" onClick={() => goToScreen("apply")}>Другая сумма</button>
          </article>
        ) : (
          <article className="v2-card">
            <h2>{quiet ? "Тишина" : "Предложение"}</h2>
            <p className="v2-muted" style={{ marginTop: 8 }}>
              {quiet
                ? "Предложений кредита на главной нет. Лента ниже — про кассу, налоги и поставщиков."
                : "Карточка предложения появится после действия банка. Заявку можно начать и самим."}
            </p>
            <button type="button" className="v2-btn" style={{ marginTop: 14 }} onClick={() => setViewMode("bank")}>
              Что видит банк
            </button>
          </article>
        )}
      </section>

      <section className="v2-grid-3" style={{ marginTop: 12 }}>
        <article className="v2-card">
          <div className="v2-row">
            <h2 title={season ? "Лента сменилась вместе с сезоном" : undefined}>Лента</h2>
            <button type="button" className="v2-link" onClick={() => goToScreen("feeds")}>3 ленты</button>
          </div>
          <div className="v2-feed" style={{ marginTop: 12 }}>
            {(season && isRosters ? seasonNews() : dashboard.news_feed).map((item) => (
              <article key={item.id} className="v2-feed-card">
                <span className="v2-pill">{item.cluster}</span>
                <h3 style={{ marginTop: 8 }}>{item.title}</h3>
                <div className="why">
                  <span>Почему вы это видите</span>
                  {item.text}
                </div>
                <button type="button" className="v2-link" onClick={() => onNews(item)}>{item.cta} →</button>
              </article>
            ))}
          </div>
          <div className="v2-signal-strip">
            Банк видит {signalFor(company.demo_key).code}: {signalFor(company.demo_key).title}
          </div>
        </article>
        <article className="v2-card">
          <h2 title="Лето ниже октября. Это прогноз, не факт">Сезонность</h2>
          <div className="v2-bars" style={{ marginTop: 16 }}>
            {[40, 55, 70, 80, 90, 85, 48, 42, 60, 100, 78, 66].map((height, index) => (
              <i key={index} className={index === 6 || index === 7 ? "hot" : ""} style={{ height: `${height}%` }} />
            ))}
          </div>
          {isRosters ? (
            <p className="v2-note">
              Октябрь {formatMoney(company.monthly_revenue_alfa)} · июль, прогноз {formatMoney(JULY_REVENUE_FORECAST)}
            </p>
          ) : null}
        </article>
        <article className="v2-card">
          <div className="v2-row">
            <h2>Операции</h2>
            <button type="button" className="v2-link" onClick={() => goToScreen("payments")}>Все операции →</button>
          </div>
          <div style={{ marginTop: 8 }}>
            {dashboard.transactions.slice(0, 6).map((row) => (
              <div key={row.id} className="v2-check">
                <span>{row.description}</span>
                <strong className={row.direction === "IN" ? "green" : undefined}>
                  {row.direction === "IN" ? "+" : "−"}{formatMoney(row.amount_rub)}
                </strong>
              </div>
            ))}
          </div>
          {isRosters ? (
            <p className="v2-note">Оборудование за октябрь: {formatMoney(EQUIPMENT_TOTAL)} — поэтому банк предложил кредит.</p>
          ) : null}
          {isRosters ? (
            <ul className="v2-note">
              {ROSTERS_OBLIGATIONS.map((row) => (
                <li key={row.date}>{row.date} · {row.title} · {formatMoney(row.amount)}</li>
              ))}
            </ul>
          ) : null}
        </article>
      </section>
    </>
  );
}

function seasonNews(): NewsItem[] {
  return [
    {
      id: "season-city",
      title: "С 01.07 по 15.08 ремонт тротуара на Покровке, 11–21",
      text: "Проход мимо кофейни ниже — учли в прогнозе июля.",
      cta: "Как это в прогнозе",
      cluster: "Город",
      source: "SEASON",
      created_at: "",
    },
    {
      id: "season-drop",
      title: "Сезон: разрешение на летнюю веранду продлено до 30.09",
      text: "Летом веранда даёт кофейням в центре до трети выручки.",
      cta: "Оставить как есть",
      cluster: "Сезон",
      source: "SEASON",
      created_at: "",
    },
    {
      id: "season-buy",
      title: "Арабика подешевела на 4% за квартал",
      text: "Можно зафиксировать цену на осень.",
      cta: "К закупкам",
      cluster: "Закупки",
      source: "SEASON",
      created_at: "",
    },
  ];
}
