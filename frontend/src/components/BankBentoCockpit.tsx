import { useEffect, useState } from "react";
import { api } from "../api/client";
import type { Application, RadarTrigger, SystemAction } from "../api/types";
import { useApp } from "../state/AppState";
import { formatMoney, formatPercent } from "../utils/format";

/** Сигналы, которые помогают выбрать вариант финансирования. Остальной радар — на аналитике. */
const FUNDING_TRIGGER_CODES = new Set(["TRG_CASH_GAP", "TRG_CAPEX_EXP"]);

interface SignalLine {
  id: string;
  title: string;
  line: string;
}

function oneLine(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function offerFigures(application: Application): {
  amount: number;
  term: number;
  rate: number;
  monthly: number | null;
} {
  const letter = application.offer_letters?.[0];
  const monthlyCandidates = [letter?.monthly_payment_rub, application.monthly_payment_rub];
  const monthly = monthlyCandidates.find((value) => typeof value === "number" && value > 0) ?? null;
  return {
    amount: letter?.amount_rub || application.approved_amount_rub || application.requested_amount_rub,
    term: letter?.term_months || application.term_months,
    rate: letter?.rate_pct || application.final_rate_pct,
    monthly,
  };
}

function fitReason(application: Application, monthly: number | null): string {
  const ceiling = application.max_payment_rub;
  const score = application.risk_score;
  if (monthly && ceiling > 0) {
    return `Платёж ${formatMoney(monthly)} при безопасном потолке ${formatMoney(ceiling)} · балл ${score}.`;
  }
  if (ceiling > 0) {
    return `Безопасный платёж до ${formatMoney(ceiling)} · балл ${score}.`;
  }
  return `Балл ${score}.`;
}

function signalLines(actions: SystemAction[], triggers: RadarTrigger[]): SignalLine[] {
  const lines: SignalLine[] = actions
    .filter((action) => action.status !== "CANCELLED")
    .map((action) => ({
      id: action.id,
      title: action.title,
      line: oneLine(action.client_text),
    }));
  const hasEquipment = lines.some((row) => /оборуд|capex/i.test(row.title));
  for (const trigger of triggers) {
    if (!FUNDING_TRIGGER_CODES.has(trigger.code)) {
      continue;
    }
    if (trigger.code === "TRG_CAPEX_EXP" && hasEquipment) {
      continue;
    }
    lines.push({
      id: trigger.code,
      title: trigger.title,
      line: oneLine(trigger.value),
    });
  }
  return lines;
}

/**
 * Короткий блок вместо дашборда с графиком: сигналы, одно предложение и отправка клиенту.
 * Аналитика, доказательства и журнал остаются секциями стола.
 */
export function BankBentoCockpit() {
  const { companyId, viewMode, application, dashboard } = useApp();
  const [actions, setActions] = useState<SystemAction[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!companyId || viewMode !== "bank") {
      return;
    }
    void api.getSystemActions(companyId).then((payload) => setActions(payload.actions));
  }, [companyId, viewMode]);

  if (!application || viewMode !== "bank") {
    return null;
  }

  const lines = signalLines(actions, dashboard?.radar_triggers ?? []);
  const primary = actions.find((action) => action.status === "PENDING") ?? null;
  const offer = offerFigures(application);

  async function publish(id: string) {
    if (!companyId) {
      return;
    }
    setBusyId(id);
    try {
      await api.publishSystemAction(companyId, id);
      const payload = await api.getSystemActions(companyId);
      setActions(payload.actions);
    } finally {
      setBusyId(null);
    }
  }

  async function cancel(id: string) {
    if (!companyId) {
      return;
    }
    setBusyId(id);
    try {
      await api.cancelSystemAction(companyId, id);
      const payload = await api.getSystemActions(companyId);
      setActions(payload.actions);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="figma-panel" id="desk-cockpit">
      <div className="figma-panel-title">Сигналы для решения</div>
      <p className="muted" style={{ marginTop: 4 }}>
        Что заметила система. Ниже — один вариант, который можно отправить клиенту.
      </p>

      {lines.length > 0 ? (
        <ul className="desk-signal-list">
          {lines.map((row) => (
            <li key={row.id}>
              <strong>{row.title}</strong>
              <span>{row.line}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted" style={{ marginTop: 12 }}>
          Новых сигналов по закупке, поставщику или кассе нет.
        </p>
      )}

      <div className="kv-list">
        <div className="meta-row">
          <span>Сумма</span>
          <strong>{formatMoney(offer.amount)}</strong>
        </div>
        <div className="meta-row">
          <span>Срок</span>
          <strong>{offer.term} мес.</strong>
        </div>
        <div className="meta-row">
          <span>Ставка</span>
          <strong>{formatPercent(offer.rate)}</strong>
        </div>
        {offer.monthly ? (
          <div className="meta-row">
            <span>Платёж</span>
            <strong>{formatMoney(offer.monthly)}</strong>
          </div>
        ) : null}
        <div className="meta-row">
          <span>Выручка / мес.</span>
          <strong>{formatMoney(application.monthly_revenue_alfa)}</strong>
        </div>
        <div className="meta-row">
          <span>Безопасный платёж</span>
          <strong>{formatMoney(application.max_payment_rub)}</strong>
        </div>
      </div>
      <p className="muted" style={{ marginTop: 8 }}>
        {fitReason(application, offer.monthly)}
      </p>

      {primary ? (
        <div className="bank-decision-cta" style={{ marginTop: 16 }}>
          <button
            type="button"
            className="btn btn-primary"
            disabled={busyId === primary.id}
            onClick={() => void publish(primary.id)}
          >
            Отправить клиенту
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            disabled={busyId === primary.id}
            onClick={() => void cancel(primary.id)}
          >
            Остановить
          </button>
        </div>
      ) : null}
    </section>
  );
}
