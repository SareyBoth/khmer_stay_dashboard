import { useAppStore } from "@/src/stores/app-store";
import type { Booking, Payout } from "@/src/types";

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export class ApiError extends Error {
  constructor(message: string, public readonly status: number, options?: ErrorOptions) {
    super(message, options);
    this.name = "ApiError";
  }
}

let activeRefreshPromise: Promise<string | null> | null = null;

async function performTokenRefresh(): Promise<string | null> {
  const session = useAppStore.getState().session;
  if (!session?.refreshToken || session.token === "demo-local") {
    return null;
  }
  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: session.refreshToken }),
      cache: "no-store",
    });
    if (!res.ok) {
      return null;
    }
    const data = await res.json();
    if (data?.token) {
      useAppStore.getState().updateTokens(data.token, data.refreshToken);
      return data.token;
    }
  } catch {
    return null;
  }
  return null;
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = useAppStore.getState().session?.token;
  const headers = new Headers(options.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (options.body && !(options.body instanceof FormData)) headers.set("Content-Type", "application/json");

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...options, headers, cache: "no-store" });
  } catch (cause) {
    throw new ApiError("Cannot reach the KhmerStay API", 0, { cause });
  }

  // Automatic 401 retry interceptor with silent refresh token rotation
  if (response.status === 401 && !path.startsWith("/auth/")) {
    if (!activeRefreshPromise) {
      activeRefreshPromise = performTokenRefresh().finally(() => {
        activeRefreshPromise = null;
      });
    }
    const newToken = await activeRefreshPromise;
    if (newToken) {
      const retryHeaders = new Headers(options.headers);
      retryHeaders.set("Authorization", `Bearer ${newToken}`);
      if (options.body && !(options.body instanceof FormData)) {
        retryHeaders.set("Content-Type", "application/json");
      }
      try {
        response = await fetch(`${API_URL}${path}`, { ...options, headers: retryHeaders, cache: "no-store" });
      } catch (cause) {
        throw new ApiError("Cannot reach the KhmerStay API", 0, { cause });
      }
    }
  }

  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiError(body.error || `Request failed (${response.status})`, response.status);
  return body as T;
}

export function json(method: string, body: unknown): RequestInit {
  return { method, body: JSON.stringify(body) };
}

// Host Payouts & Bakong Settlement
export async function getPayouts(status?: string): Promise<{ payouts: Payout[] }> {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  return api<{ payouts: Payout[] }>(`/payouts${query}`);
}

export async function requestPayout(bookingId: string, bakongAccount: string): Promise<{ payout: Payout }> {
  return api<{ payout: Payout }>("/payouts", json("POST", { bookingId, bakongAccount }));
}

export async function settlePayout(payoutId: string, reference: string, status: string = "Paid"): Promise<{ payout: Payout }> {
  return api<{ payout: Payout }>(`/payouts/${encodeURIComponent(payoutId)}/settle`, json("POST", { reference, status }));
}

// Live NBC Exchange Rates
export type CurrencyRates = {
  baseCurrency: string;
  targetCurrency: string;
  rate: number;
  source: string;
  timestamp: string;
};

export async function getCurrencyRates(): Promise<CurrencyRates> {
  return api<CurrencyRates>("/currency/rates");
}

// Bookings
export async function createBooking(data: Record<string, unknown>): Promise<{ booking: Booking }> {
  return api<{ booking: Booking }>("/bookings", json("POST", data));
}

export function formatBookingConflict(errorMessage: string, isKhmer: boolean): { title: string; description: string } | null {
  if (errorMessage.includes("property is already reserved for the selected dates")) {
    return {
      title: isKhmer
        ? "កន្លែងស្នាក់នៅត្រូវបានកក់រួចហើយសម្រាប់កាលបរិច្ឆេទដែលបានជ្រើសរើស"
        : "Property is already reserved for the selected dates",
      description: isKhmer
        ? "សូមជ្រើសរើសកាលបរិច្ឆេទស្នាក់នៅផ្សេងទៀត។"
        : "Please select different stay dates.",
    };
  }
  if (errorMessage.includes("selected dates include blocked host dates")) {
    return {
      title: isKhmer
        ? "កាលបរិច្ឆេទដែលបានជ្រើសរើសរួមបញ្ចូលថ្ងៃដែលម្ចាស់ផ្ទះបានបិទ"
        : "Selected dates include blocked host dates",
      description: isKhmer
        ? "សូមដោះការបិទកាលបរិច្ឆេទនៅលើប្រតិទិនជាមុនសិន។"
        : "Unblock the dates on your calendar first.",
    };
  }
  return null;
}
