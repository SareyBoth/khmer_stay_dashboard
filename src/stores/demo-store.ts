"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { bookings as seedBookings, properties as seedProperties, promotions as seedPromotions } from "@/src/lib/mock-data";
import type { BookingStatus, Property, PropertyStatus } from "@/src/types";
import { api, json } from "@/src/lib/api";
import { toast } from "sonner";

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
  hydrateFromApi: (properties: Property[], bookings: { id: string; status: BookingStatus }[], settings?: Record<string, boolean | string | number>) => void;
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
      hydrateFromApi: (properties, bookings, settings) => set({
        properties,
        propertyStatuses: Object.fromEntries(properties.map((property) => [property.id, property.status])),
        bookingStatuses: Object.fromEntries(bookings.map((booking) => [booking.id, booking.status])),
        prices: Object.fromEntries(properties.map((property) => [property.id, property.price])),
        ...(settings ? { settings } : {}),
      }),
      addProperty: (property) => { api<{ property: Property }>("/properties", json("POST", { ...property, roomTypes: [{ id: "", name: "Standard room", nameKm: "បន្ទប់ស្តង់ដារ", bed: "1 king bed", guests: 2, price: property.price, inventory: 1 }] })).then(({ property: saved }) => { seedProperties.unshift(saved); set((state) => ({ properties: [saved, ...state.properties] })); }).catch((error) => toast.error(error.message)); },
      updateBookingStatus: (id, status) => { api(`/bookings/${id}/status`, json("POST", { status })).then(() => set((state) => ({ bookingStatuses: { ...state.bookingStatuses, [id]: status } }))).catch((error) => toast.error(error.message)); },
      updatePropertyStatus: (id, status) => { api(`/properties/${id}/status`, json("POST", { status })).then(() => set((state) => ({ propertyStatuses: { ...state.propertyStatuses, [id]: status } }))).catch((error) => toast.error(error.message)); },
      setVerificationDecision: (id, decision) => set((state) => ({ verificationDecisions: { ...state.verificationDecisions, [id]: decision } })),
      updatePrice: (id, price) => { api<{ property: Property & { roomTypes: { id: string; name: string; nameKm: string; bed: string; guests: number; price: number; inventory: number }[] } }>(`/properties/${id}`).then(({ property }) => api(`/properties/${id}`, json("PATCH", { roomTypes: property.roomTypes.map((room) => ({ ...room, price })) }))).then(() => { const property = seedProperties.find((item) => item.id === id); if (property) property.price = price; set((state) => ({ prices: { ...state.prices, [id]: price } })); }).catch((error) => toast.error(error.message)); },
      toggleBlockedDate: (date) => { const propertyId = seedProperties[0]?.id; if (!propertyId) return; const blocked = !useDemoStore.getState().blockedDates.includes(date); api("/blocked-dates", json("POST", { propertyId, date, blocked })).then(() => set((state) => ({ blockedDates: blocked ? [...state.blockedDates, date] : state.blockedDates.filter((value) => value !== date) }))).catch((error) => toast.error(error.message)); },
      addPromotion: (promotion) => { api<{ promotion: Promotion }>("/promotions", json("POST", promotion)).then(({ promotion: saved }) => set((state) => ({ promotions: [saved, ...state.promotions] }))).catch((error) => toast.error(error.message)); },
      updateSetting: (key, value) => { api<{ settings: Record<string, boolean | string | number> }>("/settings", json("PATCH", { [key]: value })).then(({ settings }) => set({ settings })).catch((error) => toast.error(error.message)); },
      reset: () => set({ properties: seedProperties, bookingStatuses: initialBookingStatuses, propertyStatuses: initialPropertyStatuses, verificationDecisions: {}, prices: initialPrices, blockedDates: ["2026-09-10", "2026-09-18"], promotions: seedPromotions, settings: { commission: 15, maintenance: false, instantBooking: false, payouts: true } }),
    }),
    { name: "khmerstay-demo-records", storage: createJSONStorage(() => localStorage) },
  ),
);
