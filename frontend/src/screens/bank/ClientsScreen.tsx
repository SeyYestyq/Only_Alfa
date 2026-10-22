import { useMemo, useState } from "react";
import { BankEmptyState, ClientsSkeleton } from "../../components/Skeleton";
import { useApp } from "../../state/AppState";
import { formatMoney } from "../../utils/format";

type ClientFilter = "all" | "signals" | "active" | "risk";

/** Б6 — Портфель клиентов (copy 9 + состояния copy 14). */
export function ClientsScreen() {
  const { companies, selectCompany, application, isBusy, isReady } = useApp();
  const [filter, setFilter] = useState<ClientFilter>("all");
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
    return companies.map((company) => ({
      ...company,
      ...(extra[company.demo_key ?? ""] ?? {
        revenue: formatMoney(company.account_balance),
        score: 600,
        products: "РКО",
        signal: "—",
      }),
    }));
  }, [companies]);

  const filtered = rows.filter((row) => {
    const hay = `${row.name} ${row.inn} ${row.okved_code}`.toLowerCase();
    if (query.trim() && !hay.includes(query.trim().toLowerCase())) {
      return false;
    }
    if (filter === "signals") {
      return row.signal !== "—";
    }
    if (filter === "active") {
      return application?.company.id === row.id || row.signal.includes("документ") || row.signal.includes("Аномал");
    }
    if (filter === "risk") {
      return row.score > 0 && row.score < 520;
    }
    return true;
  });

  return (
    <>
      <div className="figma-eyebrow">Портфель · малый бизнес</div>
      <h1 className="figma-h1" style={{ fontSize: 32, lineHeight: "40px" }}>
        Клиенты
      </h1>
      <p className="figma-lead">
        1 248 компаний · в демо {companies.length} эталонных профиля. Сверху — клиенты со свежими сигналами в платежах.
      </p>

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
            <div className="bank-filters">
              {(
                [
                  ["all", "Все", 1248],
                  ["signals", "Со сигналами", rows.filter((r) => r.signal !== "—").length],
                  ["active", "С активной заявкой", 1],
                  ["risk", "Риск растёт", rows.filter((r) => r.score > 0 && r.score < 520).length],
                ] as Array<[ClientFilter, string, number]>
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
              placeholder="Название, ИНН или ОКВЭД"
            />
          </div>

          <section className="figma-panel figma-panel-sm">
            {filtered.length === 0 ? (
              <BankEmptyState
                title="Ничего не найдено"
                text={`По запросу «${query.trim() || "фильтр"}» клиентов нет. Проверьте ИНН — его можно пробить через ФНС.`}
              />
            ) : (
              <>
                <table className="ops-table">
                  <thead>
                    <tr>
                      <th>Клиент</th>
                      <th>ОКВЭД</th>
                      <th>Выручка / мес.</th>
                      <th>RiskScore</th>
                      <th>Продукты в Альфа</th>
                      <th>Последний сигнал</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((row) => (
                      <tr key={row.id}>
                        <td>
                          <strong>{row.name}</strong>
                          <div className="muted" style={{ fontSize: 12 }}>
                            ИНН {row.inn}
                          </div>
                        </td>
                        <td>
                          {row.okved_code} {row.okved_cluster}
                        </td>
                        <td>{row.revenue}</td>
                        <td
                          style={{ fontWeight: 700 }}
                          className={row.score === 0 ? "red" : row.score >= 750 ? "green" : undefined}
                        >
                          {row.score || "—"}
                        </td>
                        <td>{row.products}</td>
                        <td>{row.signal}</td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-sm btn-secondary"
                            onClick={() => {
                              void selectCompany(row.id, { nextScreen: "bank-profile" });
                            }}
                          >
                            360°
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="muted" style={{ marginTop: 12, fontSize: 12 }}>
                  Показано {filtered.length} из {companies.length} · сортировка: свежесть сигнала
                </p>
              </>
            )}
          </section>
        </>
      )}
    </>
  );
}
