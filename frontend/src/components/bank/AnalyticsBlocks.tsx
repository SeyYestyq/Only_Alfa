import type { ScreenId } from "../../api/types";
import {
  type AnalyticsSnapshot,
  FUNNEL_LABELS,
  conversionPct,
} from "../../domain-ui/bankAnalytics";
import {
  LIMIT_UP_AMOUNT,
  RESTRUCTURE_PAYMENT,
  ROSTERS_OFFER_AMOUNT,
  ROSTERS_REQUEST_AMOUNT,
  JULY_REVENUE_FORECAST,
} from "../../domain-ui/caseScript";
import { formatMoney } from "../../utils/format";

const SHORT_NAME: Record<string, string> = {
  rosters: "Ростерс Кафе",
  tekhnostroy: "ТехноСтрой Инжиниринг",
  kovalev: "ИП Ковалев",
  bodrost_plus: "Бодрость Плюс",
};

const TEKH_OFFER = 3_200_000;

export interface AttentionRow {
  id: string;
  name: string;
  reason: string;
  screen: ScreenId;
  primary: string | null;
}

export function attentionRows(
  companies: ReadonlyArray<{ id: string; demo_key: string | null }>,
  liveStatus: string | undefined,
): AttentionRow[] {
  const rows: AttentionRow[] = [];
  const found = (key: string) => companies.find((company) => company.demo_key === key);
  const rosters = found("rosters");
  if (rosters) {
    rows.push({
      id: rosters.id,
      name: SHORT_NAME.rosters,
      reason: rostersReason(liveStatus),
      screen: liveStatus && liveStatus !== "REJECTED" ? "bank-xray" : "bank-profile",
      primary: null,
    });
  }
  pushStatic(rows, found("tekhnostroy"), SHORT_NAME.tekhnostroy, `Ранний сигнал · госконтракты, ${formatMoney(TEKH_OFFER)}`);
  pushStatic(rows, found("kovalev"), SHORT_NAME.kovalev, "SLA · кассовый разрыв, выписка на разборе");
  pushStatic(rows, found("bodrost_plus"), SHORT_NAME.bodrost_plus, "Стоп-фактор · ФССП, предложение не шлём");
  return rows.slice(0, 5);
}

function pushStatic(
  rows: AttentionRow[],
  company: { id: string } | undefined,
  name: string,
  reason: string,
) {
  if (!company) {
    return;
  }
  rows.push({
    id: company.id,
    name,
    reason,
    screen: "bank-profile",
    primary: null,
  });
}

function rostersReason(status: string | undefined): string {
  if (status === "FUNDED") {
    return `Ранний сигнал · июль ${formatMoney(JULY_REVENUE_FORECAST)}`;
  }
  if (status === "COUNTER_OFFER") {
    return `Встречное · ${formatMoney(ROSTERS_REQUEST_AMOUNT)} при ${formatMoney(ROSTERS_OFFER_AMOUNT)}`;
  }
  if (status && status !== "REJECTED") {
    return "Заявка в работе · SLA на пределе";
  }
  return "Ранний сигнал · оборудование из оборота";
}

export function KpiButton({
  value,
  caption,
  delta,
  onClick,
  demo,
  riskValue,
}: {
  value: string;
  caption: string;
  delta: { text: string; tone: "up" | "down" | "risk" | "flat" };
  onClick: () => void;
  demo?: boolean;
  riskValue?: boolean;
}) {
  return (
    <button type="button" className="v2-kpi-btn" onClick={onClick} title="к прошлому периоду">
      <span className={riskValue ? "v2-kpi-value risk" : "v2-kpi-value"}>{value}</span>
      <span className={`v2-delta ${delta.tone}`}>{delta.text}</span>
      <span className="v2-kpi-caption">
        {caption}
        {demo ? <span className="v2-pill demo">демо</span> : null}
      </span>
    </button>
  );
}

export function pctDelta(value: number, goodWhen: "up" | "down"): { text: string; tone: "up" | "down" | "flat" } {
  if (value === 0) {
    return { text: "0%", tone: "flat" };
  }
  const arrow = value > 0 ? "↑" : "↓";
  const good = goodWhen === "up" ? value > 0 : value < 0;
  return { text: `${arrow} ${Math.abs(value)}%`, tone: good ? "up" : "down" };
}

export function countDelta(value: number, kind: "work" | "risk"): { text: string; tone: "up" | "down" | "risk" | "flat" } {
  if (value === 0) {
    return { text: "0", tone: "flat" };
  }
  const arrow = value > 0 ? "↑" : "↓";
  if (kind === "risk") {
    return { text: `${arrow} ${Math.abs(value)}`, tone: value > 0 ? "risk" : "up" };
  }
  return { text: `${arrow} ${Math.abs(value)}`, tone: value > 0 ? "down" : "up" };
}

export function FunnelChart({ book, hint, dropAt }: { book: AnalyticsSnapshot; hint: string; dropAt: number }) {
  return (
    <div className="v2-funnel-container">
      <p className="v2-axis-label">Количество, шт</p>
      <div className="v2-funnel">
        {FUNNEL_LABELS.map((label, index) => {
          const count = book.funnel[index];
          const conversion = index === 0 ? null : conversionPct(count, book.funnel[index - 1]);
          const dropped = index === dropAt;
          const tip = conversion === null
            ? `${label}: ${count} шт`
            : `${label}: ${count} шт, ${conversion}% с прошлого шага`;
          return (
            <div key={label} className={dropped ? "v2-funnel-step drop" : "v2-funnel-step"} data-tip={tip}>
              <div className="count">{count}</div>
              <div className="label">{label}</div>
              <div className="conv">{conversion === null ? "—" : `${conversion}%`}</div>
            </div>
          );
        })}
      </div>
      <p className="v2-drop-hint">{hint}</p>
    </div>
  );
}

export function ProductBars({ book, liveNote }: { book: AnalyticsSnapshot; liveNote: number | null }) {
  const max = Math.max(...book.products.map((row) => row.rub), 1);
  return (
    <div className="v2-products-container">
      <p className="v2-axis-label">Объём выдачи, ₽</p>
      <div className="v2-hbars">
        {book.products.map((row) => (
          <div key={row.name} className="v2-hbar" data-tip={`${row.name}: ${formatMoney(row.rub)}`}>
            <span className="name">{row.name}</span>
            <span className="track" aria-hidden="true">
              <span style={{ width: `${Math.max(4, Math.round((row.rub / max) * 100))}%` }} />
            </span>
            <span className="rub">{formatMoney(row.rub)}</span>
          </div>
        ))}
      </div>
      <div className="v2-axis" aria-hidden="true">
        <span>0 ₽</span>
        <span>{formatMoney(max)}</span>
      </div>
      {liveNote ? <p className="v2-muted">включая выдачу Ростерс Кафе {formatMoney(liveNote)}</p> : null}
    </div>
  );
}

export function RiskBar({ risk }: { risk: AnalyticsSnapshot["risk"] }) {
  const total = risk.ok + risk.watch + risk.risk;
  const share = (count: number) => (total > 0 ? Math.round((count / total) * 100) : 0);
  const parts = [
    { key: "ok", label: "в норме", count: risk.ok, share: share(risk.ok) },
    { key: "watch", label: "наблюдение", count: risk.watch, share: share(risk.watch) },
    { key: "risk", label: "риск", count: risk.risk, share: share(risk.risk) },
  ];
  return (
    <div className="v2-risk-container">
      <p className="v2-axis-label">Клиенты, шт</p>
      <div
        className="v2-stack"
        data-tip={parts.map((part) => `${part.label}: ${part.count} шт, ${part.share}%`).join(" · ")}
      >
        {parts.map((part) => (
          <span key={part.key} className={part.key} style={{ width: `${part.share}%` }} />
        ))}
      </div>
      <ul className="v2-legend">
        {parts.map((part) => (
          <li key={part.key} className={part.key}>
            <i />
            <span className="legend-label">{part.label}</span>
            <b>{part.count} шт · {part.share}%</b>
          </li>
        ))}
      </ul>
    </div>
  );
}
