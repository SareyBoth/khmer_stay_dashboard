"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type DemoRole = "admin" | "owner";
export type Language = "km" | "en";
export type Currency = "USD" | "KHR";

export type Session = {
  role: DemoRole;
  email: string;
  token: string;
  refreshToken?: string;
  userId: string;
  name: string;
};

type AppState = {
  session: Session | null;
  language: Language;
  currency: Currency;
  exchangeRate: number;
  sidebarCollapsed: boolean;
  notificationsRead: string[];
  unreadBookingsCount: number;
  unreadMessagesCount: number;
  login: (session: Session) => void;
  updateTokens: (token: string, refreshToken?: string) => void;
  logout: () => void;
  setLanguage: (language: Language) => void;
  setCurrency: (currency: Currency) => void;
  setExchangeRate: (rate: number) => void;
  fetchExchangeRate: () => Promise<void>;
  toggleSidebar: () => void;
  markNotificationRead: (id: string) => void;
  incrementUnreadBookings: () => void;
  clearUnreadBookings: () => void;
  incrementUnreadMessages: () => void;
  clearUnreadMessages: () => void;
  resetDemo: () => void;
};

const initialPreferences = {
  language: "km" as Language,
  currency: "USD" as Currency,
  exchangeRate: 4100,
  sidebarCollapsed: false,
  notificationsRead: [] as string[],
  unreadBookingsCount: 0,
  unreadMessagesCount: 0,
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      session: null,
      ...initialPreferences,
      login: (session) => set({ session }),
      updateTokens: (token, refreshToken) => {
        const current = get().session;
        if (!current) return;
        set({
          session: {
            ...current,
            token,
            ...(refreshToken ? { refreshToken } : {}),
          },
        });
      },
      logout: () => {
        const session = get().session;
        const token = session?.token;
        if (token && token !== "demo-local") {
          void fetch(
            `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/auth/logout`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                refreshToken: session?.refreshToken || "",
              }),
            },
          ).catch(() => {});
        }
        set({ session: null, unreadBookingsCount: 0, unreadMessagesCount: 0 });
      },
      setLanguage: (language) => set({ language }),
      setCurrency: (currency) => set({ currency }),
      setExchangeRate: (rate) => {
        if (rate > 0) set({ exchangeRate: rate });
      },
      fetchExchangeRate: async () => {
        try {
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/currency/rates`,
            { cache: "no-store" },
          );
          if (res.ok) {
            const data = await res.json();
            if (data?.rate && typeof data.rate === "number" && data.rate > 0) {
              set({ exchangeRate: data.rate });
            }
          }
        } catch {
          // Keep fallback rate (4100)
        }
      },
      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      markNotificationRead: (id) => {
        const token = get().session?.token;
        if (!token) return;
        void fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/notifications/${id}/read`,
          {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
          },
        )
          .then((response) => {
            if (response.ok)
              set((state) => ({
                notificationsRead: state.notificationsRead.includes(id)
                  ? state.notificationsRead
                  : [...state.notificationsRead, id],
              }));
          })
          .catch(() => {});
      },
      incrementUnreadBookings: () =>
        set((state) => ({
          unreadBookingsCount: state.unreadBookingsCount + 1,
        })),
      clearUnreadBookings: () => set({ unreadBookingsCount: 0 }),
      incrementUnreadMessages: () =>
        set((state) => ({
          unreadMessagesCount: state.unreadMessagesCount + 1,
        })),
      clearUnreadMessages: () => set({ unreadMessagesCount: 0 }),
      resetDemo: () => set({ session: null, ...initialPreferences }),
    }),
    {
      name: "khmerstay-demo",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        session: state.session,
        language: state.language,
        currency: state.currency,
        exchangeRate: state.exchangeRate,
        sidebarCollapsed: state.sidebarCollapsed,
        notificationsRead: state.notificationsRead,
      }),
    },
  ),
);
