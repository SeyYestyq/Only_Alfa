import { Bell } from "lucide-react";
import { useApp } from "../state/AppState";
import { formatMoney } from "../utils/format";

export function CabinetNotifications() {
  const { application, effectiveRole, setBusinessTab, openApplication } = useApp();

  if (!application) {
    return null;
  }

  const isOwner = effectiveRole === "CEO_OWNER" || effectiveRole === "IP_OWNER";
  const isAccountant = effectiveRole === "ACCOUNTANT";

  const items: Array<{ id: string; title: string; text: string; cta: string; action: () => void }> = [];

  if (
    isOwner
    && ["APPROVED", "AWAITING_CEO_APPROVAL"].includes(application.status)
  ) {
    items.push({
      id: "sign",
      title: "Нужна подпись",
      text: `Заявка на ${formatMoney(application.approved_amount_rub || application.requested_amount_rub)} одобрена. Осталось подписать ПЭП.`,
      cta: "К подписанию",
      action: () => {
        void openApplication(application.application_id);
        setBusinessTab("credits");
      },
    });
  }

  if (application.status === "NEED_MORE_INFO") {
    items.push({
      id: "docs",
      title: "Банк запросил документы",
      text: application.rejection_checklist[0]
        ?? "Инспектор запросил дополнительные данные. Откройте заявку и подтяните выручку из других банков или приложите документы.",
      cta: "Открыть заявку",
      action: () => {
        void openApplication(application.application_id);
        setBusinessTab("credits");
      },
    });
  }

  if (application.status === "ANOMALY_VERIFICATION") {
    items.push({
      id: "multibank",
      title: "Нужны данные из других банков",
      text: application.anomaly?.message
        ?? "Обороты в Альфе не совпадают с заявленными. Подтяните выручку через Мультибанк.",
      cta: "Подтянуть данные",
      action: () => {
        void openApplication(application.application_id);
        setBusinessTab("credits");
      },
    });
  }

  if (isAccountant && application.status === "AWAITING_CEO_APPROVAL") {
    items.push({
      id: "wait-ceo",
      title: "Ожидает директора",
      text: "Заявка одобрена и отправлена предпринимателю на подпись ПЭП.",
      cta: "Статус заявки",
      action: () => setBusinessTab("credits"),
    });
  }

  if (application.status === "FUNDED" && isOwner) {
    items.push({
      id: "funded",
      title: "Деньги на счёте",
      text: `Зачислено ${formatMoney(application.approved_amount_rub)}. Можно вернуться к черновику счёта и оплатить поставщика.`,
      cta: "На главную",
      action: () => setBusinessTab("home"),
    });
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="cabinet-notifications" aria-live="polite">
      {items.map((item) => (
        <div key={item.id} className="cabinet-notification">
          <Bell size={16} aria-hidden />
          <div className="cabinet-notification-body">
            <strong>{item.title}</strong>
            <span>{item.text}</span>
          </div>
          <button type="button" className="btn btn-secondary btn-sm" onClick={item.action}>
            {item.cta}
          </button>
        </div>
      ))}
    </div>
  );
}
