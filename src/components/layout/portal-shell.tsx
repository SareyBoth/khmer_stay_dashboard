"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import * as Tooltip from "@radix-ui/react-tooltip";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, ChevronDown, ChevronsLeft, ChevronsRight, Menu, Search, X } from "lucide-react";
import { toast } from "sonner";
import { Brand } from "@/src/components/brand/brand";
import { Button, cn, LoadingScreen, StatusBadge } from "@/src/components/shared/ui";
import { adminNavigation, isActivePath, ownerNavigation } from "@/src/lib/portal-config";
import { notifications, properties } from "@/src/lib/mock-data";
import { type DemoRole, useAppStore } from "@/src/stores/app-store";
import { useDemoStore } from "@/src/stores/demo-store";
import { WebMcpTools } from "@/src/components/shared/webmcp-tools";
import { canAccessPortal } from "@/src/lib/auth";

export function PortalShell({ portal, children }: { portal: DemoRole; children: ReactNode }) {
  const router = useRouter(); const pathname = usePathname();
  const session = useAppStore((state) => state.session); const logout = useAppStore((state) => state.logout);
  const language = useAppStore((state) => state.language); const setLanguage = useAppStore((state) => state.setLanguage);
  const currency = useAppStore((state) => state.currency); const setCurrency = useAppStore((state) => state.setCurrency);
  const collapsed = useAppStore((state) => state.sidebarCollapsed); const toggleSidebar = useAppStore((state) => state.toggleSidebar);
  const notificationsRead = useAppStore((state) => state.notificationsRead); const markRead = useAppStore((state) => state.markNotificationRead);
  const resetApp = useAppStore((state) => state.resetDemo); const resetRecords = useDemoStore((state) => state.reset);
  const [hydrated, setHydrated] = useState(false); const [mobileOpen, setMobileOpen] = useState(false); const [search, setSearch] = useState(""); const [switchingRole, setSwitchingRole] = useState(false);
  const navigation = portal === "owner" ? ownerNavigation : adminNavigation;
  const roleNotifications = notifications.filter((item) => item.role === portal);
  const unread = roleNotifications.filter((item) => !notificationsRead.includes(item.id)).length;

  useEffect(() => {
    const finish = () => setHydrated(true);
    if (useAppStore.persist.hasHydrated()) finish();
    const offFinish = useAppStore.persist.onFinishHydration(finish);
    return offFinish;
  }, []);

  useEffect(() => {
    if (!hydrated || switchingRole) return;
    if (!session) router.replace("/login");
    else if (!canAccessPortal(session.role, portal)) router.replace("/unauthorized");
  }, [hydrated, portal, router, session, switchingRole]);

  const searchResults = useMemo(() => {
    if (search.trim().length < 2) return [];
    const query = search.toLowerCase();
    const navResults = navigation.filter((item) => `${item.label} ${item.labelKm}`.toLowerCase().includes(query)).map((item) => ({ label: item.label, sub: item.labelKm, href: item.href }));
    const propertyResults = properties.filter((item) => `${item.name} ${item.province}`.toLowerCase().includes(query)).slice(0, 3).map((item) => ({ label: item.name, sub: item.province, href: `/${portal}/properties/${item.id}` }));
    return [...navResults, ...propertyResults].slice(0, 6);
  }, [navigation, portal, search]);

  if (!hydrated || !session || session.role !== portal) return <LoadingScreen />;

  const portalLabel = language === "km" ? (portal === "owner" ? "ផ្នែកម្ចាស់ផ្ទះ" : "ផ្នែកអ្នកគ្រប់គ្រង") : (portal === "owner" ? "Owner Portal" : "Admin Portal");
  const userName = portal === "owner" ? "Sokha Chea" : "Maly Vong";

  function handleLogout() { logout(); toast.success(language === "km" ? "បានចាកចេញពីគណនី" : "Signed out"); router.push("/login"); }
  function switchRole() { const next = portal === "owner" ? "admin" : "owner"; setSwitchingRole(true); useAppStore.getState().login(next, next === "admin" ? "admin@khmerstay.demo" : "owner@khmerstay.demo"); router.push(`/${next}`); toast.success(`Switched to ${next} demo`); }
  function resetAll() { resetRecords(); resetApp(); router.push("/login"); toast.success("Demo data reset"); }

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className={cn("flex h-[76px] items-center border-b border-white/10 px-4", collapsed ? "justify-center" : "justify-between")}>
        <Brand compact={collapsed} inverse href={`/${portal}`} />
        {!collapsed && <button onClick={() => setMobileOpen(false)} className="grid size-10 place-items-center rounded-xl text-white/60 hover:bg-white/10 lg:hidden" aria-label="Close navigation"><X className="size-5" /></button>}
      </div>
      {!collapsed && <div className="mx-4 mt-4 flex items-center gap-2 rounded-xl border border-[#d7b77a]/15 bg-[#d7b77a]/10 px-3 py-2 text-xs font-extrabold uppercase tracking-[0.13em] text-[#ead09a]"><span className="size-1.5 rounded-full bg-[#d7b77a]" />{portalLabel}</div>}
      <nav className="scrollbar-thin flex-1 overflow-y-auto px-3 py-4" aria-label={`${portalLabel} navigation`}>
        {navigation.map((item, index) => {
          const previousSection = index > 0 ? navigation[index - 1].section : undefined;
          const showSection = item.section && item.section !== previousSection;
          const active = isActivePath(pathname, item.href); const Icon = item.icon;
          const navLink = <Link href={item.href} onClick={() => setMobileOpen(false)} aria-current={active ? "page" : undefined} className={cn("group flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition", active ? "bg-[#d7b77a] text-[#2b2118] shadow-[0_8px_20px_rgba(0,0,0,.15)]" : "text-white/67 hover:bg-white/[0.07] hover:text-white", collapsed && "justify-center px-0")}><Icon className="size-[18px] shrink-0" /><span className={cn("truncate", collapsed && "sr-only")}>{language === "km" ? item.labelKm : item.label}</span></Link>;
          return <div key={item.href}>{showSection && !collapsed && <p className="mb-2 mt-5 px-3 text-[0.68rem] font-extrabold uppercase tracking-[0.15em] text-white/32">{item.section}</p>}{collapsed ? <Tooltip.Provider delayDuration={200}><Tooltip.Root><Tooltip.Trigger asChild>{navLink}</Tooltip.Trigger><Tooltip.Portal><Tooltip.Content side="right" className="z-50 rounded-lg bg-[#2b2118] px-3 py-2 text-xs font-bold text-white shadow-xl">{item.label}<Tooltip.Arrow className="fill-[#2b2118]" /></Tooltip.Content></Tooltip.Portal></Tooltip.Root></Tooltip.Provider> : navLink}</div>;
        })}
      </nav>
      <div className="border-t border-white/10 p-3">
        {!collapsed && <div className="mb-2 rounded-xl bg-white/[0.055] px-3 py-2.5"><p className="text-xs font-bold text-[#e4c789]">Demo workspace</p><p className="mt-0.5 text-[0.7rem] leading-4 text-white/40">Local data · no real transactions</p></div>}
        <button onClick={toggleSidebar} className="hidden min-h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold text-white/55 hover:bg-white/[0.07] hover:text-white lg:flex" aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>{collapsed ? <ChevronsRight className="size-4" /> : <><ChevronsLeft className="size-4" /><span>Collapse</span></>}</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#fbf7ef]">
      <WebMcpTools portal={portal} />
      <aside className={cn("fixed inset-y-0 left-0 z-40 hidden bg-[#2b2118] transition-[width] duration-200 lg:block", collapsed ? "w-[76px]" : "w-[248px]")}>{sidebar}</aside>
      {mobileOpen && <><button aria-label="Close navigation" className="fixed inset-0 z-40 bg-black/45 backdrop-blur-[1px] lg:hidden" onClick={() => setMobileOpen(false)} /><aside className="fixed inset-y-0 left-0 z-50 w-[284px] bg-[#2b2118] shadow-2xl lg:hidden">{sidebar}</aside></>}
      <div className={cn("transition-[padding] duration-200", collapsed ? "lg:pl-[76px]" : "lg:pl-[248px]")}>
        <header className="sticky top-0 z-30 flex h-[76px] items-center gap-3 border-b border-[#e4d8c6] bg-[#fffdf8]/92 px-4 backdrop-blur-xl sm:px-6 xl:px-8">
          <Button variant="ghost" size="icon" className="shrink-0 lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><Menu className="size-5" /></Button>
          <div className="relative max-w-lg flex-1">
            <Search className="pointer-events-none absolute left-3 top-3.5 size-4 text-[#877d74]" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={language === "km" ? "ស្វែងរកកន្លែង ការកក់ ឬទំព័រ..." : "Search stays, bookings or pages…"} aria-label="Global search" className="min-h-11 w-full rounded-xl border border-transparent bg-[#f4eee4] pl-10 pr-4 text-sm text-[#3d342c] transition focus:border-[#c7aa76] focus:bg-white" />
            {searchResults.length > 0 && <div className="absolute left-0 right-0 top-[50px] z-50 overflow-hidden rounded-xl border border-[#dfd2bf] bg-white p-1.5 shadow-xl">{searchResults.map((result) => <Link key={`${result.href}-${result.label}`} href={result.href} onClick={() => setSearch("")} className="block rounded-lg px-3 py-2.5 hover:bg-[#f7f0e4]"><span className="block text-sm font-bold">{result.label}</span><span className="block text-xs text-[#7a7067]">{result.sub}</span></Link>)}</div>}
          </div>
          <select value={language} onChange={(event) => setLanguage(event.target.value as "km" | "en")} aria-label="Language" className="hidden min-h-11 rounded-xl border border-[#ded2c0] bg-white px-3 text-sm font-bold text-[#554a41] sm:block"><option value="km">ខ្មែរ</option><option value="en">English</option></select>
          <select value={currency} onChange={(event) => setCurrency(event.target.value as "USD" | "KHR")} aria-label="Currency" className="hidden min-h-11 rounded-xl border border-[#ded2c0] bg-white px-3 text-sm font-bold text-[#554a41] md:block"><option>USD</option><option>KHR</option></select>
          <DropdownMenu.Root><DropdownMenu.Trigger asChild><Button variant="ghost" size="icon" className="relative" aria-label={`${unread} unread notifications`}><Bell className="size-5" />{unread > 0 && <span className="absolute right-1.5 top-1.5 grid size-4 place-items-center rounded-full bg-[#b85656] text-[0.62rem] font-extrabold text-white">{unread}</span>}</Button></DropdownMenu.Trigger><DropdownMenu.Portal><DropdownMenu.Content align="end" sideOffset={8} className="z-50 w-[min(360px,calc(100vw-24px))] rounded-2xl border border-[#dfd2bf] bg-[#fffdf8] p-2 shadow-2xl"><div className="flex items-center justify-between px-2 py-2"><p className="font-extrabold">Notifications</p><Link href={`/${portal}/notifications`} className="text-xs font-bold text-[#8e652c]">View all</Link></div>{roleNotifications.map((item) => <DropdownMenu.Item key={item.id} onSelect={() => markRead(item.id)} className="cursor-pointer rounded-xl px-3 py-2.5 outline-none hover:bg-[#f5eee3]"><div className="flex gap-3"><span className={cn("mt-1 size-2 shrink-0 rounded-full", notificationsRead.includes(item.id) ? "bg-[#d6ccc0]" : "bg-[#b88a44]")} /><div><p className="text-sm font-extrabold">{item.title}</p><p className="mt-0.5 text-xs leading-5 text-[#756d66]">{item.detail}</p></div></div></DropdownMenu.Item>)}</DropdownMenu.Content></DropdownMenu.Portal></DropdownMenu.Root>
          <DropdownMenu.Root><DropdownMenu.Trigger asChild><button className="flex min-h-11 items-center gap-2 rounded-xl p-1.5 pr-2 hover:bg-[#f2eadf]"><span className="grid size-8 place-items-center rounded-lg bg-[#2b2118] text-xs font-extrabold text-[#efd59e]">{userName.split(" ").map((part) => part[0]).join("")}</span><span className="hidden text-left xl:block"><span className="block text-xs font-extrabold text-[#332920]">{userName}</span><span className="block text-[0.68rem] text-[#80766d]">{portal === "owner" ? "Property owner" : "Administrator"}</span></span><ChevronDown className="size-4 text-[#7a7067]" /></button></DropdownMenu.Trigger><DropdownMenu.Portal><DropdownMenu.Content align="end" sideOffset={8} className="z-50 min-w-56 rounded-xl border border-[#dfd2bf] bg-white p-1.5 shadow-xl"><DropdownMenu.Label className="px-3 py-2"><p className="text-sm font-extrabold">{session.email}</p><div className="mt-1"><StatusBadge status="Demo mode" /></div></DropdownMenu.Label><DropdownMenu.Separator className="my-1 h-px bg-[#eee4d6]" /><DropdownMenu.Item onSelect={() => router.push(`/${portal}/account`)} className="cursor-pointer rounded-lg px-3 py-2 text-sm font-semibold outline-none hover:bg-[#f6efe5]">Account settings</DropdownMenu.Item><DropdownMenu.Item onSelect={switchRole} className="cursor-pointer rounded-lg px-3 py-2 text-sm font-semibold outline-none hover:bg-[#f6efe5]">Switch demo role</DropdownMenu.Item><DropdownMenu.Item onSelect={resetAll} className="cursor-pointer rounded-lg px-3 py-2 text-sm font-semibold text-[#9c4949] outline-none hover:bg-[#fbecea]">Reset demo data</DropdownMenu.Item><DropdownMenu.Item onSelect={handleLogout} className="cursor-pointer rounded-lg px-3 py-2 text-sm font-semibold outline-none hover:bg-[#f6efe5]">Sign out</DropdownMenu.Item></DropdownMenu.Content></DropdownMenu.Portal></DropdownMenu.Root>
        </header>
        <main className="mx-auto w-full max-w-[1560px] p-4 sm:p-6 xl:p-8">{children}</main>
      </div>
    </div>
  );
}
