"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Mail } from "lucide-react";
import { Brand } from "@/src/components/brand/brand";
import { api, json } from "@/src/lib/api";
import { Button } from "@/src/components/shared/ui";
import { Input } from "@/components/ui/input";

export function ForgotScreen() {
  const [step, setStep] = useState<"email" | "code" | "done">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (step === "email") {
        await api(
          "/auth/otp/request",
          json("POST", { email, purpose: "reset" }),
        );
        setStep("code");
      } else if (step === "code") {
        await api(
          "/auth/password/reset",
          json("POST", { email, code, password }),
        );
        setStep("done");
      }
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not reset password",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center px-5 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Brand href="/login" />
        </div>
        <section className="rounded-[22px] border border-[#e0d4c2] bg-[#fffdf8] p-6 shadow-[0_22px_65px_rgba(70,50,28,.1)] sm:p-8">
          {step === "done" ? (
            <div className="text-center">
              <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#e8f2ea] text-[#3c7a57]">
                <CheckCircle2 className="size-7" />
              </span>
              <h1 className="mt-5 text-2xl font-extrabold">Password updated</h1>
              <p className="mt-3 text-sm leading-6 text-[#756d66]">
                You can now sign in with your new password.
              </p>
              <Link href="/login" className="mt-6 block">
                <Button className="w-full">
                  <ArrowLeft className="size-4" />
                  Return to sign in
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={submit}>
              <span className="grid size-12 place-items-center rounded-2xl bg-[#f1e7d6] text-[#94682e]">
                <Mail className="size-6" />
              </span>
              <h1 className="mt-5 text-2xl font-extrabold">
                Reset your password
              </h1>
              <p className="mt-2 text-sm leading-6 text-[#756d66]">
                {step === "email"
                  ? "Enter your account email. We will send a one-time code."
                  : "Enter the code from your email and choose a new password."}
              </p>
              <label className="mt-6 block">
                <span className="mb-2 block text-sm font-bold">
                  Email address
                </span>
                <Input
                  required
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  readOnly={step === "code"}
                  className="form-input"
                  placeholder="name@example.com"
                />
              </label>
              {step === "code" && (
                <>
                  <label className="mt-4 block">
                    <span className="mb-2 block text-sm font-bold">
                      Six-digit code
                    </span>
                    <Input
                      required
                      inputMode="numeric"
                      maxLength={6}
                      value={code}
                      onChange={(event) => setCode(event.target.value)}
                      className="form-input"
                    />
                  </label>
                  <label className="mt-4 block">
                    <span className="mb-2 block text-sm font-bold">
                      New password
                    </span>
                    <Input
                      required
                      type="password"
                      minLength={8}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="form-input"
                    />
                  </label>
                </>
              )}
              {error && (
                <p role="alert" className="mt-4 text-sm text-red-700">
                  {error}
                </p>
              )}
              <Button disabled={busy} type="submit" className="mt-4 w-full">
                {busy
                  ? "Please wait…"
                  : step === "email"
                    ? "Send code"
                    : "Update password"}
              </Button>
              <Link
                href="/login"
                className="mt-4 flex min-h-11 items-center justify-center gap-2 text-sm font-bold text-[#8e652c]"
              >
                <ArrowLeft className="size-4" />
                Back to sign in
              </Link>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}
