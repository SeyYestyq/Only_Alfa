import { signalFor } from "../../domain-ui/caseScript";
import { useApp } from "../../state/AppState";
import { formatMoney } from "../../utils/format";

export function BankCustomers() {
  const { companies, companyId, selectCompany, dashboard } = useApp();
  return (
    <>
      <h1 className="v2-h1">Клиенты</h1>
      <section className="v2-card" style={{ padding: 0 }}>
        <table className="v2-table">
          <thead>
            <tr><th>Компания</th><th>ИНН</th><th>Сигнал</th><th>Выручка</th><th></th></tr>
          </thead>
          <tbody>
            {companies.map((company) => {
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
      </section>
    </>
  );
}
