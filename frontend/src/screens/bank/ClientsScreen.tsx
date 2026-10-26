import { useState } from "react";
import { AccountsStrip } from "../../components/AccountsStrip";
import { CashForecastChart } from "../../components/CashForecastChart";
import { ClientCapexSignal } from "../../components/ClientCapexSignal";
import { DnaPanel } from "../../components/DnaPanel";
import { RadarPanel } from "../../components/RadarPanel";
import { BankEmptyState, ClientsSkeleton } from "../../components/Skeleton";
import { TransactionsPanel } from "../../components/TransactionsPanel";
import { useApp } from "../../state/AppState";
import { useBankMessagesStore } from "../../state/bankMessagesStore";
import { formatMoney, formatPercent } from "../../utils/format";
import type { Application, CompanyBrief } from "../../api/types";
import "../../styles/bank-clients.css";

interface ClientAppBadge {
  hasApp: boolean;
  dotColor: "orange" | "yellow" | "blue" | "green" | "red" | "gray";
  label: string;
  badgeClass: string;
  stageLabel: string;
  detailText: string;
  amountLabel: string;
}

const DEMO_SCENARIOS: Record<string, any> = {
  rosters: {
    product_type: "INVEST_LEASING",
    requested_amount_rub: 2_500_000,
    term_months: 12,
    declared_monthly_revenue: 2_100_000,
  },
  tekhnostroy: {
    product_type: "VKL",
    requested_amount_rub: 3_200_000,
    term_months: 24,
    declared_monthly_revenue: 6_000_000,
  },
  kovalev: {
    product_type: "OVERDRAFT",
    requested_amount_rub: 200_000,
    term_months: 12,
    declared_monthly_revenue: 680_000,
  },
  smirnov: {
    product_type: "INVEST_LEASING",
    requested_amount_rub: 900_000,
    term_months: 24,
    declared_monthly_revenue: 1_450_000,
  },
  bodrost: {
    product_type: "INVEST_LEASING",
    requested_amount_rub: 1_500_000,
    term_months: 12,
    declared_monthly_revenue: 400_000,
  },
  bodrost_plus: {
    product_type: "INVEST_LEASING",
    requested_amount_rub: 1_500_000,
    term_months: 12,
    declared_monthly_revenue: 400_000,
  },
};

function getClientAppBadge(
  company: CompanyBrief,
  liveApp?: Application | null,
): ClientAppBadge {
  const key = (company.demo_key || company.id || "").toLowerCase();

  // Если в системе загружена актуальная заявка именно этой компании
  if (liveApp && (liveApp.company.id === company.id || liveApp.company.inn === company.inn)) {
    const isRisk =
      liveApp.status === "REJECTED" || liveApp.status === "ANOMALY_VERIFICATION";
    const isWarn =
      liveApp.status === "MANUAL_REVIEW" || liveApp.status === "NEED_MORE_INFO";
    const isGood =
      liveApp.status === "APPROVED" || liveApp.status === "FUNDED";

    return {
      hasApp: true,
      dotColor: isRisk ? "red" : isWarn ? "orange" : isGood ? "green" : "blue",
      label: `Заявка ${formatMoney(liveApp.requested_amount_rub)} · ${liveApp.status_label}`,
      badgeClass: isRisk ? "is-risk" : isWarn ? "is-warn" : isGood ? "is-good" : "is-info",
      stageLabel: liveApp.status_label,
      detailText: `Скоринг ${liveApp.risk_score} · ${liveApp.status_label} · Срок ${liveApp.term_months} мес.`,
      amountLabel: formatMoney(liveApp.requested_amount_rub),
    };
  }

  if (key.includes("rosters")) {
    return {
      hasApp: true,
      dotColor: "orange",
      label: "Заявка 2,5 млн ₽ · Ручной разбор",
      badgeClass: "is-warn",
      stageLabel: "Ручной разбор (Серый коридор)",
      detailText: "Скоринг 610 · Запрошено поручительство учредителя или залог оборудования",
      amountLabel: "2 500 000 ₽",
    };
  }
  if (key.includes("tekhnostroy")) {
    return {
      hasApp: true,
      dotColor: "yellow",
      label: "Заявка 5,6 млн ₽ · Аномалия",
      badgeClass: "is-warn",
      stageLabel: "Аномалия Мультибанка",
      detailText: "Скоринг 760 · Расхождение кассы -34% между Альфой и декларацией",
      amountLabel: "5 600 000 ₽",
    };
  }
  if (key.includes("kovalev")) {
    return {
      hasApp: true,
      dotColor: "blue",
      label: "Заявка 600 тыс ₽ · Документы",
      badgeClass: "is-info",
      stageLabel: "Документы получены",
      detailText: "Скоринг 495 · Клиент прикрепил Договор аренды помещения № 14-А",
      amountLabel: "600 000 ₽",
    };
  }
  if (key.includes("smirnov")) {
    return {
      hasApp: true,
      dotColor: "green",
      label: "Заявка 900 тыс ₽ · Одобрено",
      badgeClass: "is-good",
      stageLabel: "Одобрено (Авто-скоринг)",
      detailText: "Скоринг 815 · Кредит одобрен под 16.5% годовых, ожидает подписания КЭП",
      amountLabel: "900 000 ₽",
    };
  }
  if (key.includes("bodrost")) {
    return {
      hasApp: true,
      dotColor: "red",
      label: "Стоп-фактор · ФССП 1,4 млн ₽",
      badgeClass: "is-risk",
      stageLabel: "Отказ (Hard Stop)",
      detailText: "Скоринг 0 · Открытые исполнительные производства ФССП на 1 420 000 ₽",
      amountLabel: "1 500 000 ₽",
    };
  }

  return {
    hasApp: false,
    dotColor: "gray",
    label: "Без открытой заявки",
    badgeClass: "is-muted",
    stageLabel: "Нет заявки",
    detailText: "Клиент обслуживается в банке без открытых кредитных заявок",
    amountLabel: "—",
  };
}

/**
 * Б6 — Клиенты банка (Master-Detail 360° по макету Figma).
 * Слева — выбор компании из портфеля со статусной точкой заявки.
 * Справа — 360°-аналитика бизнеса: баннер заявки, счета, ДНК, прогноз кассы 60 дней,
 * сигнал по платежам, радар и выписка.
 */
export function ClientsScreen() {
  const {
    companies,
    companyId,
    dashboard,
    selectCompany,
    isBusy,
    isReady,
    application,
    openApplication,
    openBankCase,
    goToScreen,
  } = useApp();

  const setActiveChatThread = useBankMessagesStore((state) => state.setActiveThread);
  const [query, setQuery] = useState("");
  const showSkeleton = !isReady || (isBusy && companies.length === 0);

  const filteredCompanies = companies.filter((c) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return `${c.name} ${c.inn} ${c.okved_code} ${c.okved_cluster}`.toLowerCase().includes(q);
  });

  const selectedCompany = companies.find((c) => c.id === companyId) ?? companies[0];
  const selectedBadge = selectedCompany ? getClientAppBadge(selectedCompany, application) : null;

  const handleOpenDesk = (company: CompanyBrief) => {
    const key = (company.demo_key || company.id).replace("cmp_", "");
    const scenario = DEMO_SCENARIOS[key] ?? {
      product_type: "INVEST_LEASING",
      requested_amount_rub: 1_000_000,
      term_months: 12,
      declared_monthly_revenue: 1_500_000,
    };
    void openBankCase(company.id, scenario);
  };

  const handleOpenChat = (company: CompanyBrief) => {
    const key = (company.demo_key || company.id).replace("cmp_", "");
    setActiveChatThread(key);
    void selectCompany(company.id, { nextScreen: "bank-messages" });
  };

  return (
    <div className="bank-clients-page">
      <div className="bank-page-head">
        <div>
          <div className="figma-eyebrow">Пилот банка · Клиенты и заявки</div>
          <h1 className="figma-h1">Клиенты банка</h1>
          <p className="figma-lead">
            Статусные точки показывают входящие заявки клиентов · откройте досье для разбора
          </p>
        </div>
        <div className="bank-toolbar">
          <input
            className="bank-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск по названию или ИНН"
            aria-label="Поиск по клиентам"
          />
        </div>
      </div>

      {showSkeleton ? (
        <ClientsSkeleton />
      ) : companies.length === 0 ? (
        <BankEmptyState
          title="В портфеле нет клиентов"
          text="Подключите демо-компании или выполните поиск по ИНН."
        />
      ) : (
        <div className="bank-split">
          {/* Левая колонка: список клиентов с точками заявок */}
          <aside className="bank-clients-sidebar">
            <div className="card-header">
              <div>
                <h2 className="card-title">Все клиенты</h2>
                <div className="card-subtitle">{filteredCompanies.length} в портфеле</div>
              </div>
            </div>
            <ul className="client-list">
              {filteredCompanies.map((company) => {
                const isSelected = companyId === company.id;
                const badge = getClientAppBadge(company, application);

                return (
                  <li key={company.id}>
                    <button
                      type="button"
                      className={`client-row ${isSelected ? "active" : ""}`}
                      disabled={isBusy}
                      onClick={() => void selectCompany(company.id)}
                    >
                      <div className="client-info">
                        <strong>{company.name}</strong>
                        <div className="client-meta">
                          ИНН {company.inn} · {company.legal_form === "IP" ? "ИП" : "ООО"}
                        </div>
                        {badge.hasApp && (
                          <div className={`client-app-dot-badge ${badge.badgeClass}`}>
                            <span className={`status-dot dot-${badge.dotColor}`} />
                            <span>{badge.label}</span>
                          </div>
                        )}
                      </div>
                      <div className="client-balance">
                        {formatMoney(company.account_balance)}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </aside>

          {/* Правая колонка: 360° досье выбранного клиента */}
          <main className="bank-client-detail">
            {!dashboard ? (
              <div className="card" style={{ padding: 32, textAlign: "center" }}>
                <h3>Выберите клиента слева</h3>
                <p className="v2-muted">
                  Здесь откроется детальное 360°-досье, прогноз кассы на 60 дней и финансовый радар.
                </p>
              </div>
            ) : (
              <>
                {/* Шапка клиента */}
                <div className="bank-detail-head">
                  <div>
                    <h2 className="bank-detail-title">{dashboard.company.name}</h2>
                    <p className="bank-detail-sub">
                      {dashboard.company.director_name} · выручка{" "}
                      {formatMoney(dashboard.company.monthly_revenue_alfa)}/мес. · рост{" "}
                      {formatPercent(dashboard.company.revenue_growth_pct, 0)} · гео{" "}
                      {dashboard.company.geo_score}
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    {selectedCompany && (
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleOpenChat(selectedCompany)}
                      >
                        Чат с клиентом
                      </button>
                    )}
                    {selectedBadge?.hasApp && selectedCompany && (
                      <button
                        type="button"
                        className="bank-btn-action"
                        onClick={() => handleOpenDesk(selectedCompany)}
                      >
                        Стол разбора →
                      </button>
                    )}
                  </div>
                </div>

                {/* Баннер активной заявки со статусной точкой и действиями */}
                {selectedBadge?.hasApp && selectedCompany && (
                  <div className="bank-active-app-banner">
                    <div className="banner-text">
                      <div className="banner-title-row">
                        <span className={`status-dot dot-${selectedBadge.dotColor}`} />
                        <strong>{selectedBadge.label}</strong>
                        <span className={`status-tag ${selectedBadge.badgeClass}`}>
                          {selectedBadge.stageLabel}
                        </span>
                      </div>
                      <p className="banner-desc">{selectedBadge.detailText}</p>
                    </div>
                    <div className="banner-actions">
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => handleOpenDesk(selectedCompany)}
                      >
                        К столу разбора →
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleOpenChat(selectedCompany)}
                      >
                        Чат
                      </button>
                    </div>
                  </div>
                )}

                {/* 3 карточки счетов */}
                <AccountsStrip dashboard={dashboard} />

                {/* 360°-ДНК бизнеса */}
                <DnaPanel dashboard={dashboard} />

                {/* Прогноз кассы на 60 дней */}
                <section className="card">
                  <div className="card-header">
                    <div>
                      <h2 className="card-title">Прогноз кассы</h2>
                      <p className="card-subtitle">Риск разрыва глазами банка</p>
                    </div>
                    <div className="card-actions">
                      <span className={`pill ${dashboard.cash_forecast.has_gap ? "pill-risk" : "pill-good"}`}>
                        {dashboard.cash_forecast.has_gap ? "Кассовый разрыв" : "Разрыва нет"}
                      </span>
                    </div>
                  </div>
                  <div className="card-body">
                    <CashForecastChart forecast={dashboard.cash_forecast} />
                  </div>
                </section>

                <ClientCapexSignal />

                {/* Финансовый радар */}
                <RadarPanel triggers={dashboard.radar_triggers} />

                {/* Все операции выписки */}
                <TransactionsPanel transactions={dashboard.transactions} variant="bank" />
              </>
            )}
          </main>
        </div>
      )}
    </div>
  );
}
