import { useApp } from "../../state/AppState";
import { useBankMessagesStore } from "../../state/bankMessagesStore";
import { useSearchHistoryStore } from "../../state/searchHistoryStore";
import {
  MagnifyingGlassIcon,
  PresentationIcon,
  EnvelopeIcon,
  StarIcon,
  BlueprintIcon,
} from "../icons";

export function ClientSearchIntentAnalytics() {
  const { dashboard, goToScreen } = useApp();
  const setActiveThread = useBankMessagesStore((state) => state.setActiveThread);
  const sendMessage = useBankMessagesStore((state) => state.sendMessage);

  const history = useSearchHistoryStore((state) =>
    state.getHistoryForCompany(dashboard?.company.id || ""),
  );

  if (!dashboard) {
    return null;
  }

  const company = dashboard.company;
  const demoKey = (company.demo_key || company.id).replace(/^cmp_/, "").toLowerCase();

  function handleSendOfferToChat(query: string, product: string, rate: number, amount: string) {
    setActiveThread(demoKey);
    const text = `Добрый день! Заметили ваш интерес к «${query}». Для компании ${company.name} предварительно одобрен ${product} на сумму ${amount} по ставке ${rate}% годовых без визита в банк и без бумажных отчётов. Хотите получить персональный график платежей?`;

    sendMessage(text);
    goToScreen("bank-messages");
  }

  return (
    <section className="card client-intent-analytics-card" style={{ marginTop: 20 }}>
      <div className="card-header" style={{ alignItems: "flex-start", gap: 12 }}>
        <div>
          <div className="figma-eyebrow" style={{ color: "#ef3124", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 6 }}>
            <BlueprintIcon size={14} />
            <span>Search-to-Offer AI · Цифровой след</span>
          </div>
          <h2 className="card-title" style={{ fontSize: 18, marginTop: 2 }}>
            Поисковая активность и потребности клиента
          </h2>
          <p className="card-subtitle" style={{ marginTop: 4 }}>
            Что искал клиент в бизнес-поиске и какие товары/поставщиков подобрала система. Позволяет предложить финансирование до того, как клиент обратится в другой банк.
          </p>
        </div>
        <div className="card-actions">
          <span className="pill pill-good" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <StarIcon size={12} />
            <span>{history.length > 0 ? `${history.length} поисковых запроса` : "0 запросов"}</span>
          </span>
        </div>
      </div>

      <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {history.length === 0 ? (
          <div
            style={{
              padding: "24px 18px",
              textAlign: "center",
              background: "rgba(255, 255, 255, 0.02)",
              borderRadius: 12,
              border: "1px dashed rgba(255, 255, 255, 0.12)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
              <MagnifyingGlassIcon size={34} />
            </div>
            <div style={{ fontWeight: 650, fontSize: 14 }}>У компании пока нет истории поиска</div>
            <p className="v2-muted" style={{ fontSize: 12.5, maxWidth: 460, margin: "6px auto 14px" }}>
              Перейдите в режим клиента и выполните поиск оборудования или сырья через верхнюю строку «Найти платёж или сервис…». Все запросы и результаты мгновенно попадут в этот аналитический блок.
            </p>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => goToScreen("search")}
            >
              Открыть поиск от лица клиента
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {history.map((entry) => (
              <article
                key={entry.id}
                className="bank-intent-entry-card"
                style={{
                  background: "rgba(255, 255, 255, 0.03)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderLeft: "4px solid #ef3124",
                  borderRadius: 12,
                  padding: "16px 18px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                {/* Header row: Query + Time + Intent */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontSize: 11, color: "rgba(255, 255, 255, 0.45)", textTransform: "uppercase", letterSpacing: 0.6, fontWeight: 700 }}>
                      Поисковый запрос клиента · {entry.timestamp}
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 750, color: "#ffffff", marginTop: 2 }}>
                      «{entry.query}»
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span className="pill pill-neutral" style={{ fontSize: 11 }}>
                      {entry.intentLabel}
                    </span>
                    <span className="pill pill-good" style={{ fontSize: 11, fontWeight: 750 }}>
                      Оценка: {entry.amountLabel}
                    </span>
                  </div>
                </div>

                {/* What was found through the search engine */}
                <div
                  style={{
                    background: "rgba(0, 0, 0, 0.2)",
                    borderRadius: 10,
                    padding: "12px 14px",
                    fontSize: 12.5,
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255, 255, 255, 0.5)", marginBottom: 6, textTransform: "uppercase" }}>
                    Что нашлось через поисковую систему на стороне клиента:
                  </div>

                  {entry.itemsFound.length > 0 && (
                    <ul style={{ margin: "0 0 8px 0", paddingLeft: 18, color: "rgba(255, 255, 255, 0.9)" }}>
                      {entry.itemsFound.map((item, idx) => (
                        <li key={idx} style={{ marginBottom: 4 }}>
                          <strong>{item.item}</strong> —{" "}
                          <span style={{ color: "#34c77b", fontWeight: 700 }}>{item.price_label}</span>
                          {" "}· Поставщик: {item.supplier_name}
                        </li>
                      ))}
                    </ul>
                  )}

                  {entry.suppliers.length > 0 && (
                    <div style={{ fontSize: 12, color: "rgba(255, 255, 255, 0.65)", display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <span>Проверенные поставщики:</span>
                      {entry.suppliers.map((s, idx) => (
                        <span key={idx} style={{ color: "#ffffff", fontWeight: 550 }}>
                          ✓ {s.name} ({s.fssp_label})
                        </span>
                      ))}
                    </div>
                  )}

                  {entry.aiAnalysis && (
                    <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid rgba(255, 255, 255, 0.08)", color: "rgba(255, 255, 255, 0.75)", fontSize: 11.5, display: "flex", gap: 6, alignItems: "center" }}>
                      <PresentationIcon size={14} />
                      <em>{entry.aiAnalysis}</em>
                    </div>
                  )}
                </div>

                {/* Bank's proactive opportunity */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 16,
                    flexWrap: "wrap",
                    paddingTop: 4,
                  }}
                >
                  <div>
                    <div style={{ fontSize: 11, color: "rgba(255, 255, 255, 0.45)", fontWeight: 700 }}>
                      Рекомендация для банка:
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 650, color: "#ffffff", marginTop: 2 }}>
                      {entry.bankInsight.recommendedProduct} · Ставка от {entry.bankInsight.preapprovedRatePct}% · Лимит {entry.bankInsight.maxLimitLabel}
                    </div>
                    <div style={{ fontSize: 11.5, color: "rgba(255, 255, 255, 0.55)", marginTop: 2 }}>
                      {entry.bankInsight.actionHint}
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    style={{ whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", gap: 6 }}
                    onClick={() =>
                      handleSendOfferToChat(
                        entry.query,
                        entry.bankInsight.recommendedProduct,
                        entry.bankInsight.preapprovedRatePct,
                        entry.amountLabel,
                      )
                    }
                  >
                    <EnvelopeIcon size={14} />
                    <span>Предложить в чат клиенту</span>
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
