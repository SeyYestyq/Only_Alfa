import type { CollateralType } from "../api/types";
import { formatMoney } from "../utils/format";

/** Порог покрытия из продуктовой матрицы. Решение по заявке считает бэкенд. */
const COVERAGE_FLOOR = 0.5;

const OPTIONS: Array<{ id: Exclude<CollateralType, "NONE">; title: string; hint: string }> = [
  { id: "REAL_ESTATE", title: "Недвижимость", hint: "Офис, склад, помещение" },
  { id: "VEHICLE", title: "Транспорт", hint: "Авто и спецтехника" },
  { id: "EQUIPMENT", title: "Оборудование", hint: "Станки и линия" },
];

interface CollateralPickerProps {
  enabled: boolean;
  type: CollateralType;
  value: number;
  requestedAmount: number;
  error: string | null;
  onEnabledChange: (enabled: boolean) => void;
  onTypeChange: (type: CollateralType) => void;
  onValueChange: (value: number) => void;
}

function coverageRatio(value: number, requestedAmount: number): number {
  if (requestedAmount <= 0 || value <= 0) {
    return 0;
  }
  return value / requestedAmount;
}

/** Выбор обеспечения на заявке: без залога или ВКЛ с залогом. */
export function CollateralPicker({
  enabled,
  type,
  value,
  requestedAmount,
  error,
  onEnabledChange,
  onTypeChange,
  onValueChange,
}: CollateralPickerProps) {
  const ratio = coverageRatio(value, requestedAmount);
  const covers = ratio >= COVERAGE_FLOOR;
  const meter = Math.min(100, Math.round((ratio / COVERAGE_FLOOR) * 100));

  return (
    <div className="field field-full">
      <span className="field-label">Обеспечение</span>
      <div className="collateral-switch" role="group" aria-label="Обеспечение">
        <button
          type="button"
          className={!enabled ? "active" : ""}
          onClick={() => onEnabledChange(false)}
        >
          <strong>Без залога</strong>
          <span>Встречное предложение, если платёж выше сезона</span>
        </button>
        <button
          type="button"
          className={enabled ? "active" : ""}
          onClick={() => onEnabledChange(true)}
        >
          <strong>Под залог</strong>
          <span>Полная сумма, ВКЛ до 60 млн ₽</span>
        </button>
      </div>

      {enabled && (
        <div className="collateral-box">
          <div className="collateral-types" role="radiogroup" aria-label="Предмет залога">
            {OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={type === option.id}
                className={`collateral-type ${type === option.id ? "active" : ""}`}
                onClick={() => onTypeChange(option.id)}
              >
                <strong>{option.title}</strong>
                <span>{option.hint}</span>
              </button>
            ))}
          </div>

          <label className="field">
            <span className="field-label">Оценочная стоимость, ₽</span>
            <input
              className="field-input"
              type="number"
              min={0}
              step={50_000}
              value={value || ""}
              onChange={(event) => onValueChange(Number(event.target.value))}
            />
          </label>

          <div className={`collateral-meter ${covers ? "enough" : ""}`} aria-hidden="true">
            <div className="fill" style={{ width: `${value > 0 ? meter : 0}%` }} />
          </div>

          {error ? (
            <p className="collateral-note error">{error}</p>
          ) : value <= 0 ? (
            <p className="collateral-note">
              Укажите оценку. Для полной суммы она должна быть не ниже половины запроса —{" "}
              {formatMoney(requestedAmount * COVERAGE_FLOOR)}.
            </p>
          ) : covers ? (
            <p className="collateral-note enough">
              Покрытие {Math.round(ratio * 100)}%. Этого хватает, чтобы банк рассмотрел{" "}
              {formatMoney(requestedAmount)} как ВКЛ с залогом.
            </p>
          ) : (
            <p className="collateral-note short">
              Покрытие {Math.round(ratio * 100)}% — меньше половины. Полную сумму так не откроют,
              останутся встречные варианты. Нужно от {formatMoney(requestedAmount * COVERAGE_FLOOR)}.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
