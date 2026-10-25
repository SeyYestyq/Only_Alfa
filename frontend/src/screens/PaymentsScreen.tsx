import { TransactionsPanel } from "../components/TransactionsPanel";
import { useApp } from "../state/AppState";

/** К — Выручка и платежи: операции и пост-транзакционная рассрочка. */
export function PaymentsScreen() {
  const { dashboard, goToScreen } = useApp();

  if (!dashboard) {
    return (
      <div className="empty-state">
        <h3>Сводка ещё не загружена</h3>
      </div>
    );
  }

  return (
    <>
      <div className="page-header">
        <div>
          <div className="figma-eyebrow">
            Счёт ·{" "}
            {new Date().toLocaleDateString("ru-RU", { month: "long", year: "numeric" })}
          </div>
          <h1 className="figma-h1">Операции</h1>
          <p className="figma-lead">
            Движения по счёту. Крупный расход можно перевести в рассрочку после выставления предложения банком.
          </p>
        </div>
        <button type="button" className="btn btn-ghost" onClick={() => goToScreen("home")}>
          ← На главную
        </button>
      </div>

      <TransactionsPanel transactions={dashboard.transactions} />
    </>
  );
}

