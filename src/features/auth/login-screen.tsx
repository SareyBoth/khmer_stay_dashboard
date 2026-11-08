"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { Brand } from "@/src/components/brand/brand";
import { en } from "@/src/locales/en";
import { km } from "@/src/locales/km";
import { type DemoRole, useAppStore } from "@/src/stores/app-store";
import { authenticateDemo, demoAccounts as accounts } from "@/src/lib/auth";
import { ApiError, api, json } from "@/src/lib/api";
import { Button } from "@/src/components/shared/ui";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";

export function LoginScreen() {
  const router = useRouter();
  const language = useAppStore((state) => state.language);
  const setLanguage = useAppStore((state) => state.setLanguage);
  const login = useAppStore((state) => state.login);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const copy = language === "km" ? km : en;
  const isKhmer = language === "km";
  const selectedRole = useMemo<DemoRole | null>(
    () =>
      email === accounts.admin.email
        ? "admin"
        : email === accounts.owner.email
          ? "owner"
          : null,
    [email],
  );
  function fill(role: DemoRole) {
    setEmail(accounts[role].email);
    setPassword(accounts[role].password);
    setError("");
  }
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      let result: {
        token: string;
        refreshToken?: string;
        user: { id: string; email: string; name: string; role: DemoRole };
      };
      try {
        result = await api("/auth/login", json("POST", { email, password }));
      } catch (cause) {
        const demoRole = authenticateDemo(email, password);
        if (!(cause instanceof ApiError) || cause.status !== 0 || !demoRole)
          throw cause;
        result = {
          token: "demo-local",
          refreshToken: "demo-refresh-local",
          user: {
            id: `${demoRole}-local`,
            email,
            name: demoRole === "admin" ? "Maly Vong" : "Sokha Chea",
            role: demoRole,
          },
        };
        toast.info(
          isKhmer
            ? "API មិនអាចភ្ជាប់បាន — កំពុងប្រើទិន្នន័យសាកល្បង"
            : "API unavailable — using the offline demo",
        );
      }
      if (result.user.role !== "owner" && result.user.role !== "admin")
        throw new Error("This account cannot use the web portal");
      login({
        role: result.user.role,
        email: result.user.email,
        token: result.token,
        refreshToken: result.refreshToken,
        userId: result.user.id,
        name: result.user.name,
      });
      toast.success(
        isKhmer ? "ចូលប្រើប្រាស់បានជោគជ័យ" : "Signed in successfully",
      );
      router.push(`/${result.user.role}`);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not sign in");
      setBusy(false);
    }
  }
  return (
    <main className="min-h-screen lg:grid lg:grid-cols-[minmax(360px,0.86fr)_1.14fr]">
      <section className="relative flex min-h-[42vh] flex-col bg-[#2b2118] px-6 py-6 text-white sm:px-10 lg:min-h-screen lg:px-14 lg:py-10">
        <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute -right-24 -top-24 size-80 rounded-full border border-[#d7b77a]/20" />
          <div className="absolute -right-4 top-20 size-48 rounded-t-full border-x border-t border-[#d7b77a]/15" />
          <div
            className="absolute bottom-0 left-0 h-36 w-full opacity-[0.08]"
            style={{
              backgroundImage:
                "linear-gradient(30deg, #d7b77a 12%, transparent 12.5%, transparent 87%, #d7b77a 87.5%), linear-gradient(150deg, #d7b77a 12%, transparent 12.5%, transparent 87%, #d7b77a 87.5%)",
              backgroundSize: "48px 84px",
            }}
          />
        </div>
        <div className="relative z-10 flex items-center justify-between">
          <Brand inverse />
          <Button
            variant="ghost"
            type="button"
            onClick={() => setLanguage(language === "km" ? "en" : "km")}
            className="min-h-11 rounded-xl border border-white/15 bg-white/5 px-4 text-sm font-semibold text-white/85 transition hover:bg-white/10"
          >
            {language === "km" ? "EN" : "ខ្មែរ"}
          </Button>
        </div>
        <div className="relative z-10 my-auto max-w-xl py-16 lg:py-20">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#d7b77a]/25 bg-[#d7b77a]/10 px-3 py-1.5 text-sm font-semibold text-[#f0d59c]">
            <Sparkles className="size-4" /> {copy.login.eyebrow}
          </span>
          <h1
            className={`max-w-lg text-4xl font-extrabold leading-[1.15] tracking-[-0.045em] sm:text-5xl lg:text-[3.7rem] ${isKhmer ? "khmer tracking-[-0.02em]" : ""}`}
          >
            {isKhmer
              ? "បង្កើតបទពិសោធន៍ស្នាក់នៅដែលគួរឱ្យចងចាំ"
              : "Create stays worth remembering"}
          </h1>
          <p
            className={`mt-6 max-w-lg text-lg leading-8 text-white/65 ${isKhmer ? "khmer" : ""}`}
          >
            {copy.login.subtitle}
          </p>
          <div className="mt-12 grid gap-3 text-sm text-white/75 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <ShieldCheck className="size-5 text-[#e2c487]" />
              <span>
                {isKhmer
                  ? "ទិន្នន័យនៅលើម៉ាស៊ីនមូលដ្ឋាន"
                  : "Data stored on your local server"}
              </span>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <LockKeyhole className="size-5 text-[#e2c487]" />
              <span>
                {isKhmer
                  ? "រួចរាល់សម្រាប់ការទូទាត់ Bakong"
                  : "Bakong payment ready"}
              </span>
            </div>
          </div>
        </div>
        <p className="relative z-10 hidden text-xs text-white/40 lg:block">
          © 2026 KhmerStay · School project
        </p>
      </section>
      <section className="flex min-h-screen items-center justify-center px-5 py-12 sm:px-10 lg:px-14">
        <div className="w-full max-w-[500px]">
          <div className="mb-8">
            <p className="mb-2 text-sm font-bold uppercase tracking-[0.16em] text-[#a97936]">
              {copy.login.eyebrow}
            </p>
            <h2
              className={`text-3xl font-extrabold tracking-[-0.04em] text-[#2b2118] sm:text-4xl ${isKhmer ? "khmer tracking-[-0.02em]" : ""}`}
            >
              {copy.login.title}
            </h2>
          </div>
          <form
            onSubmit={submit}
            className="rounded-[22px] border border-[#e3d5bd] bg-[#fffdf8] p-5 shadow-[0_22px_65px_rgba(70,50,28,0.10)] sm:p-8"
            noValidate
          >
            <div className="space-y-5">
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-[#3b332d]">
                  {copy.login.email}
                </span>
                <Input
                  required
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="name@khmerstay.demo"
                  className="min-h-12 w-full rounded-xl border border-[#d8cbb8] bg-white px-4 text-base text-[#2b2118] placeholder:text-[#9b938a] focus:border-[#b88a44]"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-[#3b332d]">
                  {copy.login.password}
                </span>
                <span className="relative block">
                  <Input
                    required
                    minLength={8}
                    type={visible ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="••••••••"
                    className="min-h-12 w-full rounded-xl border border-[#d8cbb8] bg-white px-4 pr-12 text-base text-[#2b2118] placeholder:text-[#9b938a] focus:border-[#b88a44]"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    type="button"
                    onClick={() => setVisible((value) => !value)}
                    className="absolute right-1.5 top-1.5 grid size-9 place-items-center rounded-lg text-[#756d66] hover:bg-[#f4ead6]"
                    aria-label={visible ? "Hide password" : "Show password"}
                  >
                    {visible ? (
                      <EyeOff className="size-5" />
                    ) : (
                      <Eye className="size-5" />
                    )}
                  </Button>
                </span>
              </label>
            </div>
            <div className="my-5 flex flex-wrap items-center justify-between gap-3 text-sm">
              <label className="flex min-h-11 cursor-pointer items-center gap-2 text-[#4f463e]">
                <Checkbox
                  checked={remember}
                  onCheckedChange={(checked) => setRemember(checked === true)}
                  className="size-4 accent-[#9d7134]"
                />
                {copy.login.remember}
              </label>
              <Link
                href="/forgot-password"
                className="font-bold text-[#8e652c] hover:underline"
              >
                {copy.login.forgot}
              </Link>
            </div>
            {error && (
              <div
                role="alert"
                className="mb-5 rounded-xl border border-[#ddb4ac] bg-[#fff4f1] px-4 py-3 text-sm font-medium text-[#994444]"
              >
                {error}
              </div>
            )}
            <Button
              type="submit"
              disabled={busy}
              className="min-h-12 w-full rounded-xl bg-[#2b2118] px-5 font-bold text-white transition hover:bg-[#443327] disabled:cursor-wait disabled:opacity-60"
            >
              {busy
                ? isKhmer
                  ? "កំពុងចូល..."
                  : "Signing in…"
                : copy.login.signIn}
            </Button>
            <div className="my-6 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.14em] text-[#91877e] before:h-px before:flex-1 before:bg-[#e8dcc7] after:h-px after:flex-1 after:bg-[#e8dcc7]">
              {copy.login.demoAccounts}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {(["admin", "owner"] as DemoRole[]).map((role) => (
                <Button
                  variant="secondary"
                  type="button"
                  key={role}
                  onClick={() => fill(role)}
                  className={`min-h-[72px] rounded-xl border p-3 text-left transition ${selectedRole === role ? "border-[#b88a44] bg-[#f8efdf] shadow-[0_0_0_3px_rgba(184,138,68,.12)]" : "border-[#e1d6c5] bg-white hover:border-[#c9ae7e] hover:bg-[#fdf9f2]"}`}
                >
                  <span className="flex items-center gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#f2e7d3] text-[#8e652c]">
                      {role === "admin" ? (
                        <ShieldCheck className="size-5" />
                      ) : (
                        <UserRound className="size-5" />
                      )}
                    </span>
                    <span>
                      <span className="block text-sm font-extrabold text-[#2b2118]">
                        {copy.login[role]}
                      </span>
                      <span className="mt-0.5 block text-xs text-[#756d66]">
                        {role === "admin"
                          ? copy.login.adminHint
                          : copy.login.ownerHint}
                      </span>
                    </span>
                  </span>
                </Button>
              ))}
            </div>
          </form>
          <p className="mt-5 text-center text-xs font-medium text-[#756d66]">
            {copy.login.demoNotice}
          </p>
        </div>
      </section>
    </main>
  );
}
