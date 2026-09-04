"use client";

import { useEffect } from "react";
import type { DemoRole } from "@/src/stores/app-store";
import { useDemoStore } from "@/src/stores/demo-store";
import type { BookingStatus, PropertyStatus } from "@/src/types";

const bookingStatuses: BookingStatus[] = ["New request", "Pending", "Confirmed", "Checked in", "Completed", "Cancelled", "Declined", "No-show"];
const propertyStatuses: PropertyStatus[] = ["Published", "Draft", "Paused", "Rejected", "Review pending"];

export function WebMcpTools({ portal }: { portal: DemoRole }) {
  useEffect(() => {
    const context = document.modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const register = async () => {
      await context.registerTool({
        name: "read_khmerstay_demo_summary",
        title: "Read KhmerStay demo summary",
        description: "Read a concise summary of the local KhmerStay demonstration state currently visible in this portal.",
        inputSchema: { type: "object", properties: {}, additionalProperties: false },
        annotations: { readOnlyHint: true, untrustedContentHint: false },
        execute() {
          const state = useDemoStore.getState();
          return { portal, propertyCount: state.properties.length, blockedDateCount: state.blockedDates.length, promotionCount: state.promotions.length };
        },
      }, { signal: lifecycle.signal });

      if (portal === "owner") {
        await context.registerTool({
          name: "update_local_booking_status",
          title: "Update local booking status",
          description: "Update one existing booking status in local KhmerStay demo state. No backend or real booking is changed.",
          inputSchema: { type: "object", properties: { bookingId: { type: "string" }, status: { type: "string", enum: bookingStatuses } }, required: ["bookingId", "status"], additionalProperties: false },
          annotations: { readOnlyHint: false, untrustedContentHint: false },
          execute(input) {
            if (!input || typeof input !== "object") throw new Error("Expected a bookingId and status.");
            const candidate = input as { bookingId?: unknown; status?: unknown };
            if (typeof candidate.bookingId !== "string" || typeof candidate.status !== "string" || !bookingStatuses.includes(candidate.status as BookingStatus)) throw new Error("Invalid bookingId or status.");
            const state = useDemoStore.getState();
            if (!(candidate.bookingId in state.bookingStatuses)) throw new Error("Booking not found.");
            state.updateBookingStatus(candidate.bookingId, candidate.status as BookingStatus);
            return { bookingId: candidate.bookingId, status: candidate.status, storage: "local-demo" };
          },
        }, { signal: lifecycle.signal });
      } else {
        await context.registerTool({
          name: "moderate_local_property",
          title: "Moderate local property",
          description: "Update one existing property moderation status in local KhmerStay demo state. No real listing is changed.",
          inputSchema: { type: "object", properties: { propertyId: { type: "string" }, status: { type: "string", enum: propertyStatuses } }, required: ["propertyId", "status"], additionalProperties: false },
          annotations: { readOnlyHint: false, untrustedContentHint: false },
          execute(input) {
            if (!input || typeof input !== "object") throw new Error("Expected a propertyId and status.");
            const candidate = input as { propertyId?: unknown; status?: unknown };
            if (typeof candidate.propertyId !== "string" || typeof candidate.status !== "string" || !propertyStatuses.includes(candidate.status as PropertyStatus)) throw new Error("Invalid propertyId or status.");
            const state = useDemoStore.getState();
            if (!(candidate.propertyId in state.propertyStatuses)) throw new Error("Property not found.");
            state.updatePropertyStatus(candidate.propertyId, candidate.status as PropertyStatus);
            return { propertyId: candidate.propertyId, status: candidate.status, storage: "local-demo" };
          },
        }, { signal: lifecycle.signal });
      }
    };
    void register().catch(() => undefined);
    return () => lifecycle.abort();
  }, [portal]);
  return null;
}
