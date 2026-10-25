import { SmartSearchPanel } from "../components/SmartSearchPanel";

/** Поиск живёт отдельно от кредитного пути и только подсказывает, что перенести в заявку. */
export function SearchScreen() {
  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="figma-h1">Умный поиск</h1>
          <p className="figma-lead">Найдите товар или услугу и сразу подберите финансирование</p>
        </div>
      </div>
      <SmartSearchPanel />
    </>
  );
}
