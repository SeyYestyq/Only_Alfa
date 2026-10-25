import React from "react";

export interface RiskScoreGaugeProps {
  score: number;
  maxScore?: number;
  minScore?: number;
  size?: "sm" | "md" | "lg";
  showCorridors?: boolean;
  className?: string;
}

export interface ScoreCorridor {
  name: string;
  code: "GREEN" | "YELLOW" | "ORANGE" | "RED";
  min: number;
  max: number;
  color: string;
  label: string;
}

export const SCORE_CORRIDORS: ScoreCorridor[] = [
  { name: "Красный", code: "RED", min: 300, max: 450, color: "#EF3124", label: "Стоп-фактор" },
  { name: "Оранжевый", code: "ORANGE", min: 450, max: 520, color: "#F26B5B", label: "Ручной разбор" },
  { name: "Жёлтый", code: "YELLOW", min: 520, max: 650, color: "#F2B33D", label: "Сниженный лимит" },
  { name: "Зелёный", code: "GREEN", min: 650, max: 1000, color: "#34C77B", label: "Высокая надёжность" },
];

/** Одна подпись балла для клиента и инспектора: «610 · жёлтый коридор». */
export function scoreCorridorLabel(score: number): string {
  return `${score} · ${getCorridor(score).name.toLowerCase()} коридор`;
}

export function getCorridor(score: number): ScoreCorridor {
  if (score >= 650) return SCORE_CORRIDORS[3];
  if (score >= 520) return SCORE_CORRIDORS[2];
  if (score >= 450) return SCORE_CORRIDORS[1];
  return SCORE_CORRIDORS[0];
}

/**
 * Радиальный спидометр кредитного скоринга (RiskScore Gauge Meter)
 * Референс Pinterest: Dribbble/Behance fintech dark UI (#174655291791206406)
 */
export const RiskScoreGauge: React.FC<RiskScoreGaugeProps> = ({
  score,
  minScore = 300,
  maxScore = 1000,
  size = "md",
  showCorridors = true,
  className = "",
}) => {
  const clampedScore = Math.max(minScore, Math.min(maxScore, score));
  const corridor = getCorridor(clampedScore);

  // Размеры SVG
  const dim = size === "sm" ? 180 : size === "lg" ? 280 : 220;
  const radius = size === "sm" ? 64 : size === "lg" ? 104 : 82;
  const cx = dim / 2;
  const cy = size === "sm" ? dim / 2 + 10 : size === "lg" ? dim / 2 + 18 : dim / 2 + 14;
  const strokeWidth = size === "sm" ? 10 : size === "lg" ? 16 : 13;

  // Углы спидометра: от 140° (слева внизу) до 400° (справа внизу), размах 260°
  const startAngle = 140;
  const endAngle = 400;
  const totalAngle = endAngle - startAngle;

  const scoreFrac = (clampedScore - minScore) / (maxScore - minScore);
  const currentAngle = startAngle + scoreFrac * totalAngle;

  // Хелперы для вычисления точек дуги
  const polarToCartesian = (centerX: number, centerY: number, r: number, angleInDegrees: number) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + r * Math.cos(angleInRadians),
      y: centerY + r * Math.sin(angleInRadians),
    };
  };

  const describeArc = (x: number, y: number, r: number, startA: number, endA: number) => {
    const start = polarToCartesian(x, y, r, endA);
    const end = polarToCartesian(x, y, r, startA);
    const largeArcFlag = endA - startA <= 180 ? "0" : "1";
    return ["M", start.x, start.y, "A", r, r, 0, largeArcFlag, 0, end.x, end.y].join(" ");
  };

  // Стрелка
  const needleLen = radius - (size === "sm" ? 12 : 16);
  const needleTip = polarToCartesian(cx, cy, needleLen, currentAngle);
  const needleBase1 = polarToCartesian(cx, cy, 6, currentAngle + 90);
  const needleBase2 = polarToCartesian(cx, cy, 6, currentAngle - 90);

  // Маркеры порогов: 450, 520, 650
  const thresholds = [
    { value: 450, color: "#F26B5B" },
    { value: 520, color: "#F2B33D" },
    { value: 650, color: "#34C77B" },
  ];

  return (
    <div
      className={`risk-score-gauge-wrap ${className}`}
      style={{
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      }}
    >
      <svg
        width={dim}
        height={dim * 0.82}
        viewBox={`0 0 ${dim} ${dim * 0.82}`}
        style={{ overflow: "visible" }}
      >
        <defs>
          {/* Градиент активной шкалы */}
          <linearGradient id="scoreGaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#EF3124" />
            <stop offset="35%" stopColor="#F26B5B" />
            <stop offset="65%" stopColor="#F2B33D" />
            <stop offset="100%" stopColor="#34C77B" />
          </linearGradient>

          {/* Фильтр свечения */}
          <filter id="gaugeGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Фоновый трек */}
        <path
          d={describeArc(cx, cy, radius, startAngle, endAngle)}
          fill="none"
          stroke="#232327"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        {/* Секторные радиальные риски (лучевые штрихи из Pinterest Ref #6) */}
        {Array.from({ length: 27 }).map((_, i) => {
          const tickAngle = startAngle + (i / 26) * totalAngle;
          const isMajor = i % 5 === 0;
          const p1 = polarToCartesian(cx, cy, radius + strokeWidth / 2 + 3, tickAngle);
          const p2 = polarToCartesian(
            cx,
            cy,
            radius + strokeWidth / 2 + (isMajor ? 8 : 5),
            tickAngle
          );
          const isPassed = tickAngle <= currentAngle;
          return (
            <line
              key={i}
              x1={p1.x}
              y1={p1.y}
              x2={p2.x}
              y2={p2.y}
              stroke={isPassed ? corridor.color : "#303036"}
              strokeWidth={isMajor ? 1.5 : 1}
              opacity={isPassed ? 0.9 : 0.4}
            />
          );
        })}

        {/* Активная заполненная дуга */}
        {clampedScore > minScore && (
          <path
            d={describeArc(cx, cy, radius, startAngle, currentAngle)}
            fill="none"
            stroke="url(#scoreGaugeGrad)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            filter="url(#gaugeGlow)"
          />
        )}

        {/* Метки пороговых значений (450, 520, 650) */}
        {showCorridors &&
          thresholds.map((t) => {
            const tAngle = startAngle + ((t.value - minScore) / (maxScore - minScore)) * totalAngle;
            const p = polarToCartesian(cx, cy, radius - strokeWidth / 2 - 8, tAngle);
            return (
              <circle
                key={t.value}
                cx={p.x}
                cy={p.y}
                r={2.5}
                fill={t.color}
                opacity={0.85}
              />
            );
          })}

        {/* Стрелка (Needle) */}
        <polygon
          points={`${needleTip.x},${needleTip.y} ${needleBase1.x},${needleBase1.y} ${needleBase2.x},${needleBase2.y}`}
          fill={corridor.color}
          style={{
            transition: "all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)",
            transformOrigin: `${cx}px ${cy}px`,
          }}
        />

        {/* Центральная ось стрелки */}
        <circle cx={cx} cy={cy} r={7} fill="#111113" stroke={corridor.color} strokeWidth={2.5} />
        <circle cx={cx} cy={cy} r={2.5} fill="#f5f5f7" />
      </svg>

      {/* Центральные текстовые метрики */}
      <div
        style={{
          marginTop: size === "sm" ? -28 : size === "lg" ? -46 : -36,
          textAlign: "center",
          zIndex: 2,
        }}
      >
        <div
          style={{
            fontFamily: "var(--font)",
            fontSize: size === "sm" ? 26 : size === "lg" ? 42 : 34,
            fontWeight: 800,
            lineHeight: 1,
            letterSpacing: "-0.03em",
            color: "var(--text-primary)",
          }}
        >
          {score}
        </div>
        <div
          style={{
            fontSize: size === "sm" ? 11 : 12,
            color: "var(--text-faint)",
            marginTop: 4,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          из {maxScore} · {corridor.name} коридор
        </div>
        <div
          style={{
            display: "inline-block",
            marginTop: 6,
            padding: "3px 10px",
            borderRadius: "12px",
            fontSize: size === "sm" ? 11 : 12,
            fontWeight: 600,
            backgroundColor: `${corridor.color}22`,
            color: corridor.color,
            border: `1px solid ${corridor.color}44`,
          }}
        >
          {corridor.label}
        </div>
      </div>
    </div>
  );
};
