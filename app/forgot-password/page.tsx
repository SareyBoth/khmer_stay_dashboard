import type { Metadata } from "next";
import { ForgotScreen } from "@/src/features/auth/forgot-screen";

export const metadata: Metadata = { title: "Forgot password" };
export default function ForgotPasswordPage() { return <ForgotScreen/>; }
