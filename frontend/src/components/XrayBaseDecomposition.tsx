import type { Application, CompanyDetail, Xray } from "../api/types";
import {
  buildXrayBaseDecomposition,
  type XrayFactorBar,
  type XrayFunnelStage,
} from "../domain-ui/xrayBaseDecomposition";

const HOUR_LABELS = ["9", "11", "13", "15", "17", "19", "21", "23"];

function FunnelShape({ stages }: { stages: XrayFunnelStage[] }) {
  const max = stages[0]?.count ?? 500;
  return (
    <div className="xray-base-funnel" role="img" aria-label="Воронка базы 500">
      <div className="xray-base-funnel-lava" aria-hidden="true">
        {stages.map((stage, index) => {
          const widthPct = Math.max(18, (stage.count / max) * 100);
          return (
            <i
              key={stage.id}
              style={{
                width: `${widthPct}%`,
                opacity: 0.35 + (1 - index / stages.length) * 0.55,
              }}
            />
          );
        })}
      </div>
      <div className="xray-base-funnel-stages">
        {stages.map((stage) => (
          <div key={stage.id} className="xray-base-funnel-stage">
            <strong>{stage.count}</strong>
            <span className="xray-base-funnel-pct">{stage.pctOfBase}%</span>
            <em>{stage.label}</em>
            <small>{stage.hint}</small>
          </div>
        ))}
      </div>
    </div>
  );
}

function FactorBars({ title, items, tone }: { title: string; items: XrayFactorBar[]; tone: "pro" | "con" }) {
  return (
    <section className={`xray-base-side xray-base-side-${tone}`}>
      <div className="xray-base-side-title">{title}</div>
      <ul className="xray-base-bars">
        {items.map((item) => (
          <li key={item.id}>
            <div className="xray-base-bar-head">
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </div>
            <div className="xray-base-bar-track" aria-hidden="true">
              {Array.from({ length: 10 }, (_, index) => (
                <i key={index} className={index < item.blocks ? "on" : undefined} />
              ))}
            </div>
            <div className="xray-base-bar-meta">
              <span>{item.detail}</span>
              {item.scoreDelta !== null ? (
                <b className={item.scoreDelta >= 0 ? "up" : "down"}>
                  {item.scoreDelta > 0 ? `+${item.scoreDelta}` : item.scoreDelta}
                </b>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function XrayBaseDecomposition({
  application,
  company,
  xray,
}: {
  application: Application;
  company: CompanyDetail | null;
  xray: Xray | null;
}) {
  const model = buildXrayBaseDecomposition({ application, company, xray });
  const deltaSign = model.cohortDeltaPct >= 0 ? "+" : "";
  const days = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

  return (
    <section className="figma-panel figma-panel-sm xray-base" aria-label="Декомпозиция базы 500">
      <div className="xray-base-head">
        <div>
          <div className="figma-panel-title">Декомпозиция базы 500</div>
          <div className="figma-panel-heading">
            Эталон модели → фильтр по плюсам (выручка, стаж) и минусам (иски, нагрузка)
          </div>
        </div>
        <div className="xray-base-hero">
          <strong>{model.cohortPct}%</strong>
          <span>
            когорты · RiskScore {model.riskScore}
            <em className={model.cohortDeltaPct >= 0 ? "up" : "down"}>
              {deltaSign}
              {model.cohortDeltaPct}% vs медиана
            </em>
          </span>
        </div>
      </div>

      <FunnelShape stages={model.funnel} />

      <div className="xray-base-grid">
        <FactorBars title="Плюсы" items={model.pros} tone="pro" />
        <FactorBars title="Минусы" items={model.cons} tone="con" />
        <section className="xray-base-heat">
          <div className="xray-base-side-title">Нагрузка · активность платежей</div>
          <div className="xray-base-heatmap" role="img" aria-label="Тепловая карта нагрузки">
            <div className="xray-base-heatmap-hours">
              {HOUR_LABELS.map((label) => (
                <span key={label}>{label}</span>
              ))}
            </div>
            {days.map((day) => (
              <div key={day} className="xray-base-heatmap-row">
                <span>{day}</span>
                <div className="xray-base-heatmap-cells">
                  {model.workloadHeatmap
                    .filter((cell) => cell.day === day)
                    .map((cell) => (
                      <i
                        key={`${cell.day}-${cell.hour}`}
                        style={{ opacity: 0.15 + cell.intensity * 0.85 }}
                        title={`${cell.day} · ${HOUR_LABELS[cell.hour]}`}
                      />
                    ))}
                </div>
              </div>
            ))}
          </div>
          <p className="xray-base-summary">{model.summary}</p>
        </section>
      </div>
    </section>
  );
}
