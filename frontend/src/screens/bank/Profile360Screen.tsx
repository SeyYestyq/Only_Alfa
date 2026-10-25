import { RevenueBars } from "../../components/RevenueBars";
import { Profile360Skeleton } from "../../components/Skeleton";
import { useApp } from "../../state/AppState";
import { formatMoney } from "../../utils/format";

const OBLIGATIONS = [
  { date: "25.10", title: "Зарплата, 2-я часть", amount: 410_000 },
  { date: "28.10", title: "ЕНП", amount: 176_000 },
  { date: "01.11", title: "Аренда, ул. Покровка", amount: 140_000 },
  { date: "13.11", title: "ООО «Арабика Трейд»", amount: 240_000 },
  { date: "28.11", title: "ЕНП", amount: 182_000 },
];

/** Б7 — 360°: портрет → заявки → детали. */
export function Profile360Screen() {
  const { dashboard, application, goToScreen, isBusy } = useApp();

  if (!dashboard || isBusy) {
    return <Profile360Skeleton />;
  }

  const company = dashboard.company;
  const years = Math.floor(company.age_months / 12);
  const isRosters = company.demo_key === "rosters";
  const triggerCount = dashboard.radar_triggers.length;
  const hasStop = !company.is_egrul_active || company.fssp_amount > 0;

  return (
    <>
      <div className="bank-page-head">
        <div>
          <div className="figma-eyebrow">Клиент · портрет 360°</div>
          <h1 className="figma-h1">{company.name}</h1>
          <p className="figma-lead">
            ИНН {company.inn}
            {isRosters
              ? " · ОГРН 1217700412345 · кофейни и обжарка · клиент с июня 2021."
              : ` · ${company.okved_cluster || company.okved_code} · ${company.city}${company.address ? `, ${company.address}` : ""}.`}
          </p>
          <div className="bank-portrait-flags" style={{ marginTop: 12 }}>
            <span className={`pill ${company.is_egrul_active ? "pill-good" : "pill-risk"}`}>
              ЕГРЮЛ · {company.is_egrul_active ? "действует" : "стоп"}
            </span>
            <span className={`pill ${company.bki_overdue_days > 0 ? "pill-risk" : "pill-good"}`}>
              БКИ · {company.bki_overdue_days > 0 ? `${company.bki_overdue_days} дн. просрочки` : "чисто"}
            </span>
            <span className={`pill ${triggerCount > 0 ? "pill-warn" : "pill-outline"}`}>
              Сигналы · {triggerCount}
            </span>
            {hasStop ? <span className="pill pill-risk">Есть стоп-фактор</span> : null}
          </div>
        </div>
      </div>

      <div className="bank-portrait">
        <section className="figma-panel figma-panel-sm bank-portrait-main">
          <div className="figma-panel-title">Портрет</div>
          <div className="kv-list">
            <div className="meta-row">
              <span>Руководитель</span>
              <strong>{company.director_name}</strong>
            </div>
            <div className="meta-row">
              <span>Возраст бизнеса</span>
              <strong>
                {years} лет {company.age_months % 12} мес.
              </strong>
            </div>
            <div className="meta-row">
              <span>ОКВЭД</span>
              <strong>
                {company.okved_code}
                {company.okved_cluster ? ` · ${company.okved_cluster}` : ""}
              </strong>
            </div>
            <div className="meta-row">
              <span>Остаток на счёте</span>
              <strong>{formatMoney(dashboard.account_balance)}</strong>
            </div>
            <div className="meta-row">
              <span>ФССП</span>
              <strong>{company.fssp_amount > 0 ? formatMoney(company.fssp_amount) : "нет"}</strong>
            </div>
          </div>
        </section>

        <section className="figma-panel figma-panel-sm bank-apps-block">
          <div className="figma-panel-title">Заявки и действия</div>
          {application ? (
            <div className="bank-decision-card is-warn" style={{ marginBottom: 12, padding: 14 }}>
              <div className="bank-decision-kicker">Активная заявка</div>
              <strong style={{ fontSize: 16 }}>
                № {application.application_id.slice(-8).toUpperCase()} ·{" "}
                {formatMoney(application.requested_amount_rub)}
              </strong>
              <p className="bank-decision-text" style={{ marginBottom: 10 }}>
                {application.status_label} · риск {application.risk_score || "стоп"}
              </p>
              <div className="bank-decision-cta">
                <button type="button" className="btn btn-primary primary-cta" onClick={() => goToScreen("bank-xray")}>
                  Разбор заявки
                </button>
              </div>
            </div>
          ) : (
            <div className="bank-decision-card is-warn" style={{ marginBottom: 12, padding: 14 }}>
              <div className="bank-decision-kicker">Что сделать</div>
              <strong style={{ fontSize: 16 }}>Активной заявки нет</strong>
              <p className="bank-decision-text" style={{ marginBottom: 10 }}>
                Можно сформировать предложение по свежему сигналу в платежах.
              </p>
              <div className="bank-decision-cta">
                <button type="button" className="btn btn-primary" onClick={() => goToScreen("bank-queue")}>
                  К очереди заявок
                </button>
              </div>
            </div>
          )}
          <ul className="check-list">
            {dashboard.radar_triggers.slice(0, 3).map((trigger) => (
              <li key={trigger.code}>
                {trigger.title}: {trigger.value}
              </li>
            ))}
            {dashboard.radar_triggers.length === 0 ? <li className="muted">Свежих сигналов нет</li> : null}
          </ul>
        </section>
      </div>

      <section className="figma-panel figma-panel-sm" style={{ marginBottom: 16 }}>
        <div className="figma-panel-title">360°-ДНК бизнеса</div>
        <p className="muted" style={{ marginTop: 4, marginBottom: 12, fontSize: 13 }}>
          Пять блоков Business DNA за 1–2 с после выбора компании (BRD).
        </p>
        <div className="dna-grid">
          {dashboard.business_dna.blocks.map((block) => (
            <div key={block.code} className={`dna-card ${block.status}`}>
              <div className="dna-title">{block.title}</div>
              <div className="dna-value">{block.value}</div>
              <div className="dna-desc">{block.description}</div>
            </div>
          ))}
        </div>
      </section>

      <div className="figma-check-grid">
        <article className="figma-check-card">
          <header>
            <h3>ЕГРЮЛ</h3>
            <span className={`pill ${company.is_egrul_active ? "pill-good" : "pill-risk"}`}>
              {company.is_egrul_active ? "Действует" : "Стоп"}
            </span>
          </header>
          <ul className="check-list">
            <li>ОПФ {company.legal_form === "OOO" ? "ООО · МСП, микро" : "ИП"}</li>
            <li>
              Регистрация · {years} лет {company.age_months % 12} мес.
              {isRosters ? " · с 14.06.2021" : ""}
            </li>
            <li>Гендиректор: {company.director_name}</li>
            {isRosters ? <li>Учредители: Воронов А. С. 70% · Кравец М. И. 30%</li> : null}
            <li>
              Адрес:{" "}
              {isRosters
                ? "Москва, ул. Покровка, 17"
                : `${company.city}${company.address ? `, ${company.address}` : ""}`}
            </li>
          </ul>
        </article>

        <article className="figma-check-card">
          <header>
            <h3>Кредитная история</h3>
            <span className="pill pill-good">БКИ</span>
          </header>
          <ul className="check-list">
            <li>Просрочки за 24 мес.: {company.bki_overdue_days > 0 ? `${company.bki_overdue_days} дн.` : "нет"}</li>
            <li>
              Действующие кредиты:{" "}
              {isRosters ? "1 · автокредит, 18 400 ₽ / мес." : `${company.bki_history_months} мес. истории`}
            </li>
            <li>Запросы за 30 дней: {isRosters ? "2" : "—"}</li>
            <li>
              ФССП: {company.fssp_amount > 0 ? formatMoney(company.fssp_amount) : "производств нет"}
            </li>
          </ul>
        </article>

        <article className="figma-check-card">
          <header>
            <h3>Продукты в Альфа</h3>
            <span className="pill pill-outline">РКО</span>
          </header>
          <ul className="check-list">
            <li>Расчётный счёт · остаток {formatMoney(dashboard.account_balance)}</li>
            <li>Эквайринг / зарплатный проект — по ДНК бизнеса</li>
            <li>
              Кредит:{" "}
              {application
                ? `заявка № ${application.application_id.slice(-8).toUpperCase()}`
                : "нет активной"}
            </li>
          </ul>
        </article>

        <article className="figma-check-card">
          <header>
            <h3>Сигналы</h3>
            <span className="pill pill-warn">{triggerCount}</span>
          </header>
          <ul className="check-list">
            {dashboard.radar_triggers.slice(0, 3).map((trigger) => (
              <li key={trigger.code}>
                {trigger.title}: {trigger.value}
              </li>
            ))}
          </ul>
        </article>
      </div>

      <details className="bank-collapse">
        <summary>
          <span>
            Выручка и обязательства
            <span className="muted"> · детали ниже сгиба</span>
          </span>
        </summary>
        <div className="bank-collapse-body">
          <div className="figma-grid-2" style={{ marginTop: 12 }}>
            <section className="figma-panel">
              <div className="figma-panel-title">Выручка · 24 месяца</div>
              <div className="figma-panel-heading">Сезонность: июль–август −31%</div>
              <RevenueBars />
            </section>
            <section className="figma-panel figma-panel-sm">
              <div className="figma-panel-title">Обязательства · 60 дней</div>
              <div className="obligations-list">
                {OBLIGATIONS.map((row) => (
                  <div key={row.date + row.title} className="obligation-row">
                    <span className="date">{row.date}</span>
                    <span>{row.title}</span>
                    <span className="amount">{formatMoney(row.amount)}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </details>
    </>
  );
}
