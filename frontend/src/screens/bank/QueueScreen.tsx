import { useMemo, useState } from "react";
import type { ProductType } from "../../api/types";
import { BankEmptyState, QueueSkeleton } from "../../components/Skeleton";
import { useApp } from "../../state/AppState";
import { formatMoney } from "../../utils/format";

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

const TONE_PRIORITY: Record<string, number> = {
  risk: 0,
  warn: 1,
  info: 2,
  good: 3,
};

function slaMinutes(sla: string): number {
  if (sla.includes("выполнен")) {
    return Number.POSITIVE_INFINITY;
  }
  const hours = /(\d+)\s*ч/.exec(sla);
  const mins = /(\d+)\s*мин/.exec(sla);
  return (hours ? Number(hours[1]) * 60 : 0) + (mins ? Number(mins[1]) : 0);
}

function nextAction(status: string, tone: string, score: number): string {
  const lower = status.toLowerCase();
  if (lower.includes("стоп") || lower.includes("отказ")) {
    return "Закрыть кейс";
  }
  if (lower.includes("аномал")) {
    return "Проверить выписку";
  }
  if (lower.includes("документ")) {
    return "Запросить документы";
  }
  if (lower.includes("встреч")) {
    return "Подтвердить условия";
  }
  if (lower.includes("одобр")) {
    return "Контроль выдачи";
  }
  if (tone === "risk" || (score > 0 && score < 520)) {
    return "Разобрать риск";
  }
  return "Открыть и решить";
}

function priorityLabel(tone: string, sla: string): { label: string; className: string } {
  if (sla.includes("выполнен")) {
    return { label: "Готово", className: "good" };
  }
  if (tone === "risk" || slaMinutes(sla) < 30) {
    return { label: "Срочно", className: "risk" };
  }
  if (tone === "warn" || tone === "info") {
    return { label: "Внимание", className: "warn" };
  }
  return { label: "В работе", className: "info" };
}

/** Б1 — Очередь: один список, статус-теги в строке, одна кнопка «Открыть». */
export function QueueScreen() {
  const { companies, application, openBankCase, isBusy, isReady, goToScreen } = useApp();
  const [query, setQuery] = useState("");
  const showSkeleton = !isReady || (isBusy && companies.length === 0);

  const queueRows = useMemo(() => {
    const rows = companies.map((company) => {
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

    return [...rows].sort((a, b) => {
      const toneDiff = (TONE_PRIORITY[a.tone] ?? 9) - (TONE_PRIORITY[b.tone] ?? 9);
      if (toneDiff !== 0) {
        return toneDiff;
      }
      return slaMinutes(a.sla) - slaMinutes(b.sla);
    });
  }, [companies, application]);

  const visibleRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return queueRows;
    }
    return queueRows.filter((row) => `${row.name} ${row.inn}`.toLowerCase().includes(q));
  }, [queueRows, query]);

  const openCount = queueRows.filter((r) => !r.sla.includes("выполнен")).length;
  const urgentCount = queueRows.filter(
    (r) => !r.sla.includes("выполнен") && (r.tone === "risk" || slaMinutes(r.sla) < 30),
  ).length;

  function openCase(row: (typeof queueRows)[number]) {
    void openBankCase(row.id, {
      product_type: row.productType,
      requested_amount_rub: row.amount,
      term_months: row.term,
      declared_monthly_revenue: row.revenue,
    });
  }

  const nextRow =
    visibleRows.find((row) => !row.sla.includes("выполнен")) ??
    queueRows.find((row) => row.demo_key === "rosters") ??
    queueRows[0];

  return (
    <>
      <div className="bank-page-head">
        <div>
          <h1 className="figma-h1">Очередь заявок</h1>
          <p className="figma-lead">{openCount} в работе</p>
          {urgentCount > 0 ? (
            <div className="bank-next-hint">
              Сначала: <span>{urgentCount} срочных</span>
              <span className="muted">· откройте красную или янтарную строку</span>
            </div>
          ) : null}
        </div>
        <button
          type="button"
          className="btn btn-primary primary-cta"
          disabled={!nextRow}
          onClick={() => {
            if (nextRow) {
              openCase(nextRow);
            }
          }}
        >
          Взять следующую
        </button>
      </div>

      <div className="bank-toolbar">
        <input
          className="bank-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="ИНН или название"
          aria-label="Поиск по очереди"
        />
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => goToScreen("bank-signal")}>
          Сигнал CAPEX
        </button>
      </div>

      {showSkeleton ? (
        <QueueSkeleton />
      ) : companies.length === 0 ? (
        <BankEmptyState
          title="Очередь пуста"
          text="Все заявки разобраны. Новые появятся здесь автоматически."
        />
      ) : visibleRows.length === 0 ? (
        <BankEmptyState
          title="Ничего не найдено"
          text="По поиску заявок нет — очистите строку или проверьте ИНН."
        />
      ) : (
        <div className="ops-list bank-queue" role="list">
          {visibleRows.map((row, index) => {
            const priority = priorityLabel(row.tone, row.sla);
            const mins = slaMinutes(row.sla);
            const slaHot = !row.sla.includes("выполнен") && mins < 30;
            const rowTone =
              priority.className === "risk"
                ? "is-risk"
                : priority.className === "warn"
                  ? "is-warn"
                  : priority.className === "good"
                    ? "is-good"
                    : "";
            return (
              <div
                key={row.id}
                className={`ops-row ${rowTone}`}
                role="listitem"
                style={{ animationDelay: `${Math.min(index, 8) * 30}ms` }}
              >
                <div className="ops-row-main">
                  <div className="ops-row-title">{row.name}</div>
                  <div className="ops-row-sub">
                    ИНН {row.inn} · {row.product}
                    {row.score > 0 ? ` · риск ${row.score}` : " · стоп-фактор"}
                  </div>
                </div>
                <div className="ops-row-amount">{formatMoney(row.amount)}</div>
                <div className="ops-row-meta">
                  <span className={`status-tag is-${priority.className}`}>{priority.label}</span>
                  <span
                    className={`status-tag ${
                      row.tone === "good"
                        ? "is-good"
                        : row.tone === "risk"
                          ? "is-risk"
                          : row.tone === "info"
                            ? "is-info"
                            : "is-warn"
                    }`}
                  >
                    {row.status}
                  </span>
                  {slaHot ? <span className="status-tag is-risk">SLA {row.sla}</span> : null}
                </div>
                <div className="ops-row-do">{nextAction(row.status, row.tone, row.score)}</div>
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={() => openCase(row)}
                >
                  Открыть
                </button>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
