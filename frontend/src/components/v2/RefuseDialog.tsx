import { useEffect, useState } from "react";
import { REFUSE_REASONS } from "../../domain-ui/caseScript";
import { AlertDialog } from "./AlertDialog";

export function RefuseDialog({
  open,
  companyName,
  onClose,
  onConfirm,
}: {
  open: boolean;
  companyName: string;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [code, setCode] = useState("");
  const reason = REFUSE_REASONS.find((row) => row.code === code);

  useEffect(() => {
    if (!open) {
      setCode("");
    }
  }, [open]);

  return (
    <AlertDialog
      open={open}
      title={`Отказать ${companyName}?`}
      description="Без кода причины кнопка «Отказать» не работает. Клиент увидит код и что сделать дальше."
      onClose={onClose}
    >
      <label className="v2-muted" htmlFor="refuse-code" style={{ display: "block", marginTop: 12 }}>
        Код причины
      </label>
      <select
        id="refuse-code"
        value={code}
        onChange={(event) => setCode(event.target.value)}
        style={{ width: "100%", height: 40, marginTop: 8, borderRadius: 10, background: "#121215", color: "inherit", border: "1px solid #6C6C75", padding: "0 12px" }}
      >
        <option value="">Выберите код</option>
        {REFUSE_REASONS.map((row) => (
          <option key={row.code} value={row.code}>{row.code} · {row.label}</option>
        ))}
      </select>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
        <button type="button" className="v2-btn ghost" data-autofocus onClick={onClose}>Отмена</button>
        <button
          type="button"
          className="v2-btn primary"
          disabled={!reason}
          onClick={() => {
            if (reason) {
              onConfirm(`${reason.code} · ${reason.label}`);
            }
          }}
        >
          Отказать
        </button>
      </div>
    </AlertDialog>
  );
}
