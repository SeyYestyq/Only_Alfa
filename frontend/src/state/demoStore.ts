import { create } from "zustand";
import type { ActorRole, ScreenId, ViewMode } from "../api/types";

/** Куда открыть форму заявки: обычный кредит или кредит под залог. */
export type ApplyIntent = "standard" | "collateral";

export type ClientNoticeKind =
  | "approved"
  | "rejected"
  | "need_docs"
  | "counter"
  | "review"
  | "sign";

export interface ClientNotice {
  id: string;
  kind: ClientNoticeKind;
  title: string;
  text: string;
  applicationId: string;
  /** Куда вести по основной кнопке. */
  targetScreen: ScreenId;
  primaryLabel: string;
  secondaryLabel: string;
}

export type MonitoringPhase = "none" | "early" | "restructure" | "limit";

export interface ChatLine {
  id: string;
  author: string;
  side: "client" | "bank";
  text: string;
  at: string;
}

interface StoryPersist {
  offerSent: Record<string, boolean>;
  released: Record<string, boolean>;
  monitoring: Record<string, MonitoringPhase>;
  restructureOn: Record<string, boolean>;
  chat: Record<string, ChatLine[]>;
  inspectorLock: boolean;
}

const STORY_KEY = "alfa-v2-story";

function readStory(): StoryPersist {
  const empty: StoryPersist = {
    offerSent: {},
    released: {},
    monitoring: {},
    restructureOn: {},
    chat: {},
    inspectorLock: false,
  };
  try {
    const raw = sessionStorage.getItem(STORY_KEY);
    if (!raw) {
      return empty;
    }
    return { ...empty, ...(JSON.parse(raw) as Partial<StoryPersist>) };
  } catch {
    return empty;
  }
}

function writeStory(story: StoryPersist): void {
  sessionStorage.setItem(STORY_KEY, JSON.stringify(story));
}

interface DemoStore {
  screen: ScreenId;
  viewMode: ViewMode;
  userRole: ActorRole;
  applyIntent: ApplyIntent;
  prefillCollateral: boolean;
  /** Сумма заявки из Invoice-to-Credit (85% счёта); сбрасывается после подстановки в форму. */
  applyPrefillAmount: number | null;
  offersMuted: boolean;
  creditDocs: string[];
  clientNotices: ClientNotice[];
  /** Панель списка уведомлений (колокольчик). */
  noticesOpen: boolean;
  offerSent: Record<string, boolean>;
  released: Record<string, boolean>;
  monitoring: Record<string, MonitoringPhase>;
  restructureOn: Record<string, boolean>;
  chat: Record<string, ChatLine[]>;
  inspectorLock: boolean;
  setScreen: (screen: ScreenId) => void;
  setViewMode: (mode: ViewMode) => void;
  setUserRole: (role: ActorRole) => void;
  setApplyIntent: (intent: ApplyIntent, prefillFromApplication?: boolean) => void;
  setApplyPrefillAmount: (amount: number | null) => void;
  setOffersMuted: (muted: boolean) => void;
  addCreditDoc: (fileName: string) => void;
  clearCreditDocs: () => void;
  pushClientNotice: (notice: Omit<ClientNotice, "id">) => void;
  dismissClientNotice: (id: string) => void;
  clearClientNotices: () => void;
  setNoticesOpen: (open: boolean) => void;
  markOfferSent: (companyId: string) => void;
  releaseDecision: (applicationId: string) => void;
  unreleaseDecision: (applicationId: string) => void;
  setMonitoring: (companyId: string, phase: MonitoringPhase) => void;
  setRestructureOn: (companyId: string, on: boolean) => void;
  pushChat: (companyId: string, line: Omit<ChatLine, "id" | "at">) => void;
  popChat: (companyId: string) => void;
  setInspectorLock: (locked: boolean) => void;
  resetStory: () => void;
}

function noticeFromStatus(
  status: string,
  applicationId: string,
  amountLabel?: string,
): Omit<ClientNotice, "id"> | null {
  if (status === "APPROVED") {
    return {
      kind: "approved",
      title: "Кредит одобрен",
      text: amountLabel
        ? `Банк одобрил ${amountLabel}. Можно подтвердить условия и подписать договор.`
        : "Банк одобрил заявку. Можно перейти к подписи.",
      applicationId,
      targetScreen: "signing",
      primaryLabel: "Подписать",
      secondaryLabel: "Позже",
    };
  }
  if (status === "AWAITING_CEO_APPROVAL") {
    return {
      kind: "sign",
      title: "Ждёт вашей подписи",
      text: "Условия готовы. Подпишите договор — деньги зачислят на расчётный счёт.",
      applicationId,
      targetScreen: "signing",
      primaryLabel: "Подписать",
      secondaryLabel: "Позже",
    };
  }
  if (status === "REJECTED") {
    return {
      kind: "rejected",
      title: "По заявке отказ",
      text: "Банк не одобрил кредит. Откройте решение — там план, что можно усилить за 90 дней.",
      applicationId,
      targetScreen: "decision",
      primaryLabel: "Смотреть план",
      secondaryLabel: "Закрыть",
    };
  }
  if (status === "NEED_MORE_INFO") {
    return {
      kind: "need_docs",
      title: "Нужны документы",
      text: "Инспектор запросил файлы по заявке. Прикрепите их — банк продолжит проверку.",
      applicationId,
      targetScreen: "decision",
      primaryLabel: "Прикрепить",
      secondaryLabel: "Позже",
    };
  }
  if (status === "COUNTER_OFFER") {
    return {
      kind: "counter",
      title: "Другие условия от банка",
      text: "Полную сумму не одобрили. Выберите вариант — или уточните детали в чате.",
      applicationId,
      targetScreen: "decision",
      primaryLabel: "Выбрать условия",
      secondaryLabel: "Позже",
    };
  }
  if (status === "MANUAL_REVIEW" || status === "ANOMALY_VERIFICATION") {
    return {
      kind: "review",
      title: "Заявка на проверке",
      text: "Вы можете вернуться на главную — пришлём уведомление, когда банк ответит.",
      applicationId,
      targetScreen: "applications",
      primaryLabel: "Смотреть статус",
      secondaryLabel: "Понятно",
    };
  }
  return null;
}

/** Demo Control Bar UI state (pmndrs/zustand) — без бизнес-расчётов. */
export const useDemoStore = create<DemoStore>((set, get) => ({
  screen: "home",
  viewMode: "business",
  userRole: "ACCOUNTANT",
  applyIntent: "standard",
  prefillCollateral: false,
  applyPrefillAmount: null,
  offersMuted: false,
  creditDocs: [],
  clientNotices: [],
  noticesOpen: false,
  ...readStory(),
  setScreen: (screen) => set({ screen }),
  setViewMode: (viewMode) => set({ viewMode }),
  setUserRole: (userRole) => set({ userRole }),
  setApplyIntent: (applyIntent, prefillFromApplication = false) =>
    set({
      applyIntent,
      prefillCollateral: applyIntent === "collateral" && prefillFromApplication,
    }),
  setApplyPrefillAmount: (applyPrefillAmount) => set({ applyPrefillAmount }),
  setOffersMuted: (offersMuted) => set({ offersMuted }),
  addCreditDoc: (fileName) => {
    const name = fileName.trim();
    if (!name) {
      return;
    }
    const prev = get().creditDocs;
    if (prev.includes(name)) {
      return;
    }
    set({ creditDocs: [...prev, name] });
  },
  clearCreditDocs: () => set({ creditDocs: [] }),
  pushClientNotice: (notice) => {
    const id = `n-${Date.now()}-${notice.kind}`;
    const withoutSame = get().clientNotices.filter(
      (row) => !(row.applicationId === notice.applicationId && row.kind === notice.kind),
    );
    set({
      clientNotices: [{ ...notice, id }, ...withoutSame].slice(0, 4),
      noticesOpen: false,
    });
  },
  dismissClientNotice: (id) =>
    set({ clientNotices: get().clientNotices.filter((row) => row.id !== id) }),
  clearClientNotices: () => set({ clientNotices: [], noticesOpen: false }),
  setNoticesOpen: (noticesOpen) => set({ noticesOpen }),
  markOfferSent: (companyId) => {
    const offerSent = { ...get().offerSent, [companyId]: true };
    set({ offerSent });
    persist(get());
  },
  releaseDecision: (applicationId) => {
    const released = { ...get().released, [applicationId]: true };
    set({ released });
    persist(get());
  },
  unreleaseDecision: (applicationId) => {
    const released = { ...get().released };
    delete released[applicationId];
    set({ released });
    persist(get());
  },
  setMonitoring: (companyId, phase) => {
    const monitoring = { ...get().monitoring, [companyId]: phase };
    set({ monitoring });
    persist(get());
  },
  setRestructureOn: (companyId, on) => {
    const restructureOn = { ...get().restructureOn, [companyId]: on };
    set({ restructureOn });
    persist(get());
  },
  pushChat: (companyId, line) => {
    const prev = get().chat[companyId] ?? [];
    const chat = {
      ...get().chat,
      [companyId]: [
        ...prev,
        {
          ...line,
          id: `c-${Date.now()}-${prev.length}`,
          at: new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }),
        },
      ],
    };
    set({ chat });
    persist(get());
  },
  popChat: (companyId) => {
    const prev = get().chat[companyId] ?? [];
    if (prev.length === 0) {
      return;
    }
    set({ chat: { ...get().chat, [companyId]: prev.slice(0, -1) } });
    persist(get());
  },
  setInspectorLock: (inspectorLock) => {
    set({ inspectorLock });
    persist(get());
  },
  resetStory: () => {
    sessionStorage.removeItem(STORY_KEY);
    set({
      offerSent: {},
      released: {},
      monitoring: {},
      restructureOn: {},
      chat: {},
      inspectorLock: false,
      clientNotices: [],
      creditDocs: [],
      screen: "home",
      viewMode: "business",
    });
  },
}));

function persist(state: DemoStore): void {
  writeStory({
    offerSent: state.offerSent,
    released: state.released,
    monitoring: state.monitoring,
    restructureOn: state.restructureOn,
    chat: state.chat,
    inspectorLock: state.inspectorLock,
  });
}

/** Хелпер: положить уведомление клиенту по статусу заявки. */
export function notifyClientAboutStatus(
  status: string,
  applicationId: string,
  amountLabel?: string,
): void {
  const payload = noticeFromStatus(status, applicationId, amountLabel);
  if (payload) {
    useDemoStore.getState().pushClientNotice(payload);
  }
}
