import { useEffect, useRef } from "react";
import { BellRingingIcon } from "./icons";
import { useApp } from "../state/AppState";
import { useBankMessagesStore } from "../state/bankMessagesStore";
import {
  useDemoStore,
  type BankNotice,
  type ClientNotice,
} from "../state/demoStore";

function kindLabel(kind: ClientNotice["kind"]): string {
  if (kind === "approved") {
    return "Одобрено";
  }
  if (kind === "sign") {
    return "Подпись";
  }
  if (kind === "rejected") {
    return "Отказ";
  }
  if (kind === "need_docs") {
    return "Документы";
  }
  if (kind === "counter") {
    return "Условия";
  }
  return "В работе";
}

function bankKindLabel(kind: BankNotice["kind"]): string {
  if (kind === "manual_review") return "Ручной разбор";
  if (kind === "anomaly") return "Аномалия кассы";
  if (kind === "docs") return "Новые документы";
  if (kind === "new_app") return "Новая заявка";
  if (kind === "stop_factor") return "Стоп-фактор";
  return "Заявка";
}

const DEMO_SCENARIOS: Record<string, any> = {
  rosters: {
    product_type: "INVEST_LEASING",
    requested_amount_rub: 2_500_000,
    term_months: 12,
    declared_monthly_revenue: 2_100_000,
  },
  tekhnostroy: {
    product_type: "VKL",
    requested_amount_rub: 3_200_000,
    term_months: 24,
    declared_monthly_revenue: 6_000_000,
  },
  kovalev: {
    product_type: "OVERDRAFT",
    requested_amount_rub: 200_000,
    term_months: 12,
    declared_monthly_revenue: 680_000,
  },
  smirnov: {
    product_type: "INVEST_LEASING",
    requested_amount_rub: 900_000,
    term_months: 24,
    declared_monthly_revenue: 1_450_000,
  },
};

/** Колокольчик в шапке: уведомления как для бизнеса, так и для пилота банка. */
export function NoticeBell() {
  const {
    viewMode,
    effectiveRole,
    openApplication,
    goToScreen,
    openBankCase,
    selectCompany,
    companies,
  } = useApp();

  const isSigningAuthority = effectiveRole === "CEO_OWNER" || effectiveRole === "IP_OWNER";

  const clientNotices = useDemoStore((state) => state.clientNotices);
  const bankNotices = useDemoStore((state) => state.bankNotices);
  const open = useDemoStore((state) => state.noticesOpen);
  const setOpen = useDemoStore((state) => state.setNoticesOpen);
  const dismissClient = useDemoStore((state) => state.dismissClientNotice);
  const clearClient = useDemoStore((state) => state.clearClientNotices);
  const dismissBank = useDemoStore((state) => state.dismissBankNotice);
  const clearBank = useDemoStore((state) => state.clearBankNotices);
  const setActiveChatThread = useBankMessagesStore((state) => state.setActiveThread);

  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    function onDoc(event: MouseEvent) {
      if (!panelRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open, setOpen]);

  const visibleClientNotices = clientNotices.filter(
    (notice) => !notice.signingAuthorityOnly || isSigningAuthority,
  );
  const count = viewMode === "bank" ? bankNotices.length : visibleClientNotices.length;

  const handleBankNoticeClick = (notice: BankNotice) => {
    dismissBank(notice.id);
    setOpen(false);

    const company = companies.find(
      (c) => c.id === notice.companyId || c.demo_key === notice.demoKey,
    );
    const targetCompanyId = company?.id ?? notice.companyId;

    if (notice.targetScreen === "bank-xray") {
      const scenario = DEMO_SCENARIOS[notice.demoKey] ?? {
        product_type: "INVEST_LEASING",
        requested_amount_rub: 1_000_000,
        term_months: 12,
        declared_monthly_revenue: 1_500_000,
      };
      void openBankCase(targetCompanyId, scenario);
    } else if (notice.targetScreen === "bank-messages") {
      setActiveChatThread(notice.demoKey);
      void selectCompany(targetCompanyId, { nextScreen: "bank-messages" });
    } else {
      void selectCompany(targetCompanyId, { nextScreen: "bank-clients" });
    }
  };

  return (
    <div className="notice-bell" ref={panelRef}>
      <button
        type="button"
        className={`notice-bell-btn ${open ? "active" : ""}`}
        aria-label={viewMode === "bank" ? "Уведомления кредитного конвейера" : "Уведомления по кредиту"}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <span className="notice-bell-ico" aria-hidden="true">
          <BellRingingIcon size={18} />
        </span>
        {count > 0 ? (
          <span className="figma-nav-badge">{count > 9 ? "9+" : count}</span>
        ) : null}
      </button>

      {open && (
        <div className="notice-panel" role="dialog" aria-label="Уведомления">
          <div className="notice-panel-head">
            <strong>
              {viewMode === "bank" ? "Входящие события конвейера" : "Уведомления"}
            </strong>
            {count > 0 ? (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => (viewMode === "bank" ? clearBank() : clearClient())}
              >
                Очистить
              </button>
            ) : null}
          </div>

          {viewMode === "bank" ? (
            count === 0 ? (
              <p className="muted" style={{ padding: "12px 14px", fontSize: 13 }}>
                Все заявки и события обработаны. Новые заявки от заемщиков появятся здесь.
              </p>
            ) : (
              <ul className="notice-panel-list">
                {bankNotices.map((notice) => (
                  <li key={notice.id}>
                    <button
                      type="button"
                      className="notice-panel-item"
                      onClick={() => handleBankNoticeClick(notice)}
                    >
                      <span className="notice-panel-kind">
                        {bankKindLabel(notice.kind)} · {notice.time}
                      </span>
                      <strong>{notice.title}</strong>
                      <span className="muted">{notice.text}</span>
                      <span className="notice-panel-cta">{notice.primaryLabel} →</span>
                    </button>
                  </li>
                ))}
              </ul>
            )
          ) : count === 0 ? (
            <p className="muted" style={{ padding: "12px 14px", fontSize: 13 }}>
              Пока тихо. Когда банк ответит по заявке — сюда придёт сообщение с действием.
            </p>
          ) : (
            <ul className="notice-panel-list">
              {visibleClientNotices.map((notice) => (
                <li key={notice.id}>
                  <button
                    type="button"
                    className="notice-panel-item"
                    onClick={() => {
                      dismissClient(notice.id);
                      setOpen(false);
                      void openApplication(notice.applicationId).then(() => {
                        goToScreen(notice.targetScreen);
                      });
                    }}
                  >
                    <span className="notice-panel-kind">{kindLabel(notice.kind)}</span>
                    <strong>{notice.title}</strong>
                    <span className="muted">{notice.text}</span>
                    <span className="notice-panel-cta">{notice.primaryLabel} →</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

