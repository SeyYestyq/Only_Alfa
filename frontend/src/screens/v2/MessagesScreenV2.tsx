import { ChatThread } from "../../components/v2/ChatThread";
import { INSPECTOR_NAME } from "../../domain-ui/caseScript";
import { useApp } from "../../state/AppState";
import { shortPerson } from "../../utils/format";

export function MessagesScreenV2() {
  const { companyId, dashboard, userRole, viewMode } = useApp();
  if (!companyId) {
    return null;
  }
  const user = dashboard?.company.users.find((row) => row.role === userRole);
  const bank = viewMode === "bank";
  return (
    <>
      <h1 className="v2-h1">{bank ? "Чат с клиентом" : "Чат с банком"}</h1>
      <p className="v2-lead">{bank ? "Ответ до 30 минут" : `${INSPECTOR_NAME} · отвечает до 30 минут`}</p>
      <section className="v2-card">
        <h2>{bank ? shortPerson(user?.full_name) : INSPECTOR_NAME}</h2>
        <div style={{ marginTop: 12 }}>
          <ChatThread
            companyId={companyId}
            author={bank ? INSPECTOR_NAME : shortPerson(user?.full_name)}
            side={bank ? "bank" : "client"}
          />
        </div>
      </section>
    </>
  );
}
