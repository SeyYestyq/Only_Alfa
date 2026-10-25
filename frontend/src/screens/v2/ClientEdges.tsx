import { useState } from "react";
import { useApp } from "../../state/AppState";
import { useDemoStore } from "../../state/demoStore";

const EDGES: Array<{
  tag: string;
  title: string;
  text: string;
  action: string;
  tone: string;
}> = [
  { tag: "пусто", title: "Прогноза пока нет", text: "Нужно 3 месяца оборотов по счёту. Можно ускорить — подключите выписку другого банка.", action: "Подключить выписку", tone: "" },
  { tag: "загрузка", title: "Считаем прогноз кассы", text: "Обычно 2–3 секунды. Экран не пустой: кнопка остаётся на месте.", action: "Подождать на главной", tone: "" },
  { tag: "ошибка интеграции", title: "Выписка не обновилась", text: "Показаны данные на 21.10, 22:00. Прогноз может быть неточным — повторите.", action: "Повторить", tone: "warn" },
  { tag: "EXPIRED", title: "Предложение больше не действует", text: "900 000 ₽ можно было оформить до 01.11. Условия пересчитаем по свежей выписке.", action: "Получить новое предложение", tone: "warn" },
  { tag: "REJECTED", title: "Сейчас выдать не можем", text: "Причина рядом с кнопкой. Подать заявку снова можно, когда изменится то, что просил банк.", action: "Как закрыть", tone: "bad" },
  { tag: "NEED_MORE_INFO", title: "Банк просит выписку второго банка", text: "Без неё решение останется прежним. Загрузите PDF или подключите банк.", action: "Загрузить PDF", tone: "info" },
  { tag: "оспорить", title: "Не согласны с решением?", text: "Напишите, что банк не учёл. Ответ инспектора придёт сюда и в чат.", action: "Отправить возражение", tone: "warn" },
  { tag: "COUNTER_OFFER", title: "Варианты банка действуют до 26.10", text: "После этого условия пересчитаем заново. Напомним за день.", action: "Открыть варианты", tone: "warn" },
  { tag: "тишина", title: "Предложений нет — и это хорошо", text: "Касса в плюсе. Лента показывает только новости рынка, без кредитов.", action: "Открыть ленту ИП", tone: "good" },
];

export function ClientEdges() {
  const { goToScreen, selectCompany, companies } = useApp();
  const addCreditDoc = useDemoStore((state) => state.addCreditDoc);
  const [note, setNote] = useState<string | null>(null);
  const [text, setText] = useState("");

  function act(title: string) {
    if (title.startsWith("Прогноз")) {
      goToScreen("payments");
      return;
    }
    if (title.startsWith("Считаем") || title.startsWith("Выписка")) {
      goToScreen("home");
      return;
    }
    if (title.startsWith("Предложение")) {
      goToScreen("apply");
      return;
    }
    if (title.startsWith("Сейчас")) {
      goToScreen("decision");
      return;
    }
    if (title.startsWith("Банк просит")) {
      addCreditDoc("выписка-другого-банка.pdf");
      setNote("Файл отмечен в заявке. Инспектор увидит его в очереди.");
      return;
    }
    if (title.startsWith("Не согласны")) {
      setNote(text.trim() ? "Возражение уйдёт инспектору в чат заявки." : "Напишите, что не учли.");
      return;
    }
    if (title.startsWith("Варианты")) {
      goToScreen("decision");
      return;
    }
    const smirnov = companies.find((company) => company.demo_key === "smirnov");
    if (smirnov) {
      void selectCompany(smirnov.id, { nextScreen: "home" });
    }
  }

  return (
    <>
      <div className="v2-kicker">Клиент · все состояния</div>
      <h1 className="v2-h1">Что видит предприниматель, когда что-то идёт не так</h1>
      <p className="v2-lead">Никаких тупиков: у каждого состояния есть кнопка «что делать дальше».</p>
      {note ? <div className="v2-error"><span>{note}</span><button type="button" className="v2-text-btn" onClick={() => setNote(null)}>Скрыть</button></div> : null}
      <div className="v2-edge-grid">
        {EDGES.map((edge) => (
          <article key={edge.tag} className="v2-card">
            <span className={`v2-pill ${edge.tone === "bad" ? "bad" : edge.tone === "good" ? "good" : edge.tone === "warn" ? "warn" : "info"}`}>{edge.tag}</span>
            <h2 style={{ marginTop: 10 }}>{edge.title}</h2>
            <p className="v2-muted">{edge.text}</p>
            {edge.tag === "оспорить" ? (
              <input className="v2-composer" style={{ marginTop: 8 }} value={text} placeholder="Что банк не учёл" onChange={(event) => setText(event.target.value)} />
            ) : null}
            <button type="button" className={`v2-btn ${edge.tone === "bad" ? "primary" : ""}`} style={{ marginTop: 12 }} onClick={() => act(edge.title)}>
              {edge.action}
            </button>
          </article>
        ))}
      </div>
    </>
  );
}
