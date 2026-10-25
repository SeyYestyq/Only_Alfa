import { useState } from "react";
import { useApp } from "../../state/AppState";
import { useDemoStore } from "../../state/demoStore";

export function BankStates() {
  const { goToScreen, application } = useApp();
  const setLock = useDemoStore((state) => state.setInspectorLock);
  const [note, setNote] = useState<string | null>(null);

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
      <div className="v2-kicker">Банк · все состояния</div>
      <h1 className="v2-h1">Что видит инспектор, когда что-то идёт не так</h1>
      <p className="v2-lead">Каждое состояние — с понятным следующим действием.</p>
      {note ? <div className="v2-error"><span>{note}</span></div> : null}
      <div className="v2-edge-grid">
        {cards.map((card) => (
          <article key={card.tag} className="v2-card">
            <span className="v2-pill warn">{card.tag}</span>
            <h2 style={{ marginTop: 10 }}>{card.title}</h2>
            <p className="v2-muted">{card.text}</p>
            <button type="button" className="v2-btn" style={{ marginTop: 12 }} onClick={card.run}>{card.action}</button>
          </article>
        ))}
      </div>
    </>
  );
}
