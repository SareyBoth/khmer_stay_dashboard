import type { Metadata } from "next";
import { PortalApp } from "@/src/components/layout/portal-app";
import { bookings, properties } from "@/src/lib/mock-data";

export const metadata: Metadata = { title: "Admin Portal" };

const adminRoutes = [
  [], ["users"], ["owners"], ["verifications"], ["properties"], ["bookings"], ["payments"], ["commissions"],
  ["payouts"], ["refunds"], ["reviews"], ["reports"], ["promotions"], ["catalog"], ["content"], ["support"],
  ["notifications"], ["audit-logs"], ["settings"], ["account"],
  ...properties.map((property) => ["properties", property.id]),
  ...bookings.map((booking) => ["bookings", booking.id]),
];

export function generateStaticParams() {
  return adminRoutes.map((slug) => ({ slug: slug.length ? slug : undefined }));
}

export default async function AdminPage({ params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug } = await params;
  return <PortalApp portal="admin" segments={slug} />;
}
