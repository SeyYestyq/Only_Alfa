import type { ClientBrief } from "../api/types";

/** Три блока: где заявка, почему так, что делать — с бэкенда. */
export function ApplicationBriefPanel({ brief }: { brief: ClientBrief }) {
  const toneClass =
    brief.tone === "good" ? "alert-good" : brief.tone === "risk" ? "alert-risk" : "alert-warn";

  return (
    <section className="figma-panel figma-panel-sm application-brief" style={{ marginBottom: 24 }}>
      <div className="figma-panel-title">Статус заявки простыми словами</div>
      <div className={`alert ${toneClass}`} style={{ marginTop: 12 }}>
        <strong>{brief.where}</strong>
        <p style={{ margin: "6px 0 0" }}>{brief.what_next}</p>
      </div>
      <div style={{ marginTop: 16 }}>
        <div className="figma-panel-title">Почему банк решил так</div>
        <ul className="checklist" style={{ marginTop: 8 }}>
          {brief.why_facts.map((fact) => (
            <li key={fact}>{fact}</li>
          ))}
        </ul>
      </div>
      {brief.pre_decision_warnings.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div className="figma-panel-title">До решения: на что обратить внимание</div>
          <ul className="checklist muted">
            {brief.pre_decision_warnings.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      )}
      {brief.decision_letter && (
        <div className="figma-panel figma-panel-sm" style={{ marginTop: 16, background: "var(--surface-2)" }}>
          <div className="figma-panel-title">{brief.decision_letter.title}</div>
          {brief.decision_letter.paragraphs.map((paragraph) => (
            <p key={paragraph} className="muted" style={{ margin: "8px 0 0", fontSize: 14, lineHeight: 1.45 }}>
              {paragraph}
            </p>
          ))}
          {brief.decision_letter.next_steps.length > 0 && (
            <>
              <div className="figma-panel-title" style={{ marginTop: 14 }}>Следующие шаги</div>
              <ol className="checklist" style={{ marginTop: 8 }}>
                {brief.decision_letter.next_steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </>
          )}
        </div>
      )}
      <p className="muted" style={{ marginTop: 16, fontSize: 13 }}>
        <strong>Что сделать:</strong> {brief.next_action}
      </p>
    </section>
  );
}
