import { OperationsTable } from "../components/OperationsTable";
import { useApp } from "../state/AppState";

/** Раздел «Выручка и платежи»: операции по счёту и переход к оплате счёта. */
export function PaymentsScreen() {
  const { dashboard, goToScreen } = useApp();

  if (!dashboard) {
    return <div className="empty-state"><h3>Сводка ещё не загружена</h3></div>;
  }

  return (
    <>
      <div className="page-header">
        <div>
          <div className="figma-eyebrow">{dashboard.company.name}</div>
          <h1 className="figma-h1">Выручка и платежи</h1>
          <p className="figma-lead">
            Операции по расчётному счёту. Если платёж поставщику не помещается в остаток, его можно
            подготовить к оплате и закрыть кредитом.
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => goToScreen("invoice")}>
          Оплатить счёт
        </button>
      </div>
      <section className="figma-panel">
        <OperationsTable rows={dashboard.transactions} limit={12} />
      </section>
    </>
  );
}
