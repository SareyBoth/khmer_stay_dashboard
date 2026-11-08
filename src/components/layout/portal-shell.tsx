"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  CircleDollarSign,
  Globe,
  Menu,
  Search,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Brand } from "@/src/components/brand/brand";
import {
  Button,
  cn,
  LoadingScreen,
  StatusBadge,
} from "@/src/components/shared/ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  adminNavigation,
  isActivePath,
  ownerNavigation,
} from "@/src/lib/portal-config";
import { notifications, properties } from "@/src/lib/mock-data";
import { api } from "@/src/lib/api";
import { type DemoRole, useAppStore } from "@/src/stores/app-store";
import { useDemoStore } from "@/src/stores/demo-store";
import { canAccessPortal } from "@/src/lib/auth";
import { useEventStream } from "@/src/lib/use-events";
import { useChatSocket } from "@/src/lib/use-chat-socket";

export function PortalShell({
  portal,
  children,
}: {
  portal: DemoRole;
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const session = useAppStore((state) => state.session);
  const logout = useAppStore((state) => state.logout);
  const language = useAppStore((state) => state.language);
  const setLanguage = useAppStore((state) => state.setLanguage);
  const currency = useAppStore((state) => state.currency);
  const setCurrency = useAppStore((state) => state.setCurrency);
  const collapsed = useAppStore((state) => state.sidebarCollapsed);
  const toggleSidebar = useAppStore((state) => state.toggleSidebar);
  const notificationsRead = useAppStore((state) => state.notificationsRead);
  const markRead = useAppStore((state) => state.markNotificationRead);
  const resetApp = useAppStore((state) => state.resetDemo);
  const resetRecords = useDemoStore((state) => state.reset);
  const [hydrated, setHydrated] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [switchingRole, setSwitchingRole] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
  const navigation = portal === "owner" ? ownerNavigation : adminNavigation;
  const roleNotifications = notifications.filter(
    (item) => item.role === portal,
  );
  const unread = roleNotifications.filter(
    (item) => !notificationsRead.includes(item.id),
  ).length;

  const exchangeRate = useAppStore((state) => state.exchangeRate);
  const fetchExchangeRate = useAppStore((state) => state.fetchExchangeRate);
  const unreadBookings = useAppStore((state) => state.unreadBookingsCount);
  const unreadMessages = useAppStore((state) => state.unreadMessagesCount);
  const clearUnreadBookings = useAppStore((state) => state.clearUnreadBookings);
  const clearUnreadMessages = useAppStore((state) => state.clearUnreadMessages);

  // Real-Time Server-Sent Events hook
  useEventStream();
  // Dedicated authenticated WebSocket for private chat delivery.
  useChatSocket();

  useEffect(() => {
    fetchExchangeRate();
  }, [fetchExchangeRate]);

  useEffect(() => {
    if (pathname.includes("/bookings")) {
      clearUnreadBookings();
    }
    if (pathname.includes("/messages")) {
      clearUnreadMessages();
    }
  }, [pathname, clearUnreadBookings, clearUnreadMessages]);

  useEffect(() => {
    const finish = () => setHydrated(true);
    if (useAppStore.persist.hasHydrated()) finish();
    const offFinish = useAppStore.persist.onFinishHydration(finish);
    return offFinish;
  }, []);

  useEffect(() => {
    if (!hydrated || switchingRole) return;
    if (!session?.token) {
      logout();
      router.replace("/login");
    } else if (!canAccessPortal(session.role, portal))
      router.replace("/unauthorized");
  }, [hydrated, logout, portal, router, session, switchingRole]);

  useEffect(() => {
    if (!hydrated || !session?.token || session.token === "demo-local") return;
    api("/auth/me").catch(() => {
      logout();
      router.replace("/login");
    });
  }, [hydrated, session?.token, logout, router]);

  const searchResults = useMemo(() => {
    if (search.trim().length < 2) return [];
    const query = search.toLowerCase();
    const navResults = navigation
      .filter((item) =>
        `${item.label} ${item.labelKm}`.toLowerCase().includes(query),
      )
      .map((item) => ({
        label: item.label,
        sub: item.labelKm,
        href: item.href,
      }));
    const propertyResults = properties
      .filter((item) =>
        `${item.name} ${item.province}`.toLowerCase().includes(query),
      )
      .slice(0, 3)
      .map((item) => ({
        label: item.name,
        sub: item.province,
        href: `/${portal}/properties/${item.id}`,
      }));
    return [...navResults, ...propertyResults].slice(0, 6);
  }, [navigation, portal, search]);

  if (!hydrated || !session || session.role !== portal)
    return <LoadingScreen />;

  const portalLabel =
    language === "km"
      ? portal === "owner"
        ? "ផ្នែកម្ចាស់ផ្ទះ"
        : "ផ្នែកអ្នកគ្រប់គ្រង"
      : portal === "owner"
        ? "Owner Portal"
        : "Admin Portal";
  const userName = session.name;

  function handleLogout() {
    logout();
    toast.success(language === "km" ? "បានចាកចេញពីគណនី" : "Signed out");
    router.push("/login");
  }
  function switchRole() {
    setSwitchingRole(true);
    logout();
    router.push("/login");
    toast.info("Sign in with the other account to switch roles");
  }
  function resetAll() {
    resetRecords();
    resetApp();
    router.push("/login");
    toast.success("Local app data cleared");
  }

  const sidebar = (
    <div className="flex h-full flex-col">
      <div
        className={cn(
          "flex h-[76px] items-center border-b border-white/10 px-4",
          collapsed ? "justify-center" : "justify-between",
        )}
      >
        <Brand compact={collapsed} inverse href={`/${portal}`} />
        {!collapsed && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(false)}
            className="grid size-10 place-items-center rounded-xl text-white/60 hover:bg-white/10 lg:hidden"
            aria-label="Close navigation"
          >
            <X className="size-5" />
          </Button>
        )}
      </div>
      {!collapsed && (
        <div className="mx-4 mt-4 flex items-center gap-2 rounded-xl border border-[#d7b77a]/15 bg-[#d7b77a]/10 px-3 py-2 text-xs font-extrabold uppercase tracking-[0.13em] text-[#ead09a]">
          <span className="size-1.5 rounded-full bg-[#d7b77a]" />
          {portalLabel}
        </div>
      )}
      <nav
        className="scrollbar-thin flex-1 overflow-y-auto px-3 py-4"
        aria-label={`${portalLabel} navigation`}
      >
        {navigation.map((item, index) => {
          const previousSection =
            index > 0 ? navigation[index - 1].section : undefined;
          const showSection = item.section && item.section !== previousSection;
          const active = isActivePath(pathname, item.href);
          const Icon = item.icon;
          const isBookings = item.href.endsWith("/bookings");
          const isMessages = item.href.endsWith("/messages");
          const badgeCount = isBookings
            ? unreadBookings
            : isMessages
              ? unreadMessages
              : 0;
          const navLink = (
            <Link
              href={item.href}
              onClick={() => setMobileOpen(false)}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition",
                active
                  ? "bg-[#d7b77a] text-[#2b2118] shadow-[0_8px_20px_rgba(0,0,0,.15)]"
                  : "text-white/67 hover:bg-white/[0.07] hover:text-white",
                collapsed && "justify-center px-0",
              )}
            >
              <Icon className="size-[18px] shrink-0" />
              <span className={cn("truncate", collapsed && "sr-only")}>
                {language === "km" ? item.labelKm : item.label}
              </span>
              {!collapsed && badgeCount > 0 && (
                <span
                  className={cn(
                    "ml-auto rounded-full px-2 py-0.5 text-[0.68rem] font-extrabold",
                    active
                      ? "bg-[#2b2118] text-[#d7b77a]"
                      : "bg-[#b85656] text-white",
                  )}
                >
                  {badgeCount}
                </span>
              )}
            </Link>
          );
          return (
            <div key={item.href}>
              {showSection && !collapsed && (
                <p className="mb-2 mt-5 px-3 text-[0.68rem] font-extrabold uppercase tracking-[0.15em] text-white/32">
                  {item.section}
                </p>
              )}
              {collapsed ? (
                <TooltipProvider delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger asChild>{navLink}</TooltipTrigger>
                    <TooltipContent
                      side="right"
                      className="z-50 rounded-lg bg-[#2b2118] px-3 py-2 text-xs font-bold text-white shadow-xl"
                    >
                      {item.label}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                navLink
              )}
            </div>
          );
        })}
      </nav>
      <div className="border-t border-white/10 p-3">
        {!collapsed && (
          <div className="mb-2 rounded-xl bg-white/[0.055] px-3 py-2.5">
            <p className="text-xs font-bold text-[#e4c789]">
              Local school project
            </p>
            <p className="mt-0.5 text-[0.7rem] leading-4 text-white/40">
              Records saved on the Go server
            </p>
          </div>
        )}
        <Button
          variant="ghost"
          onClick={toggleSidebar}
          className="hidden min-h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold text-white/55 hover:bg-white/[0.07] hover:text-white lg:flex"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronsRight className="size-4" />
          ) : (
            <>
              <ChevronsLeft className="size-4" />
              <span>Collapse</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#fbf7ef]">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden bg-[#2b2118] transition-[width] duration-200 lg:block",
          collapsed ? "w-[76px]" : "w-[248px]",
        )}
      >
        {sidebar}
      </aside>
      {mobileOpen && (
        <>
          <Button
            variant="ghost"
            aria-label="Close navigation"
            className="fixed inset-0 z-40 h-auto rounded-none bg-black/45 p-0 backdrop-blur-[1px] hover:bg-black/45 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-[284px] bg-[#2b2118] shadow-2xl lg:hidden">
            {sidebar}
          </aside>
        </>
      )}
      <div
        className={cn(
          "transition-[padding] duration-200",
          collapsed ? "lg:pl-[76px]" : "lg:pl-[248px]",
        )}
      >
        <header className="sticky top-0 z-30 flex h-[72px] items-center gap-3 border-b border-[#e5d9c8]/90 bg-[#fffdfa]/85 px-4 backdrop-blur-xl sm:px-6 xl:px-8 shadow-[0_2px_12px_rgba(43,33,24,0.035)]">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 lg:hidden text-[#4a3f35] hover:bg-[#f4ebe0]"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
          >
            <Menu className="size-5" />
          </Button>

          {/* Search bar with shadcn Input and shortcut badge */}
          <div className="relative max-w-md flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#8a7f74]" />
            <Input
              ref={searchInputRef}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={
                language === "km"
                  ? "ស្វែងរកកន្លែង ការកក់ ឬទំព័រ... (Ctrl+K)"
                  : "Search stays, bookings or pages… (Ctrl+K)"
              }
              aria-label="Global search"
              className="h-10 w-full rounded-full border-[#ded3c2] bg-[#f7f2ea]/75 pl-9 pr-14 text-xs font-medium text-[#2d241d] placeholder:text-[#8a7f74] transition-all focus-visible:border-[#b88a44] focus-visible:bg-white focus-visible:ring-3 focus-visible:ring-[#b88a44]/20 shadow-2xs"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {search ? (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="rounded-full p-0.5 text-[#8a7f74] hover:bg-black/5 hover:text-[#3d332a]"
                >
                  <X className="size-3.5" />
                </button>
              ) : (
                <kbd className="hidden sm:inline-flex items-center rounded border border-[#dfd3c3] bg-white px-1.5 py-0.5 text-[10px] font-semibold text-[#8a7f74] shadow-2xs">
                  ⌘K
                </kbd>
              )}
            </div>
            {searchResults.length > 0 && (
              <div className="absolute left-0 right-0 top-[46px] z-50 overflow-hidden rounded-2xl border border-[#dfd2bf] bg-white p-1.5 shadow-2xl animate-in fade-in-0 zoom-in-95">
                {searchResults.map((result) => (
                  <Link
                    key={`${result.href}-${result.label}`}
                    href={result.href}
                    onClick={() => setSearch("")}
                    className="block rounded-xl px-3 py-2.5 transition hover:bg-[#f7f0e4]"
                  >
                    <span className="block text-sm font-bold text-[#322820]">
                      {result.label}
                    </span>
                    <span className="block text-xs text-[#7a7067]">
                      {result.sub}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="ml-auto flex items-center gap-2 sm:gap-2.5">
            {/* Live NBC Exchange Rate Pill */}
            <div
              className="hidden md:inline-flex items-center gap-2 rounded-full border border-emerald-300/80 bg-emerald-50/90 px-3 py-1.5 text-xs font-bold text-emerald-900 shadow-2xs transition hover:bg-emerald-100/80"
              title="Official National Bank of Cambodia Indicative Exchange Rate"
            >
              <span className="relative flex size-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
              </span>
              <span className="tabular font-extrabold">1 USD = {exchangeRate.toLocaleString()} ៛</span>
              <span className="rounded-md bg-emerald-200/80 px-1.5 py-0.5 text-[0.62rem] font-black uppercase text-emerald-950 ring-1 ring-emerald-400/50">
                NBC
              </span>
            </div>

            {/* Language Selector using shadcn Select */}
            <div className="hidden sm:block">
              <Select
                value={language}
                onValueChange={(val) => setLanguage(val as "km" | "en")}
              >
                <SelectTrigger
                  size="sm"
                  aria-label="Language selection"
                  className="h-9 w-[105px] rounded-full border-[#ded3c2] bg-white/90 text-xs font-bold text-[#453c34] shadow-2xs hover:border-[#b88a44] hover:bg-white"
                >
                  <Globe className="size-3.5 text-[#b88a44]" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-[#dfd2bf] bg-[#fffdfa] shadow-xl">
                  <SelectItem value="km" className="cursor-pointer text-xs font-bold">
                    ខ្មែរ (KM)
                  </SelectItem>
                  <SelectItem value="en" className="cursor-pointer text-xs font-bold">
                    English (EN)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Currency Selector using shadcn Select */}
            <div className="hidden md:block">
              <Select
                value={currency}
                onValueChange={(val) => setCurrency(val as "USD" | "KHR")}
              >
                <SelectTrigger
                  size="sm"
                  aria-label="Currency selection"
                  className="h-9 w-[92px] rounded-full border-[#ded3c2] bg-white/90 text-xs font-bold text-[#453c34] shadow-2xs hover:border-[#b88a44] hover:bg-white"
                >
                  <CircleDollarSign className="size-3.5 text-[#b88a44]" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-[#dfd2bf] bg-[#fffdfa] shadow-xl">
                  <SelectItem value="USD" className="cursor-pointer text-xs font-bold">
                    USD ($)
                  </SelectItem>
                  <SelectItem value="KHR" className="cursor-pointer text-xs font-bold">
                    KHR (៛)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Notification Bell */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative rounded-full text-[#564a3e] hover:bg-[#f5eee3] hover:text-[#2b2118]"
                  aria-label={`${unread + unreadBookings} unread notifications`}
                >
                  <Bell className="size-4.5" />
                  {unread + unreadBookings > 0 && (
                    <span className="absolute right-1 top-1 grid size-4.5 place-items-center rounded-full bg-[#b84444] text-[0.62rem] font-black text-white shadow-xs">
                      {unread + unreadBookings}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                sideOffset={8}
                className="z-50 w-[min(360px,calc(100vw-24px))] rounded-2xl border border-[#dfd2bf] bg-[#fffdf8] p-2 shadow-2xl"
              >
                <div className="flex items-center justify-between px-2 py-2">
                  <p className="font-extrabold text-[#322820]">
                    {language === "km" ? "ការជូនដំណឹង" : "Notifications"}
                  </p>
                  <Link
                    href={`/${portal}/notifications`}
                    className="text-xs font-bold text-[#8e652c] hover:underline"
                  >
                    {language === "km" ? "មើលទាំងអស់" : "View all"}
                  </Link>
                </div>
                {roleNotifications.map((item) => (
                  <DropdownMenuItem
                    key={item.id}
                    onSelect={() => markRead(item.id)}
                    className="cursor-pointer rounded-xl px-3 py-2.5 outline-none hover:bg-[#f5eee3]"
                  >
                    <div className="flex gap-3">
                      <span
                        className={cn(
                          "mt-1 size-2 shrink-0 rounded-full",
                          notificationsRead.includes(item.id)
                            ? "bg-[#d6ccc0]"
                            : "bg-[#b88a44]",
                        )}
                      />
                      <div>
                        <p className="text-sm font-extrabold">{item.title}</p>
                        <p className="mt-0.5 text-xs leading-5 text-[#756d66]">
                          {item.detail}
                        </p>
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-10 gap-2.5 rounded-full border border-[#ded3c2] bg-white/80 p-1 pr-3 shadow-2xs transition hover:bg-white hover:border-[#b88a44]"
                >
                  <div className="relative">
                    <span className="grid size-7.5 place-items-center rounded-full bg-gradient-to-br from-[#2b2118] to-[#423326] text-xs font-black text-[#efd59e] shadow-xs">
                      {userName
                        .split(" ")
                        .map((part) => part[0])
                        .join("")}
                    </span>
                    <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-white bg-emerald-500" />
                  </div>
                  <span className="hidden text-left xl:block">
                    <span className="block text-xs font-extrabold text-[#332920]">
                      {userName}
                    </span>
                    <span className="block text-[0.65rem] text-[#80766d]">
                      {portal === "owner" ? "Property owner" : "Administrator"}
                    </span>
                  </span>
                  <ChevronDown className="size-3.5 text-[#8a7f74]" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                sideOffset={8}
                className="z-50 min-w-60 rounded-2xl border border-[#dfd2bf] bg-white p-2 shadow-2xl"
              >
                <DropdownMenuLabel className="px-3 py-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-extrabold text-[#322820]">{userName}</p>
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[0.62rem] font-bold text-emerald-700 ring-1 ring-emerald-200">
                      Live
                    </span>
                  </div>
                  <p className="text-xs text-[#756d66] font-medium mt-0.5">{session.email}</p>
                  <div className="mt-2">
                    <StatusBadge status={portal === "owner" ? "Owner Portal" : "Admin Portal"} />
                  </div>
                </DropdownMenuLabel>

                {/* Mobile Quick Switchers for Language & Currency */}
                <div className="sm:hidden border-y border-[#eee4d6] my-1.5 py-2 px-3 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-[#5a4f45]">
                    <span>Language</span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => setLanguage("km")}
                        className={cn("px-2 py-1 rounded-lg text-xs font-bold", language === "km" ? "bg-[#2b2118] text-white" : "bg-[#f5efe5] text-[#554b41]")}
                      >
                        ខ្មែរ
                      </button>
                      <button
                        type="button"
                        onClick={() => setLanguage("en")}
                        className={cn("px-2 py-1 rounded-lg text-xs font-bold", language === "en" ? "bg-[#2b2118] text-white" : "bg-[#f5efe5] text-[#554b41]")}
                      >
                        EN
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs font-bold text-[#5a4f45]">
                    <span>Currency</span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => setCurrency("USD")}
                        className={cn("px-2 py-1 rounded-lg text-xs font-bold", currency === "USD" ? "bg-[#2b2118] text-white" : "bg-[#f5efe5] text-[#554b41]")}
                      >
                        USD ($)
                      </button>
                      <button
                        type="button"
                        onClick={() => setCurrency("KHR")}
                        className={cn("px-2 py-1 rounded-lg text-xs font-bold", currency === "KHR" ? "bg-[#2b2118] text-white" : "bg-[#f5efe5] text-[#554b41]")}
                      >
                        KHR (៛)
                      </button>
                    </div>
                  </div>
                </div>

                <DropdownMenuSeparator className="hidden sm:block my-1 h-px bg-[#eee4d6]" />
                <DropdownMenuItem
                  onSelect={() => router.push(`/${portal}/account`)}
                  className="cursor-pointer rounded-lg px-3 py-2 text-sm font-semibold outline-none hover:bg-[#f6efe5]"
                >
                  Account settings
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={switchRole}
                  className="cursor-pointer rounded-lg px-3 py-2 text-sm font-semibold outline-none hover:bg-[#f6efe5]"
                >
                  Switch role (sign in)
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={resetAll}
                  className="cursor-pointer rounded-lg px-3 py-2 text-sm font-semibold text-[#8f4738] outline-none hover:bg-[#faeeea]"
                >
                  Reset demo data
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-1 h-px bg-[#eee4d6]" />
                <DropdownMenuItem
                  onSelect={handleLogout}
                  className="cursor-pointer rounded-lg px-3 py-2 text-sm font-bold text-[#b53a3a] outline-none hover:bg-[#fbeeed]"
                >
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1560px] p-4 sm:p-6 xl:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
