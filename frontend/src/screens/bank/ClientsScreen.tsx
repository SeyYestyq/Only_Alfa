import { useMemo, useState } from "react";
import { BankEmptyState, ClientsSkeleton } from "../../components/Skeleton";
import { useApp } from "../../state/AppState";
import { formatMoney } from "../../utils/format";
import { Profile360Screen } from "./Profile360Screen";

/**
 * Б6–Б7 — Портфель клиентов + 360° как master-detail.
 * ScreenId bank-profile остаётся для deep-link.
 */
export function ClientsScreen() {
  const { companies, selectCompany, isBusy, isReady, screen, goToScreen } = useApp();
  const [query, setQuery] = useState("");
  const showSkeleton = !isReady || (isBusy && companies.length === 0);

  const rows = useMemo(() => {
    const extra: Record<string, { revenue: string; score: number; products: string; signal: string }> = {
      rosters: {
        revenue: "2,1 млн ₽",
        score: 610,
        products: "РКО · эквайринг · зарплата",
        signal: "CAPEX оборудование",
      },
      tekhnostroy: {
        revenue: "1,8 млн ₽",
        score: 760,
        products: "РКО · ВКЛ",
        signal: "Аномалия выручки",
      },
      kovalev: {
        revenue: "0,9 млн ₽",
        score: 495,
        products: "РКО · бизнес-карта",
        signal: "Нужны документы",
      },
      smirnov: {
        revenue: "1,2 млн ₽",
        score: 815,
        products: "РКО · кредит",
        signal: "—",
      },
      bodrost: {
        revenue: "0,7 млн ₽",
        score: 0,
        products: "РКО",
        signal: "Стоп-фактор",
      },
    };
    const mapped = companies.map((company) => ({
      ...company,
      ...(extra[company.demo_key ?? ""] ?? {
        revenue: formatMoney(company.account_balance),
        score: 600,
        products: "РКО",
        signal: "—",
      }),
    }));
    return [...mapped].sort((a, b) => {
      const aExc = a.signal !== "—" || (a.score > 0 && a.score < 520) || a.score === 0 ? 0 : 1;
      const bExc = b.signal !== "—" || (b.score > 0 && b.score < 520) || b.score === 0 ? 0 : 1;
      if (aExc !== bExc) {
        return aExc - bExc;
      }
      return a.score - b.score;
    });
  }, [companies]);

  const visibleRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return rows;
    }
    return rows.filter((row) => `${row.name} ${row.inn} ${row.okved_code}`.toLowerCase().includes(q));
  }, [rows, query]);

  if (screen === "bank-profile") {
    return (
      <>
        <button
          type="button"
          className="bank-back-link"
          onClick={() => goToScreen("bank-clients")}
        >
          ← К списку клиентов
        </button>
        <Profile360Screen />
      </>
    );
  }

  return (
    <>
      <div className="bank-page-head">
        <div>
          <div className="figma-eyebrow">Портфель · малый бизнес</div>
          <h1 className="figma-h1">Портфель компаний</h1>
          <p className="figma-lead">
            Один список · сверху исключения. В демо {companies.length} эталонных профиля.
          </p>
        </div>
      </div>

      {showSkeleton ? (
        <ClientsSkeleton />
      ) : companies.length === 0 ? (
        <BankEmptyState
          title="У вас пока нет клиентов"
          text="Портфель назначит руководитель группы. До этого доступна общая очередь."
        />
      ) : (
        <>
          <div className="bank-toolbar">
            <input
              className="bank-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Название, ИНН или ОКВЭД"
              aria-label="Поиск по клиентам"
            />
          </div>

          {visibleRows.length === 0 ? (
            <BankEmptyState
              title="Ничего не найдено"
              text={`По запросу «${query.trim()}» клиентов нет.`}
            />
          ) : (
            <div className="ops-list" role="list">
              {visibleRows.map((row, index) => {
                const action =
                  row.signal === "Стоп-фактор"
                    ? "Смотреть отказ"
                    : row.signal !== "—"
                      ? "Открыть сигнал"
                      : "Карточка 360°";
                const rowClass =
                  row.score === 0 || row.signal === "Стоп-фактор"
                    ? "is-risk"
                    : row.score < 520 || row.signal !== "—"
                      ? "is-warn"
                      : "";
                const scoreTag =
                  row.score === 0
                    ? { label: "Стоп", cls: "is-risk" }
                    : row.score < 520
                      ? { label: `Риск ${row.score}`, cls: "is-warn" }
                      : row.score >= 750
                        ? { label: `Риск ${row.score}`, cls: "is-good" }
                        : { label: `Риск ${row.score}`, cls: "is-info" };
                return (
                  <div
                    key={row.id}
                    className={`ops-row ${rowClass}`}
                    role="listitem"
                    style={{ animationDelay: `${Math.min(index, 8) * 30}ms` }}
                  >
                    <div className="ops-row-main">
                      <div className="ops-row-title">{row.name}</div>
                      <div className="ops-row-sub">
                        ИНН {row.inn} · {row.okved_code} {row.okved_cluster} · {row.products}
                      </div>
                    </div>
                    <div className="ops-row-amount">{row.revenue}</div>
                    <div className="ops-row-meta">
                      <span className={`status-tag ${scoreTag.cls}`}>{scoreTag.label}</span>
                      {row.signal !== "—" ? (
                        <span
                          className={`status-tag ${row.signal.includes("Стоп") ? "is-risk" : "is-warn"}`}
                        >
                          {row.signal}
                        </span>
                      ) : null}
                    </div>
                    <div className="ops-row-do">{action}</div>
                    <button
                      type="button"
                      className="btn btn-sm btn-primary"
                      onClick={() => {
                        void selectCompany(row.id, { nextScreen: "bank-profile" });
                      }}
                    >
                      Открыть
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </>
  );
}
