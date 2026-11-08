import type { Metadata } from "next";
import { PortalApp } from "@/src/components/layout/portal-app";
import { bookings, properties } from "@/src/lib/mock-data";

export const metadata: Metadata = { title: "Owner Portal" };

const ownerRoutes = [
  ["properties"], ["properties", "new"], ["bookings"], ["calendar"], ["pricing"], ["earnings"],
  ["payouts"], ["reviews"], ["messages"], ["analytics"], ["notifications"], ["account"], ["verification"],
  ...properties.flatMap((property) => [["properties", property.id], ["properties", property.id, "edit"], ["properties", property.id, "rooms"]]),
  ...bookings.map((booking) => ["bookings", booking.id]),
];

export function generateStaticParams() {
  return ownerRoutes.map((slug) => ({ slug }));
}

export default async function OwnerSectionPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  return <PortalApp portal="owner" segments={slug} />;
}
