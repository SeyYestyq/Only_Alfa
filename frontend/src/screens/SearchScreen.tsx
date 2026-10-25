import { SmartSearchPanel } from "../components/SmartSearchPanel";

/** Поиск живёт отдельно от кредитного пути и только подсказывает, что перенести в заявку. */
export function SearchScreen() {
  return (
    <>
      <div className="page-header">
        <div>
          <div className="figma-eyebrow">Сервис · умный поиск</div>
          <h1 className="figma-h1">Что ищете?</h1>
          <p className="figma-lead">
            Покупка или сервис — если подойдёт кредит, условия перенесутся в заявку. Решение банка
            считается уже там.
          </p>
        </div>
      </div>
      <SmartSearchPanel />
    </>
  );
}
