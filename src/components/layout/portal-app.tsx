"use client";

import { useEffect, useState } from "react";
import type { DemoRole } from "@/src/stores/app-store";
import { useAppStore } from "@/src/stores/app-store";
import { PortalShell } from "@/src/components/layout/portal-shell";
import { OwnerPages } from "@/src/features/owner/owner-pages";
import { AdminPages } from "@/src/features/admin/admin-pages";
import { LoadingScreen } from "@/src/components/shared/ui";
import { API_URL, api } from "@/src/lib/api";
import { bookings, conversations, financeRows, monthlyAnalytics, notifications, owners, promotions, properties, travelers } from "@/src/lib/mock-data";
import { useDemoStore } from "@/src/stores/demo-store";
import type { Booking, Property } from "@/src/types";

type ApiNotification = { id: string; title: string; body: string; time: string; category: string; read: boolean };
type ApiUser = { id: string; email: string; name: string; role: string; status: string; createdAt: string };
type ApiConversation = { id: string; travelerName: string; ownerName: string; propertyId: string; property: string; createdAt: string };

export function PortalApp({ portal, segments }: { portal: DemoRole; segments?: string[] }) {
  const session = useAppStore((state) => state.session);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const offlineDemo = session?.token === "demo-local";

  useEffect(() => {
    if (!session?.token || session.role !== portal) return;
    if (session.token === "demo-local") return;
    let active = true;
    async function load() {
      try {
        const [propertyResult, bookingResult, notificationResult, conversationResult, promotionResult, blockedResult, settingsResult, userResult] = await Promise.all([
          api<{ properties: Property[] }>("/properties"),
          api<{ bookings: Booking[] }>("/bookings"),
          api<{ notifications: ApiNotification[] }>("/notifications"),
          api<{ conversations: ApiConversation[] }>("/conversations"),
          api<{ promotions: typeof promotions }>("/promotions"),
          portal === "owner" ? api<{ blockedDates: { propertyId: string; date: string }[] }>("/blocked-dates") : Promise.resolve(null),
          portal === "admin" ? api<{ settings: Record<string, boolean | string | number> }>("/settings") : Promise.resolve(null),
          portal === "admin" ? api<{ users: ApiUser[] }>("/users") : Promise.resolve(null),
        ]);
        if (!active) return;
        properties.splice(0, properties.length, ...propertyResult.properties.map((property) => ({ ...property, image: property.image?.startsWith("/uploads/") ? `${API_URL}${property.image}` : property.image || "/images/siem-reap-homestay.png" })));
        bookings.splice(0, bookings.length, ...bookingResult.bookings);
        financeRows.splice(0, financeRows.length, ...bookingResult.bookings.map((booking) => ({ id: `TXN-${booking.id}`, booking: booking.id, owner: booking.owner, amount: booking.total, commission: Number((booking.total * .15).toFixed(2)), status: booking.payment === "Paid" ? "Completed" : booking.payment === "Demo paid" ? "Demo" : "Pending", date: booking.checkIn })));
        const today = new Date();
        monthlyAnalytics.splice(0, monthlyAnalytics.length, ...Array.from({ length: 6 }, (_, index) => {
          const month = new Date(today.getFullYear(), today.getMonth() - 5 + index, 1);
          const monthKey = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}`;
          const rows = bookingResult.bookings.filter((booking) => booking.checkIn.startsWith(monthKey));
          const revenue = rows.filter((booking) => booking.payment === "Paid" || booking.payment === "Demo paid").reduce((sum, booking) => sum + booking.total, 0);
          return { month: month.toLocaleString("en", { month: "short" }), revenue, bookings: rows.length, commission: Number((revenue * .15).toFixed(2)) };
        }));
        notifications.splice(0, notifications.length, ...notificationResult.notifications.map((item) => ({ id: item.id, role: portal, title: item.title, detail: item.body, time: new Date(item.time).toLocaleString(), category: item.category })));
        useAppStore.setState({ notificationsRead: notificationResult.notifications.filter((item) => item.read).map((item) => item.id) });
        conversations.splice(0, conversations.length, ...conversationResult.conversations.map((item) => ({ id: item.id, guest: item.travelerName, booking: item.id.replace(/^conversation-/, ""), preview: "Open conversation", unread: 0, time: new Date(item.createdAt).toLocaleDateString() })));
        promotions.splice(0, promotions.length, ...promotionResult.promotions);
        if (userResult) {
          travelers.splice(0, travelers.length, ...userResult.users.filter((item) => item.role === "traveler").map((item) => ({ id: item.id, name: item.name, province: "", joined: item.createdAt.slice(0, 10), bookings: 0, status: item.status as "Active" | "Suspended" | "Review" })));
          owners.splice(0, owners.length, ...userResult.users.filter((item) => item.role === "owner").map((item) => ({ id: item.id, name: item.name, business: "", province: "", properties: 0, bookings: 0, revenue: 0, rating: 0, verification: "Under review" as const, status: item.status as "Active" | "Suspended" })));
        }
        useDemoStore.getState().hydrateFromApi(propertyResult.properties, bookingResult.bookings, settingsResult?.settings);
        useDemoStore.setState({ promotions: promotionResult.promotions, blockedDates: blockedResult?.blockedDates.map((item) => item.date) || [] });
        setReady(true);
      } catch (cause) { if (active) setError(cause instanceof Error ? cause.message : "Could not load data"); }
    }
    load();
    return () => { active = false; };
  }, [portal, session?.token, session?.role]);

  return (
    <PortalShell portal={portal}>
      <main className="mx-auto w-full max-w-[1640px] px-4 py-6 sm:px-6 sm:py-8 xl:px-8">
        {!offlineDemo && error ? <div role="alert">Could not load KhmerStay data: {error}. Check that the Go API is running.</div> : !offlineDemo && !ready ? <LoadingScreen /> : portal === "owner" ? <OwnerPages segments={segments} /> : <AdminPages segments={segments} />}
      </main>
    </PortalShell>
  );
}
