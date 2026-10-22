import { useMemo, useState } from "react";
import type { ProductType } from "../../api/types";
import { BankEmptyState, QueueSkeleton } from "../../components/Skeleton";
import { useApp } from "../../state/AppState";
import { formatMoney } from "../../utils/format";

type QueueFilter = "all" | "manual" | "anomaly" | "docs" | "counter";

type DemoCase = {
  product: string;
  productType: ProductType;
  amount: number;
  term: number;
  score: number;
  status: string;
  tone: string;
  sla: string;
  assignee: string;
  revenue: number;
};

const DEMO_CASES: Record<string, DemoCase> = {
  rosters: {
    product: "Кредит на развитие",
    productType: "INVEST_LEASING",
    amount: 2_500_000,
    term: 12,
    score: 610,
    status: "Встречное предложение",
    tone: "risk",
    sla: "1 ч 12 мин",
    assignee: "ЕО",
    revenue: 2_100_000,
  },
  kovalev: {
    product: "Оборотный кредит",
    productType: "VKL",
    amount: 800_000,
    term: 12,
    score: 495,
    status: "Нужны документы",
    tone: "warn",
    sla: "24 мин",
    assignee: "ЕО",
    revenue: 900_000,
  },
  tekhnostroy: {
    product: "ВКЛ",
    productType: "VKL",
    amount: 6_000_000,
    term: 24,
    score: 760,
    status: "Аномалия → Мультибанк",
    tone: "info",
    sla: "2 ч 40 мин",
    assignee: "—",
    revenue: 1_800_000,
  },
  smirnov: {
    product: "Кредит на развитие",
    productType: "INVEST_LEASING",
    amount: 1_500_000,
    term: 24,
    score: 815,
    status: "Одобрено",
    tone: "good",
    sla: "выполнен",
    assignee: "АК",
    revenue: 1_200_000,
  },
  bodrost: {
    product: "Оборотный кредит",
    productType: "VKL",
    amount: 3_000_000,
    term: 12,
    score: 0,
    status: "Отказ · стоп-фактор",
    tone: "risk",
    sla: "выполнен",
    assignee: "АК",
    revenue: 700_000,
  },
};

/** Б1 — Очередь заявок (index copy 4.html + состояния copy 11). */
export function QueueScreen() {
  const { companies, application, openBankCase, isBusy, isReady } = useApp();
  const [filter, setFilter] = useState<QueueFilter>("all");
  const [query, setQuery] = useState("");
  const showSkeleton = !isReady || (isBusy && companies.length === 0);

  const queueRows = useMemo(() => {
    return companies.map((company) => {
      const demo = company.demo_key ?? "";
      const meta = DEMO_CASES[demo] ?? {
        product: "Кредит",
        productType: "VKL" as ProductType,
        amount: 1_000_000,
        term: 12,
        score: 600,
        status: "В работе",
        tone: "warn",
        sla: "—",
        assignee: "—",
        revenue: company.account_balance,
      };
      if (application && company.id === application.company.id) {
        return {
          ...company,
          product: application.product_label,
          productType: application.product_type,
          amount: application.requested_amount_rub,
          term: application.term_months,
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
          revenue: application.monthly_revenue_alfa || meta.revenue,
        };
      }
      return { ...company, ...meta };
    });
  }, [companies, application]);

  const filtered = queueRows.filter((row) => {
    const hay = `${row.name} ${row.inn}`.toLowerCase();
    if (query.trim() && !hay.includes(query.trim().toLowerCase())) {
      return false;
    }
    if (filter === "manual") {
      return row.status.toLowerCase().includes("документ") || (row.score < 520 && row.score > 0);
    }
    if (filter === "anomaly") {
      return row.status.toLowerCase().includes("аномал");
    }
    if (filter === "docs") {
      return row.status.toLowerCase().includes("документ");
    }
    if (filter === "counter") {
      return row.status.toLowerCase().includes("встреч");
    }
    return true;
  });

  const counts = {
    all: queueRows.length,
    manual: queueRows.filter((r) => r.status.toLowerCase().includes("документ") || (r.score < 520 && r.score > 0))
      .length,
    anomaly: queueRows.filter((r) => r.status.toLowerCase().includes("аномал")).length,
    docs: queueRows.filter((r) => r.status.toLowerCase().includes("документ")).length,
    counter: queueRows.filter((r) => r.status.toLowerCase().includes("встреч")).length,
  };

  function openCase(row: (typeof queueRows)[number]) {
    void openBankCase(row.id, {
      product_type: row.productType,
      requested_amount_rub: row.amount,
      term_months: row.term,
      declared_monthly_revenue: row.revenue,
    });
  }

  return (
    <>
      <div className="page-header">
        <div>
          <div className="figma-eyebrow">Малый бизнес · Москва</div>
          <h1 className="figma-h1" style={{ fontSize: 32, lineHeight: "40px" }}>
            Очередь заявок
          </h1>
          <p className="figma-lead">
            {queueRows.length} заявок в работе. SLA по малому бизнесу — 4 часа с момента отправки.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            const next =
              queueRows.find((row) => row.demo_key === "rosters") ??
              queueRows.find((row) => row.sla.includes("мин")) ??
              queueRows[0];
            if (next) {
              openCase(next);
            }
          }}
        >
          Взять следующую
        </button>
      </div>

      <div className="bank-toolbar">
        <div className="bank-filters">
          {(
            [
              ["all", `Все`, counts.all],
              ["manual", "Ручная проверка", counts.manual],
              ["anomaly", "Аномалии", counts.anomaly],
              ["docs", "Нужны документы", counts.docs],
              ["counter", "Встречные", counts.counter],
            ] as Array<[QueueFilter, string, number]>
          ).map(([id, label, count]) => (
            <button
              key={id}
              type="button"
              className={`bank-chip ${filter === id ? "active" : ""}`}
              onClick={() => setFilter(id)}
            >
              {label}
              <span>{count}</span>
            </button>
          ))}
        </div>
        <input
          className="bank-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="ИНН или название"
        />
      </div>

      {showSkeleton ? (
        <QueueSkeleton />
      ) : companies.length === 0 ? (
        <BankEmptyState
          title="Очередь пуста"
          text="Все заявки разобраны. Новые появятся здесь автоматически."
        />
      ) : (
      <section className="figma-panel figma-panel-sm bank-queue">
        {filtered.length === 0 ? (
          <BankEmptyState
            title="Ничего не найдено"
            text="По выбранным фильтрам заявок нет."
          />
        ) : (
          <table className="ops-table">
            <thead>
              <tr>
                <th>Клиент</th>
                <th>Продукт</th>
                <th>Сумма</th>
                <th>RiskScore</th>
                <th>Статус</th>
                <th>SLA ↑</th>
                <th>Исполнитель</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.id}>
                  <td>
                    <strong>{row.name}</strong>
                    <div className="muted" style={{ fontSize: 12 }}>
                      ИНН {row.inn} · {row.okved_cluster || row.okved_code}
                    </div>
                  </td>
                  <td>{row.product}</td>
                  <td>{formatMoney(row.amount)}</td>
                  <td
                    style={{ fontWeight: 700 }}
                    className={row.score === 0 ? "red" : row.score >= 750 ? "green" : undefined}
                  >
                    {row.score || "—"}
                  </td>
                  <td>
                    <span
                      className={`pill ${
                        row.tone === "good"
                          ? "pill-good"
                          : row.tone === "risk"
                            ? "pill-risk"
                            : row.tone === "info"
                              ? "pill-outline"
                              : "pill-warn"
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td
                    className={
                      row.sla.includes("мин") && Number.parseInt(row.sla, 10) < 30 ? "red" : undefined
                    }
                  >
                    {row.sla}
                  </td>
                  <td>
                    <span className="chat-avatar" style={{ width: 28, height: 28, fontSize: 10 }}>
                      {row.assignee}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-sm btn-secondary"
                      onClick={() => openCase(row)}
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
      )}
    </>
  );
}
