import type { LucideIcon } from "lucide-react";
import {
  BadgeDollarSign, Banknote, BookOpenCheck, Building2, CalendarDays, CircleDollarSign, ClipboardCheck,
  FileText, Gauge, Headphones, Landmark, LayoutDashboard, ListChecks, Megaphone, MessageCircle, NotebookTabs,
  Percent, Settings, ShieldCheck, Star, Tags, UserRoundCheck, UsersRound, WalletCards,
} from "lucide-react";

export type NavItem = { href: string; label: string; labelKm: string; icon: LucideIcon; section?: string };

export const ownerNavigation: NavItem[] = [
  { href: "/owner", label: "Dashboard", labelKm: "ទិដ្ឋភាពទូទៅ", icon: LayoutDashboard },
  { href: "/owner/properties", label: "Properties", labelKm: "កន្លែងស្នាក់", icon: Building2 },
  { href: "/owner/bookings", label: "Bookings", labelKm: "ការកក់", icon: BookOpenCheck },
  { href: "/owner/calendar", label: "Calendar", labelKm: "ប្រតិទិន", icon: CalendarDays },
  { href: "/owner/pricing", label: "Pricing", labelKm: "តម្លៃ", icon: Tags },
  { href: "/owner/earnings", label: "Earnings", labelKm: "ចំណូល", icon: CircleDollarSign },
  { href: "/owner/payouts", label: "Payouts", labelKm: "ការបើកប្រាក់", icon: WalletCards, section: "Finance" },
  { href: "/owner/messages", label: "Messages", labelKm: "សារ", icon: MessageCircle, section: "Guests" },
  { href: "/owner/reviews", label: "Reviews", labelKm: "មតិវាយតម្លៃ", icon: Star },
  { href: "/owner/analytics", label: "Analytics", labelKm: "របាយការណ៍", icon: Gauge },
  { href: "/owner/verification", label: "Verification", labelKm: "ការផ្ទៀងផ្ទាត់", icon: ClipboardCheck, section: "Account" },
  { href: "/owner/account", label: "Account", labelKm: "គណនី", icon: Settings },
];

export const adminNavigation: NavItem[] = [
  { href: "/admin", label: "Overview", labelKm: "ទិដ្ឋភាពទូទៅ", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", labelKm: "អ្នកប្រើប្រាស់", icon: UsersRound },
  { href: "/admin/owners", label: "Owners", labelKm: "ម្ចាស់ផ្ទះ", icon: UserRoundCheck },
  { href: "/admin/verifications", label: "Verifications", labelKm: "ការផ្ទៀងផ្ទាត់", icon: ShieldCheck },
  { href: "/admin/properties", label: "Properties", labelKm: "កន្លែងស្នាក់", icon: Building2 },
  { href: "/admin/bookings", label: "Bookings", labelKm: "ការកក់", icon: BookOpenCheck },
  { href: "/admin/payments", label: "Payments", labelKm: "ការទូទាត់", icon: Banknote, section: "Finance" },
  { href: "/admin/commissions", label: "Commissions", labelKm: "កម្រៃជើងសារ", icon: Percent },
  { href: "/admin/payouts", label: "Payouts", labelKm: "ការបើកប្រាក់", icon: WalletCards },
  { href: "/admin/refunds", label: "Refunds", labelKm: "ការសងប្រាក់", icon: BadgeDollarSign },
  { href: "/admin/reviews", label: "Reviews & reports", labelKm: "មតិ និងរបាយការណ៍", icon: Star, section: "Operations" },
  { href: "/admin/promotions", label: "Promotions", labelKm: "ការផ្សព្វផ្សាយ", icon: Megaphone },
  { href: "/admin/catalog", label: "Catalog", labelKm: "កាតាឡុក", icon: NotebookTabs },
  { href: "/admin/content", label: "Content", labelKm: "មាតិកា", icon: FileText },
  { href: "/admin/support", label: "Support", labelKm: "ជំនួយ", icon: Headphones },
  { href: "/admin/audit-logs", label: "Audit logs", labelKm: "កំណត់ត្រា", icon: ListChecks, section: "System" },
  { href: "/admin/settings", label: "Settings", labelKm: "ការកំណត់", icon: Settings },
  { href: "/admin/account", label: "Account", labelKm: "គណនី", icon: Landmark },
];

export function isActivePath(pathname: string, href: string) {
  return href.endsWith("/owner") || href.endsWith("/admin") ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}
