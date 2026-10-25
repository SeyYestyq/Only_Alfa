import { useState, useMemo } from "react";
import { useApp } from "../state/AppState";
import { useBankMessagesStore } from "../state/bankMessagesStore";
import { formatMoney, formatPercent } from "../utils/format";

export interface BankBentoCockpitProps {
  onNavigateSection: (sectionId: string) => void;
  activeSection?: string;
}

type Timeframe = "1M" | "3M" | "6M" | "12M";

interface ChartPoint {
  label: string;
  revenue: number;
  cashFlow: number;
  safeCeiling: number;
}

export function BankBentoCockpit({ onNavigateSection, activeSection = "decision" }: BankBentoCockpitProps) {
  const { application, xray, dashboard, underwriterAction, isBusy, goToScreen } = useApp();
  const setActiveThread = useBankMessagesStore((state) => state.setActiveThread);

  const [timeframe, setTimeframe] = useState<Timeframe>("12M");
  const [isStress, setIsStress] = useState<boolean>(false);
  const [modelAmount, setModelAmount] = useState<number>(() => {
    return application?.approved_amount_rub || application?.requested_amount_rub || 2500000;
  });
  const [resolutionChoice, setResolutionChoice] = useState<"APPROVE" | "COUNTER_OFFER" | "NEED_MORE_INFO">("APPROVE");
  const [hoveredPoint, setHoveredPoint] = useState<ChartPoint | null>(null);

  if (!application) {
    return null;
  }

  const baseMonthlyRev = application.monthly_revenue_alfa || 3850000;
  const companyName = application.company.name;
  const inn = application.company.inn;
  const score = application.risk_score;
  const ratePct = application.final_rate_pct || 18.5;
  const termMonths = application.term_months || 24;
  const demoKey = (dashboard?.company.demo_key || dashboard?.company.id || "rosters").replace("cmp_", "");
  const companyAgeMonths = dashboard?.company.age_months ?? 40;

  // Рассчёт аннуитетного платежа для интерактивного слайдера
  const monthlyPaymentCalc = useMemo(() => {
    const monthlyRate = ratePct / 100 / 12;
    if (monthlyRate === 0) return modelAmount / termMonths;
    const factor = Math.pow(1 + monthlyRate, termMonths);
    return Math.round((modelAmount * (monthlyRate * factor)) / (factor - 1));
  }, [modelAmount, ratePct, termMonths]);

  // Генерация точек для графика выручки и Cash-Flow
  const chartData: ChartPoint[] = useMemo(() => {
    const raw12: Array<{ label: string; factor: number }> = [
      { label: "Ноя", factor: 0.94 },
      { label: "Дек", factor: 1.15 },
      { label: "Янв", factor: 0.88 },
      { label: "Фев", factor: 0.92 },
      { label: "Мар", factor: 1.02 },
      { label: "Апр", factor: 1.06 },
      { label: "Май", factor: 0.96 },
      { label: "Июн", factor: 1.08 },
      { label: "Июл", factor: 1.12 },
      { label: "Авг", factor: 1.05 },
      { label: "Сен", factor: 1.18 },
      { label: "Окт", factor: 1.14 },
    ];

    let slice = raw12;
    if (timeframe === "1M") {
      slice = [
        { label: "Нед 1", factor: 1.08 },
        { label: "Нед 2", factor: 1.12 },
        { label: "Нед 3", factor: 1.14 },
        { label: "Нед 4", factor: 1.19 },
      ];
    } else if (timeframe === "3M") {
      slice = raw12.slice(-3);
    } else if (timeframe === "6M") {
      slice = raw12.slice(-6);
    }

    const stressMult = isStress ? 0.8 : 1.0;

    return slice.map((item) => {
      const rev = Math.round(baseMonthlyRev * item.factor * stressMult);
      const cash = Math.round(rev * (isStress ? 0.21 : 0.29));
      const safeCeiling = Math.round(rev * 0.36);
      return {
        label: item.label,
        revenue: rev,
        cashFlow: cash,
        safeCeiling,
      };
    });
  }, [baseMonthlyRev, timeframe, isStress]);

  // SVG координаты для графика
  const svgWidth = 800;
  const svgHeight = 180;
  const maxVal = Math.max(...chartData.map((d) => d.revenue)) * 1.15;
  const minVal = 0;

  const points = chartData.map((d, i) => {
    const x = chartData.length > 1 ? (i / (chartData.length - 1)) * (svgWidth - 60) + 30 : svgWidth / 2;
    const y = svgHeight - 24 - ((d.revenue - minVal) / (maxVal - minVal)) * (svgHeight - 48);
    const yCash = svgHeight - 24 - ((d.cashFlow - minVal) / (maxVal - minVal)) * (svgHeight - 48);
    const yCeiling = svgHeight - 24 - ((d.safeCeiling - minVal) / (maxVal - minVal)) * (svgHeight - 48);
    return { ...d, x, y, yCash, yCeiling };
  });

  const pathD = points.reduce((acc, p, i) => {
    return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, "");

  const areaD = points.length > 0 ? `${pathD} L ${points[points.length - 1].x} ${svgHeight - 16} L ${points[0].x} ${svgHeight - 16} Z` : "";

  const ceilingPathD = points.reduce((acc, p, i) => {
    return i === 0 ? `M ${p.x} ${p.yCeiling}` : `${acc} L ${p.x} ${p.yCeiling}`;
  }, "");

  function openChatWithClient() {
    setActiveThread(demoKey);
    goToScreen("bank-messages");
  }

  function handleSignResolution() {
    if (resolutionChoice === "APPROVE") {
      void underwriterAction("APPROVE", "Решение утверждено на цифровом кокпите андеррайтера (Maker)");
    } else if (resolutionChoice === "COUNTER_OFFER") {
      void underwriterAction("COUNTER_OFFER", `Встречный лимит: ${formatMoney(modelAmount)} под ${formatPercent(ratePct)}`);
    } else {
      void underwriterAction("NEED_MORE_INFO", "Запрошены уточняющие документы заёмщика");
    }
  }

  const isResolved = !["MANUAL_REVIEW", "NEED_MORE_INFO", "COUNTER_OFFER", "ANOMALY_DETECTED", "MULTIBANK_PENDING"].includes(
    application.status
  );

  return (
    <div className="bank-bento-shell" id="desk-cockpit">
      {/* ── 1. Top Dynamic Island (Status Capsule с 5 точками-шагами) ── */}
      <div className="bento-island-wrapper">
        <div className="bento-island-capsule">
          <div className="bento-island-dots" title="Этапы скоринга конвейера">
            <span className="bento-island-dot done" title="Шаг 1: ЕГРЮЛ верифицирован" />
            <span className="bento-island-dot done" title="Шаг 2: БКИ & ФССП чистые" />
            <span className="bento-island-dot done" title="Шаг 3: RiskScore калиброван" />
            <span className="bento-island-dot done" title="Шаг 4: CAPEX подтвержден" />
            <span className={`bento-island-dot ${isResolved ? "done" : "active"}`} title="Шаг 5: Резолюция Maker-Checker" />
          </div>
          <span className="bento-island-label">
            {isResolved ? "Кейс закрыт · Решение зафиксировано" : "Кокпит андеррайтера · Maker (Елена Орлова)"}
          </span>
        </div>
      </div>

      {/* ── Top Header Controls on the Hero Frame ── */}
      <div className="bento-hero-top-row">
        <div className="bento-hero-title-group">
          <div className="bento-hero-badge-icon">⚡</div>
          <div>
            <h2 className="bento-hero-title">
              {companyName} <span style={{ fontSize: 13, fontWeight: 500, color: "#8c93a4" }}>· ИНН {inn}</span>
            </h2>
            <p className="bento-hero-subtitle">
              Динамика выручки, чистый денежный поток и безопасный кредитный потолок (НБКИ + Альфа)
            </p>
          </div>
        </div>

        <div className="bento-hero-controls">
          {/* Segmented Period Tabs */}
          <div className="bento-segmented-pill">
            {(["1M", "3M", "6M", "12M"] as Timeframe[]).map((t) => (
              <button
                key={t}
                type="button"
                className={`bento-segment-btn ${timeframe === t ? "active" : ""}`}
                onClick={() => setTimeframe(t)}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Stress-Test Toggle */}
          <button
            type="button"
            className={`bento-stress-toggle ${isStress ? "active" : ""}`}
            onClick={() => setIsStress(!isStress)}
            title="Смоделировать стресс-сценарий падения выручки на -20%"
          >
            <span>{isStress ? "⚠️ Стресс-тест -20%" : "🛡️ Базовый поток"}</span>
          </button>

          {/* SLA Pill */}
          <span
            className="pill pill-warning"
            style={{
              fontSize: 11,
              fontWeight: 750,
              padding: "5px 12px",
              background: "rgba(245, 166, 35, 0.12)",
              border: "1px solid rgba(245, 166, 35, 0.3)",
              color: "#ffb020",
            }}
          >
            ⏱ SLA: 14 мин
          </span>
        </div>
      </div>

      {/* ── 2. Main Hero Canvas (Huge Interactive Viewport) ── */}
      <div className="bento-hero-canvas">
        <div className="bento-chart-container">
          <svg className="bento-chart-svg" viewBox={`0 0 ${svgWidth} ${svgHeight}`} preserveAspectRatio="none">
            <defs>
              <linearGradient id="bentoGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef3124" stopOpacity={isStress ? "0.2" : "0.38"} />
                <stop offset="100%" stopColor="#ef3124" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="bentoLineGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#ff7875" />
                <stop offset="100%" stopColor="#ef3124" />
              </linearGradient>
              <filter id="bentoGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Сетка и горизонтальные ориентиры */}
            <line x1="20" y1={svgHeight - 24} x2={svgWidth - 20} y2={svgHeight - 24} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
            <line x1="20" y1={svgHeight / 2} x2={svgWidth - 20} y2={svgHeight / 2} stroke="rgba(255,255,255,0.04)" strokeDasharray="4 4" strokeWidth="1" />

            {/* Область под графиком выручки */}
            {areaD && <path d={areaD} fill="url(#bentoGrad)" />}

            {/* Пунктирный потолок безопасного долга */}
            {ceilingPathD && (
              <path
                d={ceilingPathD}
                fill="none"
                stroke="#ffb020"
                strokeWidth="1.5"
                strokeDasharray="5 4"
                opacity={0.7}
              />
            )}

            {/* Основная линия тренда выручки */}
            {pathD && (
              <path
                d={pathD}
                fill="none"
                stroke="url(#bentoLineGrad)"
                strokeWidth="3"
                filter="url(#bentoGlow)"
              />
            )}

            {/* Точки данных на графике */}
            {points.map((p, idx) => (
              <g key={idx}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="5"
                  fill="#ffffff"
                  stroke="#ef3124"
                  strokeWidth="2.5"
                  style={{ cursor: "pointer", transition: "transform 0.2s" }}
                  onMouseEnter={() => setHoveredPoint(p)}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
                <text
                  x={p.x}
                  y={svgHeight - 6}
                  fill="#7d8492"
                  fontSize="10"
                  fontWeight="600"
                  textAnchor="middle"
                >
                  {p.label}
                </text>
              </g>
            ))}
          </svg>

          {/* Тултип при наведении */}
          {hoveredPoint && (
            <div
              style={{
                position: "absolute",
                top: 10,
                left: 20,
                background: "rgba(18, 22, 30, 0.95)",
                border: "1px solid rgba(255, 255, 255, 0.14)",
                borderRadius: 10,
                padding: "8px 12px",
                fontSize: 11,
                color: "#fff",
                boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
                pointerEvents: "none",
                display: "flex",
                gap: 16,
              }}
            >
              <span>Период: <strong>{hoveredPoint.label}</strong></span>
              <span>Выручка: <strong style={{ color: "#00e599" }}>{formatMoney(hoveredPoint.revenue)}</strong></span>
              <span>Свободный поток: <strong>{formatMoney(hoveredPoint.cashFlow)}</strong></span>
              <span>Безопасный лимит: <strong style={{ color: "#ffb020" }}>{formatMoney(hoveredPoint.safeCeiling)}</strong></span>
            </div>
          )}
        </div>

        {/* Метрики внизу полотна */}
        <div className="bento-hero-chips">
          <div className="bento-hero-chip">
            <span>Выручка за 30 дней:</span>
            <strong>{formatMoney(baseMonthlyRev * (isStress ? 0.8 : 1))}</strong>
          </div>
          <div className="bento-hero-chip">
            <span>Чистый поток (EBITDA):</span>
            <strong style={{ color: "#00e599" }}>{formatMoney(baseMonthlyRev * (isStress ? 0.21 : 0.29))}</strong>
          </div>
          <div className="bento-hero-chip">
            <span>Запас прочности (Runway):</span>
            <strong style={{ color: isStress ? "#ffb020" : "#00e599" }}>{isStress ? "3.2 мес." : "4.4 мес."}</strong>
          </div>
        </div>
      </div>

      {/* ── 3. Bottom Row: 2x2 Bento Micro-Cards Grid + 3 Modular Cards ── */}
      <div className="bento-lower-grid">
        {/* Left Column: 2x2 Bento Micro-Cards */}
        <div className="bento-vitals-column">
          <div className="bento-vitals-quad">
            {/* Card 1: RiskScore */}
            <div className="bento-vital-card">
              <div className="bento-vital-top">
                <div className="bento-vital-icon">🎯</div>
                <span className={`bento-vital-badge ${score >= 750 ? "good" : score >= 600 ? "warn" : "risk"}`}>
                  {score >= 750 ? "Зелёный" : score >= 600 ? "Жёлтый" : "Красный"}
                </span>
              </div>
              <div>
                <div className="bento-vital-val" style={{ color: score >= 750 ? "#00e599" : score >= 600 ? "#ffb020" : "#ff4d4f" }}>
                  {score ? `${score}` : "0"} <span style={{ fontSize: 12, fontWeight: 500, color: "#8c93a4" }}>/ 1000</span>
                </div>
                <div className="bento-vital-lbl">RiskScore · PD {score >= 750 ? "0.8%" : score >= 600 ? "2.4%" : "12%"}</div>
              </div>
            </div>

            {/* Card 2: DTI (Долговая нагрузка) */}
            <div className="bento-vital-card">
              <div className="bento-vital-top">
                <div className="bento-vital-icon">💳</div>
                <span className="bento-vital-badge good">Норма &lt; 50%</span>
              </div>
              <div>
                <div className="bento-vital-val">34%</div>
                <div className="bento-vital-lbl">Долговая нагрузка DTI</div>
                <div style={{ width: "100%", height: 3, background: "rgba(255,255,255,0.08)", borderRadius: 2, marginTop: 4 }}>
                  <div style={{ width: "34%", height: "100%", background: "#00e599", borderRadius: 2 }} />
                </div>
              </div>
            </div>

            {/* Card 3: Оборот в банке */}
            <div className="bento-vital-card">
              <div className="bento-vital-top">
                <div className="bento-vital-icon">📈</div>
                <span className="bento-vital-badge good">↑ +11% г/г</span>
              </div>
              <div>
                <div className="bento-vital-val">{formatMoney(application.monthly_revenue_alfa)}</div>
                <div className="bento-vital-lbl">Оборот в Альфа-Банке</div>
              </div>
            </div>

            {/* Card 4: Стоп-факторы */}
            <div className="bento-vital-card">
              <div className="bento-vital-top">
                <div className="bento-vital-icon">🛡️</div>
                <span className="bento-vital-badge good">0 / 15 стопов</span>
              </div>
              <div>
                <div className="bento-vital-val" style={{ color: "#00e599" }}>100% Чисто</div>
                <div className="bento-vital-lbl">ЕГРЮЛ · ФССП · БКИ</div>
              </div>
            </div>
          </div>

          {/* Verified Strip below 2x2 Grid */}
          <div className="bento-verified-strip">
            <span>✓</span>
            <span>
              ЕГРЮЛ {Math.floor(companyAgeMonths / 12)} г. {companyAgeMonths % 12} мес. · БКИ без просрочек · ФССП 0 ₽ · SHA-256 Verified
            </span>
          </div>
        </div>

        {/* Right Column: 3 Bento Modular Cards */}
        <div className="bento-actions-grid">
          {/* Bento Card 1: Interactive Loan Calculator */}
          <div className="bento-action-card">
            <div className="bento-card-header">
              <div>
                <span className="bento-card-kicker">Моделирование оффера</span>
                <h4 className="bento-card-title">Параметры кредита & ставка</h4>
              </div>
              <span className="pill pill-good" style={{ fontSize: 10 }}>{formatPercent(ratePct)}</span>
            </div>

            <div className="bento-slider-wrap">
              <div className="bento-slider-val-row">
                <span className="bento-slider-val">{formatMoney(modelAmount)}</span>
                <span className="bento-slider-sub">{termMonths} мес.</span>
              </div>
              <input
                type="range"
                min="500000"
                max="5000000"
                step="100000"
                value={modelAmount}
                onChange={(e) => setModelAmount(Number(e.target.value))}
                className="bento-range-input"
              />
            </div>

            <div className="bento-calc-details">
              <span>Аннуитет: <strong>≈ {formatMoney(monthlyPaymentCalc)} / мес.</strong></span>
              <span>Безопасный DTI: <strong>{Math.round((monthlyPaymentCalc / (baseMonthlyRev * 0.28)) * 100)}%</strong></span>
            </div>
          </div>

          {/* Bento Card 2: CAPEX Installment Module */}
          <div className="bento-action-card">
            <div className="bento-card-header">
              <div>
                <span className="bento-card-kicker">Целевое расходование</span>
                <h4 className="bento-card-title">Рассрочка CAPEX оборудования</h4>
              </div>
              <span className="pill pill-outline" style={{ fontSize: 10 }}>100% Целевое</span>
            </div>

            <div className="bento-capex-preview">
              <div className="bento-capex-img-placeholder">☕</div>
              <div className="bento-capex-info">
                <span className="bento-capex-title">Ростер Giesen W6A (Кофе)</span>
                <span className="bento-capex-cost">1 850 000 ₽ · Спецставка</span>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ width: "100%", justifyContent: "center" }}
              onClick={openChatWithClient}
            >
              💬 Предложить рассрочку клиенту
            </button>
          </div>

          {/* Bento Card 3: Underwriter Action Resolution */}
          <div className="bento-action-card">
            <div className="bento-card-header">
              <div>
                <span className="bento-card-kicker">Резолюция инспектора</span>
                <h4 className="bento-card-title">Maker-Checker пульт</h4>
              </div>
              <span className={`status-tag is-${score >= 750 ? "good" : score >= 600 ? "warn" : "risk"}`} style={{ fontSize: 10 }}>
                {application.status_label}
              </span>
            </div>

            {isResolved ? (
              <div style={{ fontSize: 12, color: "#9aa1b2", background: "rgba(255,255,255,0.03)", padding: "10px", borderRadius: 10 }}>
                ✓ Решение подписано ПЭП сотрудника банка. Запись зафиксирована в ACID-журнале событий.
              </div>
            ) : (
              <div className="bento-resolution-selector">
                <button
                  type="button"
                  className={`bento-resolution-btn ${resolutionChoice === "APPROVE" ? "active-approve" : ""}`}
                  onClick={() => setResolutionChoice("APPROVE")}
                >
                  <span>✓ Одобрить лимит {formatMoney(modelAmount)}</span>
                  {resolutionChoice === "APPROVE" && <span>●</span>}
                </button>
                <button
                  type="button"
                  className={`bento-resolution-btn ${resolutionChoice === "COUNTER_OFFER" ? "active-counter" : ""}`}
                  onClick={() => setResolutionChoice("COUNTER_OFFER")}
                >
                  <span>⚖️ Встречный оффер конвейера</span>
                  {resolutionChoice === "COUNTER_OFFER" && <span>●</span>}
                </button>
                <button
                  type="button"
                  className={`bento-resolution-btn ${resolutionChoice === "NEED_MORE_INFO" ? "active-counter" : ""}`}
                  onClick={() => setResolutionChoice("NEED_MORE_INFO")}
                >
                  <span>📄 Запросить доп. документы</span>
                  {resolutionChoice === "NEED_MORE_INFO" && <span>●</span>}
                </button>
              </div>
            )}

            <button
              type="button"
              className="bento-cta-btn primary"
              disabled={isBusy || isResolved}
              onClick={handleSignResolution}
            >
              {isResolved ? "Решение зафиксировано" : "✓ Подписать решение ПЭП"}
            </button>
          </div>
        </div>
      </div>

      {/* ── 4. Bottom Floating Dock (5-Tab Navigation Capsule) ── */}
      <div className="bento-bottom-dock-wrapper">
        <div className="bento-bottom-dock">
          <button
            type="button"
            className={`bento-dock-item ${activeSection === "cockpit" || activeSection === "decision" ? "active" : ""}`}
            onClick={() => onNavigateSection("desk-cockpit")}
          >
            <span>📊</span>
            <span>Кокпит</span>
          </button>
          <button
            type="button"
            className={`bento-dock-item ${activeSection === "evidence" ? "active" : ""}`}
            onClick={() => onNavigateSection("desk-evidence")}
          >
            <span>🔍</span>
            <span>CAPEX & Выписка</span>
          </button>
          <button
            type="button"
            className={`bento-dock-item ${activeSection === "analytics" ? "active" : ""}`}
            onClick={() => onNavigateSection("desk-analytics")}
          >
            <span>🗺️</span>
            <span>X-Ray & Гео</span>
          </button>
          {application.collateral_type !== "NONE" && (
            <button
              type="button"
              className={`bento-dock-item ${activeSection === "collateral" ? "active" : ""}`}
              onClick={() => onNavigateSection("desk-collateral")}
            >
              <span>💎</span>
              <span>Залог</span>
            </button>
          )}
          <button
            type="button"
            className={`bento-dock-item ${activeSection === "audit" ? "active" : ""}`}
            onClick={() => onNavigateSection("desk-audit")}
          >
            <span>📜</span>
            <span>Аудит-лог</span>
          </button>
        </div>
      </div>
    </div>
  );
}
