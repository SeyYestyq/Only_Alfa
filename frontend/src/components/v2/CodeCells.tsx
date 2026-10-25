export function CodeCells({
  digits,
  active,
  invalid,
  onChange,
  onFocusIndex,
}: {
  digits: string[];
  active: number;
  invalid: boolean;
  onChange: (index: number, value: string) => void;
  onFocusIndex: (index: number) => void;
}) {
  return (
    <div className="v2-otp">
      {digits.map((digit, index) => (
        <input
          key={index}
          inputMode="numeric"
          aria-label={`Цифра ${index + 1}`}
          className={invalid ? "bad" : index === active ? "on" : ""}
          value={digit}
          maxLength={1}
          onFocus={() => onFocusIndex(index)}
          onChange={(event) => onChange(index, event.target.value.replace(/\D/g, "").slice(-1))}
        />
      ))}
    </div>
  );
}
