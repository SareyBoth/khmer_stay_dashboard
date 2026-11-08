import type { Booking, BookingStatus, Owner, Property, PropertyStatus, Traveler } from "@/src/types";
import { useAppStore } from "@/src/stores/app-store";

const images = [
  "/images/siem-reap-homestay.png",
  "/images/kampot-riverside.png",
  "/images/kep-coastal.png",
  "/images/mondulkiri-lodge.png",
];

const propertySeed = [
  ["Angkor Lotus Heritage Stay", "ផ្ទះស្នាក់បេតិកភណ្ឌឈូកអង្គរ", "Siem Reap", "Heritage homestay"],
  ["Kampot Riverstone Guesthouse", "ផ្ទះសំណាក់ទន្លេថ្មកំពត", "Kampot", "Guesthouse"],
  ["Kep Seabreeze Homestay", "ផ្ទះស្នាក់ខ្យល់សមុទ្រកែប", "Kep", "Coastal homestay"],
  ["Battambang Colonial Courtyard", "ទីធ្លាអាណានិគមបាត់ដំបង", "Battambang", "Boutique stay"],
  ["Mondulkiri Pine View Lodge", "ផ្ទះសំណាក់ព្រៃស្រល់មណ្ឌលគិរី", "Mondulkiri", "Eco lodge"],
  ["Koh Rong Palm Cove Stay", "ផ្ទះស្នាក់ឆ្នេរដូងកោះរ៉ុង", "Koh Rong", "Island stay"],
  ["Kratie Mekong Dolphin House", "ផ្ទះផ្សោតមេគង្គក្រចេះ", "Kratie", "Riverside homestay"],
  ["Ratanakiri Red Earth Retreat", "ផ្ទះស្នាក់ដីក្រហមរតនគិរី", "Ratanakiri", "Nature retreat"],
  ["Phnom Penh Riverside Boutique Stay", "ផ្ទះស្នាក់ប៊ូទិកមាត់ទន្លេភ្នំពេញ", "Phnom Penh", "Boutique stay"],
  ["Preah Vihear Temple View Homestay", "ផ្ទះស្នាក់ទេសភាពប្រាសាទព្រះវិហារ", "Preah Vihear", "Heritage homestay"],
  ["Takeo Silk Village Stay", "ផ្ទះស្នាក់ភូមិសូត្រតាកែវ", "Takeo", "Village stay"],
  ["Pursat Cardamom Gateway Lodge", "ផ្ទះសំណាក់ច្រកក្រវាញពោធិ៍សាត់", "Pursat", "Eco lodge"],
] as const;

const propertyStatuses: PropertyStatus[] = ["Published", "Published", "Published", "Draft", "Published", "Review pending", "Published", "Paused", "Published", "Review pending", "Draft", "Published"];

export const properties: Property[] = propertySeed.map((item, index) => ({
  id: `KS-P${String(index + 1).padStart(3, "0")}`,
  name: item[0], nameKm: item[1], province: item[2], type: item[3],
  rooms: 2 + (index % 5), price: 24 + index * 4, rating: Number((4.3 + (index % 6) * 0.1).toFixed(1)),
  bookings: 18 + index * 7, occupancy: 48 + (index * 7) % 43, status: propertyStatuses[index],
  updated: `2026-08-${String(26 - (index % 9)).padStart(2, "0")}`,
  image: images[index % images.length], owner: ["Sokha Chea", "Dara Lim", "Sophea Khim", "Vannak Chhun", "Bopha Heng"][index % 5],
}));

const travelerNames = [
  "Sreyneang Sok", "Piseth Chan", "Ratha Kim", "Sophal Meas", "Davy Touch", "Veasna Ly", "Sreypov Nhem", "Borey Ouk", "Mony Roth", "Chenda Hak",
  "Nita Kheang", "Panha Eang", "Socheat Prum", "Sreyka Mao", "Vicheka Yem", "Samnang Nuon", "Sokunthy Tep", "Rithy Keo", "Bunnary Kong", "Vuthy Sen",
  "Sreymom Pech", "Makara Say", "Thida Orn", "Chanrith Hoeun", "Sophea San", "Borin Kuy", "Sreymao Chhim", "Visal Touch", "Leakhena Long", "Rady Pen",
];
const provinces = ["Phnom Penh", "Siem Reap", "Kampot", "Battambang", "Kandal", "Kep", "Takeo", "Kampong Cham"];

export const travelers: Traveler[] = travelerNames.map((name, index) => ({
  id: `KS-U${String(index + 1).padStart(3, "0")}`, name, province: provinces[index % provinces.length],
  joined: `2026-${String((index % 8) + 1).padStart(2, "0")}-${String((index % 24) + 1).padStart(2, "0")}`,
  bookings: (index * 3) % 12, status: index === 11 ? "Suspended" : index % 9 === 0 ? "Review" : "Active",
}));

const ownerNames = ["Sokha Chea", "Dara Lim", "Sophea Khim", "Vannak Chhun", "Bopha Heng", "Sovannary Em", "Bunthoeun Ka", "Sokunthea Prak", "Ravy Ngin", "Chansopheak Hor"];
export const owners: Owner[] = ownerNames.map((name, index) => ({
  id: `KS-O${String(index + 1).padStart(3, "0")}`, name, business: index % 2 ? `${name.split(" ")[0]} Family Stays` : `${provinces[index % provinces.length]} Heritage Hospitality`,
  province: provinces[index % provinces.length], properties: 1 + (index % 3), bookings: 24 + index * 9,
  revenue: 2600 + index * 870, rating: Number((4.4 + (index % 5) * 0.1).toFixed(1)),
  verification: index === 2 ? "Changes required" : index % 4 === 0 ? "Under review" : "Approved",
  status: index === 7 ? "Suspended" : "Active",
}));

const bookingStatuses: BookingStatus[] = ["New request", "Pending", "Confirmed", "Checked in", "Completed", "Cancelled", "Declined", "No-show"];
const rooms = ["Lotus King", "Garden Twin", "River View", "Family Khmer House", "Pine Cabin", "Courtyard Suite"];
export const bookings: Booking[] = Array.from({ length: 48 }, (_, index) => {
  const property = properties[index % properties.length];
  const day = 5 + (index % 24);
  return {
    id: `KST-${String(260900 + index)}`, guest: travelers[index % travelers.length].name, property: property.name,
    room: rooms[index % rooms.length], checkIn: `2026-09-${String(day).padStart(2, "0")}`,
    checkOut: `2026-09-${String(Math.min(day + 2 + (index % 3), 30)).padStart(2, "0")}`,
    guests: 1 + (index % 4), total: 72 + (index % 8) * 29,
    payment: index % 9 === 0 ? "Refunded · demo" : index % 5 === 0 ? "Pending · demo" : "Paid · demo",
    status: bookingStatuses[index % bookingStatuses.length], owner: property.owner,
  };
});

export const monthlyAnalytics = [
  { month: "Apr", revenue: 12420, bookings: 84, commission: 1863 },
  { month: "May", revenue: 14880, bookings: 96, commission: 2232 },
  { month: "Jun", revenue: 13920, bookings: 91, commission: 2088 },
  { month: "Jul", revenue: 17640, bookings: 112, commission: 2646 },
  { month: "Aug", revenue: 19380, bookings: 127, commission: 2907 },
  { month: "Sep", revenue: 21860, bookings: 143, commission: 3279 },
];

export const reviews = [
  { id: "RV-108", guest: "Sreyneang Sok", property: properties[0].name, rating: 5, date: "Sep 3", text: "A calm courtyard, thoughtful breakfast, and kind local recommendations.", response: "Thank you for staying with our family." },
  { id: "RV-107", guest: "Piseth Chan", property: properties[1].name, rating: 4, date: "Sep 2", text: "Peaceful river view and a very comfortable room.", response: "" },
  { id: "RV-106", guest: "Davy Touch", property: properties[4].name, rating: 5, date: "Aug 30", text: "The pine forest mornings were unforgettable.", response: "We hope to welcome you again." },
  { id: "RV-105", guest: "Ratha Kim", property: properties[2].name, rating: 3, date: "Aug 29", text: "Lovely place; check-in instructions could be clearer.", response: "" },
];

export const notifications = [
  { id: "n1", role: "owner", title: "New booking request", detail: "Sreyneang requested Lotus King for Sep 12–14.", time: "8 min", category: "Booking" },
  { id: "n2", role: "owner", title: "Upcoming arrival", detail: "Piseth arrives tomorrow at Kampot Riverstone.", time: "1 hr", category: "Arrival" },
  { id: "n3", role: "owner", title: "New guest message", detail: "A guest asked about airport transfer options.", time: "2 hr", category: "Message" },
  { id: "n4", role: "admin", title: "Owner verification submitted", detail: "Sovannary Em submitted business documents.", time: "12 min", category: "Verification" },
  { id: "n5", role: "admin", title: "Property awaiting review", detail: "Koh Rong Palm Cove Stay is ready for moderation.", time: "42 min", category: "Property" },
  { id: "n6", role: "admin", title: "Refund request", detail: "KST-260909 requires an administrator decision.", time: "1 hr", category: "Finance" },
];

export const conversations = [
  { id: "c1", guest: "Sreyneang Sok", booking: "KST-260900", preview: "Could we arrive around 8 pm?", unread: 2, time: "10:24" },
  { id: "c2", guest: "Piseth Chan", booking: "KST-260904", preview: "Thank you for the directions.", unread: 0, time: "Yesterday" },
  { id: "c3", guest: "Ratha Kim", booking: "KST-260912", preview: "Is breakfast vegetarian-friendly?", unread: 1, time: "Mon" },
];

export const supportTickets = [
  { id: "SUP-284", subject: "Unable to update guest count", user: "Sreypov Nhem", type: "Traveler", priority: "High", status: "Open", assignee: "Chenda" },
  { id: "SUP-283", subject: "Property photo guidance", user: "Dara Lim", type: "Owner", priority: "Normal", status: "Pending", assignee: "Vannak" },
  { id: "SUP-282", subject: "Cancellation policy question", user: "Mony Roth", type: "Traveler", priority: "Normal", status: "Resolved", assignee: "Sophea" },
];

export const promotions = [
  { id: "PR-12", name: "Pchum Ben stays", code: "PCHUM15", value: "15%", dates: "Sep 18–Oct 3", usage: "42 / 150", status: "Active" },
  { id: "PR-11", name: "Kampot weekday escape", code: "RIVER10", value: "$10", dates: "Sep 1–30", usage: "18 / 80", status: "Active" },
  { id: "PR-10", name: "Green season", code: "GREEN20", value: "20%", dates: "Jun 1–Aug 31", usage: "120 / 120", status: "Inactive" },
];

export const auditLogs = [
  { time: "Sep 4 · 10:42", admin: "Maly Vong", action: "Approved property", resource: "KS-P006", previous: "Review pending", next: "Published", ip: "203.189.140.24" },
  { time: "Sep 4 · 09:18", admin: "Maly Vong", action: "Requested changes", resource: "KS-O003", previous: "Submitted", next: "Changes required", ip: "103.9.188.41" },
  { time: "Sep 3 · 16:05", admin: "Sokha Mey", action: "Resolved ticket", resource: "SUP-282", previous: "Pending", next: "Resolved", ip: "175.100.32.18" },
];

export const financeRows = bookings.slice(0, 12).map((booking, index) => ({
  id: `TXN-${260800 + index}`, booking: booking.id, owner: booking.owner, amount: booking.total,
  commission: Number((booking.total * 0.15).toFixed(2)), status: index % 7 === 0 ? "Pending" : index % 11 === 0 ? "Failed" : "Completed",
  date: booking.checkIn,
}));

export const DEMO_RATE = 4100;
export function formatMoney(amount: number, currency: "USD" | "KHR", customRate?: number) {
  let rate = customRate;
  if (!rate) {
    try {
      rate = useAppStore.getState().exchangeRate;
    } catch {
      rate = DEMO_RATE;
    }
  }
  if (!rate || rate <= 0) rate = DEMO_RATE;

  if (currency === "USD") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
    }).format(amount);
  }
  const khr = Math.round((amount * rate) / 100) * 100;
  return `${new Intl.NumberFormat("km-KH", { maximumFractionDigits: 0 }).format(khr)}៛`;
}
