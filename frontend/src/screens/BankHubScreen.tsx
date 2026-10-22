import { EventLog } from "../components/EventLog";
import { GeoPanel } from "../components/GeoPanel";
import { PnlPanel } from "../components/PnlPanel";
import { UnderwriterActions } from "../components/UnderwriterActions";
import { WaterfallChart } from "../components/WaterfallChart";
import { useApp } from "../state/AppState";
import type { ScreenId } from "../api/types";
import { formatMoney, formatPercent, formatDateTime } from "../utils/format";
import { COLLATERAL_LABELS } from "../api/client";
import { useMemo, useState } from "react";

const TABS: Array<{ id: ScreenId; label: string; badge?: number }> = [
  { id: "bank-queue", label: "Очередь" },
  { id: "bank-signal", label: "Сигналы" },
  { id: "bank-clients", label: "Клиенты" },
  { id: "bank-messages", label: "Сообщения" },
  { id: "bank-effect", label: "Эффект", badge: 3 },
  { id: "bank-xray", label: "Рентген" },
  { id: "bank-profile", label: "360°" },
];

type QueueFilter = "all" | "manual" | "anomaly" | "docs" | "counter";

/** Банковский конвейер: Б1 очередь по макету Figma 56:511 + остальные разделы. */
export function BankHubScreen() {
  const {
    screen,
    goToScreen,
    application,
    xray,
    companies,
    companyId,
    dashboard,
    selectCompany,
    cbrRate,
  } = useApp();
  const [filter, setFilter] = useState<QueueFilter>("all");

  const active: ScreenId = screen.startsWith("bank-") ? screen : "bank-queue";

  const queueRows = useMemo(() => {
    const statusByDemo: Record<
      string,
      { product: string; amount: number; score: number; status: string; tone: string; sla: string; assignee: string }
    > = {
      rosters: {
        product: "Кредит на развитие",
        amount: 2_500_000,
        score: 610,
        status: "Встречное предложение",
        tone: "risk",
        sla: "1 ч 12 мин",
        assignee: "ЕО",
      },
      kovalev: {
        product: "Оборотный кредит",
        amount: 800_000,
        score: 495,
        status: "Нужны документы",
        tone: "warn",
        sla: "24 мин",
        assignee: "ЕО",
      },
      tekhnostroy: {
        product: "ВКЛ",
        amount: 6_000_000,
        score: 760,
        status: "Аномалия → Мультибанк",
        tone: "info",
        sla: "2 ч 40 мин",
        assignee: "—",
      },
      smirnov: {
        product: "Кредит на развитие",
        amount: 1_500_000,
        score: 815,
        status: "Одобрено",
        tone: "good",
        sla: "Завершено",
        assignee: "АК",
      },
      bodrost: {
        product: "Оборотный кредит",
        amount: 3_000_000,
        score: 0,
        status: "Отказ · стоп-фактор",
        tone: "risk",
        sla: "Завершено",
        assignee: "АК",
      },
    };

    return companies.map((company) => {
      const demo = company.demo_key ?? "";
      const meta = statusByDemo[demo] ?? {
        product: "Кредит",
        amount: 1_000_000,
        score: 600,
        status: "В работе",
        tone: "warn",
        sla: "—",
        assignee: "—",
      };
      if (application && company.id === application.company.id) {
        return {
          ...company,
          product: application.product_label,
          amount: application.requested_amount_rub,
          score: application.risk_score,
          status: application.status_label,
          tone:
            application.status === "APPROVED" || application.status === "FUNDED"
              ? "good"
              : application.status === "REJECTED"
                ? "risk"
                : "warn",
          sla: "1 ч 12 мин",
          assignee: "ЕО",
        };
      }
      return { ...company, ...meta };
    });
  }, [companies, application]);

  const filtered = queueRows.filter((row) => {
    if (filter === "all") {
      return true;
    }
    if (filter === "manual") {
      return row.status.toLowerCase().includes("документ") || row.score < 520 && row.score > 0;
    }
    if (filter === "anomaly") {
      return row.status.toLowerCase().includes("аномал");
    }
    if (filter === "docs") {
      return row.status.toLowerCase().includes("документ");
    }
    if (filter === "counter") {
      return row.status.toLowerCase().includes("встреч") || row.status.toLowerCase().includes("counter");
    }
    return true;
  });

  return (
    <>
      <div className="bank-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`figma-nav-item ${active === tab.id ? "active" : ""}`}
            onClick={() => goToScreen(tab.id)}
            style={{ position: "relative" }}
          >
            {tab.label}
            {typeof tab.badge === "number" && <span className="figma-nav-badge">{tab.badge}</span>}
          </button>
        ))}
      </div>

      {active === "bank-queue" && (
        <>
          <div className="page-header">
            <div>
              <h1 className="figma-h1" style={{ fontSize: 32, lineHeight: "40px" }}>
                Очередь заявок
              </h1>
              <p className="figma-lead">
                {queueRows.length} заявок в работе. SLA для МСБ — 4 часа с момента подачи.
              </p>
            </div>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                const next = companies.find((c) => c.demo_key === "rosters") ?? companies[0];
                if (next) {
                  void selectCompany(next.id).then(() => goToScreen("bank-xray"));
                }
              }}
            >
              Взять следующую
            </button>
          </div>

          <div className="figma-kpi-row">
            <div className="figma-kpi">
              <div className="figma-kpi-label">Новых сегодня</div>
              <div className="figma-kpi-value">7</div>
              <div className="figma-kpi-delta">+3 к вчера</div>
            </div>
            <div className="figma-kpi">
              <div className="figma-kpi-label">Ручная проверка</div>
              <div className="figma-kpi-value">3</div>
              <div className="figma-kpi-delta">1 ждёт документы</div>
            </div>
            <div className="figma-kpi">
              <div className="figma-kpi-label">SLA под угрозой</div>
              <div className="figma-kpi-value">2</div>
              <div className="figma-kpi-delta">меньше 30 минут</div>
            </div>
            <div className="figma-kpi">
              <div className="figma-kpi-label">Одобрено сегодня</div>
              <div className="figma-kpi-value">14,2 млн ₽</div>
              <div className="figma-kpi-delta">11 заявок · демо</div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "20px 0 12px" }}>
            {(
              [
                ["all", `Все ${queueRows.length}`],
                ["manual", "Ручная проверка 3"],
                ["anomaly", "Аномалии 1"],
                ["docs", "Нужны документы 1"],
                ["counter", "Встречные 2"],
              ] as Array<[QueueFilter, string]>
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={`btn btn-sm ${filter === id ? "btn-secondary" : "btn-ghost"}`}
                onClick={() => setFilter(id)}
              >
                {label}
              </button>
            ))}
          </div>

          <section className="figma-panel figma-panel-sm">
            {filtered.length === 0 ? (
              <div className="empty-state">
                <h3>Фильтры без результатов</h3>
                <p>Сбросьте фильтр или возьмите следующую заявку.</p>
              </div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Клиент</th>
                    <th>Продукт</th>
                    <th>Сумма</th>
                    <th>RiskScore</th>
                    <th>Статус</th>
                    <th>SLA</th>
                    <th>Исполнитель</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row) => (
                    <tr key={row.id}>
                      <td style={{ color: "var(--text-primary)", fontWeight: 650 }}>{row.name}</td>
                      <td>{row.product}</td>
                      <td>{formatMoney(row.amount)}</td>
                      <td
                        className={
                          row.score >= 750 ? "green" : row.score === 0 ? "red" : undefined
                        }
                        style={{ fontWeight: 700 }}
                      >
                        {row.score}
                      </td>
                      <td>
                        <span
                          className={`pill ${
                            row.tone === "good"
                              ? "pill-good"
                              : row.tone === "risk"
                                ? "pill-risk"
                                : row.tone === "info"
                                  ? "pill-neutral"
                                  : "pill-warn"
                          }`}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td className={row.sla.includes("мин") && Number.parseInt(row.sla, 10) < 30 ? "red" : undefined}>
                        {row.sla}
                      </td>
                      <td>{row.assignee}</td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-sm btn-secondary"
                          onClick={() => {
                            void selectCompany(row.id).then(() => goToScreen("bank-xray"));
                          }}
                        >
                          Открыть
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </>
      )}

      {active === "bank-signal" && (
        <section className="figma-panel figma-panel-sm">
          <div className="figma-panel-title">Сигнал → проактивное предложение</div>
          <div className="figma-panel-heading">
            {dashboard ? dashboard.company.name : "Выберите клиента из очереди"}
          </div>
          {!dashboard ? (
            <div className="empty-state">
              <h3>Сигналов нет</h3>
            </div>
          ) : (
            <>
              <div className="radar-list" style={{ marginTop: 16 }}>
                {dashboard.radar_triggers.map((trigger) => (
                  <div key={trigger.code} className="radar-item">
                    <span className={`radar-dot ${trigger.severity}`} />
                    <div style={{ flex: 1 }}>
                      <div className="radar-title">{trigger.title}</div>
                      <div className="radar-value">{trigger.value}</div>
                    </div>
                    <span className="pill pill-outline">{trigger.action_label}</span>
                  </div>
                ))}
              </div>
              <div className="figma-offer-card">
                <strong>Рекомендация: кредит на развитие · 900 000 ₽ / 24 мес.</strong>
                <p>18,0% · ≈ 44 930 ₽/мес. · альтернативы: Альфа-Лизинг, овердрафт под разрыв.</p>
                <button type="button" className="btn btn-primary">
                  Отправить предложение клиенту
                </button>
              </div>
            </>
          )}
        </section>
      )}

      {active === "bank-xray" && (
        <>
          {!application ? (
            <div className="empty-state">
              <h3>Нет заявки для рентгена</h3>
              <p>Создайте заявку в кабинете клиента или откройте из очереди.</p>
              <button type="button" className="btn btn-primary" onClick={() => goToScreen("bank-queue")}>
                К очереди
              </button>
            </div>
          ) : (
            <>
              <div className="page-header">
                <div>
                  <h1 className="figma-h1" style={{ fontSize: 32, lineHeight: "40px" }}>
                    Рентген: {application.company.name}
                  </h1>
                  <p className="figma-lead">
                    RiskScore {application.risk_score} · {application.status_label} ·{" "}
                    {formatPercent(application.final_rate_pct)} · КС{" "}
                    {cbrRate === null ? "—" : formatPercent(cbrRate, 1)}
                  </p>
                </div>
              </div>
              {application.collateral_type !== "NONE" && (
                <div className="alert alert-info" style={{ marginBottom: 14 }}>
                  Обеспечение: {COLLATERAL_LABELS[application.collateral_type]} ·{" "}
                  {formatMoney(application.collateral_value_rub)} · {application.collateral_status}
                </div>
              )}
              <UnderwriterActions />
              {xray ? (
                <>
                  <section className="figma-panel figma-panel-sm section-gap">
                    <div className="figma-panel-title">P&L банка</div>
                    <div style={{ marginTop: 12 }}>
                      <PnlPanel pnl={xray.bank_pnl} />
                    </div>
                  </section>
                  <section className="figma-panel figma-panel-sm section-gap">
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <div className="figma-panel-title">Waterfall</div>
                      <span className="pill pill-risk">{xray.waterfall.final_score}</span>
                    </div>
                    <div style={{ marginTop: 12 }}>
                      <WaterfallChart
                        factors={xray.waterfall.factors}
                        finalScore={xray.waterfall.final_score}
                        rawScore={xray.waterfall.raw_score}
                      />
                    </div>
                  </section>
                  <div className="section-gap">
                    <GeoPanel xray={xray} />
                  </div>
                  <div className="section-gap">
                    <EventLog events={xray.events} />
                  </div>
                </>
              ) : (
                <div className="loading section-gap">
                  <span className="spinner" /> Загрузка рентгена…
                </div>
              )}
            </>
          )}
        </>
      )}

      {active === "bank-messages" && (
        <section className="figma-panel figma-panel-sm">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div className="figma-panel-title">Входящие</div>
              <div className="figma-panel-heading">Без исполнителя / мои</div>
            </div>
            <button type="button" className="btn btn-primary btn-sm">
              Взять в работу
            </button>
          </div>
          {application ? (
            <div className="radar-item" style={{ marginTop: 16 }}>
              <span className="radar-dot WARN" />
              <div>
                <div className="radar-title">Диалог · {application.company.name}</div>
                <div className="radar-value">
                  Заявка {application.application_id.slice(-8)} · {application.status_label} ·{" "}
                  {formatDateTime(application.updated_at)}
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <h3>Входящие пусты</h3>
            </div>
          )}
        </section>
      )}

      {active === "bank-effect" && (
        <section className="figma-panel figma-panel-sm">
          <div className="figma-panel-title">Эффект для банка</div>
          <div className="figma-panel-heading">Демо-KPI из BRD v3.3</div>
          <div className="figma-kpi-row" style={{ marginTop: 20 }}>
            <div className="figma-kpi">
              <div className="figma-kpi-label">Time-to-Yes</div>
              <div className="figma-kpi-value">5 сек</div>
              <div className="figma-kpi-delta">было 3 дня</div>
            </div>
            <div className="figma-kpi">
              <div className="figma-kpi-label">Drop-off</div>
              <div className="figma-kpi-value">−38%</div>
              <div className="figma-kpi-delta">воронка выдачи</div>
            </div>
            <div className="figma-kpi">
              <div className="figma-kpi-label">Спасённые заявки</div>
              <div className="figma-kpi-value">+24%</div>
              <div className="figma-kpi-delta">через контр-офферы</div>
            </div>
            <div className="figma-kpi">
              <div className="figma-kpi-label">Ранний NPL</div>
              <div className="figma-kpi-value">1,4%</div>
              <div className="figma-kpi-delta">было 2,3%</div>
            </div>
          </div>
        </section>
      )}

      {active === "bank-clients" && (
        <section className="figma-panel figma-panel-sm">
          <div className="figma-panel-title">Клиенты</div>
          <div className="figma-panel-heading">Портфель · {companies.length} компаний</div>
          <table className="table" style={{ marginTop: 16 }}>
            <thead>
              <tr>
                <th>Компания</th>
                <th>ОКВЭД</th>
                <th>Остаток</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {companies.map((company) => (
                <tr key={company.id}>
                  <td style={{ color: "var(--text-primary)", fontWeight: 650 }}>{company.name}</td>
                  <td>{company.okved_code}</td>
                  <td>{formatMoney(company.account_balance)}</td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-sm btn-secondary"
                      onClick={() => {
                        void selectCompany(company.id).then(() => goToScreen("bank-profile"));
                      }}
                    >
                      360°
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {active === "bank-profile" && (
        <section className="figma-panel figma-panel-sm">
          <div className="figma-panel-title">Профиль 360°</div>
          <div className="figma-panel-heading">{dashboard?.company.name ?? "Клиент не выбран"}</div>
          {!dashboard ? (
            <div className="loading" style={{ marginTop: 16 }}>
              <span className="spinner" /> Сбор ДНК…
            </div>
          ) : (
            <div className="dna-grid" style={{ marginTop: 16 }}>
              {dashboard.business_dna.blocks.map((block) => (
                <div key={block.code} className={`dna-card ${block.status}`}>
                  <div className="dna-title">{block.title}</div>
                  <div className="dna-value">{block.value}</div>
                  <div className="dna-desc">{block.description}</div>
                </div>
              ))}
            </div>
          )}
          {companyId && (
            <button
              type="button"
              className="btn btn-primary"
              style={{ marginTop: 16 }}
              onClick={() => goToScreen("bank-signal")}
            >
              Сформировать предложение
            </button>
          )}
        </section>
      )}
    </>
  );
}
