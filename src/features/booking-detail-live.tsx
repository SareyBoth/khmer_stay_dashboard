"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { api, json } from "@/src/lib/api";
import {
  Button,
  Card,
  ConfirmDialog,
  PageHeader,
  StatusBadge,
} from "@/src/components/shared/ui";
import { formatMoney } from "@/src/lib/mock-data";
import { useAppStore } from "@/src/stores/app-store";

type Booking = {
  id: string;
  property: string;
  room: string;
  guest: string;
  guestEmail: string;
  guestPhone: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  total: number;
  status: string;
  payment: string;
  specialRequest: string;
  createdAt: string;
};
type Payment = {
  status: string;
  amount: number;
  currency: "USD" | "KHR";
  configured: boolean;
  automaticVerification: boolean;
  qrPayload: string;
  qrMd5: string;
  expiresAt: string;
  checkedAt?: string;
  bakongHash?: string;
};

export function BookingDetailLive({
  bookingId,
  portal,
}: {
  bookingId: string;
  portal: "owner" | "admin";
}) {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const currency = useAppStore((state) => state.currency);

  useEffect(() => {
    let active = true;
    Promise.all([
      api<{ booking: Booking }>(`/bookings/${bookingId}`),
      api<Payment>(`/bookings/${bookingId}/payment`),
    ])
      .then(([bookingResult, paymentResult]) => {
        if (active) {
          setBooking(bookingResult.booking);
          setPayment(paymentResult);
        }
      })
      .catch((cause) => {
        if (active)
          setError(
            cause instanceof Error ? cause.message : "Could not load booking",
          );
      });
    return () => {
      active = false;
    };
  }, [bookingId]);

  async function changeStatus(status: string) {
    setBusy(true);
    setError("");
    try {
      const result = await api<{ booking: Booking }>(
        `/bookings/${bookingId}/status`,
        json("POST", { status }),
      );
      setBooking(result.booking);
      toast.success(`Booking is now ${status.toLowerCase()}`);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not update booking",
      );
    } finally {
      setBusy(false);
    }
  }

  async function verifyPayment() {
    setBusy(true);
    setError("");
    try {
      const paymentResult = await api<Payment>(
        `/bookings/${bookingId}/payment/check`,
        { method: "POST" },
      );
      const bookingResult = await api<{ booking: Booking }>(
        `/bookings/${bookingId}`,
      );
      setPayment(paymentResult);
      setBooking(bookingResult.booking);
      toast[paymentResult.status === "Paid" ? "success" : "info"](
        paymentResult.status === "Paid"
          ? "Bakong payment verified"
          : "Payment has not arrived yet",
      );
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not verify payment",
      );
    } finally {
      setBusy(false);
    }
  }

  const choices =
    portal === "owner"
      ? ["Confirmed", "Declined", "Checked in", "Completed"]
      : ["Confirmed", "Cancelled", "Declined", "No-show"];
  return (
    <div>
      <PageHeader
        eyebrow="Bookings"
        title={booking?.guest || bookingId}
        description={
          booking
            ? `${booking.property} · ${booking.checkIn} to ${booking.checkOut}`
            : "Loading booking…"
        }
        actions={
          <Link href={`/${portal}/bookings`}>
            <Button variant="secondary">All bookings</Button>
          </Link>
        }
      />
      {error && (
        <p role="alert" className="mb-4 rounded-xl bg-red-50 p-4 text-red-700">
          {error}
        </p>
      )}
      {booking && (
        <div className="grid gap-5 lg:grid-cols-[1.3fr_.7fr]">
          <Card className="p-5">
            <div className="flex justify-between">
              <h2 className="text-lg font-bold">Reservation</h2>
              <StatusBadge status={booking.status} />
            </div>
            <dl className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="Property" value={booking.property} />
              <Field label="Room" value={booking.room} />
              <Field label="Check-in" value={booking.checkIn} />
              <Field label="Check-out" value={booking.checkOut} />
              <Field label="Guests" value={String(booking.guests)} />
              <Field
                label="Created"
                value={new Date(booking.createdAt).toLocaleString()}
              />
              <Field
                label="Total"
                value={formatMoney(booking.total, currency)}
              />
              <Field label="Payment" value={booking.payment} />
            </dl>
            <h3 className="mt-6 font-bold">Special request</h3>
            <p className="mt-2 text-sm">{booking.specialRequest || "None"}</p>
          </Card>
          <div className="space-y-5">
            <Card className="p-5">
              <h2 className="text-lg font-bold">Guest contact</h2>
              <p className="mt-3">{booking.guest}</p>
              <p>{booking.guestEmail}</p>
              <p>{booking.guestPhone || "No phone provided"}</p>
              {portal === "owner" && (
                <Link className="mt-4 inline-block" href="/owner/messages">
                  <Button variant="secondary">Open messages</Button>
                </Link>
              )}
            </Card>
            <Card className="p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-bold">Bakong payment</h2>
                <StatusBadge status={payment?.status || booking.payment} />
              </div>
              <p className="mt-3 text-sm text-[#776d64]">
                {payment?.configured
                  ? `Dynamic KHQR · ${payment.currency} ${payment.amount.toFixed(2)} · expires ${new Date(payment.expiresAt).toLocaleString()}`
                  : "Add the Bakong receiving account and API token to the Go API environment."}
              </p>
              {payment?.bakongHash && (
                <p className="mt-3 break-all rounded-lg bg-[#f4eee4] p-2 font-mono text-xs">
                  {payment.bakongHash}
                </p>
              )}
              {payment?.automaticVerification && payment.status !== "Paid" && (
                <Button
                  className="mt-4 w-full"
                  disabled={busy}
                  onClick={verifyPayment}
                >
                  {busy ? "Checking Bakong…" : "Verify with Bakong"}
                </Button>
              )}
            </Card>
            <Card className="p-5">
              <h2 className="text-lg font-bold">Update status</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {choices.map((status) => (
                  <ConfirmDialog
                    key={status}
                    trigger={
                      <Button
                        variant="secondary"
                        disabled={
                          busy ||
                          (status === "Confirmed" &&
                            ((booking.payment !== "Paid" &&
                              booking.payment !== "Demo paid") ||
                              booking.status !== "Pending")) ||
                          (status === "Declined" &&
                            booking.status !== "Pending") ||
                          (status === "Checked in" &&
                            booking.status !== "Confirmed") ||
                          (status === "Completed" &&
                            booking.status !== "Checked in") ||
                          (status === "No-show" &&
                            booking.status !== "Confirmed")
                        }
                      >
                        {status}
                      </Button>
                    }
                    title={`${status} this booking?`}
                    description="The status will be saved on the local server and shared with the traveler."
                    confirmLabel="Confirm"
                    onConfirm={() => changeStatus(status)}
                  />
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-bold text-[#776d64]">{label}</dt>
      <dd className="mt-1 font-semibold">{value}</dd>
    </div>
  );
}
