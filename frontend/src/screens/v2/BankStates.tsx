import { useState } from "react";
import { HotkeyCard } from "../../components/v2/HotkeyCard";
import { RefuseDialog } from "../../components/v2/RefuseDialog";
import { SkeletonLines } from "../../components/v2/ScreenState";
import { useApp } from "../../state/AppState";
import { useDemoStore } from "../../state/demoStore";
import { useUiStore } from "../../state/uiStore";

export function BankStates() {
  const { goToScreen, application } = useApp();
  const setLock = useDemoStore((state) => state.setInspectorLock);
  const pushToast = useUiStore((state) => state.pushToast);
  const [note, setNote] = useState<string | null>(null);
  const [refuseOpen, setRefuseOpen] = useState(false);
  const [offerSent, setOfferSent] = useState(false);

  const cards = [
    { tag: "409", title: "Заявку уже решает Е. Орлова", text: "Второй инспектор открыл ту же заявку: кнопки решения заблокированы.", action: "Только просмотр", run: () => { setLock(true); goToScreen("bank-xray"); } },
    { tag: "NEED_MORE_INFO", title: "Ждём документ — SLA на паузе", text: "Запрос выписки второго банка. Таймер инспектора остановлен, клиент видит задачу на главной.", action: "К заявке", run: () => goToScreen("bank-xray") },
    { tag: "оспорено", title: "Клиент не согласен с решением", text: "Обороты во втором банке не учтены. Заявка вернулась в очередь со вторым взглядом руководителя.", action: "Открыть чат", run: () => goToScreen("messages") },
    { tag: "REJECTED", title: "Отказ — только с причиной и шагом", text: "Нельзя отправить отказ без кода. Клиенту автоматически уходит, что не так и что сделать.", action: "К решению", run: () => goToScreen(application ? "bank-xray" : "bank-queue") },
    { tag: "интеграция", title: "БКИ не ответило за 2 секунды", text: "Решение без кредитной истории запрещено. Автоповтор через 30 с, остальные проверки уже готовы.", action: "Повторить сейчас", run: () => setNote("Повтор запроса БКИ в демо ничего не вызывает наружу: реестр — симулятор.") },
    { tag: "сообщение", title: "Клиент написал первым", text: "Сообщение сразу становится задачей в очереди со SLA 30 минут.", action: "К очереди", run: () => goToScreen("bank-queue") },
    { tag: "повтор выдачи", title: "Двойной клик «Выдать» — одна выдача", text: "Повторный запрос с тем же ключом возвращает прежний результат.", action: "К выдаче", run: () => goToScreen("bank-payout") },
    { tag: "пусто", title: "Очередь разобрана", text: "Все задачи закрыты. Новые сигналы и заявки появятся сами.", action: "Обновить очередь", run: () => goToScreen("bank-queue") },
    { tag: "загрузка", title: "Очередь загружается", text: "Список держит высоту, чтобы кнопки не прыгали.", action: "Открыть стол", run: () => goToScreen("bank-queue") },
  ];

  return (
    <>
      <h1 className="v2-h1">Состояния</h1>
      <p className="v2-lead">Что делать, если шаг не прошёл</p>
      {note ? <div className="v2-error"><span>{note}</span></div> : null}
      <div className="v2-edge-grid">
        {cards.map((card) => (
          <article key={card.tag} className="v2-card">
            <span className="v2-pill warn">{card.tag}</span>
            <h2 style={{ marginTop: 10 }}>{card.title}</h2>
            <p className="v2-muted">{card.text}</p>
            {card.tag === "загрузка" ? <SkeletonLines /> : null}
            <button type="button" className="v2-btn ghost" style={{ marginTop: 12 }} onClick={card.run}>{card.action}</button>
          </article>
        ))}
      </div>
      <div className="v2-edge-grid" style={{ marginTop: 12 }}>
        <article className="v2-card">
          <span className="v2-pill bad">подтверждение · отказ</span>
          <h2 style={{ marginTop: 10 }}>Отказ только через диалог</h2>
          <p className="v2-muted">Фокус попадает на «Отмена». «Отказать» молчит, пока не выбран код. Esc закрывает, клик по фону — нет.</p>
          <button type="button" className="v2-btn primary" style={{ marginTop: 12 }} onClick={() => setRefuseOpen(true)}>Отказать ООО «Ростерс Кафе»</button>
        </article>
        <article className="v2-card">
          <span className="v2-pill good">toast · отмена</span>
          <h2 style={{ marginTop: 10 }}>Отправлено — 10 секунд на отмену</h2>
          <p className="v2-muted">Встречное уходит клиенту. До конца таймера «Отменить» и ⌘Z прячут его обратно.</p>
          <button
            type="button"
            className="v2-btn ghost"
            style={{ marginTop: 12 }}
            onClick={() => {
              setOfferSent(true);
              pushToast({
                tone: "success",
                title: "Отправлено клиенту",
                subtitle: "ООО «Ростерс Кафе» · 3 варианта",
                actionLabel: "Отменить",
                until: Date.now() + 10_000,
                undo: () => setOfferSent(false),
              });
            }}
          >
            {offerSent ? "Отправлено" : "Отправить встречное"}
          </button>
        </article>
        <HotkeyCard />
      </div>
      <RefuseDialog
        open={refuseOpen}
        companyName="ООО «Ростерс Кафе»"
        onClose={() => setRefuseOpen(false)}
        onConfirm={(reason) => {
          setRefuseOpen(false);
          setNote(`Отказ не отправлен в API с этой витрины. Выбрано: ${reason}. На заявке в работе диалог вызывает решение банка.`);
        }}
      />
    </>
  );
}
