import type { Metadata } from "next";
import { UnauthorizedScreen } from "@/src/features/auth/unauthorized-screen";

export const metadata: Metadata = { title: "Unauthorized" };
export default function UnauthorizedPage() { return <UnauthorizedScreen/>; }
