import { Kbd } from "./Kbd";

const ROWS: Array<[string, string]> = [
  ["J / K", "строка вверх / вниз"],
  ["↵", "открыть задачу"],
  ["R", "ответить клиенту"],
  ["N", "взять следующую"],
  ["/", "поиск"],
  ["Esc", "закрыть окно, фокус назад"],
  ["⌘↵", "отправить решение"],
  ["⌘Z", "отменить отправку"],
];

export function HotkeyCard() {
  return (
    <section className="v2-hotkey-card">
      <div className="v2-kicker">Клавиатура</div>
      <h2>Всё — без мыши</h2>
      <p className="v2-muted">Горячие клавиши не срабатывают, пока курсор в поле ввода.</p>
      <div className="v2-hotkey-grid">
        {ROWS.map(([key, label]) => (
          <span key={key} style={{ display: "contents" }}>
            <Kbd>{key}</Kbd>
            <span>{label}</span>
          </span>
        ))}
      </div>
    </section>
  );
}
