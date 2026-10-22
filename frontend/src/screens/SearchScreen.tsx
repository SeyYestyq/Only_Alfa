import { SmartSearchPanel } from "../components/SmartSearchPanel";

/** Поиск живёт отдельно от кредитного пути и только подсказывает, что перенести в заявку. */
export function SearchScreen() {
  return (
    <>
      <div className="page-header">
        <div>
          <div className="figma-eyebrow">Сервис · не заявка</div>
          <h1 className="figma-h1">Поиск</h1>
          <p className="figma-lead">
            Найдите покупку или сервис. Если подойдёт кредит, условия переносятся в заявку — решение
            банка считается уже там.
          </p>
        </div>
      </div>
      <SmartSearchPanel />
    </>
  );
}
