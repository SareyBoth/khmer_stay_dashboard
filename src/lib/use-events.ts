"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { API_URL } from "@/src/lib/api";
import { useAppStore } from "@/src/stores/app-store";
import { useDemoStore } from "@/src/stores/demo-store";
import type { BookingStatus } from "@/src/types";

export type SSEEventDetail = {
  type: string;
  data: unknown;
};

export function useEventStream() {
  const token = useAppStore((state) => state.session?.token);
  const role = useAppStore((state) => state.session?.role);
  const language = useAppStore((state) => state.language);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    // Only connect in browser environment with valid backend token
    if (typeof window === "undefined" || !token || token === "demo-local") {
      return;
    }

    const sseUrl = `${API_URL}/events?token=${encodeURIComponent(token)}`;
    const es = new EventSource(sseUrl);
    esRef.current = es;

    const isKhmer = language === "km";

    // 1. payment_received listener
    es.addEventListener("payment_received", (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        const bookingId =
          data.id || data.bookingId || data.ID || (isKhmer ? "ការកក់" : "Booking");
        const amount = typeof data.amount === "number" || typeof data.Amount === "number"
          ? `$${data.amount || data.Amount}`
          : "";

        toast.success(
          isKhmer
            ? `ទទួលបានការទូទាត់សម្រាប់ ${bookingId} ${amount}`.trim()
            : `Payment received for booking ${bookingId} ${amount}`.trim(),
          {
            description: isKhmer
              ? "ការទូទាត់ KHQR បានផ្ទៀងផ្ទាត់ជោគជ័យ។ ព័ត៌មានចំណូលត្រូវបានធ្វើបច្ចុប្បន្នភាព។"
              : "KHQR payment confirmed. Dashboard revenue and booking updated.",
            duration: 6000,
          },
        );

        // Update local demo store if applicable
        if (data.id || data.bookingId) {
          useDemoStore
            .getState()
            .updateBookingStatus(data.id || data.bookingId, "Confirmed");
        }

        // Notify active dashboard / bookings tables to refresh live data
        window.dispatchEvent(
          new CustomEvent("khmerstay:refresh-bookings", {
            detail: { type: "payment_received", data },
          }),
        );
      } catch (err) {
        console.warn("Failed to parse payment_received SSE payload", err);
      }
    });

    // 2. new_booking_request listener
    es.addEventListener("new_booking_request", (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        const guest =
          data.guest || data.travelerName || (isKhmer ? "ភ្ញៀវ" : "A guest");
        const bookingId = data.id || data.bookingId || "";

        useAppStore.getState().incrementUnreadBookings();

        toast.info(
          isKhmer
            ? `សំណើកក់បន្ទប់ថ្មីពី ${guest} (${bookingId})`
            : `New booking request from ${guest} (${bookingId})`,
          {
            description: isKhmer
              ? "សូមពិនិត្យមើល និងឆ្លើយតបទៅកាន់ភ្ញៀវ"
              : "Review and respond to the guest request.",
            duration: 8000,
          },
        );

        window.dispatchEvent(
          new CustomEvent("khmerstay:refresh-bookings", {
            detail: { type: "new_booking_request", data },
          }),
        );
      } catch (err) {
        console.warn("Failed to parse new_booking_request SSE payload", err);
      }
    });

    // 3. booking_updated listener. Chat uses the dedicated WebSocket hook.
    es.addEventListener("booking_updated", (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        const bookingId = data.id || data.bookingId || data.ID;
        const status: BookingStatus = data.status || data.Status || "Confirmed";

        if (bookingId && status) {
          useDemoStore.getState().updateBookingStatus(bookingId, status);
        }

        toast.info(
          isKhmer
            ? `ស្ថានភាពការកក់ ${bookingId || ""} ត្រូវបានកែប្រែជា ${status}`
            : `Booking ${bookingId || ""} updated to ${status}`,
          { duration: 5000 },
        );

        window.dispatchEvent(
          new CustomEvent("khmerstay:refresh-bookings", {
            detail: { type: "booking_updated", data },
          }),
        );
      } catch (err) {
        console.warn("Failed to parse booking_updated SSE payload", err);
      }
    });

    es.onerror = () => {
      // EventSource auto-reconnects on error; we do not force-close unless unmounted
    };

    return () => {
      es.close();
      esRef.current = null;
    };
  }, [token, role, language]);

  return esRef;
}
