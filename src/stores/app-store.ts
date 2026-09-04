"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type DemoRole = "admin" | "owner";
export type Language = "km" | "en";
export type Currency = "USD" | "KHR";
type Session = { role: DemoRole; email: string };
type AppState = {
  session: Session | null; language: Language; currency: Currency; sidebarCollapsed: boolean; notificationsRead: string[];
  login: (role: DemoRole, email: string) => void; logout: () => void; setLanguage: (language: Language) => void;
  setCurrency: (currency: Currency) => void; toggleSidebar: () => void; markNotificationRead: (id: string) => void; resetDemo: () => void;
};
const initialPreferences = { language: "km" as Language, currency: "USD" as Currency, sidebarCollapsed: false, notificationsRead: [] as string[] };
export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      session: null, ...initialPreferences,
      login: (role, email) => set({ session: { role, email } }), logout: () => set({ session: null }),
      setLanguage: (language) => set({ language }), setCurrency: (currency) => set({ currency }),
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      markNotificationRead: (id) => set((state) => ({ notificationsRead: state.notificationsRead.includes(id) ? state.notificationsRead : [...state.notificationsRead, id] })),
      resetDemo: () => set({ session: null, ...initialPreferences }),
    }),
    { name: "khmerstay-demo", storage: createJSONStorage(() => localStorage), partialize: (state) => ({ session: state.session, language: state.language, currency: state.currency, sidebarCollapsed: state.sidebarCollapsed, notificationsRead: state.notificationsRead }) },
  ),
);
