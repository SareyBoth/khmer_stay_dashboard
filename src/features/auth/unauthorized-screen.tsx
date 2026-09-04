"use client";

import Link from "next/link";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { Brand } from "@/src/components/brand/brand";
import { Button } from "@/src/components/shared/ui";
import { useAppStore } from "@/src/stores/app-store";

export function UnauthorizedScreen() {
  const session = useAppStore((state) => state.session);
  const destination = session ? `/${session.role}` : "/login";
  return <main className="grid min-h-screen place-items-center px-5 py-12"><section className="w-full max-w-lg rounded-[24px] border border-[#e0d4c2] bg-[#fffdf8] p-7 text-center shadow-[0_22px_65px_rgba(70,50,28,.1)] sm:p-10"><Brand href={destination}/><span className="mx-auto mt-8 grid size-16 place-items-center rounded-2xl bg-[#fae9e6] text-[#a64c4c]"><ShieldAlert className="size-8"/></span><h1 className="mt-5 text-3xl font-extrabold tracking-[-.035em]">This portal belongs to another demo role</h1><p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#756d66]">Owner and administrator workspaces stay separate. Return to your current portal or sign in with a different demo account.</p><div className="mt-7 flex flex-col justify-center gap-2 sm:flex-row"><Link href={destination}><Button><ArrowLeft className="size-4"/>Return to {session?.role || "sign in"}</Button></Link><Link href="/login"><Button variant="secondary">Choose another account</Button></Link></div><p className="mt-6 text-xs text-[#8a8077]">Client-side demo guard only — this is not real application security.</p></section></main>;
}
