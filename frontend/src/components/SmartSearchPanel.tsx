import { useState, type FormEvent } from "react";
import { MagnifyingGlassIcon } from "./icons";
import { useApp } from "../state/AppState";
import { useDemoStore } from "../state/demoStore";
import { formatMoney, formatPercent } from "../utils/format";
import {
  BUSINESS_SEARCH_SCENARIOS,
  findMatchingScenario,
  type BusinessSearchScenario,
} from "../data/searchMocks";
import type { SearchResult } from "../api/types";

export function SmartSearchPanel() {
  const {
    dashboard,
    searchResult: backendResult,
    runSearch,
    isBusy,
    viewMode,
    goToScreen,
    clearInvoiceResult,
  } = useApp();
  const setApplyIntent = useDemoStore((state) => state.setApplyIntent);
  const setApplySource = useDemoStore((state) => state.setApplySource);
  const setApplyPrefillAmount = useDemoStore((state) => state.setApplyPrefillAmount);

  const [query, setQuery] = useState("");
  const [selectedScenario, setSelectedScenario] = useState<BusinessSearchScenario | null>(null);
  const [customResult, setCustomResult] = useState<SearchResult | null>(null);
  const [searchMode, setSearchMode] = useState<"auto" | "suppliers" | "info">("auto");
  const [showModeMenu, setShowModeMenu] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);

  if (!dashboard) {
    return null;
  }

  // Active result priority: custom mock scenario -> backend result
  const activeResult: SearchResult | null =
    selectedScenario?.result ?? customResult ?? backendResult;

  async function executeSearch(targetQuery: string) {
    const trimmed = targetQuery.trim();
    if (!trimmed) return;

    const matched = findMatchingScenario(trimmed);
    if (matched) {
      setSelectedScenario(matched);
      setCustomResult(null);
    } else {
      setSelectedScenario(null);
    }

    try {
      await runSearch(trimmed);
    } catch {
      // Backend fallback handled gracefully
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!query.trim()) return;
    await executeSearch(query);
  }

  async function handleScenarioClick(scenario: BusinessSearchScenario) {
    setQuery(scenario.query);
    setSelectedScenario(scenario);
    setCustomResult(null);
    try {
      await runSearch(scenario.query);
    } catch {
      // Handled
    }
  }

  function handleVoiceToggle() {
    setIsVoiceActive(!isVoiceActive);
    if (!isVoiceActive && !query) {
      // Simulate voice capture
      setQuery("Ростер для кофе Giesen W15A 2.5 млн");
      setTimeout(() => {
        setIsVoiceActive(false);
        void executeSearch("Ростер для кофе Giesen W15A 2.5 млн");
      }, 900);
    }
  }

  const badge = activeResult?.credit_badge ?? null;
  const company = dashboard.company;

  // 32-day cash flow activity dots for Column 1
  const activityDots = [
    { day: 1, level: "level-2", label: "День 1: Выручка 140 000 ₽" },
    { day: 2, level: "level-3", label: "День 2: Выручка 210 000 ₽" },
    { day: 3, level: "level-2", label: "День 3: Выручка 165 000 ₽" },
    { day: 4, level: "level-peak", label: "День 4: Пик эквайринга 340 000 ₽" },
    { day: 5, level: "level-3", label: "День 5: Выручка 220 000 ₽" },
    { day: 6, level: "level-1", label: "День 6: Выходной 85 000 ₽" },
    { day: 7, level: "level-1", label: "День 7: Выходной 95 000 ₽" },
    { day: 8, level: "level-2", label: "День 8: Выручка 155 000 ₽" },
    { day: 9, level: "level-3", label: "День 9: Выручка 205 000 ₽" },
    { day: 10, level: "level-3", label: "День 10: Выручка 240 000 ₽" },
    { day: 11, level: "level-peak", label: "День 11: Выручка 310 000 ₽" },
    { day: 12, level: "level-2", label: "День 12: Выручка 175 000 ₽" },
    { day: 13, level: "level-1", label: "День 13: Выходной 90 000 ₽" },
    { day: 14, level: "level-2", label: "День 14: Выручка 130 000 ₽" },
    { day: 15, level: "level-3", label: "День 15: Выручка 235 000 ₽" },
    { day: 16, level: "level-2", label: "День 16: Выручка 160 000 ₽" },
    { day: 17, level: "level-3", label: "День 17: Выручка 215 000 ₽" },
    { day: 18, level: "level-peak", label: "День 18: Пик эквайринга 380 000 ₽" },
    { day: 19, level: "level-3", label: "День 19: Выручка 245 000 ₽" },
    { day: 20, level: "level-1", label: "День 20: Выходной 80 000 ₽" },
    { day: 21, level: "level-2", label: "День 21: Выходной 110 000 ₽" },
    { day: 22, level: "level-3", label: "День 22: Выручка 225 000 ₽" },
    { day: 23, level: "level-2", label: "День 23: Выручка 170 000 ₽" },
    { day: 24, level: "level-3", label: "День 24: Выручка 210 000 ₽" },
    { day: 25, level: "level-peak", label: "День 25: Пик эквайринга 360 000 ₽" },
    { day: 26, level: "level-3", label: "День 26: Выручка 250 000 ₽" },
    { day: 27, level: "level-1", label: "День 27: Выходной 92 000 ₽" },
    { day: 28, level: "level-2", label: "День 28: Выручка 145 000 ₽" },
    { day: 29, level: "level-3", label: "День 29: Выручка 230 000 ₽" },
    { day: 30, level: "level-peak", label: "День 30: Сегодня +295 000 ₽" },
    { day: 31, level: "level-3", label: "Прогноз: Стабильно" },
    { day: 32, level: "level-3", label: "Прогноз: Без кассового разрыва" },
  ];

  return (
    <div className="grok-search-card">
      {/* Top Bar: Company badge & Security/Live status */}
      <div className="grok-top-bar">
        <div className="grok-badge-pill">
          <span className="grok-badge-dot" />
          <span>{company.name}</span>
        </div>
        <div className="grok-badge-pill" title="Защищённое подключение к ядру кредитного конвейера">
          <span>🔒 Защищённый контур Альфа-Банк · Live-скоринг 2.0</span>
        </div>
      </div>

      {/* Hero Center Branding: Minimalist Emblem + Grok-style Title */}
      <div className="grok-hero-header">
        <div className="grok-hero-brand">
          <div className="grok-hero-glyph">Ø</div>
          <h1 className="grok-hero-title">
            <span>Alfa Business</span>
          </h1>
        </div>
        <div className="grok-hero-sub">
          Search-to-Credit AI · Моментальный подбор оборудования, поставщиков и расчёт кредита
        </div>
      </div>

      {/* Capsule Pill Search Bar (Grok style, NO sidebar) */}
      <div className="grok-capsule-wrapper">
        <form className="grok-capsule" onSubmit={handleSubmit}>
          <div className="grok-capsule-icon">
            <MagnifyingGlassIcon size={18} />
          </div>

          <input
            className="grok-capsule-input"
            placeholder="Что вы хотите найти или профинансировать? Например, ростер для кофе, кассовый разрыв..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          <div className="grok-capsule-controls">
            {/* Mode Selector */}
            <div style={{ position: "relative" }}>
              <button
                type="button"
                className="grok-mode-dropdown-btn"
                onClick={() => setShowModeMenu(!showModeMenu)}
                title="Режим работы поисковика"
              >
                <span>
                  {searchMode === "auto"
                    ? "⚡ Auto (Search-to-Credit)"
                    : searchMode === "suppliers"
                      ? "📦 Только поставщики"
                      : "ℹ️ Инфо / Тишина"}
                </span>
                <span style={{ fontSize: 10 }}>▼</span>
              </button>

              {showModeMenu && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 8px)",
                    right: 0,
                    background: "rgba(20, 22, 28, 0.96)",
                    border: "1px solid rgba(255, 255, 255, 0.14)",
                    borderRadius: 14,
                    padding: 6,
                    minWidth: 230,
                    zIndex: 50,
                    boxShadow: "0 12px 32px rgba(0,0,0,0.6)",
                    backdropFilter: "blur(18px)",
                  }}
                >
                  <button
                    type="button"
                    className="grok-scenario-item"
                    style={{ marginBottom: 4 }}
                    onClick={() => {
                      setSearchMode("auto");
                      setShowModeMenu(false);
                    }}
                  >
                    <span>⚡ Search-to-Credit (Авто)</span>
                  </button>
                  <button
                    type="button"
                    className="grok-scenario-item"
                    style={{ marginBottom: 4 }}
                    onClick={() => {
                      setSearchMode("suppliers");
                      setShowModeMenu(false);
                    }}
                  >
                    <span>📦 Только каталог поставщиков</span>
                  </button>
                  <button
                    type="button"
                    className="grok-scenario-item"
                    onClick={() => {
                      setSearchMode("info");
                      setShowModeMenu(false);
                    }}
                  >
                    <span>ℹ️ Инфо-запрос (Режим тишины)</span>
                  </button>
                </div>
              )}
            </div>

            {/* Waveform / Voice Button */}
            <button
              type="button"
              className="grok-waveform-btn"
              onClick={handleVoiceToggle}
              title={isVoiceActive ? "Голосовой ввод активен" : "Голосовой поиск / сканирование"}
              style={{
                background: isVoiceActive ? "#ef3124" : undefined,
                color: isVoiceActive ? "#ffffff" : undefined,
              }}
            >
              <div className="grok-wave-bars">
                <span className="grok-wave-bar" />
                <span className="grok-wave-bar" />
                <span className="grok-wave-bar" />
                <span className="grok-wave-bar" />
                <span className="grok-wave-bar" />
              </div>
            </button>

            {/* Submit Arrow Button */}
            <button
              type="submit"
              disabled={isBusy || !query.trim()}
              className="btn btn-primary"
              style={{
                height: 40,
                borderRadius: 999,
                padding: "0 18px",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontWeight: 700,
                fontSize: 13,
              }}
            >
              <span>Найти</span>
            </button>
          </div>
        </form>
      </div>

      {/* 3-Column Grok-Inspired Telemetry Strip */}
      <div className="grok-telemetry-grid">
        {/* Column 1: Team usage / Daily Cash Flow Activity Heatmap */}
        <div className="grok-telem-col">
          <div className="grok-telem-header">
            <span>Кассовая активность</span>
            <span className="grok-telem-badge">За 30 дней</span>
          </div>

          <div className="grok-heatmap-matrix">
            {activityDots.map((dot, idx) => (
              <div
                key={idx}
                className={`grok-heat-dot ${dot.level}`}
                title={dot.label}
              />
            ))}
          </div>

          <div className="grok-matrix-caption">
            30/30 дней с операциями · Кассовый разрыв: 0 дней · Риск 0.0%
          </div>
        </div>

        {/* Column 2: Live Pre-approved Limits */}
        <div className="grok-telem-col">
          <div className="grok-telem-header">
            <span>Лимиты компании</span>
            <span className="grok-telem-badge" style={{ color: "#34c77b" }}>
              Предодобрено
            </span>
          </div>

          <div className="grok-limits-list">
            <div className="grok-limit-row">
              <span className="grok-limit-label">Овердрафт (ФОТ/аренда)</span>
              <span className="grok-limit-value">до 1 500 000 ₽</span>
            </div>
            <div className="grok-limit-row">
              <span className="grok-limit-label">Оборотная линия (ВКЛ)</span>
              <span className="grok-limit-value">до 5 000 000 ₽</span>
            </div>
            <div className="grok-limit-row">
              <span className="grok-limit-label">Инвест / Лизинг (CAPEX)</span>
              <span className="grok-limit-value">до 15 000 000 ₽</span>
            </div>
          </div>
          <div className="grok-matrix-caption" style={{ marginTop: 8 }}>
            Ставка от 14.5% · Решение без визита в банк
          </div>
        </div>

        {/* Column 3: Top Business Queries (Commercial Mocks for Alfa Bank) */}
        <div className="grok-telem-col">
          <div className="grok-telem-header">
            <span>Частые сценарии бизнеса</span>
            <span className="grok-telem-badge">1 клик</span>
          </div>

          <div className="grok-scenarios-list">
            {BUSINESS_SEARCH_SCENARIOS.slice(0, 4).map((scenario) => (
              <button
                key={scenario.id}
                type="button"
                className="grok-scenario-item"
                onClick={() => void handleScenarioClick(scenario)}
                disabled={isBusy}
              >
                <span>
                  {scenario.icon} {scenario.shortLabel}
                </span>
                <span className="grok-scenario-tag">{scenario.productTag.split(" ")[0]}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Dynamic Results Presentation */}
      {activeResult && (
        <div className="grok-results-container">
          <div className="grok-result-header-bar">
            <div>
              <div className="grok-result-query-title">Результаты по запросу: «{activeResult.query}»</div>
              <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.45)", marginTop: 2 }}>
                Категория: {activeResult.intent_label}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span className="pill pill-neutral">
                ⚡ {activeResult.classification_ms.toFixed(1)} мс · Search-to-Credit
              </span>
              <span className="pill pill-good">
                {activeResult.silence_mode ? "Режим тишины" : "Оффер готов"}
              </span>
            </div>
          </div>

          {/* Silence Mode Result (Ethical AI) */}
          {activeResult.silence_mode ? (
            <div className="grok-silence-hero">
              <div className="grok-silence-badge">✓ Режим тишины активен</div>
              <div className="grok-silence-text">
                {activeResult.silence_reason ??
                  "Кредит не требуется: на счёте достаточно средств. Банк защищает вашу финансовую дисциплину и не навязывает заёмные средства."}
              </div>
              <div
                style={{
                  marginTop: 14,
                  paddingTop: 12,
                  borderTop: "1px solid rgba(52, 199, 123, 0.25)",
                  fontSize: 12.5,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span style={{ fontSize: 16 }}>💡</span>
                <span>
                  <strong>Рекомендация Альфа-Банка:</strong> Подключите сервис «Налоговая копилка» —
                  6% от каждого чека эквайринга откладываются автоматически под 11% годовых до даты
                  ЕНП.
                </span>
              </div>
            </div>
          ) : (
            <>
              {/* Search-to-Credit Offer Card */}
              {badge && (
                <div className="grok-credit-card">
                  <div className="grok-credit-top">
                    <div>
                      <div className="grok-credit-eyebrow">
                        {badge.product_label} · Альфа-Банк
                      </div>
                      <div className="grok-credit-rate">
                        {formatPercent(badge.rate_pct)}
                        <small> годовых</small>
                      </div>
                    </div>
                    <span className="grok-preapproved-pill">
                      ✓ {badge.is_preapproved ? "Предодобрено без выезда" : "Предварительный расчёт"}
                    </span>
                  </div>

                  <div className="grok-credit-grid">
                    <div>
                      <div className="grok-credit-stat-label">Сумма финансирования</div>
                      <div className="grok-credit-stat-val">{formatMoney(badge.amount_rub)}</div>
                    </div>
                    <div>
                      <div className="grok-credit-stat-label">Ежемесячный платёж</div>
                      <div className="grok-credit-stat-val">
                        {formatMoney(badge.monthly_payment_rub)}
                      </div>
                    </div>
                    <div>
                      <div className="grok-credit-stat-label">Срок договора</div>
                      <div className="grok-credit-stat-val">{badge.term_months} мес.</div>
                    </div>
                    <div>
                      <div className="grok-credit-stat-label">Доступный лимит</div>
                      <div className="grok-credit-stat-val">{formatMoney(badge.limit_rub)}</div>
                    </div>
                  </div>

                  {/* Commercial Perk / Tax Offsets */}
                  <div className="grok-perk-banner">
                    <span>⚡</span>
                    <span>
                      {selectedScenario?.result?.tax_benefit ??
                        selectedScenario?.result?.alfa_product_perk ??
                        "Субсидированная ставка от Альфа-Банка · Вычет 20% НДС · Решение онлайн за 90 секунд"}
                    </span>
                  </div>

                  <button
                    type="button"
                    className="grok-apply-cta-btn"
                    disabled={viewMode === "bank"}
                    onClick={() => {
                      clearInvoiceResult();
                      setApplyPrefillAmount(badge.amount_rub);
                      setApplySource("badge");
                      setApplyIntent("standard");
                      goToScreen("apply");
                    }}
                  >
                    <span>🚀 Перенести условия в заявку</span>
                  </button>

                  <div className="grok-credit-disclaimer">{badge.disclaimer}</div>
                </div>
              )}

              {/* Verified Suppliers and Partners */}
              {activeResult.suppliers.length > 0 && (
                <div className="grok-suppliers-section">
                  <div className="grok-section-title">
                    Проверенные поставщики и партнёры Альфа-Банка · {activeResult.suppliers.length}
                  </div>
                  {activeResult.suppliers.map((supplier) => (
                    <article key={supplier.inn} className="grok-supplier-row">
                      <div>
                        <div className="grok-supplier-name">{supplier.name}</div>
                        <div className="grok-supplier-meta">
                          ИНН {supplier.inn} · Поставка {supplier.delivery_days} дн. · Цена {supplier.price_label}
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span className="pill pill-good">{supplier.fssp_label}</span>
                      </div>
                    </article>
                  ))}
                </div>
              )}

              {/* Market Benchmark Prices */}
              {activeResult.market_prices.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <div className="grok-section-title">Рыночные бенчмарки и цены</div>
                  <table className="market-table">
                    <thead>
                      <tr>
                        <th>Позиция</th>
                        <th>Ориентировочная цена</th>
                        <th>Поставщик</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeResult.market_prices.map((row, idx) => (
                        <tr key={idx}>
                          <td>{row.item}</td>
                          <td className="nowrap" style={{ fontWeight: 700 }}>
                            {row.price_label}
                          </td>
                          <td style={{ color: "rgba(255,255,255,0.6)" }}>{row.supplier_name}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* AI Financial Advisory */}
              {activeResult.ai_enrichment && (
                <div className="grok-ai-advisory">
                  <span style={{ fontSize: 18 }}>🤖</span>
                  <div>
                    <strong>AI Финансовый советник Альфа:</strong> {activeResult.ai_enrichment.text}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
