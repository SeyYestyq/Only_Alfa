import { create } from "zustand";
import type { ActorRole, ScreenId, ViewMode } from "../api/types";

/** Куда открыть форму заявки: обычный кредит или кредит под залог. */
export type ApplyIntent = "standard" | "collateral";

interface DemoStore {
  screen: ScreenId;
  viewMode: ViewMode;
  userRole: ActorRole;
  applyIntent: ApplyIntent;
  prefillCollateral: boolean;
  offersMuted: boolean;
  setScreen: (screen: ScreenId) => void;
  setViewMode: (mode: ViewMode) => void;
  setUserRole: (role: ActorRole) => void;
  setApplyIntent: (intent: ApplyIntent, prefillFromApplication?: boolean) => void;
  setOffersMuted: (muted: boolean) => void;
}

/** Demo Control Bar UI state (pmndrs/zustand) — без бизнес-расчётов. */
export const useDemoStore = create<DemoStore>((set) => ({
  screen: "home",
  viewMode: "business",
  userRole: "CEO_OWNER",
  applyIntent: "standard",
  prefillCollateral: false,
  offersMuted: false,
  setScreen: (screen) => set({ screen }),
  setViewMode: (viewMode) => set({ viewMode }),
  setUserRole: (userRole) => set({ userRole }),
  setApplyIntent: (applyIntent, prefillFromApplication = false) =>
    set({
      applyIntent,
      prefillCollateral: applyIntent === "collateral" && prefillFromApplication,
    }),
  setOffersMuted: (offersMuted) => set({ offersMuted }),
}));
