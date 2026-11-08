"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/src/lib/api";
import { useAppStore } from "@/src/stores/app-store";
import {
  Button,
  Card,
  PageHeader,
  StatusBadge,
} from "@/src/components/shared/ui";
import { formatMoney } from "@/src/lib/mock-data";
import type { Booking, Property } from "@/src/types";

type Data = { properties: number; bookings: number; revenue: number };
type User = { id: string; role: string; status: string };

export function LiveDashboard({ portal }: { portal: "owner" | "admin" }) {
  const [data, setData] = useState<Data | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const currency = useAppStore((state) => state.currency);
  const name = useAppStore((state) => state.session?.name);

  useEffect(() => {
    const handleRefresh = () => setRefreshKey((k) => k + 1);
    window.addEventListener("khmerstay:refresh-bookings", handleRefresh);
    return () => window.removeEventListener("khmerstay:refresh-bookings", handleRefresh);
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([
      api<Data>("/dashboard"),
      api<{ bookings: Booking[] }>("/bookings"),
      api<{ properties: Property[] }>("/properties"),
      portal === "admin"
        ? api<{ users: User[] }>("/users")
        : Promise.resolve({ users: [] }),
    ])
      .then(([dashboard, bookingResult, propertyResult, userResult]) => {
        if (!active) return;
        setData(dashboard);
        setBookings(bookingResult.bookings);
        setProperties(propertyResult.properties);
        setUsers(userResult.users);
      })
      .catch((cause) => {
        if (active)
          setError(
            cause instanceof Error ? cause.message : "Could not load dashboard",
          );
      });
    return () => {
      active = false;
    };
  }, [portal, refreshKey]);

  const pending = bookings.filter(
    (item) => item.status === "Pending" || item.status === "New request",
  ).length;
  const reviewPending = properties.filter(
    (item) => item.status === "Review pending",
  ).length;
  const paid = bookings
    .filter((item) => item.payment === "Paid")
    .reduce((sum, item) => sum + item.total, 0);
  const demoPaid = bookings
    .filter((item) => item.payment === "Demo paid")
    .reduce((sum, item) => sum + item.total, 0);

  return (
    <div>
      <PageHeader
        eyebrow={portal === "owner" ? "Owner Portal" : "Admin Portal"}
        title={`Welcome, ${name || "KhmerStay"}`}
        description="Current records from the local KhmerStay server."
        actions={
          <Link
            href={
              portal === "owner" ? "/owner/properties/new" : "/admin/properties"
            }
          >
            <Button>
              {portal === "owner" ? "Add property" : "Review properties"}
            </Button>
          </Link>
        }
      />
      {error && (
        <p role="alert" className="mb-4 rounded-xl bg-red-50 p-4 text-red-700">
          {error}
        </p>
      )}
      {!data ? (
        <p>Loading dashboard…</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Metric
              label="Properties"
              value={String(data.properties)}
              href={
                portal === "owner" ? "/owner/properties" : "/admin/properties"
              }
            />
            <Metric
              label="Bookings"
              value={String(data.bookings)}
              href={portal === "owner" ? "/owner/bookings" : "/admin/bookings"}
            />
            <Metric
              label="Verified KHQR revenue"
              value={formatMoney(paid, currency)}
              href={portal === "owner" ? "/owner/earnings" : "/admin/payments"}
            />
            <Metric
              label="Demo payment total"
              value={formatMoney(demoPaid, currency)}
              href={portal === "owner" ? "/owner/earnings" : "/admin/payments"}
            />
          </div>
          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <Card className="p-5">
              <h2 className="text-lg font-bold">Action needed</h2>
              <div className="mt-4 space-y-3">
                <Action
                  label="Pending booking requests"
                  value={pending}
                  href={
                    portal === "owner" ? "/owner/bookings" : "/admin/bookings"
                  }
                />
                <Action
                  label="Properties awaiting review"
                  value={reviewPending}
                  href={
                    portal === "owner"
                      ? "/owner/properties"
                      : "/admin/properties"
                  }
                />
                {portal === "admin" && (
                  <Action
                    label="Traveler accounts"
                    value={
                      users.filter((item) => item.role === "traveler").length
                    }
                    href="/admin/users"
                  />
                )}
              </div>
            </Card>
            <Card className="p-5">
              <h2 className="text-lg font-bold">Recent bookings</h2>
              <div className="mt-4 space-y-3">
                {bookings.slice(0, 5).map((item) => (
                  <Link
                    key={item.id}
                    className="flex items-center justify-between rounded-xl border border-[#e9dfd1] p-3 hover:bg-[#fbf6ee]"
                    href={`/${portal}/bookings/${item.id}`}
                  >
                    <span>
                      <strong className="block">{item.guest}</strong>
                      <small>
                        {item.property} · {item.checkIn}
                      </small>
                    </span>
                    <StatusBadge status={item.status} />
                  </Link>
                ))}
                {bookings.length === 0 && (
                  <p className="text-sm text-[#786e65]">No bookings yet.</p>
                )}
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function Metric({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href: string;
}) {
  return (
    <Link href={href}>
      <Card className="p-5 transition hover:border-[#b88a44]">
        <p className="text-sm text-[#776d64]">{label}</p>
        <p className="mt-2 text-2xl font-extrabold">{value}</p>
      </Card>
    </Link>
  );
}
function Action({
  label,
  value,
  href,
}: {
  label: string;
  value: number;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex justify-between rounded-xl border border-[#e9dfd1] p-3 hover:bg-[#fbf6ee]"
    >
      <span>{label}</span>
      <strong>{value}</strong>
    </Link>
  );
}
