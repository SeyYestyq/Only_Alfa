import { useApp } from "../../state/AppState";
import { useUiStore } from "../../state/uiStore";
import { signalFor } from "../../domain-ui/caseScript";
import { EmptyState, SkeletonLines } from "../../components/v2/ScreenState";
import { formatMoney } from "../../utils/format";

const RISK_KEYS = new Set(["kovalev", "bodrost_plus"]);

export function BankCustomers() {
  const { companies, companyId, selectCompany, dashboard, application } = useApp();
  const clientFocus = useUiStore((state) => state.clientFocus);
  const setClientFocus = useUiStore((state) => state.setClientFocus);

  const visible = companies.filter((company) => {
    if (clientFocus === "risk") {
      return company.demo_key !== null && RISK_KEYS.has(company.demo_key);
    }
    if (clientFocus === "issued") {
      return company.id === companyId && application?.status === "FUNDED";
    }
    return true;
  });

  const note = clientFocus === "risk"
    ? "Стоп-фактор и кассовый разрыв. Счётчик на аналитике — демо-книга."
    : clientFocus === "issued"
      ? "Живые выдачи этой сессии. Сумма «Выдано» на аналитике — демо-книга."
      : null;

  return (
    <>
      <div className="v2-row">
        <h1 className="v2-h1">Клиенты</h1>
        {clientFocus ? (
          <button type="button" className="v2-btn" onClick={() => setClientFocus(null)}>Показать всех</button>
        ) : null}
      </div>
      {note ? <p className="v2-muted" style={{ marginBottom: 12 }}>{note}</p> : null}
      <section className="v2-card" style={{ padding: 0 }}>
        {companies.length === 0 ? (
          <div style={{ padding: 16 }}><SkeletonLines lines={4} /></div>
        ) : visible.length === 0 ? (
          <EmptyState
            title={clientFocus === "issued" ? "Живой выдачи нет" : "Таких клиентов нет"}
            text={clientFocus === "issued"
              ? "Сумма «Выдано» — демо-книга портфеля. В этой сессии деньги ещё не ушли."
              : "Фильтр с аналитики никого не оставил. Верните полный список."}
            action="Показать всех"
            onAction={() => setClientFocus(null)}
          />
        ) : (
          <table className="v2-table">
            <thead>
              <tr><th>Компания</th><th>ИНН</th><th>Сигнал</th><th>Выручка</th><th></th></tr>
            </thead>
            <tbody>
              {visible.map((company) => {
                const signal = signalFor(company.demo_key);
                const revenue = company.id === companyId ? dashboard?.company.monthly_revenue_alfa : null;
                return (
                  <tr key={company.id} className={company.id === companyId ? "active" : ""}>
                    <td>{company.name}</td>
                    <td>{company.inn}</td>
                    <td><span className={`v2-pill ${signal.quiet ? "good" : "warn"}`}>{signal.code}</span></td>
                    <td>{revenue === null || revenue === undefined ? "—" : formatMoney(revenue)}</td>
                    <td>
                      <button type="button" className="v2-btn" onClick={() => void selectCompany(company.id, { nextScreen: "bank-signal" })}>
                        Открыть сигнал
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
