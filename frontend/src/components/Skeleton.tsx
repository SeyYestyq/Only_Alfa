import type { ReactNode } from "react";

type BoneProps = {
  width?: string | number;
  height?: string | number;
  radius?: number;
  className?: string;
};

/** Базовый «костяк» с shimmer (состояния загрузки из Figma Б1–Б7). */
export function Bone({ width = "100%", height = 14, radius = 8, className = "" }: BoneProps) {
  return (
    <span
      className={`sk-bone ${className}`.trim()}
      style={{ width, height, borderRadius: radius }}
      aria-hidden
    />
  );
}

export function SkeletonTable({ rows = 5, cols = 7 }: { rows?: number; cols?: number }) {
  const grid = { gridTemplateColumns: `1.6fr repeat(${Math.max(cols - 1, 1)}, minmax(0, 1fr))` };
  return (
    <div className="sk-table" role="status" aria-label="Загрузка таблицы">
      <div className="sk-table-head" style={grid}>
        {Array.from({ length: cols }, (_, i) => (
          <Bone key={`h-${i}`} height={10} width={`${60 + (i % 3) * 12}%`} />
        ))}
      </div>
      {Array.from({ length: rows }, (_, row) => (
        <div key={`r-${row}`} className="sk-table-row" style={grid}>
          {Array.from({ length: cols }, (_, col) => (
            <Bone
              key={`c-${row}-${col}`}
              height={col === 0 ? 28 : 12}
              width={col === 0 ? "78%" : `${50 + ((row + col) % 4) * 10}%`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Б1 · Загрузка таблицы очереди */
export function QueueSkeleton() {
  return (
    <section className="figma-panel figma-panel-sm" role="status" aria-label="Загрузка очереди">
      <div className="sk-toolbar">
        <div className="sk-chips">
          <Bone width={72} height={32} radius={99} />
          <Bone width={128} height={32} radius={99} />
          <Bone width={96} height={32} radius={99} />
          <Bone width={140} height={32} radius={99} />
        </div>
        <Bone width={180} height={36} radius={10} />
      </div>
      <SkeletonTable rows={5} cols={7} />
    </section>
  );
}

/** Б2 · Загрузка сигнала */
export function SignalSkeleton() {
  return (
    <div role="status" aria-label="Загрузка сигнала">
      <Bone width="42%" height={12} className="sk-mb" />
      <Bone width="68%" height={32} className="sk-mb" />
      <Bone width="88%" height={16} className="sk-mb-lg" />
      <div className="figma-grid-2">
        <section className="figma-panel figma-panel-sm sk-stack">
          <Bone width="40%" height={14} />
          <SkeletonTable rows={3} cols={3} />
          <Bone width="55%" height={12} />
          <Bone width="48%" height={12} />
          <Bone width="62%" height={12} />
        </section>
        <aside className="figma-panel figma-panel-sm sk-stack">
          <Bone width="50%" height={14} />
          <Bone width="70%" height={22} />
          <div className="sk-metrics">
            <Bone height={48} />
            <Bone height={48} />
            <Bone height={48} />
          </div>
          <Bone width="90%" height={12} />
          <Bone width="80%" height={12} />
          <Bone width="100%" height={44} radius={12} />
        </aside>
      </div>
    </div>
  );
}

/** Б3 · Загрузка рентгена */
export function XraySkeleton() {
  return (
    <div role="status" aria-label="Загрузка рентгена">
      <Bone width="55%" height={12} className="sk-mb" />
      <Bone width="36%" height={32} className="sk-mb" />
      <Bone width="92%" height={16} className="sk-mb-lg" />
      <div className="xray-top">
        <section className="figma-panel figma-panel-sm sk-stack">
          <Bone width="45%" height={14} />
          <Bone width={120} height={48} />
          <Bone width="100%" height={8} radius={99} />
          <Bone width="100%" height={160} radius={12} />
        </section>
        <section className="figma-panel figma-panel-sm sk-stack">
          <Bone width="60%" height={14} />
          <div className="sk-metrics">
            <Bone height={56} />
            <Bone height={56} />
            <Bone height={56} />
            <Bone height={56} />
          </div>
          <Bone width="100%" height={120} radius={12} />
        </section>
      </div>
      <section className="figma-panel figma-panel-sm sk-stack" style={{ marginTop: 16 }}>
        <Bone width="50%" height={14} />
        <Bone width="100%" height={140} radius={12} />
      </section>
    </div>
  );
}

/** Б3 · Долгий пересчёт (Мультибанк / выписка) */
export function XrayRecalcPanel() {
  return (
    <section className="figma-panel figma-panel-sm sk-recalc" role="status" aria-label="Пересчёт скоринга">
      <div className="figma-panel-title">Пересчитываем скоринг</div>
      <p className="muted" style={{ marginTop: 6 }}>
        Клиент прислал выписку из другого банка. Обычно до 40 с.
      </p>
      <ul className="sk-progress">
        <li className="done">
          <i />
          <span>Мультибанк: обороты</span>
          <span className="mono faint">12 с</span>
        </li>
        <li className="now">
          <i />
          <span>FCF и MaxPayment</span>
          <span className="mono faint">идёт…</span>
        </li>
        <li>
          <i />
          <span>Decision Engine</span>
          <span className="mono faint">в очереди</span>
        </li>
      </ul>
    </section>
  );
}

/** Б4 · Загрузка входящих */
export function InboxSkeleton() {
  return (
    <div className="bank-messages-shell sk-inbox" role="status" aria-label="Загрузка входящих">
      <aside className="chat-list sk-stack" style={{ padding: 16 }}>
        <Bone width="40%" height={22} />
        <div className="sk-chips">
          <Bone width={110} height={28} radius={99} />
          <Bone width={64} height={28} radius={99} />
          <Bone width={56} height={28} radius={99} />
        </div>
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="sk-thread">
            <Bone width={40} height={40} radius={99} />
            <div className="sk-stack" style={{ flex: 1 }}>
              <Bone width="55%" height={12} />
              <Bone width="90%" height={10} />
            </div>
          </div>
        ))}
      </aside>
      <section className="chat-pane sk-stack" style={{ padding: 20 }}>
        <div className="sk-thread">
          <Bone width={40} height={40} radius={99} />
          <div className="sk-stack" style={{ flex: 1 }}>
            <Bone width="50%" height={14} />
            <Bone width="70%" height={10} />
          </div>
        </div>
        <Bone width="72%" height={72} radius={14} />
        <Bone width="58%" height={56} radius={14} />
      </section>
      <aside className="bank-client-card sk-stack">
        <Bone width="40%" height={14} />
        <Bone width="70%" height={12} />
        <Bone width="60%" height={12} />
        <Bone width="50%" height={12} />
      </aside>
    </div>
  );
}

/** Б5 · Загрузка дашборда эффекта */
export function EffectSkeleton() {
  return (
    <div role="status" aria-label="Загрузка дашборда эффекта">
      <Bone width="48%" height={12} className="sk-mb" />
      <Bone width="52%" height={32} className="sk-mb" />
      <Bone width="80%" height={14} className="sk-mb-lg" />
      <div className="sk-chips sk-mb-lg">
        <Bone width={88} height={32} radius={99} />
        <Bone width={88} height={32} radius={99} />
      </div>
      <section className="figma-panel figma-panel-sm sk-stack">
        <Bone width="45%" height={14} />
        <Bone width="60%" height={20} />
        {Array.from({ length: 5 }, (_, i) => (
          <Bone key={i} height={44} radius={12} />
        ))}
      </section>
      <div className="figma-grid-2" style={{ marginTop: 16 }}>
        <section className="figma-panel figma-panel-sm sk-stack">
          <Bone width="50%" height={14} />
          <Bone height={120} radius={12} />
        </section>
        <section className="figma-panel figma-panel-sm sk-stack">
          <Bone width="55%" height={14} />
          <Bone height={120} radius={12} />
        </section>
      </div>
    </div>
  );
}

/** Б6 · Загрузка списка клиентов */
export function ClientsSkeleton() {
  return (
    <section className="figma-panel figma-panel-sm" role="status" aria-label="Загрузка портфеля">
      <div className="sk-toolbar">
        <div className="sk-chips">
          <Bone width={80} height={32} radius={99} />
          <Bone width={120} height={32} radius={99} />
          <Bone width={140} height={32} radius={99} />
        </div>
        <Bone width={220} height={36} radius={10} />
      </div>
      <SkeletonTable rows={5} cols={6} />
    </section>
  );
}

/** Б7 · Загрузка профиля 360° с прогрессом сборки ДНК */
export function Profile360Skeleton() {
  return (
    <div role="status" aria-label="Сбор 360°-ДНК">
      <Bone width="55%" height={12} className="sk-mb" />
      <h1 className="figma-h1" style={{ fontSize: 28, marginBottom: 8 }}>
        Собираем 360°-ДНК
      </h1>
      <ul className="sk-progress sk-mb-lg">
        <li className="done">
          <i />
          <span>ЕГРЮЛ</span>
          <span className="mono faint">0,2 с</span>
        </li>
        <li className="done">
          <i />
          <span>Выручка и сезонность</span>
          <span className="mono faint">0,6 с</span>
        </li>
        <li className="now">
          <i />
          <span>БКИ</span>
          <span className="mono faint">идёт…</span>
        </li>
        <li>
          <i />
          <span>Geo / BuyerScore</span>
          <span className="mono faint">в очереди</span>
        </li>
      </ul>
      <div className="figma-check-grid">
        {Array.from({ length: 4 }, (_, i) => (
          <article key={i} className="figma-check-card sk-stack">
            <Bone width="40%" height={14} />
            <Bone width="85%" height={12} />
            <Bone width="70%" height={12} />
            <Bone width="75%" height={12} />
          </article>
        ))}
      </div>
      <div className="figma-grid-2" style={{ marginTop: 16 }}>
        <section className="figma-panel sk-stack">
          <Bone width="40%" height={14} />
          <Bone height={160} radius={12} />
        </section>
        <section className="figma-panel figma-panel-sm sk-stack">
          <Bone width="45%" height={14} />
          <Bone height={160} radius={12} />
        </section>
      </div>
    </div>
  );
}

/** Универсальный empty-state по копирайту макетов состояний. */
export function BankEmptyState({
  title,
  text,
  action,
}: {
  title: string;
  text: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state bank-empty">
      <h3>{title}</h3>
      <p>{text}</p>
      {action}
    </div>
  );
}
