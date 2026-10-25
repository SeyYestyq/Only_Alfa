import { create } from "zustand";

export interface ChatAttachment {
  name: string;
  size: string;
  type: "pdf" | "xlsx" | "doc";
}

export interface ChatOfferCard {
  title: string;
  body: string;
  amount: string;
  term: string;
  badge?: string;
}

export interface ChatMessage {
  id: string;
  sender: "bank" | "client" | "system";
  senderName: string;
  text: string;
  time: string;
  attachment?: ChatAttachment;
  offerCard?: ChatOfferCard;
}

export interface ChatThread {
  id: string;
  companyId: string;
  demoKey: string;
  companyName: string;
  inn: string;
  directorName: string;
  initials: string;
  tagColor: "orange" | "yellow" | "blue" | "green" | "red";
  statusLabel: string;
  score: number;
  requestedAmountRub: number;
  unreadCount: number;
  lastTime: string;
  lastMessageSnippet: string;
  messages: ChatMessage[];
}

const INITIAL_THREADS: ChatThread[] = [
  {
    id: "rosters",
    demoKey: "rosters",
    companyId: "cmp_rosters",
    companyName: "ООО «Ростерс Кафе»",
    inn: "7704561238",
    directorName: "Кузнецова Мария Андреевна",
    initials: "РК",
    tagColor: "orange",
    statusLabel: "Ручной разбор · Серый коридор",
    score: 610,
    requestedAmountRub: 2_500_000,
    unreadCount: 1,
    lastTime: "14:32",
    lastMessageSnippet: "Загрузили скан доп. соглашения и поручительства директора.",
    messages: [
      {
        id: "m-sys-1",
        sender: "system",
        senderName: "Система",
        text: "Заявка на кредит 2 500 000 ₽ передана на стол кредитного инспектора (Серый коридор, скоринг 610).",
        time: "10:00",
      },
      {
        id: "m-ros-1",
        sender: "client",
        senderName: "Кузнецова М.А. (Генеральный директор)",
        text: "Добрый день! Подали заявку на расширение кофейни на Тверской. Видим статус «Ручной разбор». Подскажите, что требуется от нас?",
        time: "10:15",
      },
      {
        id: "m-bank-1",
        sender: "bank",
        senderName: "Елена Орлова (Кредитный инспектор)",
        text: "Здравствуйте, Мария Андреевна! Ваш скоринг 610 — для одобрения полной суммы 2,5 млн ₽ требуется либо поручительство учредителя, либо залог оборудования. Также банк сформировал контр-оффер на 1,8 млн ₽.",
        time: "11:20",
        offerCard: {
          title: "Контр-оффер кредитного конвейера",
          body: "Кредит на развитие бизнеса · 1 800 000 ₽ на 24 мес. без доп. залога по ставке 18.5%.",
          amount: "1 800 000 ₽",
          term: "24 мес.",
          badge: "Альтернатива",
        },
      },
      {
        id: "m-ros-2",
        sender: "client",
        senderName: "Кузнецова М.А. (Генеральный директор)",
        text: "Мы готовы предоставить поручительство и залог новой итальянской ростер-машины, чтобы сохранить сумму 2,5 млн ₽. Загрузили скан доп. соглашения и поручительства директора.",
        time: "14:32",
        attachment: {
          name: "Поручительство_учредителя_Кузнецова_МА.pdf",
          size: "2.4 МБ",
          type: "pdf",
        },
      },
    ],
  },
  {
    id: "tekhnostroy",
    demoKey: "tekhnostroy",
    companyId: "cmp_tekhnostroy",
    companyName: "ООО «ТехноСтрой Инжиниринг»",
    inn: "7728901122",
    directorName: "Волков Игорь Николаевич",
    initials: "ТС",
    tagColor: "yellow",
    statusLabel: "Аномалия Мультибанка",
    score: 760,
    requestedAmountRub: 5_600_000,
    unreadCount: 1,
    lastTime: "12:15",
    lastMessageSnippet: "Направили выписку из ВТБ с пояснениями по кассе.",
    messages: [
      {
        id: "m-sys-2",
        sender: "system",
        senderName: "Система",
        text: "Детектор аномалий выявил расхождение -34% между декларированной выручкой и оборотами в Альфа-Банке. Требуется подтверждение Мультибанком.",
        time: "09:30",
      },
      {
        id: "m-bank-2",
        sender: "bank",
        senderName: "Елена Орлова (Кредитный инспектор)",
        text: "Игорь Николаевич, добрый день! В вашей заявке указана выручка 6,0 млн ₽/мес., однако по счёту в Альфе проходит 1,8 млн ₽. Подключите Мультибанк или направьте выписку из второго банка, чтобы поднять скоринг до 760.",
        time: "10:05",
      },
      {
        id: "m-tek-1",
        sender: "client",
        senderName: "Волков И.Н. (Генеральный директор)",
        text: "Добрый день! Основной контракт с ГК Самолёт оплачивается на спецсчёт в ВТБ. Подключили Мультибанк и направили выписку из ВТБ с пояснениями по кассе.",
        time: "12:15",
        attachment: {
          name: "Выписка_ВТБ_ГК_Самолет_6мес.xlsx",
          size: "4.1 МБ",
          type: "xlsx",
        },
      },
    ],
  },
  {
    id: "kovalev",
    demoKey: "kovalev",
    companyId: "cmp_kovalev",
    companyName: "ИП Ковалев Д.С. «Эспрессо-Бар»",
    inn: "773344556677",
    directorName: "Ковалев Дмитрий Сергеевич",
    initials: "ИК",
    tagColor: "blue",
    statusLabel: "Документы получены",
    score: 495,
    requestedAmountRub: 600_000,
    unreadCount: 0,
    lastTime: "Вчера",
    lastMessageSnippet: "Прикрепил скан договора аренды помещения на Профсоюзной.",
    messages: [
      {
        id: "m-sys-3",
        sender: "system",
        senderName: "Система",
        text: "По заявке на овердрафт 600 000 ₽ запрошены подтверждающие документы по локации.",
        time: "Вчера 11:00",
      },
      {
        id: "m-bank-3",
        sender: "bank",
        senderName: "Елена Орлова (Кредитный инспектор)",
        text: "Дмитрий Сергеевич, для согласования лимита овердрафта 600 000 ₽ приложите, пожалуйста, действующий договор аренды помещения.",
        time: "Вчера 11:45",
      },
      {
        id: "m-kov-1",
        sender: "client",
        senderName: "Ковалев Д.С. (Предприниматель)",
        text: "Добрый день! Прикрепил скан договора аренды помещения на Профсоюзной 41. Срок действия до 2027 года.",
        time: "Вчера 14:10",
        attachment: {
          name: "Договор_аренды_Профсоюзная_41_Ковалев.pdf",
          size: "1.9 МБ",
          type: "pdf",
        },
      },
      {
        id: "m-bank-4",
        sender: "bank",
        senderName: "Елена Орлова (Кредитный инспектор)",
        text: "Договор получен, проверяем условия. Ответ направим до конца рабочего дня.",
        time: "Вчера 14:25",
      },
    ],
  },
  {
    id: "smirnov",
    demoKey: "smirnov",
    companyId: "cmp_smirnov",
    companyName: "ИП Смирнов А.В. «Зерно & Молоко»",
    inn: "771589012345",
    directorName: "Смирнов Алексей Викторович",
    initials: "СА",
    tagColor: "green",
    statusLabel: "Одобрено · Ожидает подписания",
    score: 815,
    requestedAmountRub: 900_000,
    unreadCount: 0,
    lastTime: "18.10",
    lastMessageSnippet: "Подскажите, если подключим Мультибанк, снизится ли ставка?",
    messages: [
      {
        id: "m-sys-4",
        sender: "system",
        senderName: "Система",
        text: "Кредит на развитие 900 000 ₽ одобрен конвейером автоматически (Скоринг 815).",
        time: "18.10 09:00",
      },
      {
        id: "m-bank-5",
        sender: "bank",
        senderName: "Елена Орлова (Кредитный инспектор)",
        text: "Алексей Викторович, поздравляем! Ваша заявка на 900 000 ₽ одобрена под 16.5% годовых на 24 мес. Договор готов к подписанию КЭП в кабинете.",
        time: "18.10 09:30",
        offerCard: {
          title: "Одобренный кредит на оборудование",
          body: "900 000 ₽ на 24 месяца · Ежемесячный платёж 44 260 ₽. Зачисление на счёт сразу после КЭП.",
          amount: "900 000 ₽",
          term: "24 мес.",
          badge: "Одобрено",
        },
      },
      {
        id: "m-smi-1",
        sender: "client",
        senderName: "Смирнов А.В. (Предприниматель)",
        text: "Отлично, спасибо! Подскажите, если подключим Мультибанк, снизится ли ставка на следующий транш?",
        time: "18.10 10:12",
      },
      {
        id: "m-bank-6",
        sender: "bank",
        senderName: "Елена Орлова (Кредитный инспектор)",
        text: "Да, при подтверждении регулярных поступлений через Мультибанк лимит вырастет до 1,32 млн ₽, а ставка снизится на 1,5 п.п.",
        time: "18.10 10:30",
      },
    ],
  },
  {
    id: "bodrost_plus",
    demoKey: "bodrost_plus",
    companyId: "cmp_bodrost",
    companyName: "ООО «Бодрость Плюс»",
    inn: "7719009988",
    directorName: "Орлова Светлана Викторовна",
    initials: "БП",
    tagColor: "red",
    statusLabel: "Стоп-фактор · ФССП 1,4 млн ₽",
    score: 0,
    requestedAmountRub: 1_500_000,
    unreadCount: 0,
    lastTime: "16.10",
    lastMessageSnippet: "Уведомление о стоп-факторе по ФССП передано руководству.",
    messages: [
      {
        id: "m-sys-5",
        sender: "system",
        senderName: "Система",
        text: "Сработал критический стоп-фактор: открытые исполнительные производства ФССП на сумму 1 420 000 ₽.",
        time: "16.10 15:00",
      },
      {
        id: "m-bank-7",
        sender: "bank",
        senderName: "Елена Орлова (Кредитный инспектор)",
        text: "Светлана Викторовна, информируем, что кредитование приостановлено из-за активных производств ФССП. Сформировали для вас дорожную карту по оздоровлению на 90 дней.",
        time: "16.10 15:15",
      },
      {
        id: "m-bod-1",
        sender: "client",
        senderName: "Орлова С.В. (Генеральный директор)",
        text: "Уведомление о стоп-факторе по ФССП передано руководству. Бухгалтерия уже погашает задолженность, направим платёжки.",
        time: "16.10 16:00",
      },
    ],
  },
];

interface BankMessagesState {
  threads: ChatThread[];
  activeThreadId: string;
  isTyping: boolean;
  filter: "all" | "attention" | "with_app";
  setActiveThread: (id: string) => void;
  setFilter: (filter: "all" | "attention" | "with_app") => void;
  sendMessage: (text: string, attachment?: ChatAttachment) => void;
  sendQuickAction: (actionKey: string) => void;
}

export const useBankMessagesStore = create<BankMessagesState>((set, get) => ({
  threads: INITIAL_THREADS,
  activeThreadId: "rosters",
  isTyping: false,
  filter: "all",

  setActiveThread: (id: string) => {
    set((state) => ({
      activeThreadId: id,
      threads: state.threads.map((t) =>
        t.id === id ? { ...t, unreadCount: 0 } : t,
      ),
    }));
  },

  setFilter: (filter) => set({ filter }),

  sendMessage: (text: string, attachment?: ChatAttachment) => {
    const { activeThreadId, threads } = get();
    const thread = threads.find((t) => t.id === activeThreadId);
    if (!thread || (!text.trim() && !attachment)) return;

    const newMsg: ChatMessage = {
      id: `bank-msg-${Date.now()}`,
      sender: "bank",
      senderName: "Елена Орлова (Кредитный инспектор)",
      text: text.trim(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      attachment,
    };

    const updatedThreads = threads.map((t) => {
      if (t.id === activeThreadId) {
        return {
          ...t,
          lastTime: "сейчас",
          lastMessageSnippet: text.trim() || (attachment ? `Файл: ${attachment.name}` : ""),
          messages: [...t.messages, newMsg],
        };
      }
      return t;
    });

    set({ threads: updatedThreads, isTyping: true });

    // Симуляция ответа заёмщика через 1.8 сек для максимальной реалистичности и интерактива
    setTimeout(() => {
      const current = get();
      const currentThread = current.threads.find((t) => t.id === activeThreadId);
      if (!currentThread) {
        set({ isTyping: false });
        return;
      }

      let replyText = "Спасибо за информацию! Мы приняли в работу и скоро ответим.";
      if (text.includes("договор") || text.includes("аренд")) {
        replyText = "Договор аренды проверили, скан отправляем. Все условия с собственником согласованы.";
      } else if (text.includes("контр-оффер") || text.includes("1 800") || text.includes("условия")) {
        replyText = "Спасибо за встречное предложение! Мы обсудили с финансовым директором и готовы акцептовать 1,8 млн ₽.";
      } else if (text.includes("Мультибанк") || text.includes("выписк")) {
        replyText = "Подтвердили согласие в Мультибанке, обороты по второму банку уже подгрузились.";
      } else if (text.includes("платеж") || text.includes("график")) {
        replyText = "График платежей устраивает, просим установить дату списания на 20-е число каждого месяца.";
      }

      const clientMsg: ChatMessage = {
        id: `client-msg-${Date.now()}`,
        sender: "client",
        senderName: `${currentThread.directorName} (${currentThread.companyName})`,
        text: replyText,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      set({
        isTyping: false,
        threads: current.threads.map((t) =>
          t.id === activeThreadId
            ? {
                ...t,
                lastTime: "только что",
                lastMessageSnippet: replyText,
                messages: [...t.messages, clientMsg],
              }
            : t,
        ),
      });
    }, 1800);
  },

  sendQuickAction: (actionKey: string) => {
    const { activeThreadId, threads, sendMessage } = get();
    const thread = threads.find((t) => t.id === activeThreadId);
    if (!thread) return;

    switch (actionKey) {
      case "request_lease":
        sendMessage(
          "Уважаемый клиент! Для финализации кредитного решения просим предоставить актуальный скан договора аренды помещения с отметкой о регистрации.",
        );
        break;
      case "send_counter":
        sendMessage(
          "Банк подготовил встречное предложение (контр-оффер) на сумму 1 800 000 ₽ на 24 месяца с льготной ставкой. Ознакомьтесь с условиями в кабинете.",
        );
        break;
      case "request_multibank":
        sendMessage(
          "В связи с расхождением оборотов просим подключить сервис «Мультибанк» в кабинете либо прикрепить выписку с расчётного счёта за последние 6 месяцев.",
        );
        break;
      case "confirm_docs":
        sendMessage(
          "Все предоставленные документы успешно прошли первичную проверку рисками. Переводим заявку на этап финального андеррайтинга.",
        );
        break;
      case "adjust_schedule":
        sendMessage(
          "Согласовали перенос даты ежемесячного платежа на удобную для вас дату (25-е число месяца). Проект доп. соглашения направлен.",
        );
        break;
      default:
        break;
    }
  },
}));
