import { useApp } from "../../state/AppState";
import { useBankMessagesStore } from "../../state/bankMessagesStore";
import { useSearchHistoryStore } from "../../state/searchHistoryStore";
import {
  PresentationIcon,
  GearIcon,
  ArchiveIcon,
  BatteryChargingIcon,
  UserIcon,
  EnvelopeIcon,
  StarIcon,
} from "../icons";

export function PortfolioSearchIntentCard() {
  const { selectCompany, goToScreen } = useApp();
  const setActiveThread = useBankMessagesStore((state) => state.setActiveThread);
  const history = useSearchHistoryStore((state) => state.getAllHistory());

  function handleOpenClient(companyId: string) {
    void selectCompany(companyId, { nextScreen: "bank-clients" });
  }

  function handleOpenChat(companyId: string) {
    const key = companyId.replace(/^cmp_/, "").toLowerCase();
    setActiveThread(key);
    void selectCompany(companyId, { nextScreen: "bank-messages" });
  }

  return (
    <section className="v2-card" style={{ marginTop: 16 }}>
      <div className="v2-card-head">
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 8 }}>
            <PresentationIcon size={18} />
            <span>Поисковые интенты клиентов портфеля (Ранний спрос)</span>
          </h2>
          <p className="v2-muted" style={{ fontSize: 12.5, marginTop: 2 }}>
            Аналитика запросов в поисковой системе на стороне бизнеса: что ищут клиенты и какие предложения для них готовы.
          </p>
        </div>
        <span className="v2-pill demo" style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
          <StarIcon size={12} />
          <span>Live Intent AI</span>
        </span>
      </div>

      {/* Aggregate Intent Breakdown */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 12,
          margin: "14px 0",
        }}
      >
        <div
          style={{
            background: "rgba(255, 255, 255, 0.03)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: 10,
            padding: "10px 14px",
          }}
        >
          <div style={{ fontSize: 11, color: "rgba(255, 255, 255, 0.5)", fontWeight: 650, display: "flex", alignItems: "center", gap: 6 }}>
            <GearIcon size={14} />
            <span>Оборудование и станки (CAPEX)</span>
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#ffffff", marginTop: 2 }}>
            48% <small style={{ fontSize: 12, color: "#34c77b", fontWeight: 600 }}>+6% за мес.</small>
          </div>
          <div style={{ fontSize: 11, color: "rgba(255, 255, 255, 0.4)", marginTop: 2 }}>
            Ростеры, упаковка, автокраны
          </div>
        </div>

        <div
          style={{
            background: "rgba(255, 255, 255, 0.03)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: 10,
            padding: "10px 14px",
          }}
        >
          <div style={{ fontSize: 11, color: "rgba(255, 255, 255, 0.5)", fontWeight: 650, display: "flex", alignItems: "center", gap: 6 }}>
            <ArchiveIcon size={14} />
            <span>Оборотный капитал / Сырьё</span>
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#ffffff", marginTop: 2 }}>
            32% <small style={{ fontSize: 12, color: "#ffffff", fontWeight: 600 }}>стабильно</small>
          </div>
          <div style={{ fontSize: 11, color: "rgba(255, 255, 255, 0.4)", marginTop: 2 }}>
            Зерно арабика, стройматериалы
          </div>
        </div>

        <div
          style={{
            background: "rgba(255, 255, 255, 0.03)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: 10,
            padding: "10px 14px",
          }}
        >
          <div style={{ fontSize: 11, color: "rgba(255, 255, 255, 0.5)", fontWeight: 650, display: "flex", alignItems: "center", gap: 6 }}>
            <BatteryChargingIcon size={14} />
            <span>Кассовые разрывы (Овердрафт)</span>
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#ffffff", marginTop: 2 }}>
            20% <small style={{ fontSize: 12, color: "#ffb020", fontWeight: 600 }}>ранний сигнал</small>
          </div>
          <div style={{ fontSize: 11, color: "rgba(255, 255, 255, 0.4)", marginTop: 2 }}>
            ФОТ, аренда, налоги
          </div>
        </div>
      </div>

      {/* Feed of Real Searches by Clients */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255, 255, 255, 0.6)", textTransform: "uppercase", letterSpacing: 0.6 }}>
          Лента последних поисковых запросов клиентов:
        </div>

        {history.slice(0, 4).map((item) => (
          <div
            key={item.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 14,
              padding: "10px 14px",
              background: "rgba(255, 255, 255, 0.02)",
              border: "1px solid rgba(255, 255, 255, 0.06)",
              borderRadius: 10,
              flexWrap: "wrap",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <strong style={{ fontSize: 13, color: "#ffffff" }}>{item.companyName}</strong>
                <span className="pill pill-neutral" style={{ fontSize: 10 }}>{item.timestamp}</span>
                <span className="pill pill-good" style={{ fontSize: 10 }}>{item.intentLabel}</span>
              </div>
              <div style={{ fontSize: 12.5, color: "rgba(255, 255, 255, 0.85)", marginTop: 3 }}>
                Искал: «{item.query}» → Найдено:{" "}
                <span style={{ color: "rgba(255, 255, 255, 0.6)" }}>
                  {item.itemsFound[0]?.item || "товары"} ({item.itemsFound[0]?.price_label || item.amountLabel})
                </span>
              </div>
              <div style={{ fontSize: 11, color: "#34c77b", marginTop: 2 }}>
                ✓ Готов оффер: {item.bankInsight.recommendedProduct} ({item.bankInsight.maxLimitLabel})
              </div>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
                onClick={() => handleOpenClient(item.companyId)}
              >
                <UserIcon size={14} />
                <span>В досье 360°</span>
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
                onClick={() => handleOpenChat(item.companyId)}
              >
                <EnvelopeIcon size={14} />
                <span>В чат</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
