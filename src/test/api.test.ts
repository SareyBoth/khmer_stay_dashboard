import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { waitFor } from "@testing-library/react";
import {
  ApiError,
  api,
  getPayouts,
  requestPayout,
  settlePayout,
  getCurrencyRates,
  createBooking,
  formatBookingConflict,
} from "@/src/lib/api";
import { filterProperties } from "@/src/lib/filters";
import { formatMoney, properties } from "@/src/lib/mock-data";
import { useAppStore } from "@/src/stores/app-store";
import { useDemoStore } from "@/src/stores/demo-store";

beforeEach(() => {
  useAppStore.getState().login({
    role: "owner",
    email: "owner@khmerstay.demo",
    token: "test-token",
    refreshToken: "test-refresh-token",
    userId: "owner-1",
    name: "Owner",
  });
  useDemoStore.getState().reset();
  useAppStore.getState().setExchangeRate(4100);
});
afterEach(() => vi.unstubAllGlobals());

describe("Go API integration", () => {
  it("sends the bearer token and reports server errors", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ status: "ok" }), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: "permission denied" }), {
          status: 403,
        }),
      );
    vi.stubGlobal("fetch", fetchMock);
    expect(await api<{ status: string }>("/health")).toEqual({ status: "ok" });
    expect(fetchMock.mock.calls[0][1].headers.get("Authorization")).toBe(
      "Bearer test-token",
    );
    await expect(api("/settings")).rejects.toMatchObject({
      message: "permission denied",
      status: 403,
    });
  });

  it("marks connection failures so login can safely use the offline demo", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("network unavailable")),
    );
    await expect(api("/health")).rejects.toMatchObject({
      name: "ApiError",
      message: "Cannot reach the KhmerStay API",
      status: 0,
    } satisfies Partial<ApiError>);
  });

  it("automatically performs silent refresh token rotation and retries on HTTP 401", async () => {
    const fetchMock = vi
      .fn()
      // Initial protected call returns 401
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: "token expired" }), { status: 401 }),
      )
      // POST /auth/refresh returns new access token and rotated refresh token
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            token: "new-rotated-token",
            refreshToken: "new-rotated-refresh-token",
          }),
          { status: 200 },
        ),
      )
      // Retried call with new token succeeds
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ dashboard: "ok" }), { status: 200 }),
      );

    vi.stubGlobal("fetch", fetchMock);

    const result = await api<{ dashboard: string }>("/dashboard");
    expect(result).toEqual({ dashboard: "ok" });

    // Verify refresh endpoint was called with refreshToken
    expect(fetchMock.mock.calls[1][0]).toContain("/auth/refresh");
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({
      refreshToken: "test-refresh-token",
    });

    // Verify session in store was updated with new rotated tokens
    const session = useAppStore.getState().session;
    expect(session?.token).toBe("new-rotated-token");
    expect(session?.refreshToken).toBe("new-rotated-refresh-token");

    // Verify original request was retried with new Bearer token
    expect(fetchMock.mock.calls[2][1].headers.get("Authorization")).toBe(
      "Bearer new-rotated-token",
    );
  });

  it("sends refreshToken in payload when logging out", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    useAppStore.getState().logout();

    expect(fetchMock.mock.calls[0][0]).toContain("/auth/logout");
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      refreshToken: "test-refresh-token",
    });
    expect(useAppStore.getState().session).toBeNull();
  });

  it("supports host payouts and Bakong settlement API helpers", async () => {
    const fetchMock = vi
      .fn()
      // getPayouts
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            payouts: [
              {
                id: "PO-100",
                bookingId: "KST-100",
                grossAmount: 300,
                commissionRate: 15,
                commissionAmount: 45,
                netAmount: 255,
                bakongAccount: "sokha@aclb",
                status: "Pending",
              },
            ],
          }),
          { status: 200 },
        ),
      )
      // requestPayout
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            payout: {
              id: "PO-101",
              bookingId: "KST-101",
              netAmount: 170,
              status: "Pending",
            },
          }),
          { status: 201 },
        ),
      )
      // settlePayout
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            payout: {
              id: "PO-101",
              status: "Paid",
              reference: "BKG-TXN-12345",
            },
          }),
          { status: 200 },
        ),
      );

    vi.stubGlobal("fetch", fetchMock);

    const list = await getPayouts("Pending");
    expect(list.payouts[0].id).toBe("PO-100");
    expect(fetchMock.mock.calls[0][0]).toContain("/payouts?status=Pending");

    const requested = await requestPayout("KST-101", "sokha@aclb");
    expect(requested.payout.id).toBe("PO-101");
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({
      bookingId: "KST-101",
      bakongAccount: "sokha@aclb",
    });

    const settled = await settlePayout("PO-101", "BKG-TXN-12345");
    expect(settled.payout.status).toBe("Paid");
    expect(fetchMock.mock.calls[2][0]).toContain("/payouts/PO-101/settle");
    expect(JSON.parse(fetchMock.mock.calls[2][1].body)).toEqual({
      reference: "BKG-TXN-12345",
      status: "Paid",
    });
  });

  it("fetches NBC exchange rates and formats currency dynamically", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          baseCurrency: "USD",
          targetCurrency: "KHR",
          rate: 4120,
          source: "National Bank of Cambodia",
          timestamp: "2026-10-30T10:00:00Z",
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const rates = await getCurrencyRates();
    expect(rates.rate).toBe(4120);

    // Update store exchange rate
    useAppStore.getState().setExchangeRate(4120);

    // In USD
    expect(formatMoney(100, "USD")).toContain("$100");
    // In KHR with live NBC rate: 100 * 4120 = 412,000
    expect(formatMoney(100, "KHR")).toContain("412,000៛");
  });

  it("handles double-booking and date conflict messages with localized responses", () => {
    const doubleBookingMsg =
      "property is already reserved for the selected dates";
    const conflictEn = formatBookingConflict(doubleBookingMsg, false);
    expect(conflictEn?.title).toBe(
      "Property is already reserved for the selected dates",
    );

    const conflictKm = formatBookingConflict(doubleBookingMsg, true);
    expect(conflictKm?.title).toContain(
      "កន្លែងស្នាក់នៅត្រូវបានកក់រួចហើយ",
    );

    const blockedDatesMsg = "selected dates include blocked host dates";
    const blockedConflictEn = formatBookingConflict(blockedDatesMsg, false);
    expect(blockedConflictEn?.title).toBe(
      "Selected dates include blocked host dates",
    );

    const blockedConflictKm = formatBookingConflict(blockedDatesMsg, true);
    expect(blockedConflictKm?.title).toContain("ថ្ងៃដែលម្ចាស់ផ្ទះបានបិទ");

    expect(formatBookingConflict("Some other error", false)).toBeNull();
  });

  it("creates manual reservations via POST /bookings", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          booking: {
            id: "KST-NEW-1",
            guest: "John Doe",
            total: 150,
            status: "Confirmed",
          },
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const res = await createBooking({
      propertyId: "stay-1",
      checkIn: "2026-09-20",
      checkOut: "2026-09-23",
      guest: "John Doe",
    });

    expect(res.booking.id).toBe("KST-NEW-1");
    expect(fetchMock.mock.calls[0][0]).toContain("/bookings");
  });

  it("updates a booking only after the API accepts the change", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          booking: { id: "booking-1", status: "Confirmed" },
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);
    useDemoStore.getState().updateBookingStatus("booking-1", "Confirmed");
    await waitFor(() =>
      expect(useDemoStore.getState().bookingStatuses["booking-1"]).toBe(
        "Confirmed",
      ),
    );
    expect(fetchMock.mock.calls[0][0]).toContain("/bookings/booking-1/status");
  });

  it("hydrates property and booking records from the API", () => {
    const property = {
      ...properties[0],
      id: "stay-new",
      status: "Draft" as const,
    };
    useDemoStore
      .getState()
      .hydrateFromApi([property], [{ id: "booking-new", status: "Pending" }]);
    expect(useDemoStore.getState().properties.map((item) => item.id)).toEqual([
      "stay-new",
    ]);
    expect(useDemoStore.getState().bookingStatuses["booking-new"]).toBe(
      "Pending",
    );
  });
});

it("filters the property catalog", () => {
  const result = filterProperties(properties, "kampot", "Published", {});
  expect(result).toHaveLength(1);
});
