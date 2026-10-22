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

/** Б7 — 360°-ДНК клиента (index copy 10.html). */
export function Profile360Screen() {
  const { dashboard, application, goToScreen, isBusy } = useApp();

  // Нет данных или идёт сбор ДНК после смены клиента (copy 14 · Загрузка профиля).
  if (!dashboard || isBusy) {
    return <Profile360Skeleton />;
  }

  const company = dashboard.company;
  const years = Math.floor(company.age_months / 12);
  const isRosters = company.demo_key === "rosters";

  return (
    <>
      <div className="figma-eyebrow">Клиенты · 360°-ДНК бизнеса · собрано за 1,4 с</div>
      <h1 className="figma-h1" style={{ fontSize: 32, lineHeight: "40px" }}>
        {company.name}
      </h1>
      <p className="figma-lead">
        ИНН {company.inn}
        {isRosters ? " · ОГРН 1217700412345 · кофейни и обжарка · клиент Альфа-Банка с июня 2021." : ` · ${company.okved_cluster || company.okved_code} · ${company.city}${company.address ? `, ${company.address}` : ""}.`}
      </p>

      <div className="figma-check-grid" style={{ marginTop: 24 }}>
        <article className="figma-check-card">
          <header>
            <h3>ЕГРЮЛ</h3>
            <span className={`pill ${company.is_egrul_active ? "pill-good" : "pill-risk"}`}>
              {company.is_egrul_active ? "Действует" : "Стоп"}
            </span>
          </header>
          <ul className="check-list">
            <li>
              ОПФ {company.legal_form === "OOO" ? "ООО · МСП, микро" : "ИП"}
            </li>
            <li>
              Регистрация · {years} лет {company.age_months % 12} мес.
              {isRosters ? " · с 14.06.2021" : ""}
            </li>
            <li>Гендиректор: {company.director_name}</li>
            {isRosters ? <li>Учредители: Воронов А. С. 70% · Кравец М. И. 30%</li> : null}
            <li>
              ОКВЭД {company.okved_code}
              {isRosters ? " · доп. 10.83 обжарка" : company.okved_cluster ? ` · ${company.okved_cluster}` : ""}
            </li>
            <li>
              Адрес: {isRosters ? "Москва, ул. Покровка, 17" : `${company.city}${company.address ? `, ${company.address}` : ""}`}
            </li>
            {isRosters ? <li>Сотрудники: 9 · ФОТ 810 000 ₽ / мес.</li> : null}
          </ul>
        </article>

        <article className="figma-check-card">
          <header>
            <h3>Кредитная история</h3>
            <span className="pill pill-good">БКИ</span>
          </header>
          <ul className="check-list">
            <li>Просрочки за 24 мес.: {company.bki_overdue_days > 0 ? `${company.bki_overdue_days} дн.` : "нет"}</li>
            <li>Действующие кредиты: {isRosters ? "1 · автокредит, 18 400 ₽ / мес." : `${company.bki_history_months} мес. истории`}</li>
            <li>Запросы за 30 дней: {isRosters ? "2" : "—"}</li>
            <li>Балл БКИ: {isRosters ? "812 из 850" : "—"}</li>
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
            <span className="pill pill-warn">{dashboard.radar_triggers.length}</span>
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

      <div className="figma-grid-2" style={{ marginTop: 16 }}>
        <section className="figma-panel">
          <div className="figma-panel-title">Выручка · 24 месяца</div>
          <div className="figma-panel-heading">
            Сезонность: июль–август −31%
          </div>
          <RevenueBars />
          <p className="muted" style={{ marginTop: 12, fontSize: 13 }}>
            В низкий сезон 2026 спад меньше, чем в 2025: −31% против −33% — помогли доставка и корпоративные заказы.
          </p>
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

      <div className="dna-grid" style={{ marginTop: 16 }}>
        {dashboard.business_dna.blocks.map((block) => (
          <div key={block.code} className={`dna-card ${block.status}`}>
            <div className="dna-title">{block.title}</div>
            <div className="dna-value">{block.value}</div>
            <div className="dna-desc">{block.description}</div>
          </div>
        ))}
      </div>

      <div className="figma-footer-bar">
        <div>
          <strong>История предложений</strong>
          <div className="muted" style={{ fontSize: 13 }}>
            {application
              ? `Текущая: ${application.status_label} · ${formatMoney(application.requested_amount_rub)}`
              : "Активной заявки нет"}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" className="btn btn-ghost" onClick={() => goToScreen("bank-signal")}>
            Сигналы
          </button>
          <button type="button" className="btn btn-primary" onClick={() => goToScreen("bank-signal")}>
            Сформировать предложение
          </button>
        </div>
      </div>
    </>
  );
}
