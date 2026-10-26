import { useState, type FormEvent } from "react";
import {
  MagnifyingGlassIcon,
  GearIcon,
  ArchiveIcon,
  BatteryChargingIcon,
  BankIcon,
  PresentationIcon,
  BlueprintIcon,
  StarIcon,
} from "./icons";
import { useApp } from "../state/AppState";
import {
  findMatchingScenario,
  type BusinessSearchScenario,
} from "../data/searchMocks";
import type { SearchResult } from "../api/types";
import { useSearchHistoryStore } from "../state/searchHistoryStore";

const QUICK_SUGGESTIONS = [
  {
    icon: <GearIcon size={14} />,
    label: "Ростер Giesen W15A 2.5 млн",
    query: "Ростер для кофе Giesen W15A 2.5 млн",
  },
  {
    icon: <ArchiveIcon size={14} />,
    label: "Закупка зерна арабика 1.8 млн",
    query: "Закупка зерна арабика 1.8 млн",
  },
  {
    icon: <BatteryChargingIcon size={14} />,
    label: "Кассовый разрыв 650 000 ₽",
    query: "Кассовый разрыв 650 000 ₽ на зарплату и аренду",
  },
  {
    icon: <BankIcon size={14} />,
    label: "Гарантия 44-ФЗ 1.2 млн ₽",
    query: "Банковская гарантия 44-ФЗ 1.2 млн",
  },
];

export function SmartSearchPanel() {
  const {
    dashboard,
    searchResult: backendResult,
    runSearch,
    isBusy,
    companyId,
  } = useApp();

  const addSearchFromRun = useSearchHistoryStore((state) => state.addSearchFromRun);

  const [query, setQuery] = useState("");
  const [selectedScenario, setSelectedScenario] = useState<BusinessSearchScenario | null>(null);
  const [customResult, setCustomResult] = useState<SearchResult | null>(null);

  if (!dashboard) {
    return null;
  }

  // Active result priority: custom mock scenario -> backend result
  const activeResult: SearchResult | null =
    selectedScenario?.result ?? customResult ?? backendResult;

  const company = dashboard.company;

  async function executeSearch(targetQuery: string) {
    const trimmed = targetQuery.trim();
    if (!trimmed) return;

    const matched = findMatchingScenario(trimmed);
    let resultToSave: SearchResult | null = null;

    if (matched) {
      setSelectedScenario(matched);
      setCustomResult(null);
      resultToSave = matched.result;
    } else {
      setSelectedScenario(null);
    }

    try {
      await runSearch(trimmed);
    } catch {
      // Backend fallback handled gracefully
    }

    // Record query and what was found into search intent history (visible to the bank)
    const effectiveResult = resultToSave ?? backendResult;
    if (effectiveResult) {
      addSearchFromRun(
        companyId || company.id,
        company.name,
        trimmed,
        effectiveResult,
      );
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!query.trim()) return;
    await executeSearch(query);
  }

  async function handleSuggestionClick(targetQuery: string) {
    setQuery(targetQuery);
    await executeSearch(targetQuery);
  }

  return (
    <div className="grok-search-card">
      {/* Top Bar: Company status pill */}
      <div className="grok-top-bar">
        <div className="grok-badge-pill">
          <span className="grok-badge-dot" />
          <span>{company.name}</span>
        </div>
        <div className="grok-badge-pill" title="Проверенная база поставщиков и рыночных цен Альфа-Банка">
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <BlueprintIcon size={14} />
            <span>Единый реестр надёжных контрагентов · Актуальные цены</span>
          </span>
        </div>
      </div>

      {/* Hero Header */}
      <div className="grok-hero-header">
        <div className="grok-hero-brand">
          <div className="grok-hero-glyph">А</div>
          <h1 className="grok-hero-title">
            <span>Альфа-Бизнес Поиск</span>
          </h1>
        </div>
        <div className="grok-hero-sub">
          Поиск оборудования, сырья, проверенных контрагентов и рыночных цен
        </div>
      </div>

      {/* Clean, Lightweight Search Bar with Iconimate MagnifyingGlassIcon */}
      <div className="grok-capsule-wrapper">
        <form className="grok-capsule" onSubmit={handleSubmit}>
          <div className="grok-capsule-icon">
            <MagnifyingGlassIcon size={18} />
          </div>

          <input
            className="grok-capsule-input"
            placeholder="Что вы хотите найти? Например: ростер для кофе, зерно арабика, кассовый разрыв..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          {query.trim() && (
            <button
              type="button"
              className="btn btn-ghost"
              style={{ padding: "0 10px", fontSize: 13, height: 36, opacity: 0.6 }}
              onClick={() => {
                setQuery("");
                setSelectedScenario(null);
                setCustomResult(null);
              }}
              title="Очистить"
            >
              ✕
            </button>
          )}

          <div className="grok-capsule-controls">
            <button
              type="submit"
              disabled={isBusy || !query.trim()}
              className="btn btn-primary"
              style={{
                height: 40,
                borderRadius: 999,
                padding: "0 22px",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontWeight: 700,
                fontSize: 13,
              }}
            >
              <span>{isBusy ? "Поиск…" : "Найти"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Quick Search Chips with Iconimate Micro-Motion Icons */}
      <div className="search-quick-chips">
        <span className="search-chips-label">Популярные запросы:</span>
        <div className="search-chips-row">
          {QUICK_SUGGESTIONS.map((item, idx) => (
            <button
              key={idx}
              type="button"
              className="search-chip-btn"
              onClick={() => void handleSuggestionClick(item.query)}
              disabled={isBusy}
              style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              <span style={{ display: "inline-flex" }}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Search Results: Prominently displaying WHAT WAS FOUND */}
      {activeResult ? (
        <div className="grok-results-container">
          <div className="grok-result-header-bar">
            <div>
              <div className="grok-result-query-title">
                Результаты поиска по запросу: «{activeResult.query}»
              </div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", marginTop: 2 }}>
                Категория: <strong>{activeResult.intent_label}</strong> · Найдено за {activeResult.classification_ms.toFixed(1)} мс
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span className="pill pill-good" style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                <StarIcon size={12} />
                <span>{activeResult.market_prices.length} предложений на рынке</span>
              </span>
              <span className="pill pill-neutral" style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                <BlueprintIcon size={12} />
                <span>{activeResult.suppliers.length} проверенных контрагента</span>
              </span>
            </div>
          </div>

          {/* Top Found Products / Equipment Showcase with Iconimate Icons */}
          {activeResult.market_prices.length > 0 && (
            <div className="search-found-section">
              <div className="grok-section-title">
                Найденные позиции и спецификации ({activeResult.market_prices.length})
              </div>
              <div className="search-products-grid">
                {activeResult.market_prices.map((item, idx) => (
                  <article key={idx} className="search-product-card">
                    <div className="search-product-header">
                      <div className="search-product-icon">
                        <ArchiveIcon size={22} />
                      </div>
                      <div className="search-product-details">
                        <h4 className="search-product-name">{item.item}</h4>
                        <div className="search-product-supplier">
                          Поставщик: <strong>{item.supplier_name}</strong>
                          {item.unit && <span> · Ед.: {item.unit}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="search-product-footer">
                      <div className="search-product-price-block">
                        <span className="search-price-caption">Ориентировочная стоимость</span>
                        <span className="search-price-val">{item.price_label}</span>
                      </div>
                      <div className="search-product-badge">
                        <span className="pill pill-good">В наличии</span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}

          {/* Market Price Benchmark Table */}
          {activeResult.market_prices.length > 0 && (
            <div className="search-benchmark-section">
              <div className="grok-section-title">Сравнение рыночных цен и условий</div>
              <table className="market-table">
                <thead>
                  <tr>
                    <th>Наименование позиции</th>
                    <th>Ориентировочная цена</th>
                    <th>Единица</th>
                    <th>Поставщик / Дистрибьютор</th>
                    <th>Статус</th>
                  </tr>
                </thead>
                <tbody>
                  {activeResult.market_prices.map((row, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600 }}>{row.item}</td>
                      <td className="nowrap" style={{ fontWeight: 750, color: "#ffffff" }}>
                        {row.price_label}
                      </td>
                      <td style={{ color: "rgba(255,255,255,0.6)" }}>{row.unit || "комплект"}</td>
                      <td style={{ color: "rgba(255,255,255,0.8)" }}>{row.supplier_name}</td>
                      <td>
                        <span className="pill pill-good" style={{ fontSize: 11, padding: "2px 8px" }}>
                          ✓ Проверен
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Verified Suppliers and Partners */}
          {activeResult.suppliers.length > 0 && (
            <div className="grok-suppliers-section">
              <div className="grok-section-title">
                Проверенные поставщики из реестра Альфа-Банка ({activeResult.suppliers.length})
              </div>
              <div className="search-suppliers-list">
                {activeResult.suppliers.map((supplier) => (
                  <article key={supplier.inn} className="grok-supplier-row">
                    <div>
                      <div className="grok-supplier-name">{supplier.name}</div>
                      <div className="grok-supplier-meta">
                        ИНН {supplier.inn} · Срок поставки: {supplier.delivery_days} дн. · Ценовое предложение: {supplier.price_label}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span className="pill pill-good">{supplier.fssp_label}</span>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}

          {/* AI Financial & Market Advisory */}
          {activeResult.ai_enrichment && (
            <div className="grok-ai-advisory">
              <span style={{ display: "inline-flex", marginTop: 2 }}>
                <PresentationIcon size={20} />
              </span>
              <div>
                <strong>Аналитический комментарий Альфа-Бизнес:</strong>{" "}
                {activeResult.ai_enrichment.text}
              </div>
            </div>
          )}

          {/* Subtle footer notice about bank intent saving */}
          <div className="search-results-footer-notice">
            <span style={{ display: "inline-flex" }}>
              <StarIcon size={14} />
            </span>
            <span>
              Результаты поиска сохранены в цифровом профиле компании для автоматического расчёта персональных лимитов и льготных программ.
            </span>
          </div>
        </div>
      ) : (
        /* Empty State / Search Guide with Animated Iconimate Icons */
        <div className="search-empty-guide">
          <div className="search-empty-icon" style={{ display: "flex", justifyContent: "center" }}>
            <MagnifyingGlassIcon size={42} />
          </div>
          <h3 className="search-empty-title">Найдите всё необходимое для вашего бизнеса</h3>
          <p className="search-empty-desc">
            Ищите технику, станки, кофейное оборудование, сырьё, логистические услуги или проверяйте надёжность контрагентов по ИНН.
          </p>
          <div className="search-categories-grid">
            <button
              type="button"
              className="search-cat-card"
              onClick={() => void handleSuggestionClick("Ростер для кофе Giesen W15A 2.5 млн")}
            >
              <span className="search-cat-icon">
                <GearIcon size={26} />
              </span>
              <span className="search-cat-title">Оборудование и станки</span>
              <span className="search-cat-sub">Ростеры, кофемашины, упаковка</span>
            </button>
            <button
              type="button"
              className="search-cat-card"
              onClick={() => void handleSuggestionClick("Закупка зерна арабика 1.8 млн")}
            >
              <span className="search-cat-icon">
                <ArchiveIcon size={26} />
              </span>
              <span className="search-cat-title">Сырьё и материалы</span>
              <span className="search-cat-sub">Зерно, упаковка, ингредиенты</span>
            </button>
            <button
              type="button"
              className="search-cat-card"
              onClick={() => void handleSuggestionClick("Кассовый разрыв 650 000 ₽ на зарплату и аренду")}
            >
              <span className="search-cat-icon">
                <BatteryChargingIcon size={26} />
              </span>
              <span className="search-cat-title">Кассовый разрыв</span>
              <span className="search-cat-sub">Покрытие выплат на ФОТ и аренду</span>
            </button>
            <button
              type="button"
              className="search-cat-card"
              onClick={() => void handleSuggestionClick("Банковская гарантия 44-ФЗ 1.2 млн")}
            >
              <span className="search-cat-icon">
                <BankIcon size={26} />
              </span>
              <span className="search-cat-title">Госзакупки 44-ФЗ / 223-ФЗ</span>
              <span className="search-cat-sub">Банковские гарантии без залога</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
