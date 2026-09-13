import { create } from "zustand";

export type QuickAddKind = "habit" | "task" | "journal" | "goal" | "focus" | null;

interface UiState {
  quickAddKind: QuickAddKind;
  searchOpen: boolean;
  notificationsOpen: boolean;
  openQuickAdd: (kind: Exclude<QuickAddKind, null>) => void;
  closeQuickAdd: () => void;
  setSearchOpen: (open: boolean) => void;
  setNotificationsOpen: (open: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  quickAddKind: null,
  searchOpen: false,
  notificationsOpen: false,
  openQuickAdd: (kind) => set({ quickAddKind: kind }),
  closeQuickAdd: () => set({ quickAddKind: null }),
  setSearchOpen: (open) => set({ searchOpen: open }),
  setNotificationsOpen: (open) => set({ notificationsOpen: open }),
}));
