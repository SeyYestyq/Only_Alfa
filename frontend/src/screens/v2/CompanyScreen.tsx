import { useEffect, useState } from "react";
import { api } from "../../api/client";
import { EmptyState, ErrorState, SkeletonLines } from "../../components/v2/ScreenState";
import { useApp } from "../../state/AppState";

interface CompanyDocument {
  id: string;
  name: string;
  source: string;
  created_at: string | null;
  downloadable: boolean;
}

export function CompanyScreen() {
  const { dashboard, companyId, application, goToScreen } = useApp();
  const [documents, setDocuments] = useState<CompanyDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!companyId) {
      return;
    }
    let alive = true;
    setLoading(true);
    setFailed(false);
    api.companyDocuments(companyId)
      .then((payload) => {
        if (alive) {
          setDocuments(payload.documents);
        }
      })
      .catch(() => {
        if (alive) {
          setFailed(true);
        }
      })
      .finally(() => {
        if (alive) {
          setLoading(false);
        }
      });
    return () => {
      alive = false;
    };
  }, [application?.status, application?.updated_at, companyId]);

  if (!dashboard || !companyId) {
    return <SkeletonLines lines={5} />;
  }

  const company = dashboard.company;

  return (
    <>
      <h1 className="v2-h1">Компания</h1>
      <p className="v2-lead">Реквизиты, сотрудники и документы</p>
      <div className="v2-split">
        <section className="v2-card">
          <h2>Реквизиты</h2>
          <div className="v2-check"><span>Название</span><strong>{company.name}</strong></div>
          <div className="v2-check"><span>ИНН</span><strong>{company.inn}</strong></div>
          <div className="v2-check"><span>Форма</span><strong>{company.legal_form === "OOO" ? "ООО" : "ИП"}</strong></div>
        </section>
        <section className="v2-card">
          <h2>Сотрудники</h2>
          {company.users.map((user) => (
            <div key={user.id} className="v2-check">
              <span>{user.full_name}</span>
              <strong>{user.role === "CEO_OWNER" || user.role === "IP_OWNER" ? "подпись" : "заявки"}</strong>
            </div>
          ))}
        </section>
      </div>
      <section className="v2-card" style={{ marginTop: 12 }}>
        <div className="v2-card-head">
          <h2>Документы компании</h2>
          <button type="button" className="v2-btn primary" onClick={() => goToScreen(application ? "decision" : "apply")}>
            Загрузить документ
          </button>
        </div>
        {loading ? <SkeletonLines lines={3} /> : null}
        {failed ? (
          <ErrorState
            title="Не получилось загрузить"
            text="Список документов не пришёл. Повторите запрос."
            onRetry={() => {
              setFailed(false);
              setLoading(true);
              void api.companyDocuments(companyId).then((payload) => {
                setDocuments(payload.documents);
                setLoading(false);
              }).catch(() => {
                setFailed(true);
                setLoading(false);
              });
            }}
          />
        ) : null}
        {!loading && !failed && documents.length === 0 ? (
          <EmptyState
            title="Документов пока нет"
            text="Документы появятся после заявки или подписи."
            action="К заявке"
            onAction={() => goToScreen("apply")}
          />
        ) : null}
        {!loading && !failed && documents.length > 0 ? (
          <table className="v2-table">
            <thead>
              <tr><th>Документ</th><th>Откуда</th><th>Дата</th></tr>
            </thead>
            <tbody>
              {documents.map((row) => (
                <tr key={row.id}>
                  <td>{row.name}</td>
                  <td>{row.source}</td>
                  <td>{row.created_at?.slice(0, 10) ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </section>
    </>
  );
}
