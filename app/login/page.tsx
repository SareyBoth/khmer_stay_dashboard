import type { Metadata } from "next";
import { LoginScreen } from "@/src/features/auth/login-screen";

export const metadata: Metadata = { title: "Sign in" };
export default function LoginPage() { return <LoginScreen />; }
