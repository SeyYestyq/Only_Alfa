import { create } from "zustand";
import type { ActorRole, BankTab, BusinessTab, ScreenId, ViewMode } from "../api/types";

interface DemoStore {
  screen: ScreenId;
  viewMode: ViewMode;
  userRole: ActorRole;
  businessTab: BusinessTab;
  bankTab: BankTab;
  setScreen: (screen: ScreenId) => void;
  setViewMode: (mode: ViewMode) => void;
  setUserRole: (role: ActorRole) => void;
  setBusinessTab: (tab: BusinessTab) => void;
  setBankTab: (tab: BankTab) => void;
}

function syncFromScreen(screen: ScreenId): Partial<DemoStore> {
  if (screen === 1) {
    return { screen, businessTab: "home", viewMode: "business" };
  }
  if (screen === 2) {
    return { screen, businessTab: "credits", viewMode: "business" };
  }
  return { screen, bankTab: "applications", viewMode: "bank" };
}

/** Demo Control Bar UI state (pmndrs/zustand) — без бизнес-расчётов. */
export const useDemoStore = create<DemoStore>((set) => ({
  screen: 1,
  viewMode: "business",
  userRole: "CEO_OWNER",
  businessTab: "home",
  bankTab: "clients",
  setScreen: (screen) => set(syncFromScreen(screen)),
  setViewMode: (viewMode) =>
    set((state) => ({
      viewMode,
      screen: viewMode === "bank" ? 3 : state.businessTab === "credits" ? 2 : 1,
      bankTab: viewMode === "bank" ? state.bankTab : state.bankTab,
    })),
  setUserRole: (userRole) => set({ userRole }),
  setBusinessTab: (businessTab) =>
    set({
      businessTab,
      viewMode: "business",
      screen: businessTab === "credits" ? 2 : 1,
    }),
  setBankTab: (bankTab) =>
    set({
      bankTab,
      viewMode: "bank",
      screen: 3,
    }),
}));
