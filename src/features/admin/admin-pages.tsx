"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  BadgeDollarSign,
  BookOpenCheck,
  Building2,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Edit3,
  Eye,
  FileCheck2,
  Filter,
  Headphones,
  Megaphone,
  MessageCircle,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Save,
  Search,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  TrendingUp,
  UsersRound,
  WalletCards,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  AlertBanner,
  Button,
  Card,
  ConfirmDialog,
  DemoTable,
  EmptyState,
  ExportButton,
  PageHeader,
  Pagination,
  StatCard,
  StatusBadge,
  cn,
} from "@/src/components/shared/ui";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  auditLogs,
  bookings,
  financeRows,
  formatMoney,
  monthlyAnalytics,
  notifications,
  owners,
  properties,
  reviews,
  travelers,
} from "@/src/lib/mock-data";
import { useAppStore } from "@/src/stores/app-store";
import { useDemoStore } from "@/src/stores/demo-store";
import type {
  Booking,
  BookingStatus,
  Owner,
  Payout,
  Property,
  PropertyStatus,
  Traveler,
} from "@/src/types";
import { getPayouts, settlePayout } from "@/src/lib/api";
import { UsersLive } from "./users-live";
import { LiveDashboard } from "../live-dashboard";
import { BookingDetailLive } from "../booking-detail-live";
import { SettingsLive } from "./settings-live";
import { ChatWorkspace } from "../chat/chat-workspace";

function useText() {
  const language = useAppStore((state) => state.language);
  return {
    tx: (en: string, km: string) => (language === "km" ? km : en),
    isKhmer: language === "km",
  };
}

export function AdminPages({ segments = [] }: { segments?: string[] }) {
  const [section, id] = segments;
  if (!section) return <LiveDashboard portal="admin" />;
  if (section === "users") return <UsersLive role="traveler" />;
  if (section === "owners") return <UsersLive role="owner" />;
  if (section === "verifications") return <VerificationsView />;
  if (section === "properties")
    return id ? (
      <AdminPropertyDetail propertyId={id} />
    ) : (
      <AdminPropertiesView />
    );
  if (section === "bookings")
    return id ? (
      <BookingDetailLive bookingId={id} portal="admin" />
    ) : (
      <AdminBookingsView />
    );
  if (section === "payouts") return <AdminPayoutsView />;
  if (["payments", "commissions", "refunds"].includes(section))
    return (
      <FinanceView
        type={section as "payments" | "commissions" | "refunds"}
      />
    );
  if (section === "reviews" || section === "reports")
    return <ModerationView active={section} />;
  if (section === "promotions") return <PromotionsView />;
  if (section === "catalog") return <CatalogView />;
  if (section === "content") return <ContentView />;
  if (section === "support") return <SupportView />;
  if (section === "notifications") return <NotificationsView />;
  if (section === "audit-logs") return <AuditLogsView />;
  if (section === "settings") return <SettingsLive />;
  if (section === "account") return <AdminAccountView />;
  return (
    <EmptyState
      title="Page not found"
      description="This administrator page is not available in the demonstration."
      action={
        <Link href="/admin">
          <Button>Return to overview</Button>
        </Link>
      }
    />
  );
}

function AdminDashboard() {
  const { tx } = useText();
  const currency = useAppStore((state) => state.currency);
  const bookingStatuses = useDemoStore((state) => state.bookingStatuses);
  const propertyStatuses = useDemoStore((state) => state.propertyStatuses);
  const pendingProperties = Object.values(propertyStatuses).filter(
    (status) => status === "Review pending",
  ).length;
  return (
    <div>
      <PageHeader
        eyebrow={tx("Admin Portal", "ផ្នែកអ្នកគ្រប់គ្រង")}
        title={tx("Marketplace overview", "ទិដ្ឋភាពទូទៅនៃទីផ្សារ")}
        description={tx(
          "Monitor growth, moderation queues and platform operations.",
          "តាមដានកំណើន ការត្រួតពិនិត្យ និងប្រតិបត្តិការវេទិកា។",
        )}
        actions={
          <Select defaultValue="30d">
            <SelectTrigger
              aria-label="Date range"
              className="min-h-11 w-44 rounded-xl border-[#d9ccb9] bg-white text-sm font-bold shadow-2xs"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="quarter">This quarter</SelectItem>
              <SelectItem value="ytd">Year to date</SelectItem>
            </SelectContent>
          </Select>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5">
        <StatCard
          label={tx("Gross booking value", "តម្លៃការកក់សរុប")}
          value={formatMoney(21860, currency)}
          helper="+14.2% this month"
          icon={<CircleDollarSign className="size-5" />}
        />
        <StatCard
          label={tx("Platform revenue", "ចំណូលវេទិកា")}
          value={formatMoney(3279, currency)}
          helper="15% demo commission"
          icon={<TrendingUp className="size-5" />}
          accent="green"
        />
        <StatCard
          label={tx("Total bookings", "ការកក់សរុប")}
          value="1,284"
          helper="143 this month"
          icon={<BookOpenCheck className="size-5" />}
          accent="blue"
        />
        <StatCard
          label={tx("Active properties", "កន្លែងស្នាក់សកម្ម")}
          value="186"
          helper={`${pendingProperties} awaiting review`}
          icon={<Building2 className="size-5" />}
          accent="rose"
        />
        <StatCard
          label={tx("Travelers", "អ្នកដំណើរ")}
          value="8,492"
          helper="+312 this month"
          icon={<UsersRound className="size-5" />}
        />
      </div>
      <div className="mt-5 grid gap-5 xl:grid-cols-[1.4fr_.75fr]">
        <ChartCard
          title={tx("Revenue & commission", "ចំណូល និងកម្រៃជើងសារ")}
          subtitle={tx(
            "Six-month marketplace performance",
            "លទ្ធផលទីផ្សារប្រាំមួយខែ",
          )}
        >
          <ResponsiveContainer width="100%" height={290}>
            <AreaChart data={monthlyAnalytics} margin={{ left: -15, right: 8 }}>
              <defs>
                <linearGradient id="adminRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#b88a44" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#b88a44" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                stroke="#eadfce"
                strokeDasharray="4 4"
                vertical={false}
              />
              <XAxis dataKey="month" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} />
              <Tooltip />
              <Legend />
              <Area
                dataKey="revenue"
                name="Gross value"
                stroke="#a97936"
                strokeWidth={2.5}
                fill="url(#adminRevenue)"
              />
              <Area
                dataKey="commission"
                name="Commission"
                stroke="#547a91"
                strokeWidth={2.5}
                fill="transparent"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard
          title={tx("Booking status", "ស្ថានភាពការកក់")}
          subtitle={tx("Current distribution", "ការបែងចែកបច្ចុប្បន្ន")}
        >
          <ResponsiveContainer width="100%" height={290}>
            <PieChart>
              <Pie
                data={[
                  { name: "Confirmed", value: 46 },
                  { name: "Completed", value: 31 },
                  { name: "Pending", value: 13 },
                  { name: "Cancelled", value: 10 },
                ]}
                dataKey="value"
                innerRadius={62}
                outerRadius={94}
                paddingAngle={3}
              >
                {["#b88a44", "#8fa38a", "#547a91", "#c98262"].map((color) => (
                  <Cell key={color} fill={color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend verticalAlign="bottom" />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
      <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_1fr_.85fr]">
        <Card>
          <SectionHead
            title={tx("Action required", "ត្រូវការសកម្មភាព")}
            href="/admin/verifications"
          />
          <QueueItem
            icon={<ShieldCheck />}
            label="Owner verifications"
            value="8"
            href="/admin/verifications"
            tone="gold"
          />
          <QueueItem
            icon={<Building2 />}
            label="Property approvals"
            value={String(pendingProperties)}
            href="/admin/properties"
            tone="blue"
          />
          <QueueItem
            icon={<BadgeDollarSign />}
            label="Refund requests"
            value="4"
            href="/admin/refunds"
            tone="rose"
          />
          <QueueItem
            icon={<Headphones />}
            label="Open support tickets"
            value="12"
            href="/admin/support"
            tone="green"
          />
        </Card>
        <Card>
          <SectionHead
            title={tx("Recent bookings", "ការកក់ថ្មីៗ")}
            href="/admin/bookings"
          />
          {bookings.slice(0, 4).map((booking) => (
            <Link
              key={booking.id}
              href={`/admin/bookings/${booking.id}`}
              className="flex items-center gap-3 border-t border-[#ece2d4] px-5 py-3.5 hover:bg-[#fbf6ee]"
            >
              <span className="min-w-0 flex-1">
                <strong className="block truncate text-sm">
                  {booking.guest}
                </strong>
                <span className="block truncate text-xs text-[#7b7168]">
                  {booking.property}
                </span>
              </span>
              <span className="tabular text-sm font-bold">
                {formatMoney(booking.total, currency)}
              </span>
              <StatusBadge
                status={bookingStatuses[booking.id] || booking.status}
              />
            </Link>
          ))}
        </Card>
        <Card>
          <SectionHead title={tx("Quick actions", "សកម្មភាពរហ័ស")} />
          <div className="space-y-2 p-4 pt-0">
            <QuickAction
              href="/admin/verifications"
              icon={<ShieldCheck />}
              label="Review owners"
            />
            <QuickAction
              href="/admin/properties"
              icon={<Building2 />}
              label="Review properties"
            />
            <QuickAction
              href="/admin/support"
              icon={<Headphones />}
              label="View support tickets"
            />
            <QuickAction
              href="/admin/promotions"
              icon={<Megaphone />}
              label="Create promotion"
            />
          </div>
        </Card>
      </div>
      <div className="mt-5 grid gap-5 xl:grid-cols-3">
        <RankCard
          title="Top provinces"
          rows={[
            ["Siem Reap", "364 bookings"],
            ["Kampot", "246 bookings"],
            ["Phnom Penh", "192 bookings"],
          ]}
        />
        <RankCard
          title="Top properties"
          rows={properties
            .slice(0, 3)
            .map((item) => [item.name, `${item.bookings} bookings`])}
        />
        <Card className="p-5">
          <h2 className="font-extrabold">Recent admin activity</h2>
          <div className="mt-4">
            <AdminTimeline />
          </div>
        </Card>
      </div>
    </div>
  );
}
function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="min-w-0 p-5">
      <div className="mb-4">
        <h2 className="font-extrabold">{title}</h2>
        <p className="mt-1 text-sm text-[#786e65]">{subtitle}</p>
      </div>
      {children}
    </Card>
  );
}
function SectionHead({ title, href }: { title: string; href?: string }) {
  return (
    <div className="flex items-center justify-between p-5">
      <h2 className="font-extrabold">{title}</h2>
      {href && (
        <Link href={href} className="text-xs font-bold text-[#8e652c]">
          View all
        </Link>
      )}
    </div>
  );
}
function QueueItem({
  icon,
  label,
  value,
  href,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href: string;
  tone: "gold" | "blue" | "rose" | "green";
}) {
  const tones = {
    gold: "bg-[#f3e7d1] text-[#95692f]",
    blue: "bg-[#e6eff3] text-[#547a91]",
    rose: "bg-[#f7e8e3] text-[#a6614c]",
    green: "bg-[#e6f0e8] text-[#3c7a57]",
  };
  return (
    <Link
      href={href}
      className="flex items-center gap-3 border-t border-[#ece2d4] px-5 py-3.5 hover:bg-[#fbf6ee]"
    >
      <span
        className={cn(
          "grid size-9 place-items-center rounded-xl [&>svg]:size-4",
          tones[tone],
        )}
      >
        {icon}
      </span>
      <span className="flex-1 text-sm font-bold">{label}</span>
      <span className="tabular grid size-8 place-items-center rounded-full bg-[#f1e8dc] text-sm font-extrabold">
        {value}
      </span>
    </Link>
  );
}
function QuickAction({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex min-h-12 items-center gap-3 rounded-xl border border-[#e6dbc9] bg-white px-3 text-sm font-bold hover:border-[#caa972]"
    >
      <span className="text-[#94682e] [&>svg]:size-4">{icon}</span>
      {label}
    </Link>
  );
}
function RankCard({ title, rows }: { title: string; rows: string[][] }) {
  return (
    <Card className="p-5">
      <h2 className="font-extrabold">{title}</h2>
      <div className="mt-4 space-y-4">
        {rows.map(([name, value], index) => (
          <div key={name} className="flex items-center gap-3">
            <span className="grid size-8 place-items-center rounded-lg bg-[#f1e7d7] text-xs font-extrabold text-[#8e652c]">
              {index + 1}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm font-bold">
              {name}
            </span>
            <span className="text-xs text-[#7b7168]">{value}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
function AdminTimeline() {
  return (
    <div className="space-y-4">
      {auditLogs.slice(0, 3).map((item) => (
        <div key={item.time} className="flex gap-3">
          <span className="mt-1 size-2 rounded-full bg-[#b88a44]" />
          <div>
            <p className="text-sm font-bold">{item.action}</p>
            <p className="text-xs text-[#7b7168]">
              {item.resource} · {item.time}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function SearchFilters({
  placeholder = "Search records…",
  query,
  setQuery,
  children,
}: {
  placeholder?: string;
  query: string;
  setQuery: (value: string) => void;
  children?: React.ReactNode;
}) {
  return (
    <Card className="mb-5 p-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <label className="relative flex-1">
          <Search className="absolute left-3 top-3 size-4 text-[#7b7168]" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="min-h-11 w-full rounded-xl border border-[#ded2c0] bg-white pl-10 pr-3 text-sm"
          />
        </label>
        {children}
        <Button variant="secondary">
          <Filter className="size-4" />
          More filters
        </Button>
      </div>
    </Card>
  );
}

function UsersView() {
  const [query, setQuery] = useState("");
  const [userStatus, setUserStatus] = useState<Record<string, string>>({});
  const filtered = travelers.filter((item) =>
    `${item.name} ${item.id} ${item.province}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  const columns = useMemo<ColumnDef<Traveler>[]>(
    () => [
      { accessorKey: "id", header: "User" },
      {
        accessorKey: "name",
        header: "Traveler",
        cell: ({ getValue }) => (
          <span className="font-extrabold">{getValue<string>()}</span>
        ),
      },
      { accessorKey: "province", header: "Province" },
      { accessorKey: "joined", header: "Registered" },
      { accessorKey: "bookings", header: "Bookings" },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => (
          <StatusBadge
            status={userStatus[row.original.id] || row.original.status}
          />
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <ConfirmDialog
            trigger={
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="size-4" />
                Manage
              </Button>
            }
            title={`Update ${row.original.name}?`}
            description="Choose confirm to toggle this traveler’s local demonstration account status."
            confirmLabel="Update account"
            onConfirm={() => {
              setUserStatus((state) => ({
                ...state,
                [row.original.id]:
                  (state[row.original.id] || row.original.status) ===
                  "Suspended"
                    ? "Active"
                    : "Suspended",
              }));
              toast.success("Traveler account updated locally");
            }}
          />
        ),
      },
    ],
    [userStatus],
  );
  return (
    <div>
      <PageHeader
        eyebrow="People"
        title="Travelers"
        description="Search traveler accounts, review activity and manage demonstration account status."
        actions={<ExportButton />}
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Registered travelers"
          value="8,492"
          helper="+312 this month"
          icon={<UsersRound className="size-5" />}
        />
        <StatCard
          label="Active this month"
          value="2,184"
          helper="25.7% of total"
          icon={<Activity className="size-5" />}
          accent="green"
        />
        <StatCard
          label="Needs review"
          value="18"
          helper="Reports or warnings"
          icon={<ShieldAlert className="size-5" />}
          accent="rose"
        />
      </div>
      <div className="mt-5">
        <SearchFilters
          query={query}
          setQuery={setQuery}
          placeholder="Search name, ID or province"
        >
          <Select defaultValue="all">
            <SelectTrigger className="min-h-11 w-40 rounded-xl border-[#ded2c0] bg-white text-sm font-bold shadow-2xs">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
        </SearchFilters>
        <Card>
          <DemoTable data={filtered.slice(0, 15)} columns={columns} />
          <Pagination total={2} />
        </Card>
      </div>
    </div>
  );
}

function OwnersView() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<Record<string, string>>({});
  const filtered = owners.filter((item) =>
    `${item.name} ${item.business} ${item.province}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  const columns = useMemo<ColumnDef<Owner>[]>(
    () => [
      { accessorKey: "id", header: "Owner" },
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => (
          <span className="font-extrabold">
            {row.original.name}
            <span className="block text-xs font-medium text-[#7b7168]">
              {row.original.business}
            </span>
          </span>
        ),
      },
      {
        accessorKey: "verification",
        header: "Verification",
        cell: ({ getValue }) => <StatusBadge status={getValue<string>()} />,
      },
      { accessorKey: "properties", header: "Properties" },
      { accessorKey: "bookings", header: "Bookings" },
      {
        accessorKey: "revenue",
        header: "Revenue",
        cell: ({ getValue }) => `$${getValue<number>().toLocaleString()}`,
      },
      {
        accessorKey: "rating",
        header: "Rating",
        cell: ({ getValue }) => `${getValue<number>()} ★`,
      },
      {
        id: "status",
        header: "Account",
        cell: ({ row }) => (
          <StatusBadge
            status={status[row.original.id] || row.original.status}
          />
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <ConfirmDialog
            trigger={
              <Button variant="ghost" size="sm">
                Manage
              </Button>
            }
            title={`Update ${row.original.name}?`}
            description="Approve, suspend or restore this local demo owner account."
            confirmLabel="Toggle status"
            onConfirm={() => {
              setStatus((value) => ({
                ...value,
                [row.original.id]:
                  (value[row.original.id] || row.original.status) ===
                  "Suspended"
                    ? "Active"
                    : "Suspended",
              }));
              toast.success("Owner status updated locally");
            }}
          />
        ),
      },
    ],
    [status],
  );
  return (
    <div>
      <PageHeader
        eyebrow="Marketplace partners"
        title="Property owners"
        description="Review owner businesses, verification, properties, earnings and account status."
      />
      <SearchFilters
        query={query}
        setQuery={setQuery}
        placeholder="Search owner or business"
      >
        <Select defaultValue="all">
          <SelectTrigger className="min-h-11 w-44 rounded-xl border-[#ded2c0] bg-white text-sm font-bold shadow-2xs">
            <SelectValue placeholder="All verification" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All verification</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="review">Under review</SelectItem>
          </SelectContent>
        </Select>
      </SearchFilters>
      <Card>
        <DemoTable data={filtered} columns={columns} />
        <Pagination total={1} />
      </Card>
    </div>
  );
}

function VerificationsView() {
  const [selected, setSelected] = useState(
    owners.find((item) => item.verification !== "Approved") || owners[0],
  );
  const decisions = useDemoStore((state) => state.verificationDecisions);
  const decide = useDemoStore((state) => state.setVerificationDecision);
  const queue = owners.filter((item) => item.verification !== "Approved");
  function act(value: string) {
    decide(selected.id, value);
    toast.success(`Verification marked ${value}`);
  }
  return (
    <div>
      <PageHeader
        eyebrow="Trust & safety · demo"
        title="Verification review"
        description="Review locally stored demonstration owner and business submissions."
        actions={<StatusBadge status={`${queue.length} pending`} />}
      />
      <AlertBanner title="Local demonstration documents" tone="info">
        No identity provider, cloud storage or external verification service is
        connected.
      </AlertBanner>
      <div className="mt-5 grid gap-5 xl:grid-cols-[390px_1fr]">
        <Card className="self-start">
          <div className="p-4">
            <label className="relative">
              <Search className="absolute left-3 top-3 size-4 text-[#7b7168]" />
              <Input
                className="min-h-11 w-full rounded-xl border border-[#ded2c0] pl-10 pr-3 text-sm"
                placeholder="Search review queue"
              />
            </label>
          </div>
          {queue.map((owner) => (
            <Button
              variant="ghost"
              key={owner.id}
              onClick={() => setSelected(owner)}
              className={cn(
                "w-full border-t border-[#ece2d4] p-4 text-left hover:bg-[#faf5ec]",
                selected.id === owner.id && "bg-[#f6eddd]",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <strong className="text-sm">{owner.name}</strong>
                <StatusBadge
                  status={decisions[owner.id] || owner.verification}
                />
              </div>
              <p className="mt-1 text-xs text-[#776d64]">
                {owner.business} · submitted Aug {20 + queue.indexOf(owner)}
              </p>
            </Button>
          ))}
        </Card>
        <Card className="p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[.12em] text-[#9a6e32]">
                {selected.id}
              </p>
              <h2 className="mt-1 text-xl font-extrabold">{selected.name}</h2>
              <p className="text-sm text-[#776d64]">
                {selected.business} · {selected.province}
              </p>
            </div>
            <StatusBadge
              status={decisions[selected.id] || selected.verification}
            />
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <InfoCard
              title="Owner information"
              rows={[
                ["Full name", selected.name],
                ["Phone", "+855 12 345 678"],
                ["Registered", "18 Aug 2026"],
              ]}
            />
            <InfoCard
              title="Business information"
              rows={[
                ["Business", selected.business],
                ["Province", selected.province],
                ["Type", "Sole proprietor"],
              ]}
            />
          </div>
          <h3 className="mt-6 font-extrabold">Document previews</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <DocumentPreview name="National identity card" />
            <DocumentPreview name="Business registration" />
          </div>
          <label className="mt-5 block">
            <span className="mb-2 block text-sm font-extrabold">
              Internal note
            </span>
            <Textarea
              className="form-input min-h-24"
              placeholder="Add a note for other administrators"
            />
          </label>
          <div className="mt-5 flex flex-wrap gap-2">
            <ConfirmDialog
              trigger={
                <Button>
                  <CheckCircle2 className="size-4" />
                  Approve
                </Button>
              }
              title="Approve this verification?"
              description="This is a local demo decision and does not verify a real person."
              confirmLabel="Approve demo"
              onConfirm={() => act("Approved")}
            />
            <Button variant="secondary" onClick={() => act("Changes required")}>
              <RefreshCw className="size-4" />
              Request changes
            </Button>
            <ConfirmDialog
              trigger={
                <Button variant="danger">
                  <XCircle className="size-4" />
                  Reject
                </Button>
              }
              title="Reject this submission?"
              description="The owner will see the local demonstration reason."
              confirmLabel="Reject demo"
              danger
              onConfirm={() => act("Rejected")}
            />
            <Button
              variant="ghost"
              onClick={() => toast.success("Reviewer assigned locally")}
            >
              Assign reviewer
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
function InfoCard({ title, rows }: { title: string; rows: string[][] }) {
  return (
    <div className="rounded-xl border border-[#e2d6c4] bg-white p-4">
      <h3 className="font-extrabold">{title}</h3>
      <dl className="mt-3 space-y-3">
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs font-bold text-[#7b7168]">{label}</dt>
            <dd className="mt-0.5 text-sm font-semibold">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
function DocumentPreview({ name }: { name: string }) {
  return (
    <Button
      variant="ghost"
      type="button"
      onClick={() => toast.info(`${name} preview opened`)}
      className="flex min-h-28 items-center gap-4 rounded-xl border border-[#ded1be] bg-[#f8f1e6] p-4 text-left hover:border-[#b88a44]"
    >
      <span className="grid size-11 place-items-center rounded-xl bg-white text-[#95692f]">
        <FileCheck2 className="size-5" />
      </span>
      <span>
        <strong className="block text-sm">{name}</strong>
        <span className="mt-1 block text-xs text-[#756b62]">
          Local demo · click to preview
        </span>
      </span>
    </Button>
  );
}

function AdminPropertiesView() {
  const [query, setQuery] = useState("");
  const statuses = useDemoStore((state) => state.propertyStatuses);
  const filtered = properties.filter((item) =>
    `${item.name} ${item.owner} ${item.province}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  const columns = useMemo<ColumnDef<Property>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Property",
        cell: ({ row }) => (
          <Link
            href={`/admin/properties/${row.original.id}`}
            className="flex items-center gap-3 font-extrabold"
          >
            <span className="relative size-10 overflow-hidden rounded-lg">
              <Image
                src={row.original.image}
                alt=""
                fill
                className="object-cover"
                sizes="40px"
              />
            </span>
            <span>
              {row.original.name}
              <span className="block text-xs font-medium text-[#7b7168]">
                {row.original.id} · {row.original.province}
              </span>
            </span>
          </Link>
        ),
      },
      { accessorKey: "owner", header: "Owner" },
      { accessorKey: "type", header: "Type" },
      { accessorKey: "rooms", header: "Rooms" },
      { accessorKey: "updated", header: "Submitted" },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => (
          <StatusBadge
            status={statuses[row.original.id] || row.original.status}
          />
        ),
      },
      {
        id: "action",
        header: "",
        cell: ({ row }) => (
          <Link href={`/admin/properties/${row.original.id}`}>
            <Button variant="ghost" size="sm">
              Review
            </Button>
          </Link>
        ),
      },
    ],
    [statuses],
  );
  return (
    <div>
      <PageHeader
        eyebrow="Marketplace catalog"
        title="Property moderation"
        description="Review pending, published, draft, paused, rejected and suspended listings."
      />
      <div className="mb-4 flex gap-2 overflow-x-auto scrollbar-thin">
        {[
          "Pending",
          "Published",
          "Draft",
          "Rejected",
          "Paused",
          "Suspended",
        ].map((tab, index) => (
          <Button
            key={tab}
            variant={index === 0 ? "primary" : "ghost"}
            size="sm"
          >
            {tab}
          </Button>
        ))}
      </div>
      <SearchFilters
        query={query}
        setQuery={setQuery}
        placeholder="Search property, owner or province"
      >
        <Select defaultValue="all">
          <SelectTrigger className="min-h-11 w-44 rounded-xl border-[#ded2c0] bg-white text-sm font-bold shadow-2xs">
            <SelectValue placeholder="All provinces" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All provinces</SelectItem>
            <SelectItem value="siem-reap">Siem Reap</SelectItem>
            <SelectItem value="kampot">Kampot</SelectItem>
          </SelectContent>
        </Select>
      </SearchFilters>
      <Card>
        <DemoTable data={filtered} columns={columns} />
        <Pagination total={2} />
      </Card>
    </div>
  );
}

function AdminPropertyDetail({ propertyId }: { propertyId: string }) {
  const property =
    properties.find((item) => item.id === propertyId) || properties[0];
  const status = useDemoStore(
    (state) => state.propertyStatuses[property.id] || property.status,
  );
  const update = useDemoStore((state) => state.updatePropertyStatus);
  function act(next: PropertyStatus, message: string) {
    update(property.id, next);
    toast.success(message);
  }
  return (
    <div>
      <PageHeader
        eyebrow={`Property moderation / ${property.id}`}
        title={property.name}
        description={`${property.nameKm} · ${property.owner}`}
        actions={<StatusBadge status={status} />}
      />
      <div className="grid gap-5 xl:grid-cols-[1fr_370px]">
        <div className="space-y-5">
          <Card className="overflow-hidden">
            <div className="relative aspect-[16/7]">
              <Image
                src={property.image}
                alt={`${property.name} demonstration image`}
                fill
                className="object-cover"
                priority
                sizes="70vw"
              />
              <span className="absolute bottom-4 left-4 rounded-lg bg-[#2b2118]/85 px-3 py-1.5 text-xs font-bold text-white">
                Fictional demonstration property
              </span>
            </div>
            <div className="p-5">
              <div className="grid gap-4 sm:grid-cols-3">
                <InfoCard
                  title="Owner"
                  rows={[
                    ["Name", property.owner],
                    ["Status", "Verified · demo"],
                  ]}
                />
                <InfoCard
                  title="Location"
                  rows={[
                    ["Province", property.province],
                    ["Map", "Static preview only"],
                  ]}
                />
                <InfoCard
                  title="Property"
                  rows={[
                    ["Type", property.type],
                    ["Rooms", String(property.rooms)],
                  ]}
                />
              </div>
              <h2 className="mt-6 font-extrabold">Content & policies</h2>
              <p className="mt-2 text-sm leading-6 text-[#6f665e]">
                This bilingual fictional listing demonstrates KhmerStay
                moderation. Amenities include Wi-Fi, breakfast, parking,
                workspace and family-friendly facilities.
              </p>
            </div>
          </Card>
          <Card className="p-5">
            <h2 className="font-extrabold">Rooms & pricing</h2>
            <div className="mt-4 space-y-3">
              {[
                ["Lotus King Room", "$42", "2 guests"],
                ["Garden Twin Room", "$36", "3 guests"],
              ].map((row) => (
                <div
                  key={row[0]}
                  className="flex items-center gap-3 rounded-xl border border-[#e3d7c5] bg-white p-4"
                >
                  <span className="grid size-10 place-items-center rounded-xl bg-[#f1e7d7] text-[#94682e]">
                    <Building2 className="size-5" />
                  </span>
                  <span className="flex-1">
                    <strong className="block text-sm">{row[0]}</strong>
                    <span className="text-xs text-[#776d64]">{row[2]}</span>
                  </span>
                  <strong className="tabular">{row[1]}</strong>
                </div>
              ))}
            </div>
          </Card>
        </div>
        <div className="space-y-5">
          <Card className="p-5">
            <h2 className="font-extrabold">Moderation checklist</h2>
            <div className="mt-4 space-y-3">
              {[
                "Bilingual content reviewed",
                "Images appear authentic",
                "Location is consistent",
                "Room details complete",
                "Pricing is reasonable",
                "Policies are clear",
              ].map((label) => (
                <label
                  key={label}
                  className="flex items-center gap-3 text-sm font-semibold"
                >
                  <Input
                    type="checkbox"
                    defaultChecked
                    className="size-5 accent-[#9a6d31]"
                  />
                  {label}
                </label>
              ))}
            </div>
          </Card>
          <Card className="p-5">
            <h2 className="font-extrabold">Decision</h2>
            <label className="mt-4 block">
              <span className="mb-2 block text-sm font-bold">
                Internal note
              </span>
              <Textarea
                className="form-input min-h-24"
                placeholder="Visible to administrators only"
              />
            </label>
            <div className="mt-4 grid gap-2">
              <ConfirmDialog
                trigger={
                  <Button>
                    <CheckCircle2 className="size-4" />
                    Approve property
                  </Button>
                }
                title="Approve this property?"
                description="This publishes the listing in local demonstration state."
                confirmLabel="Approve demo"
                onConfirm={() => act("Published", "Property approved locally")}
              />
              <Button
                variant="secondary"
                onClick={() =>
                  act("Review pending", "Changes requested locally")
                }
              >
                <RefreshCw className="size-4" />
                Request changes
              </Button>
              <ConfirmDialog
                trigger={
                  <Button variant="danger">
                    <XCircle className="size-4" />
                    Reject
                  </Button>
                }
                title="Reject this property?"
                description="A demonstration rejection reason will be recorded."
                confirmLabel="Reject demo"
                danger
                onConfirm={() => act("Rejected", "Property rejected locally")}
              />
              <Button
                variant="ghost"
                onClick={() =>
                  act(
                    status === "Paused" ? "Published" : "Paused",
                    status === "Paused"
                      ? "Property restored"
                      : "Property suspended",
                  )
                }
              >
                {status === "Paused" ? "Restore" : "Suspend"}
              </Button>
            </div>
          </Card>
          <Card className="p-5">
            <h2 className="font-extrabold">Status history</h2>
            <div className="mt-4">
              <SimpleTimeline
                rows={[
                  ["Submitted", "Aug 28 · Sokha Chea"],
                  ["Automated checks · demo", "Aug 28 · Passed"],
                  [status, "Current status"],
                ]}
              />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
function SimpleTimeline({ rows }: { rows: string[][] }) {
  return (
    <div>
      {rows.map(([title, meta], index) => (
        <div
          key={`${title}-${index}`}
          className="relative flex gap-3 pb-5 last:pb-0"
        >
          <span className="relative z-10 mt-1 size-3 rounded-full border-[3px] border-[#edd9b6] bg-[#a97936]" />
          {index < rows.length - 1 && (
            <span className="absolute left-[5px] top-3 h-full w-px bg-[#ddccb0]" />
          )}
          <div>
            <p className="text-sm font-extrabold">{title}</p>
            <p className="text-xs text-[#776d64]">{meta}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function AdminBookingsView() {
  const [query, setQuery] = useState("");
  const statuses = useDemoStore((state) => state.bookingStatuses);
  const currency = useAppStore((state) => state.currency);
  const filtered = bookings
    .filter((item) =>
      `${item.id} ${item.guest} ${item.property} ${item.owner}`
        .toLowerCase()
        .includes(query.toLowerCase()),
    )
    .slice(0, 15);
  const columns = useMemo<ColumnDef<Booking>[]>(
    () => [
      {
        accessorKey: "id",
        header: "Reference",
        cell: ({ row }) => (
          <Link
            href={`/admin/bookings/${row.original.id}`}
            className="font-extrabold text-[#825d2b]"
          >
            {row.original.id}
          </Link>
        ),
      },
      {
        accessorKey: "guest",
        header: "Traveler",
        cell: ({ getValue }) => <strong>{getValue<string>()}</strong>,
      },
      { accessorKey: "owner", header: "Owner" },
      { accessorKey: "property", header: "Property" },
      {
        accessorKey: "checkIn",
        header: "Stay",
        cell: ({ row }) => (
          <span className="whitespace-nowrap">
            {row.original.checkIn}
            <span className="block text-xs text-[#7b7168]">
              to {row.original.checkOut}
            </span>
          </span>
        ),
      },
      {
        accessorKey: "total",
        header: "Total",
        cell: ({ getValue }) => formatMoney(getValue<number>(), currency),
      },
      {
        accessorKey: "payment",
        header: "Payment",
        cell: ({ getValue }) => <StatusBadge status={getValue<string>()} />,
      },
      {
        id: "status",
        header: "Booking",
        cell: ({ row }) => (
          <StatusBadge
            status={statuses[row.original.id] || row.original.status}
          />
        ),
      },
    ],
    [currency, statuses],
  );
  return (
    <div>
      <PageHeader
        eyebrow="Marketplace operations"
        title="Booking management"
        description="Review booking value, payment demonstration status and stay timelines."
        actions={<ExportButton />}
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total bookings"
          value="1,284"
          icon={<BookOpenCheck className="size-5" />}
        />
        <StatCard
          label="Confirmed value"
          value={formatMoney(21860, currency)}
          icon={<CircleDollarSign className="size-5" />}
          accent="green"
        />
        <StatCard
          label="Pending"
          value="28"
          icon={<Clock3 className="size-5" />}
          accent="blue"
        />
        <StatCard
          label="Disputed · demo"
          value="3"
          icon={<ShieldAlert className="size-5" />}
          accent="rose"
        />
      </div>
      <div className="mt-5">
        <SearchFilters
          query={query}
          setQuery={setQuery}
          placeholder="Search booking, traveler, owner or property"
        />
        <Card>
          <DemoTable data={filtered} columns={columns} />
          <Pagination total={4} />
        </Card>
      </div>
    </div>
  );
}

function AdminBookingDetail({ bookingId }: { bookingId: string }) {
  const booking = bookings.find((item) => item.id === bookingId) || bookings[0];
  const currency = useAppStore((state) => state.currency);
  const status = useDemoStore(
    (state) => state.bookingStatuses[booking.id] || booking.status,
  );
  const update = useDemoStore((state) => state.updateBookingStatus);
  function set(next: BookingStatus) {
    update(booking.id, next);
    toast.success(`Booking updated to ${next}`);
  }
  return (
    <div>
      <PageHeader
        eyebrow={`Bookings / ${booking.id}`}
        title={booking.guest}
        description={`${booking.property} · ${booking.checkIn} to ${booking.checkOut}`}
        actions={<StatusBadge status={status} />}
      />
      <AlertBanner title="Mock payment timeline" tone="info">
        No payment gateway, PayWay, KHQR, billing or refund service is
        connected.
      </AlertBanner>
      <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <Card className="p-5">
            <h2 className="font-extrabold">Complete booking summary</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <InfoCard
                title="Traveler"
                rows={[
                  ["Name", booking.guest],
                  ["Contact", "traveler@demo.local"],
                ]}
              />
              <InfoCard
                title="Owner"
                rows={[
                  ["Name", booking.owner],
                  ["Contact", "owner@demo.local"],
                ]}
              />
              <InfoCard
                title="Stay"
                rows={[
                  ["Room", booking.room],
                  ["Guests", String(booking.guests)],
                ]}
              />
            </div>
          </Card>
          <Card className="p-5">
            <h2 className="font-extrabold">Timelines</h2>
            <div className="mt-4 grid gap-6 sm:grid-cols-2">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-wide text-[#8d6530]">
                  Booking status
                </p>
                <SimpleTimeline
                  rows={[
                    ["Requested", "Sep 1 · 09:42"],
                    ["Confirmed", "Sep 1 · 10:08"],
                    [status, "Current"],
                  ]}
                />
              </div>
              <div>
                <p className="text-xs font-extrabold uppercase tracking-wide text-[#587a8d]">
                  Payment · demo
                </p>
                <SimpleTimeline
                  rows={[
                    ["Authorized", "Sep 1 · Mock"],
                    [booking.payment, "Current demo state"],
                  ]}
                />
              </div>
            </div>
          </Card>
          <Card className="p-5">
            <h2 className="font-extrabold">Admin notes</h2>
            <Textarea
              className="form-input mt-4 min-h-24"
              placeholder="Visible to administrators only"
            />
            <Button
              variant="secondary"
              className="mt-3"
              onClick={() => toast.success("Admin note saved locally")}
            >
              <Save className="size-4" />
              Add note
            </Button>
          </Card>
        </div>
        <div className="space-y-5">
          <Card className="p-5">
            <h2 className="font-extrabold">Price breakdown</h2>
            {[
              ["Stay subtotal", booking.total - 18],
              ["Traveler fee · demo", 18],
              ["Platform commission", Math.round(booking.total * 0.15)],
            ].map(([label, value]) => (
              <div
                key={label as string}
                className="flex justify-between border-b border-[#ece2d4] py-3 text-sm"
              >
                <span>{label}</span>
                <strong>{formatMoney(value as number, currency)}</strong>
              </div>
            ))}
            <div className="flex justify-between py-3 font-extrabold">
              <span>Total</span>
              <span>{formatMoney(booking.total, currency)}</span>
            </div>
          </Card>
          <Card className="p-5">
            <h2 className="font-extrabold">Admin actions</h2>
            <div className="mt-4 grid gap-2">
              <Button variant="secondary" onClick={() => set("Confirmed")}>
                Mark confirmed
              </Button>
              <Button
                variant="secondary"
                onClick={() => toast.info("Dispute marked locally")}
              >
                Mark disputed
              </Button>
              <Button
                variant="secondary"
                onClick={() => toast.info("Owner contact composer opened")}
              >
                <MessageCircle className="size-4" />
                Contact owner
              </Button>
              <Button
                variant="secondary"
                onClick={() => toast.info("Traveler contact composer opened")}
              >
                <MessageCircle className="size-4" />
                Contact traveler
              </Button>
              <ConfirmDialog
                trigger={<Button variant="danger">Cancel booking</Button>}
                title="Cancel this booking?"
                description="This changes local demo status only."
                confirmLabel="Cancel demo booking"
                danger
                onConfirm={() => set("Cancelled")}
              />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function AdminPayoutsView() {
  const { tx, isKhmer } = useText();
  const currency = useAppStore((state) => state.currency);
  const exchangeRate = useAppStore((state) => state.exchangeRate);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [tab, setTab] = useState<string>("All");
  const [query, setQuery] = useState("");
  const [settleModalOpen, setSettleModalOpen] = useState(false);
  const [targetPayout, setTargetPayout] = useState<Payout | null>(null);
  const [reference, setReference] = useState("");
  const [settling, setSettling] = useState(false);

  const loadPayouts = () => {
    getPayouts()
      .then((res) => {
        if (res?.payouts) {
          setPayouts(res.payouts);
        }
      })
      .catch(() => {
        setPayouts([
          {
            id: "PO-260901-789a1",
            ownerId: "owner-1",
            bookingId: "KST-260825-1029",
            grossAmount: 320,
            commissionRate: 15,
            commissionAmount: 48,
            netAmount: 272,
            currency: "USD",
            bakongAccount: "sokha@aclb",
            status: "Paid",
            reference: "BKG-TXN-98410294",
            createdAt: "2026-09-01T08:30:00Z",
            paidAt: "2026-09-01T10:15:00Z",
            propertyName: "Angkor Lotus Heritage Stay",
            guestName: "Dara Som",
          },
          {
            id: "PO-260915-324b9",
            ownerId: "owner-1",
            bookingId: "KST-260910-4491",
            grossAmount: 540,
            commissionRate: 15,
            commissionAmount: 81,
            netAmount: 459,
            currency: "USD",
            bakongAccount: "012894567@aba",
            status: "Pending",
            reference: "",
            createdAt: "2026-09-15T09:00:00Z",
            propertyName: "Kampot Riverstone",
            guestName: "Channary Phoung",
          },
          {
            id: "PO-260920-118c5",
            ownerId: "owner-2",
            bookingId: "KST-260915-8821",
            grossAmount: 420,
            commissionRate: 15,
            commissionAmount: 63,
            netAmount: 357,
            currency: "USD",
            bakongAccount: "rathana@wing",
            status: "Pending",
            reference: "",
            createdAt: "2026-09-20T11:20:00Z",
            propertyName: "Bokor Mist Villa",
            guestName: "Vibol Heng",
          },
        ]);
      });
  };

  useEffect(() => {
    loadPayouts();
    window.addEventListener("khmerstay:refresh-bookings", loadPayouts);
    return () =>
      window.removeEventListener("khmerstay:refresh-bookings", loadPayouts);
  }, []);

  async function handleSettlePayout(e: React.FormEvent) {
    e.preventDefault();
    if (!targetPayout) return;
    if (!reference.trim()) {
      toast.error(
        isKhmer
          ? "សូមបញ្ចូលលេខកូដយោងប្រតិបត្តិការ Bakong"
          : "Please enter the Bakong transaction reference",
      );
      return;
    }
    setSettling(true);
    try {
      try {
        await settlePayout(targetPayout.id, reference.trim(), "Paid");
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        if (
          err &&
          typeof err === "object" &&
          "status" in err &&
          (err as { status: number }).status !== 0 &&
          !errMsg.includes("Cannot reach")
        ) {
          toast.error(errMsg || "Settlement failed");
          setSettling(false);
          return;
        }
      }

      setPayouts((prev) =>
        prev.map((p) =>
          p.id === targetPayout.id
            ? {
                ...p,
                status: "Paid" as const,
                reference: reference.trim(),
                paidAt: new Date().toISOString(),
              }
            : p,
        ),
      );

      toast.success(
        isKhmer
          ? `ការទូទាត់ ${targetPayout.id} ត្រូវបានសម្គាល់ថាបានទូទាត់ជោគជ័យ!`
          : `Payout ${targetPayout.id} settled successfully via Bakong!`,
        {
          description: `Ref: ${reference.trim()} · $${targetPayout.netAmount} transferred to ${targetPayout.bakongAccount}`,
          duration: 6000,
        },
      );

      setSettleModalOpen(false);
      setTargetPayout(null);
      setReference("");
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to settle payout",
      );
    } finally {
      setSettling(false);
    }
  }

  const pendingPayouts = payouts.filter(
    (p) => p.status === "Pending" || p.status === "Processing",
  );
  const paidPayouts = payouts.filter((p) => p.status === "Paid");

  const pendingAmount = pendingPayouts.reduce((sum, p) => sum + p.netAmount, 0);
  const paidAmount = paidPayouts.reduce((sum, p) => sum + p.netAmount, 0);
  const totalCommissionRetained = payouts.reduce(
    (sum, p) => sum + p.commissionAmount,
    0,
  );

  const filtered = payouts.filter((p) => {
    const matchesTab = tab === "All" || p.status === tab;
    const matchesQuery =
      query.trim() === "" ||
      `${p.id} ${p.bookingId} ${p.bakongAccount} ${p.propertyName} ${p.guestName}`
        .toLowerCase()
        .includes(query.toLowerCase());
    return matchesTab && matchesQuery;
  });

  return (
    <div>
      <PageHeader
        eyebrow={tx("Finance · Bakong", "ហិរញ្ញវត្ថុ · បាគង")}
        title={tx("Host Payout Requests", "សំណើបើកប្រាក់ពីម្ចាស់ផ្ទះ")}
        description={tx(
          "Review host payout requests, verify 15% platform commission retention, and settle payments directly via Bakong.",
          "ត្រួតពិនិត្យសំណើបើកប្រាក់ពីម្ចាស់ផ្ទះ ផ្ទៀងផ្ទាត់កម្រៃជើងសារ ១៥% និងទូទាត់ប្រាក់តាមប្រព័ន្ធបាគង។",
        )}
        actions={<ExportButton />}
      />

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <StatCard
          label={tx("Pending Settlement Value", "តម្លៃរង់ចាំការទូទាត់")}
          value={formatMoney(pendingAmount, currency)}
          helper={tx(
            `${pendingPayouts.length} requests awaiting transfer`,
            `មាន ${pendingPayouts.length} សំណើរង់ចាំផ្ទេរ`,
          )}
          icon={<Clock3 className="size-5" />}
          accent="blue"
        />
        <StatCard
          label={tx("Total Settled (Paid)", "បានទូទាត់ជោគជ័យ (Paid)")}
          value={formatMoney(paidAmount, currency)}
          helper={tx(
            `${paidPayouts.length} transfers completed`,
            `បានបញ្ចប់ការផ្ទេរ ${paidPayouts.length} ដង`,
          )}
          icon={<CheckCircle2 className="size-5" />}
          accent="green"
        />
        <StatCard
          label={tx("Retained Commission (15%)", "កម្រៃជើងសារទទួលបាន (១៥%)")}
          value={formatMoney(totalCommissionRetained, currency)}
          helper={tx("Platform service revenue", "ចំណូលសេវារបស់ប្រព័ន្ធ")}
          icon={<CircleDollarSign className="size-5" />}
        />
      </div>

      {/* Settle via Bakong Modal */}
      <Dialog open={settleModalOpen} onOpenChange={setSettleModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {tx(
                "Settle Host Payout via Bakong",
                "ទូទាត់ប្រាក់ជូនម្ចាស់ផ្ទះតាម Bakong",
              )}
            </DialogTitle>
            <DialogDescription>
              {tx(
                "Enter the National Bank of Cambodia Bakong transaction reference or hash to confirm settlement.",
                "បញ្ចូលលេខកូដយោងប្រតិបត្តិការបាគង ឬ Hash ដើម្បីបញ្ជាក់ការទូទាត់។",
              )}
            </DialogDescription>
          </DialogHeader>

          {targetPayout && (
            <form onSubmit={handleSettlePayout} className="space-y-4 pt-2">
              <div className="rounded-xl border border-[#ded2c0] bg-[#fbf8f2] p-4 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-[#6d6155]">{tx("Payout ID:", "លេខកូដបើកប្រាក់:")}</span>
                  <strong className="font-mono text-[#815b29]">{targetPayout.id}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6d6155]">{tx("Booking:", "ការកក់:")}</span>
                  <strong>{targetPayout.bookingId}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6d6155]">{tx("Host Bakong Account:", "គណនីបាគងម្ចាស់ផ្ទះ:")}</span>
                  <strong className="font-mono text-[#322820]">{targetPayout.bakongAccount}</strong>
                </div>
                <div className="flex justify-between border-t border-[#e2d5c3] pt-2 text-sm font-extrabold text-[#1f4e38]">
                  <span>{tx("Net Transfer Amount:", "ចំនួនទឹកប្រាក់ត្រូវផ្ទេរ:")}</span>
                  <strong className="tabular">{formatMoney(targetPayout.netAmount, currency)}</strong>
                </div>
                <div className="text-[0.7rem] text-[#786b5f] text-right">
                  ≈ {(targetPayout.netAmount * exchangeRate).toLocaleString()} ៛ (NBC rate: {exchangeRate.toLocaleString()} KHR/USD)
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#6a5e53]">
                  {tx(
                    "Bakong Settlement Transaction Reference / Hash",
                    "លេខកូដយោងប្រតិបត្តិការ Bakong Transaction Reference",
                  )}
                </label>
                <Input
                  required
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder={tx(
                    "e.g., BKG-TXN-98410294 or Bakong Hash",
                    "ឧទាហរណ៍៖ BKG-TXN-98410294 ឬ Hash",
                  )}
                  className="mt-1 font-mono"
                />
              </div>

              <DialogFooter className="mt-5 flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setSettleModalOpen(false)}
                >
                  {tx("Cancel", "បោះបង់")}
                </Button>
                <Button type="submit" disabled={settling}>
                  {settling
                    ? tx("Confirming…", "កំពុងបញ្ជាក់…")
                    : tx("Confirm & Mark as Paid", "បញ្ជាក់ថាបានទូទាត់")}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Card className="mt-6">
        <div className="flex flex-col gap-3 border-b border-[#e8dece] p-4">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {["All", "Pending", "Processing", "Paid"].map((status) => (
              <Button
                key={status}
                size="sm"
                variant={tab === status ? "primary" : "ghost"}
                onClick={() => setTab(status)}
                className="shrink-0"
              >
                {status}
              </Button>
            ))}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="relative flex-1">
              <Search className="absolute left-3 top-3 size-4 text-[#837970]" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={tx(
                  "Search payout ID, booking, Bakong account or host…",
                  "ស្វែងរកលេខកូដបើកប្រាក់ ការកក់ គណនីបាគង ឬម្ចាស់ផ្ទះ…",
                )}
                className="min-h-11 w-full rounded-xl border border-[#ded2c0] bg-white pl-10 pr-3 text-sm"
              />
            </label>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#e8ded0] bg-[#f9f5ee] text-xs font-bold text-[#685c50]">
                <th className="px-5 py-3.5">{tx("Payout ID", "លេខកូដបើកប្រាក់")}</th>
                <th className="px-4 py-3.5">{tx("Booking ID", "ការកក់")}</th>
                <th className="px-4 py-3.5">{tx("Property & Host", "កន្លែងស្នាក់ និងម្ចាស់")}</th>
                <th className="px-4 py-3.5 text-right">{tx("Gross ($)", "តម្លៃសរុប")}</th>
                <th className="px-4 py-3.5 text-right text-[#a04747]">{tx("Fee (15%)", "កម្រៃ (១៥%)")}</th>
                <th className="px-4 py-3.5 text-right font-extrabold text-[#1f4e38]">{tx("Net Payout", "ចំណូលសុទ្ធ")}</th>
                <th className="px-4 py-3.5">{tx("Bakong Account", "គណនីបាគង")}</th>
                <th className="px-4 py-3.5">{tx("Status", "ស្ថានភាព")}</th>
                <th className="px-4 py-3.5">{tx("Reference / Hash", "លេខយោង")}</th>
                <th className="px-4 py-3.5 text-right">{tx("Action", "សកម្មភាព")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ece2d4]">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-[#fbf7f0] transition">
                  <td className="px-5 py-4 font-mono font-bold text-[#815b29]">
                    {item.id}
                  </td>
                  <td className="px-4 py-4 font-semibold text-[#453c34]">
                    {item.bookingId}
                  </td>
                  <td className="px-4 py-4">
                    <strong className="block text-[#322820]">
                      {item.propertyName || "Homestay"}
                    </strong>
                    <span className="text-xs text-[#776c60]">
                      {item.guestName || "Guest"}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right tabular font-bold">
                    {formatMoney(item.grossAmount, currency)}
                  </td>
                  <td className="px-4 py-4 text-right tabular text-[#a04747]">
                    -{formatMoney(item.commissionAmount, currency)}
                  </td>
                  <td className="px-4 py-4 text-right tabular font-extrabold text-[#1f4e38]">
                    {formatMoney(item.netAmount, currency)}
                  </td>
                  <td className="px-4 py-4">
                    <span className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-[#54493e]">
                      <WalletCards className="size-3 text-[#b58b44]" />
                      {item.bakongAccount}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="px-4 py-4 font-mono text-xs text-[#6e6358]">
                    {item.reference || "—"}
                  </td>
                  <td className="px-4 py-4 text-right">
                    {item.status !== "Paid" ? (
                      <Button
                        size="sm"
                        onClick={() => {
                          setTargetPayout(item);
                          setReference(item.reference || "");
                          setSettleModalOpen(true);
                        }}
                      >
                        <CheckCircle2 className="size-3.5" />
                        {tx("Settle", "ទូទាត់")}
                      </Button>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                        <CheckCircle2 className="size-3.5" />
                        {tx("Settled", "បានទូទាត់")}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-5 py-8 text-center text-[#786c60]">
                    {tx("No payout requests found.", "មិនមានសំណើបើកប្រាក់ត្រូវបានរកឃើញទេ។")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

type FinanceType = "payments" | "commissions" | "refunds";
function FinanceView({ type }: { type: FinanceType }) {
  const currency = useAppStore((state) => state.currency);
  const titles = {
    payments: [
      "Payments",
      "Mock transaction status and payment-method display.",
    ],
    commissions: [
      "Commissions",
      "Default and owner-specific demonstration commission rules.",
    ],
    payouts: [
      "Owner payouts",
      "Review local payout requests and demonstration decisions.",
    ],
    refunds: [
      "Refund requests",
      "Review mock reasons, amounts and decision timelines.",
    ],
  } as const;
  const [states, setStates] = useState<Record<string, string>>({});
  const columns = useMemo<ColumnDef<(typeof financeRows)[number]>[]>(
    () => [
      {
        accessorKey: "id",
        header: type === "refunds" ? "Request" : "Transaction",
      },
      { accessorKey: "booking", header: "Booking" },
      {
        accessorKey: "owner",
        header: "Owner",
        cell: ({ getValue }) => <strong>{getValue<string>()}</strong>,
      },
      {
        accessorKey: "amount",
        header: "Amount",
        cell: ({ getValue }) => formatMoney(getValue<number>(), currency),
      },
      {
        accessorKey: "commission",
        header: "Commission",
        cell: ({ getValue }) => formatMoney(getValue<number>(), currency),
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => (
          <StatusBadge
            status={states[row.original.id] || row.original.status}
          />
        ),
      },
      {
        id: "action",
        header: "",
        cell: ({ row }) => (
          <ConfirmDialog
            trigger={
              <Button variant="ghost" size="sm">
                Review
              </Button>
            }
            title={`${type === "refunds" ? "Approve refund" : "Update transaction"}?`}
            description="This is local demonstration financial data. No money will move."
            confirmLabel="Approve demo"
            onConfirm={() => {
              setStates((value) => ({
                ...value,
                [row.original.id]: "Approved",
              }));
              toast.success("Demo financial status updated");
            }}
          />
        ),
      },
    ],
    [currency, states, type],
  );
  return (
    <div>
      <PageHeader
        eyebrow="Finance · local demo"
        title={titles[type][0]}
        description={titles[type][1]}
        actions={
          type === "commissions" ? (
            <Button
              onClick={() => toast.success("Commission schedule saved locally")}
            >
              <Save className="size-4" />
              Save schedule
            </Button>
          ) : (
            <ExportButton />
          )
        }
      />
      <AlertBanner
        title="Mock financial information — no real transactions will occur."
        tone="info"
      >
        No banking, PayWay, KHQR, gateway, payout, refund or billing service is
        connected.
      </AlertBanner>
      {type === "commissions" ? (
        <CommissionPanel />
      ) : (
        <>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <StatCard
              label={type === "refunds" ? "Requested" : "Processed value"}
              value={formatMoney(type === "refunds" ? 1480 : 21860, currency)}
              icon={<CircleDollarSign className="size-5" />}
            />
            <StatCard
              label="Pending"
              value={type === "refunds" ? "4" : "8"}
              icon={<Clock3 className="size-5" />}
              accent="blue"
            />
            <StatCard
              label="Failed"
              value={type === "refunds" ? "1" : "3"}
              icon={<XCircle className="size-5" />}
              accent="rose"
            />
          </div>
          <Card className="mt-5">
            <DemoTable data={financeRows} columns={columns} />
            <Pagination total={3} />
          </Card>
        </>
      )}
    </div>
  );
}
function CommissionPanel() {
  const commission = useDemoStore((state) =>
    Number(state.settings.commission || 15),
  );
  const update = useDemoStore((state) => state.updateSetting);
  return (
    <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_360px]">
      <Card className="p-5 sm:p-6">
        <h2 className="font-extrabold">Commission rules</h2>
        <label className="mt-5 block">
          <span className="mb-2 block text-sm font-bold">
            Default platform commission (%)
          </span>
          <Input
            type="number"
            value={commission}
            onChange={(e) => update("commission", Number(e.target.value))}
            className="form-input max-w-xs"
          />
        </label>
        <h3 className="mt-7 font-extrabold">Owner-specific rates</h3>
        <div className="mt-3 space-y-3">
          {owners.slice(0, 4).map((owner, index) => (
            <div
              key={owner.id}
              className="flex flex-wrap items-center gap-3 rounded-xl border border-[#e1d4c2] bg-white p-3"
            >
              <span className="min-w-48 flex-1 text-sm font-bold">
                {owner.name}
              </span>
              <Input
                aria-label={`${owner.name} commission`}
                type="number"
                defaultValue={index === 0 ? 12 : commission}
                className="form-input w-24"
              />
              <StatusBadge status="Active" />
            </div>
          ))}
        </div>
      </Card>
      <Card className="self-start p-5">
        <h2 className="font-extrabold">Revenue breakdown</h2>
        <div className="mt-4">
          <p className="text-sm text-[#776d64]">Current default</p>
          <p className="tabular mt-1 text-4xl font-extrabold">{commission}%</p>
          <p className="mt-4 text-sm leading-6 text-[#6f665e]">
            Effective date: immediately in local demo state. Historical
            calculations remain unchanged.
          </p>
        </div>
      </Card>
    </div>
  );
}

function ModerationView({ active }: { active: string }) {
  const [hidden, setHidden] = useState<string[]>([]);
  const [selected, setSelected] = useState(reviews[0]);
  return (
    <div>
      <PageHeader
        eyebrow="Trust & safety"
        title={active === "reports" ? "Reports" : "Review moderation"}
        description="Assess flagged reviews and user, owner or property reports with local demonstration evidence."
      />
      <div className="grid gap-5 xl:grid-cols-[1fr_370px]">
        <div>
          <SearchFilters
            query=""
            setQuery={() => {}}
            placeholder="Search review or report"
          />
          <div className="space-y-3">
            {reviews.map((review) => (
              <Card
                key={review.id}
                className={cn(
                  "p-4",
                  hidden.includes(review.id) && "opacity-55",
                )}
              >
                <div className="flex flex-wrap items-start gap-3">
                  <span className="grid size-10 place-items-center rounded-full bg-[#eee3d3] text-xs font-extrabold">
                    {review.guest
                      .split(" ")
                      .map((part) => part[0])
                      .join("")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <strong>{review.guest}</strong>
                      <span className="text-sm text-[#a77734]">
                        {review.rating} ★
                      </span>
                      {review.rating <= 3 && <StatusBadge status="Flagged" />}
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[#655c54]">
                      {review.text}
                    </p>
                    <p className="mt-2 text-xs text-[#7b7168]">
                      {review.property} · {review.date}
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setSelected(review)}
                  >
                    Review
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
        <Card className="self-start p-5">
          <h2 className="font-extrabold">Moderation detail</h2>
          <p className="mt-1 text-xs text-[#776d64]">
            {selected.id} · {selected.guest}
          </p>
          <div className="mt-4 rounded-xl border border-[#e2d5c3] bg-white p-4">
            <p className="text-sm leading-6">{selected.text}</p>
          </div>
          <label className="mt-4 block">
            <span className="mb-2 block text-sm font-bold">Admin notes</span>
            <Textarea
              className="form-input min-h-24"
              placeholder="Document your decision"
            />
          </label>
          <div className="mt-4 grid gap-2">
            <Button onClick={() => toast.success("Report dismissed locally")}>
              Dismiss
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setHidden((values) => [...values, selected.id]);
                toast.success("Review hidden locally");
              }}
            >
              Hide review
            </Button>
            <Button
              variant="secondary"
              onClick={() => toast.info("Warning recorded locally")}
            >
              Warn user
            </Button>
            <Button
              variant="danger"
              onClick={() => toast.info("Report escalated locally")}
            >
              Escalate
            </Button>
          </div>
          <div className="mt-5">
            <SimpleTimeline
              rows={[
                ["Report received", "Sep 2 · Traveler"],
                ["Assigned to Maly", "Sep 3 · 09:18"],
                ["Awaiting decision", "Current"],
              ]}
            />
          </div>
        </Card>
      </div>
    </div>
  );
}

function PromotionsView() {
  const promotions = useDemoStore((state) => state.promotions);
  const add = useDemoStore((state) => state.addPromotion);
  const [open, setOpen] = useState(false);
  return (
    <div>
      <PageHeader
        eyebrow="Growth"
        title="Promotions & coupons"
        description="Create local percentage or fixed discounts and preview their impact."
        actions={
          <Button onClick={() => setOpen((value) => !value)}>
            <Plus className="size-4" />
            Add promotion
          </Button>
        }
      />
      {open && (
        <Card className="mb-5 p-5">
          <h2 className="font-extrabold">New promotion</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <label>
              <span className="mb-2 block text-sm font-bold">Name</span>
              <Input
                id="promo-name"
                className="form-input"
                placeholder="Weekend escape"
              />
            </label>
            <label>
              <span className="mb-2 block text-sm font-bold">Coupon code</span>
              <Input
                id="promo-code"
                className="form-input"
                placeholder="ESCAPE15"
              />
            </label>
            <label>
              <span className="mb-2 block text-sm font-bold">Discount</span>
              <Input className="form-input" defaultValue="15%" />
            </label>
          </div>
          <Button
            className="mt-4"
            onClick={() => {
              const name =
                (document.getElementById("promo-name") as HTMLInputElement)
                  ?.value || "New promotion";
              const code =
                (document.getElementById("promo-code") as HTMLInputElement)
                  ?.value || "DEMO15";
              add({
                id: `PR-${Date.now()}`,
                name,
                code,
                value: "15%",
                dates: "Sep 10–30",
                usage: "0 / 100",
                status: "Active",
              });
              setOpen(false);
              toast.success("Promotion created locally");
            }}
          >
            Create promotion
          </Button>
        </Card>
      )}
      <Card>
        {promotions.map((promo) => (
          <div
            key={promo.id}
            className="grid gap-3 border-b border-[#ece2d4] p-4 last:border-0 sm:grid-cols-[1fr_130px_110px_130px_auto] sm:items-center"
          >
            <div>
              <strong className="block">{promo.name}</strong>
              <span className="text-xs text-[#776d64]">{promo.dates}</span>
            </div>
            <code className="rounded-lg bg-[#f2e8d9] px-2 py-1 text-center text-xs font-bold">
              {promo.code}
            </code>
            <span className="tabular font-extrabold">{promo.value}</span>
            <span className="text-sm text-[#776d64]">{promo.usage}</span>
            <div className="flex items-center gap-2">
              <StatusBadge status={promo.status} />
              <Button variant="ghost" size="icon">
                <Edit3 className="size-4" />
              </Button>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}

function CatalogView() {
  const [tab, setTab] = useState("Property types");
  const [items, setItems] = useState([
    "Homestay",
    "Guesthouse",
    "Boutique stay",
    "Eco lodge",
    "Wooden house",
  ]);
  const tabs = [
    "Property types",
    "Amenities",
    "Provinces",
    "Popular destinations",
    "Cancellation policies",
    "Rejection reasons",
  ];
  return (
    <div>
      <PageHeader
        eyebrow="Marketplace configuration"
        title="Catalog"
        description="Manage bilingual labels, order and availability in local demonstration data."
        actions={
          <Button
            onClick={() => {
              setItems((value) => [...value, "New catalog item"]);
              toast.success("Catalog item added locally");
            }}
          >
            <Plus className="size-4" />
            Add item
          </Button>
        }
      />
      <div className="mb-5 flex gap-2 overflow-x-auto scrollbar-thin">
        {tabs.map((item) => (
          <Button
            key={item}
            size="sm"
            variant={tab === item ? "primary" : "ghost"}
            onClick={() => setTab(item)}
            className="shrink-0"
          >
            {item}
          </Button>
        ))}
      </div>
      <Card>
        <div className="grid grid-cols-[44px_1fr_1fr_110px_80px] gap-3 border-b border-[#e5dac8] px-4 py-3 text-xs font-extrabold uppercase tracking-wide text-[#7b7168]">
          <span>Order</span>
          <span>English</span>
          <span>Khmer</span>
          <span>Status</span>
          <span>Actions</span>
        </div>
        {items.map((item, index) => (
          <div
            key={`${item}-${index}`}
            className="grid grid-cols-[44px_1fr_1fr_110px_80px] items-center gap-3 border-b border-[#eee5d8] px-4 py-3 last:border-0"
          >
            <span className="grid size-8 place-items-center rounded-lg bg-[#f2e8d9] text-xs font-extrabold">
              {index + 1}
            </span>
            <Input
              className="min-h-10 rounded-lg border border-[#ded2c0] px-3 text-sm"
              value={item}
              onChange={(e) =>
                setItems((values) =>
                  values.map((value, i) =>
                    i === index ? e.target.value : value,
                  ),
                )
              }
            />
            <Input
              className="khmer min-h-10 rounded-lg border border-[#ded2c0] px-3 text-sm"
              defaultValue={
                [
                  "ផ្ទះស្នាក់",
                  "ផ្ទះសំណាក់",
                  "ផ្ទះស្នាក់ប៊ូទិក",
                  "ផ្ទះសំណាក់ធម្មជាតិ",
                  "ផ្ទះឈើ",
                ][index] || "ធាតុថ្មី"
              }
            />
            <StatusBadge status="Active" />
            <div className="flex">
              <Button variant="ghost" size="icon" aria-label="Reorder">
                <SlidersHorizontal className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  setItems((values) => values.filter((_, i) => i !== index))
                }
                aria-label="Delete"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}

function ContentView() {
  const [tab, setTab] = useState("Homepage banners");
  const tabs = [
    "Homepage banners",
    "Featured destinations",
    "Promotional cards",
    "Help articles",
    "Terms & policies",
    "About KhmerStay",
  ];
  return (
    <div>
      <PageHeader
        eyebrow="Local content prototype"
        title="Content"
        description="Edit bilingual demonstration content, preview changes and control draft status."
        actions={
          <Button
            onClick={() => toast.success("Content changes saved locally")}
          >
            <Save className="size-4" />
            Save content
          </Button>
        }
      />
      <AlertBanner title="Local UI prototype" tone="info">
        This is not a real content management system and does not publish
        externally.
      </AlertBanner>
      <div className="mt-5 grid gap-5 xl:grid-cols-[260px_1fr]">
        <Card className="self-start p-2">
          {tabs.map((item) => (
            <Button
              variant="ghost"
              key={item}
              onClick={() => setTab(item)}
              className={cn(
                "min-h-11 w-full rounded-xl px-3 text-left text-sm font-bold",
                tab === item ? "bg-[#2b2118] text-white" : "hover:bg-[#f5ede1]",
              )}
            >
              {item}
            </Button>
          ))}
        </Card>
        <Card className="p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-extrabold">{tab}</h2>
              <p className="mt-1 text-sm text-[#776d64]">
                Khmer and English demonstration content
              </p>
            </div>
            <StatusBadge status="Draft" />
          </div>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <label>
              <span className="mb-2 block text-sm font-bold">
                English title
              </span>
              <Input
                className="form-input"
                defaultValue="Stay closer to Cambodia"
              />
            </label>
            <label>
              <span className="mb-2 block text-sm font-bold">Khmer title</span>
              <Input
                className="form-input khmer"
                defaultValue="ស្នាក់នៅជិតស្និទ្ធនឹងកម្ពុជា"
              />
            </label>
            <label className="sm:col-span-2">
              <span className="mb-2 block text-sm font-bold">English body</span>
              <Textarea
                className="form-input min-h-32"
                defaultValue="Discover thoughtful local stays, welcoming hosts and places with a story."
              />
            </label>
            <label className="sm:col-span-2">
              <span className="mb-2 block text-sm font-bold">Khmer body</span>
              <Textarea
                className="form-input khmer min-h-32"
                defaultValue="ស្វែងរកកន្លែងស្នាក់នៅក្នុងស្រុក ម្ចាស់ផ្ទះរួសរាយ និងទីកន្លែងដែលមានរឿងរ៉ាវ។"
              />
            </label>
          </div>
          <div className="mt-5 flex gap-2">
            <Button
              onClick={() =>
                toast.success("Content published in local preview")
              }
            >
              Publish demo
            </Button>
            <Button
              variant="secondary"
              onClick={() => toast.info("Content preview opened")}
            >
              <Eye className="size-4" />
              Preview
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

function SupportView() {
  return <ChatWorkspace mode="admin" />;
}

function NotificationsView() {
  const read = useAppStore((state) => state.notificationsRead);
  const mark = useAppStore((state) => state.markNotificationRead);
  const rows = notifications.filter((item) => item.role === "admin");
  return (
    <div>
      <PageHeader
        eyebrow="Operations updates"
        title="Notifications"
        description="Verification, property, report, refund, support and payout alerts."
        actions={
          <Button
            variant="secondary"
            onClick={() => rows.forEach((item) => mark(item.id))}
          >
            Mark all as read
          </Button>
        }
      />
      <Card>
        {rows.map((item) => (
          <Button
            variant="ghost"
            key={item.id}
            onClick={() => mark(item.id)}
            className={cn(
              "flex w-full items-start gap-4 border-b border-[#ebe2d5] p-5 text-left last:border-0 hover:bg-[#fbf6ee]",
              !read.includes(item.id) && "bg-[#fffaf0]",
            )}
          >
            <span
              className={cn(
                "mt-1 size-3 rounded-full",
                read.includes(item.id) ? "bg-[#d8cfc3]" : "bg-[#b88a44]",
              )}
            />
            <span className="flex-1">
              <span className="flex items-center gap-2">
                <strong>{item.title}</strong>
                <StatusBadge status={item.category} />
              </span>
              <span className="mt-1 block text-sm text-[#756d66]">
                {item.detail}
              </span>
            </span>
            <small>{item.time}</small>
          </Button>
        ))}
      </Card>
    </div>
  );
}

function AuditLogsView() {
  const [query, setQuery] = useState("");
  const filtered = auditLogs.filter((item) =>
    `${item.admin} ${item.action} ${item.resource}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  const columns = useMemo<ColumnDef<(typeof auditLogs)[number]>[]>(
    () => [
      { accessorKey: "time", header: "Timestamp" },
      {
        accessorKey: "admin",
        header: "Admin",
        cell: ({ getValue }) => <strong>{getValue<string>()}</strong>,
      },
      { accessorKey: "action", header: "Action" },
      { accessorKey: "resource", header: "Resource" },
      {
        accessorKey: "previous",
        header: "Previous",
        cell: ({ getValue }) => <StatusBadge status={getValue<string>()} />,
      },
      {
        accessorKey: "next",
        header: "New",
        cell: ({ getValue }) => <StatusBadge status={getValue<string>()} />,
      },
      { accessorKey: "ip", header: "Mock IP" },
      {
        id: "detail",
        header: "",
        cell: () => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toast.info("Audit detail opened")}
          >
            Details
          </Button>
        ),
      },
    ],
    [],
  );
  return (
    <div>
      <PageHeader
        eyebrow="System"
        title="Audit logs"
        description="Inspect local demonstration administrator actions and status changes."
        actions={<ExportButton />}
      />
      <SearchFilters
        query={query}
        setQuery={setQuery}
        placeholder="Search action, admin or resource"
      />
      <Card>
        <DemoTable data={filtered} columns={columns} />
        <Pagination total={1} />
      </Card>
    </div>
  );
}

function SettingsView() {
  const settings = useDemoStore((state) => state.settings);
  const update = useDemoStore((state) => state.updateSetting);
  const [tab, setTab] = useState("General");
  const tabs = [
    "General",
    "Booking",
    "Commission",
    "Cancellation",
    "Currency & language",
    "Notifications",
    "Maintenance",
    "Features",
    "Demo payments",
  ];
  return (
    <div>
      <PageHeader
        eyebrow="Platform configuration"
        title="Settings"
        description="Update local demonstration platform preferences and feature displays."
        actions={
          <Button
            onClick={() => toast.success("Platform settings saved locally")}
          >
            <Save className="size-4" />
            Save settings
          </Button>
        }
      />
      <div className="grid gap-5 xl:grid-cols-[260px_1fr]">
        <Card className="self-start p-2">
          {tabs.map((item) => (
            <Button
              variant="ghost"
              key={item}
              onClick={() => setTab(item)}
              className={cn(
                "min-h-11 w-full rounded-xl px-3 text-left text-sm font-bold",
                tab === item ? "bg-[#2b2118] text-white" : "hover:bg-[#f5ede1]",
              )}
            >
              {item}
            </Button>
          ))}
        </Card>
        <Card className="p-5 sm:p-6">
          <h2 className="text-lg font-extrabold">{tab} settings</h2>
          <p className="mt-1 text-sm text-[#776d64]">
            All changes remain in local browser storage.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label>
              <span className="mb-2 block text-sm font-bold">
                Platform name
              </span>
              <Input className="form-input" defaultValue="KhmerStay" />
            </label>
            <label>
              <span className="mb-2 block text-sm font-bold">
                Contact email
              </span>
              <Input
                className="form-input"
                defaultValue="support@khmerstay.demo"
              />
            </label>
            <label>
              <span className="mb-2 block text-sm font-bold">
                Default commission (%)
              </span>
              <Input
                type="number"
                value={Number(settings.commission || 15)}
                onChange={(e) => update("commission", Number(e.target.value))}
                className="form-input"
              />
            </label>
            <div>
              <span className="mb-2 block text-sm font-bold">
                Currency display
              </span>
              <Select defaultValue="usd">
                <SelectTrigger className="form-input w-full min-h-10 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="usd">USD with KHR reference</SelectItem>
                  <SelectItem value="khr">KHR with USD reference</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-6 space-y-3">
            {[
              ["maintenance", "Maintenance banner"],
              ["instantBooking", "Instant booking display"],
              ["payouts", "Demo payouts"],
            ].map(([key, label]) => (
              <label
                key={key}
                className="flex items-center justify-between rounded-xl border border-[#e1d5c3] bg-white p-4 text-sm font-bold"
              >
                <span>{label}</span>
                <Input
                  type="checkbox"
                  checked={Boolean(settings[key])}
                  onChange={(e) => update(key, e.target.checked)}
                  className="size-5 accent-[#9b6e31]"
                />
              </label>
            ))}
          </div>
          {tab === "Demo payments" && (
            <AlertBanner title="Display only" tone="info">
              No payment gateway, API key, environment variable, billing service
              or bank connection exists.
            </AlertBanner>
          )}
        </Card>
      </div>
    </div>
  );
}

function AdminAccountView() {
  const [twoFactor, setTwoFactor] = useState(false);
  return (
    <div>
      <PageHeader
        eyebrow="Administrator profile"
        title="Account"
        description="Manage personal details, preferences and local security demonstrations."
      />
      <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
        <Card className="p-5 sm:p-6">
          <h2 className="font-extrabold">Personal information</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label>
              <span className="mb-2 block text-sm font-bold">Full name</span>
              <Input className="form-input" defaultValue="Maly Vong" />
            </label>
            <label>
              <span className="mb-2 block text-sm font-bold">Role</span>
              <Input
                className="form-input"
                value="Platform administrator"
                disabled
              />
            </label>
            <label>
              <span className="mb-2 block text-sm font-bold">Email</span>
              <Input
                className="form-input"
                defaultValue="admin@khmerstay.demo"
              />
            </label>
            <label>
              <span className="mb-2 block text-sm font-bold">Phone</span>
              <Input className="form-input" defaultValue="+855 10 456 789" />
            </label>
          </div>
          <Button
            className="mt-5"
            onClick={() => toast.success("Administrator profile saved locally")}
          >
            <Save className="size-4" />
            Save profile
          </Button>
        </Card>
        <div className="space-y-5">
          <Card className="p-5">
            <h2 className="font-extrabold">Security · demo</h2>
            <label className="mt-4 flex items-center justify-between rounded-xl border border-[#e1d5c3] p-4 text-sm font-bold">
              Two-step verification
              <Input
                type="checkbox"
                checked={twoFactor}
                onChange={(e) => setTwoFactor(e.target.checked)}
                className="size-5 accent-[#9b6e31]"
              />
            </label>
            <Button
              variant="secondary"
              className="mt-3 w-full"
              onClick={() => toast.info("Password-change form opened")}
            >
              Change password
            </Button>
          </Card>
          <Card className="p-5">
            <h2 className="font-extrabold">Session</h2>
            <p className="mt-2 text-sm text-[#776d64]">
              Local desktop · Phnom Penh · active now
            </p>
            <StatusBadge status="Active" />
          </Card>
        </div>
      </div>
    </div>
  );
}
