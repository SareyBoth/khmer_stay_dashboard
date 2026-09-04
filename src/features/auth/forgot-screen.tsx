"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Mail } from "lucide-react";
import { Brand } from "@/src/components/brand/brand";
import { Button } from "@/src/components/shared/ui";

export function ForgotScreen() {
  const [sent, setSent] = useState(false);
  return <main className="grid min-h-screen place-items-center px-5 py-12"><div className="w-full max-w-md"><div className="mb-8 text-center"><Brand href="/login"/></div><section className="rounded-[22px] border border-[#e0d4c2] bg-[#fffdf8] p-6 shadow-[0_22px_65px_rgba(70,50,28,.1)] sm:p-8">{sent ? <div className="text-center"><span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#e8f2ea] text-[#3c7a57]"><CheckCircle2 className="size-7"/></span><h1 className="mt-5 text-2xl font-extrabold">Check the demo inbox</h1><p className="mt-3 text-sm leading-6 text-[#756d66]">No email was sent. In a real product, password-reset instructions would appear here.</p><Link href="/login" className="mt-6 block"><Button className="w-full"><ArrowLeft className="size-4"/>Return to sign in</Button></Link></div> : <><span className="grid size-12 place-items-center rounded-2xl bg-[#f1e7d6] text-[#94682e]"><Mail className="size-6"/></span><h1 className="mt-5 text-2xl font-extrabold">Reset your demo password</h1><p className="mt-2 text-sm leading-6 text-[#756d66]">Enter your demo email to preview the recovery flow.</p><label className="mt-6 block"><span className="mb-2 block text-sm font-bold">Email address</span><input type="email" className="form-input" placeholder="name@khmerstay.demo"/></label><Button className="mt-4 w-full" onClick={() => setSent(true)}>Send demo instructions</Button><Link href="/login" className="mt-4 flex min-h-11 items-center justify-center gap-2 text-sm font-bold text-[#8e652c]"><ArrowLeft className="size-4"/>Back to sign in</Link></>}</section></div></main>;
}
