export type PropertyStatus = "Published" | "Draft" | "Paused" | "Rejected" | "Review pending";
export type BookingStatus = "New request" | "Pending" | "Confirmed" | "Checked in" | "Completed" | "Cancelled" | "Declined" | "No-show";

export type Property = {
  id: string; name: string; nameKm: string; province: string; type: string; rooms: number;
  provinceKm?: string; provinceCode?: string; city?: string; cityKm?: string; cityId?: string;
  price: number; rating: number; bookings: number; occupancy: number; status: PropertyStatus;
  updated: string; image: string; owner: string;
  recommendationScore?: number; recommendationReason?: string;
};

export type Booking = {
  id: string; guest: string; property: string; room: string; checkIn: string; checkOut: string;
  guests: number; total: number; payment: string;
  status: BookingStatus; owner: string;
};

export type Traveler = {
  id: string; name: string; province: string; joined: string; bookings: number; status: "Active" | "Suspended" | "Review";
};

export type Owner = {
  id: string; name: string; business: string; province: string; properties: number; bookings: number;
  revenue: number; rating: number; verification: "Approved" | "Under review" | "Changes required"; status: "Active" | "Suspended";
};

export type PayoutStatus = "Pending" | "Processing" | "Paid" | "Declined";

export type Payout = {
  id: string;
  ownerId: string;
  bookingId: string;
  grossAmount: number;
  commissionRate: number;
  commissionAmount: number;
  netAmount: number;
  currency: string;
  bakongAccount: string;
  status: PayoutStatus;
  reference: string;
  createdAt: string;
  paidAt?: string;
  propertyName?: string;
  guestName?: string;
};
