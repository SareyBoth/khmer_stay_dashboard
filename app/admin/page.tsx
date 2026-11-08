import type { Metadata } from "next";
import { PortalApp } from "@/src/components/layout/portal-app";

export const metadata: Metadata = { title: "Admin Portal" };

export default function AdminPage() {
  return <PortalApp portal="admin" />;
}
