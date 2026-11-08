import type { Metadata } from "next";
import { PortalApp } from "@/src/components/layout/portal-app";

export const metadata: Metadata = { title: "Owner Portal" };

export default function OwnerPage() {
  return <PortalApp portal="owner" />;
}
