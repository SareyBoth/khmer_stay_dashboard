"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { bookings as seedBookings, properties as seedProperties, promotions as seedPromotions } from "@/src/lib/mock-data";
import type { BookingStatus, Property, PropertyStatus } from "@/src/types";

type Promotion = (typeof seedPromotions)[number];
type DemoState = {
  properties: Property[];
  bookingStatuses: Record<string, BookingStatus>;
  propertyStatuses: Record<string, PropertyStatus>;
  verificationDecisions: Record<string, string>;
  prices: Record<string, number>;
  blockedDates: string[];
  promotions: Promotion[];
  settings: Record<string, boolean | string | number>;
  addProperty: (property: Property) => void;
  updateBookingStatus: (id: string, status: BookingStatus) => void;
  updatePropertyStatus: (id: string, status: PropertyStatus) => void;
  setVerificationDecision: (id: string, decision: string) => void;
  updatePrice: (id: string, price: number) => void;
  toggleBlockedDate: (date: string) => void;
  addPromotion: (promotion: Promotion) => void;
  updateSetting: (key: string, value: boolean | string | number) => void;
  reset: () => void;
};

const initialBookingStatuses = Object.fromEntries(seedBookings.map((booking) => [booking.id, booking.status]));
const initialPropertyStatuses = Object.fromEntries(seedProperties.map((property) => [property.id, property.status]));
const initialPrices = Object.fromEntries(seedProperties.map((property) => [property.id, property.price]));

export const useDemoStore = create<DemoState>()(
  persist(
    (set) => ({
      properties: seedProperties,
      bookingStatuses: initialBookingStatuses,
      propertyStatuses: initialPropertyStatuses,
      verificationDecisions: {},
      prices: initialPrices,
      blockedDates: ["2026-09-10", "2026-09-18"],
      promotions: seedPromotions,
      settings: { commission: 15, maintenance: false, instantBooking: false, payouts: true },
      addProperty: (property) => set((state) => ({ properties: [property, ...state.properties] })),
      updateBookingStatus: (id, status) => set((state) => ({ bookingStatuses: { ...state.bookingStatuses, [id]: status } })),
      updatePropertyStatus: (id, status) => set((state) => ({ propertyStatuses: { ...state.propertyStatuses, [id]: status } })),
      setVerificationDecision: (id, decision) => set((state) => ({ verificationDecisions: { ...state.verificationDecisions, [id]: decision } })),
      updatePrice: (id, price) => set((state) => ({ prices: { ...state.prices, [id]: price } })),
      toggleBlockedDate: (date) => set((state) => ({ blockedDates: state.blockedDates.includes(date) ? state.blockedDates.filter((value) => value !== date) : [...state.blockedDates, date] })),
      addPromotion: (promotion) => set((state) => ({ promotions: [promotion, ...state.promotions] })),
      updateSetting: (key, value) => set((state) => ({ settings: { ...state.settings, [key]: value } })),
      reset: () => set({ properties: seedProperties, bookingStatuses: initialBookingStatuses, propertyStatuses: initialPropertyStatuses, verificationDecisions: {}, prices: initialPrices, blockedDates: ["2026-09-10", "2026-09-18"], promotions: seedPromotions, settings: { commission: 15, maintenance: false, instantBooking: false, payouts: true } }),
    }),
    { name: "khmerstay-demo-records", storage: createJSONStorage(() => localStorage) },
  ),
);
