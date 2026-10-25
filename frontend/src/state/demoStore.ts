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

export type BankNoticeKind = "new_app" | "manual_review" | "anomaly" | "docs" | "stop_factor";

export interface BankNotice {
  id: string;
  kind: BankNoticeKind;
  title: string;
  text: string;
  companyId: string;
  companyName: string;
  demoKey: string;
  amountLabel?: string;
  targetScreen: ScreenId;
  primaryLabel: string;
  time: string;
}

const INITIAL_BANK_NOTICES: BankNotice[] = [
  {
    id: "bn-1",
    kind: "manual_review",
    title: "Заявка на 2,5 млн ₽ на ручном разборе",
    text: "ООО «Ростерс Кафе» · Скоринг 610 (Серый коридор). Требуется решение по поручительству или контр-офферу.",
    companyId: "cmp_rosters",
    companyName: "ООО «Ростерс Кафе»",
    demoKey: "rosters",
    amountLabel: "2 500 000 ₽",
    targetScreen: "bank-xray",
    primaryLabel: "К разбору",
    time: "10 мин назад",
  },
  {
    id: "bn-2",
    kind: "anomaly",
    title: "Аномалия кассы: расхождение -34%",
    text: "ООО «ТехноСтрой» · Заявка на 5,6 млн ₽. Декларировано 6 млн ₽, в Альфе 1,8 млн ₽. Выписка ВТБ в чате.",
    companyId: "cmp_tekhnostroy",
    companyName: "ООО «ТехноСтрой Инжиниринг»",
    demoKey: "tekhnostroy",
    amountLabel: "5 600 000 ₽",
    targetScreen: "bank-messages",
    primaryLabel: "В чат",
    time: "25 мин назад",
  },
  {
    id: "bn-3",
    kind: "docs",
    title: "Загружен Договор аренды № 14-А",
    text: "ИП Ковалев Д.С. · Заявка на 600 000 ₽. Скан договора аренды помещения на Профсоюзной 41 прикреплен в чате.",
    companyId: "cmp_kovalev",
    companyName: "ИП Ковалев Д.С.",
    demoKey: "kovalev",
    amountLabel: "600 000 ₽",
    targetScreen: "bank-messages",
    primaryLabel: "Проверить",
    time: "45 мин назад",
  },
  {
    id: "bn-4",
    kind: "new_app",
    title: "Новая заявка: 900 000 ₽ (Инвест-лизинг)",
    text: "ИП Смирнов А.В. · Скоринг 815. Автоматически одобрено. Договор передан на подпись клиенту.",
    companyId: "cmp_smirnov",
    companyName: "ИП Смирнов А.В.",
    demoKey: "smirnov",
    amountLabel: "900 000 ₽",
    targetScreen: "bank-clients",
    primaryLabel: "Открыть",
    time: "1 час назад",
  },
];

export interface BankInstallmentVariant {
  months: number;
  ratePct: number;
  monthlyPayment: number;
  totalInterest: number;
}

export interface InstallmentOffer {
  txId: string;
  txDescription: string;
  amountRub: number;
  variant1: BankInstallmentVariant;
  variant2: BankInstallmentVariant;
  selectedVariantIndex?: 1 | 2;
  status: "OFFERED" | "COUNTER_OFFERED" | "ACCEPTED";
  offeredAt: string;
  clientCounterMonths?: number;
  clientCounterRatePct?: number;
  clientCounterMonthlyPayment?: number;
  clientComment?: string;
}

const INITIAL_INSTALLMENT_OFFERS: Record<string, InstallmentOffer> = {
  trn_rosters_1: {
    txId: "trn_rosters_1",
    txDescription: "Оплата ООО «РестоОборудование»",
    amountRub: 235_000,
    variant1: {
      months: 3,
      ratePct: 18.0,
      monthlyPayment: 80_737,
      totalInterest: 7_211,
    },
    variant2: {
      months: 6,
      ratePct: 18.0,
      monthlyPayment: 41_248,
      totalInterest: 12_488,
    },
    selectedVariantIndex: 2,
    status: "OFFERED",
    offeredAt: "Сегодня 10:15",
  },
};

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
  bankNotices: BankNotice[];
  /** Панель списка уведомлений (колокольчик). */
  noticesOpen: boolean;
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
  pushBankNotice: (notice: Omit<BankNotice, "id">) => void;
  dismissBankNotice: (id: string) => void;
  clearBankNotices: () => void;
  setNoticesOpen: (open: boolean) => void;
  installmentOffers: Record<string, InstallmentOffer>;
  setInstallmentOffer: (offer: InstallmentOffer) => void;
  removeInstallmentOffer: (txId: string) => void;
  resetAll: () => void;
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
  userRole: "CEO_OWNER",
  applyIntent: "standard",
  prefillCollateral: false,
  applyPrefillAmount: null,
  offersMuted: false,
  creditDocs: [],
  clientNotices: [],
  bankNotices: INITIAL_BANK_NOTICES,
  noticesOpen: false,
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
  pushBankNotice: (notice) => {
    const id = `bn-${Date.now()}-${notice.kind}`;
    const withoutSame = get().bankNotices.filter(
      (row) => !(row.companyId === notice.companyId && row.kind === notice.kind),
    );
    set({
      bankNotices: [{ ...notice, id }, ...withoutSame].slice(0, 6),
      noticesOpen: false,
    });
  },
  dismissBankNotice: (id) =>
    set({ bankNotices: get().bankNotices.filter((row) => row.id !== id) }),
  clearBankNotices: () => set({ bankNotices: [], noticesOpen: false }),
  setNoticesOpen: (noticesOpen) => set({ noticesOpen }),
  installmentOffers: INITIAL_INSTALLMENT_OFFERS,
  setInstallmentOffer: (offer) =>
    set((state) => ({
      installmentOffers: {
        ...state.installmentOffers,
        [offer.txId]: offer,
      },
    })),
  removeInstallmentOffer: (txId) =>
    set((state) => {
      const copy = { ...state.installmentOffers };
      delete copy[txId];
      return { installmentOffers: copy };
    }),
  resetAll: () =>
    set({
      screen: "home",
      viewMode: "business",
      userRole: "CEO_OWNER",
      applyIntent: "standard",
      prefillCollateral: false,
      applyPrefillAmount: null,
      offersMuted: false,
      creditDocs: [],
      clientNotices: [],
      bankNotices: INITIAL_BANK_NOTICES,
      installmentOffers: INITIAL_INSTALLMENT_OFFERS,
      noticesOpen: false,
    }),
}));

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
