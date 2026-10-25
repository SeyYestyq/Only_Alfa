import { useEffect, useState } from "react";
import type { ScreenId } from "../../api/types";
import { INSPECTOR_NAME } from "../../domain-ui/caseScript";
import { Kbd } from "./Kbd";
import { isTextField } from "./keys";
import { useApp } from "../../state/AppState";
import { useDemoStore } from "../../state/demoStore";
import { useUiStore } from "../../state/uiStore";
import { givenInitial, roleLabel, shortPerson } from "../../utils/format";

const STORY_CLOCK = "21.10.2026, 22:40";

function permissionHint(role: string, legalForm: string | undefined): string {
  if (role === "ACCOUNTANT") {
    return "бухгалтер · может готовить заявки";
  }
  if (role === "CEO_OWNER") {
    return "генеральный директор · право подписи";
  }
  if (role === "IP_OWNER") {
    return "предприниматель · подписывает сам";
  }
  if (legalForm === "IP") {
    return "подписывает сам";
  }
  return roleLabel(role);
}

export function Chrome() {
  const {
    companies,
    companyId,
    dashboard,
    application,
    viewMode,
    userRole,
    screen,
    isBusy,
    error,
    clearError,
    selectCompany,
    setUserRole,
    setViewMode,
    goToScreen,
    lookupInn,
  } = useApp();
  const chat = useDemoStore((state) => state.chat);
  const resetStory = useDemoStore((state) => state.resetStory);
  const [companyOpen, setCompanyOpen] = useState(false);
  const [roleOpen, setRoleOpen] = useState(false);
  const [inn, setInn] = useState("");
  const [innNote, setInnNote] = useState<string | null>(null);
  const searchQuery = useUiStore((state) => state.searchQuery);
  const setSearchQuery = useUiStore((state) => state.setSearchQuery);
  const notifiedAt = useDemoStore((state) =>
    application ? state.ceoNotifiedAt[application.application_id] : undefined);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setCompanyOpen(false);
        setRoleOpen(false);
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
        return;
      }
      if (event.key === "/" && !isTextField(event.target) && !event.metaKey && !event.ctrlKey) {
        const field = document.getElementById("v2-search");
        if (field) {
          event.preventDefault();
          field.focus();
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const company = dashboard?.company ?? companies.find((row) => row.id === companyId);
  const users = company?.users ?? [];
  const user = users.find((row) => row.role === userRole) ?? users[0];
  const person = viewMode === "bank" ? INSPECTOR_NAME : shortPerson(user?.full_name);
  const initial = viewMode === "bank" ? "Е" : givenInitial(user?.full_name);
  const hint = viewMode === "bank"
    ? "кредитный инспектор · МСБ"
    : permissionHint(userRole, company?.legal_form);
  const messages = companyId ? (chat[companyId]?.length ?? 0) : 0;

  const clientLinks: Array<{ id: ScreenId; label: string; dot?: boolean }> = [
    { id: "home", label: "Главная" },
    { id: "payments", label: "Деньги" },
    { id: "apply", label: "Кредиты" },
    { id: "invoice", label: "Счёт" },
    { id: "documents", label: "Документы" },
    { id: "messages", label: "Сообщения", dot: messages > 0 && screen !== "messages" },
  ];
  const bankLinks: Array<{ id: ScreenId; label: string; dot?: boolean }> = [
    { id: "bank-queue", label: "Рабочий стол" },
    { id: "bank-clients", label: "Аналитика" },
    { id: "bank-customers", label: "Клиенты" },
    { id: "bank-effect", label: "Эффект" },
  ];
  const links = viewMode === "bank" ? bankLinks : clientLinks;

  function active(id: ScreenId): boolean {
    if (id === "apply") {
      return ["apply", "decision", "signing", "passport", "applications"].includes(screen);
    }
    if (id === "bank-queue") {
      return ["bank-queue", "bank-signal", "bank-xray", "bank-messages", "bank-payout"].includes(screen);
    }
    return screen === id;
  }

  return (
    <>
      <div className="v2-demo">
        <div className="v2-demo-left">
          <span className="v2-demo-pill">ДЕМО</span>
          <span>Синтетические данные · {STORY_CLOCK}{isBusy ? " · считаем…" : ""}</span>
        </div>
        <div className="v2-demo-right">
          <div className="v2-eyes">
            <button
              type="button"
              className={viewMode === "business" ? "active" : ""}
              onClick={() => setViewMode("business")}
            >
              Глазами бизнеса
            </button>
            <button
              type="button"
              className={viewMode === "bank" ? "active" : ""}
              onClick={() => setViewMode("bank")}
            >
              Глазами банка
            </button>
          </div>
          <div className="v2-menu">
            <button type="button" className="v2-text-btn" onClick={() => setRoleOpen((open) => !open)}>
              Роль: {viewMode === "bank" ? "Инспектор" : roleLabel(userRole)} ▾
            </button>
            {roleOpen && viewMode === "business" ? (
              <div className="v2-menu-pop">
                {users.map((row) => (
                  <button
                    key={row.id}
                    type="button"
                    className={row.role === userRole ? "active" : ""}
                    onClick={() => {
                      setUserRole(row.role);
                      setRoleOpen(false);
                    }}
                  >
                    <span>{shortPerson(row.full_name)}</span>
                    <small>{roleLabel(row.role)}</small>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <button
            type="button"
            className="v2-text-btn"
            onClick={() => goToScreen(viewMode === "bank" ? "bank-states" : "edges")}
          >
            Состояния
          </button>
          <button
            type="button"
            className="v2-text-btn"
            onClick={() => {
              resetStory();
              window.location.reload();
            }}
          >
            Сбросить демо
          </button>
        </div>
      </div>
      <header className="v2-nav">
        <button type="button" className="v2-logo" onClick={() => goToScreen(viewMode === "bank" ? "bank-queue" : "home")}>
          <span className="v2-logo-mark">А</span>
          <span>
            <strong>Альфа Бизнес</strong>
            <small>{viewMode === "bank" ? "Кредитный конвейер · банк" : "Кредитный кабинет"}</small>
          </span>
        </button>
        <nav className="v2-links" aria-label="Разделы">
          {links.map((link) => (
            <button
              key={link.id}
              type="button"
              className={active(link.id) ? "active" : ""}
              onClick={() => {
                if (link.id === "apply") {
                  const status = application?.status;
                  if (status === "FUNDED" || status === "AWAITING_CEO_APPROVAL" || status === "APPROVED") {
                    goToScreen("signing");
                    return;
                  }
                  if (status && status !== "DRAFT_BY_EMPLOYEE") {
                    goToScreen("decision");
                    return;
                  }
                  goToScreen("apply");
                  return;
                }
                goToScreen(link.id);
              }}
            >
              {link.label}
              {link.dot ? <i className="v2-dot" /> : null}
            </button>
          ))}
        </nav>
        <div className="v2-nav-tools">
          {viewMode === "bank" ? (
            <label className="v2-search">
              <input
                id="v2-search"
                type="search"
                placeholder="Поиск: ИНН, компания, № заявки"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
              <Kbd>/</Kbd>
            </label>
          ) : null}
          <div className="v2-chip">
            <button type="button" onClick={() => setCompanyOpen((open) => !open)}>
              {company?.name ?? "Компания"} ▾
            </button>
            {companyOpen ? (
              <div className="v2-menu-pop">
                {companies.map((row) => (
                  <button
                    key={row.id}
                    type="button"
                    className={row.id === companyId ? "active" : ""}
                    onClick={() => {
                      setCompanyOpen(false);
                      void selectCompany(row.id);
                    }}
                  >
                    <span>{row.name}</span>
                    <small>ИНН {row.inn}</small>
                  </button>
                ))}
                <form
                  className="v2-inn-row"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void lookupInn(inn).then((result) => {
                      setInnNote(result.ok ? result.name : result.message);
                    });
                  }}
                >
                  <input
                    value={inn}
                    onChange={(event) => setInn(event.target.value)}
                    placeholder="Проверить ИНН"
                    inputMode="numeric"
                  />
                  <button type="submit" className="v2-btn">Ок</button>
                </form>
                {innNote ? <p className="v2-muted">{innNote}</p> : null}
              </div>
            ) : null}
          </div>
          <div className="v2-user">
            <span className={`v2-avatar ${viewMode === "bank" ? "bank" : ""}`}>{initial}</span>
            <span>
              <strong>{person}</strong>
              <small>{hint}</small>
            </span>
          </div>
        </div>
      </header>
      {viewMode === "business" &&
      notifiedAt &&
      application &&
      (application.status === "AWAITING_CEO_APPROVAL" || application.status === "APPROVED") &&
      userRole === (company?.legal_form === "IP" ? "IP_OWNER" : "CEO_OWNER") &&
      screen !== "signing" ? (
        <div className="v2-sign-note" role="status">
          <span>Ждёт вашей подписи · уведомление в {notifiedAt}</span>
          <button type="button" className="v2-btn dense" onClick={() => goToScreen("signing")}>
            К подписи
          </button>
        </div>
      ) : null}
      {error ? (
        <div className="v2-main" style={{ paddingBottom: 0 }}>
          <div className="v2-error">
            <span>{error}</span>
            <button type="button" className="v2-btn dense" onClick={() => window.location.reload()}>Повторить</button>
            <button type="button" className="v2-text-btn" onClick={clearError}>Закрыть</button>
          </div>
        </div>
      ) : null}
    </>
  );
}
