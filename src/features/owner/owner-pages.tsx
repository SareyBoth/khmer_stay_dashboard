"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import { format } from "date-fns";
import type { ColumnDef } from "@tanstack/react-table";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowLeft,
  ArrowRight,
  BedDouble,
  Bell,
  BookOpenCheck,
  CalendarDays,
  Camera,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Copy,
  Edit3,
  Eye,
  FileCheck2,
  Filter,
  Grid2X2,
  Home,
  ImagePlus,
  List,
  MapPin,
  MessageCircle,
  MoreHorizontal,
  Plus,
  Save,
  Search,
  Send,
  Settings2,
  Star,
  ToggleLeft,
  Trash2,
  TrendingUp,
  Upload,
  WalletCards,
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
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  bookings,
  financeRows,
  formatMoney,
  monthlyAnalytics,
  notifications,
  properties as seedProperties,
  reviews,
} from "@/src/lib/mock-data";
import { useAppStore } from "@/src/stores/app-store";
import { useDemoStore } from "@/src/stores/demo-store";
import type {
  Booking,
  BookingStatus,
  Payout,
  Property,
  PropertyStatus,
} from "@/src/types";
import { filterProperties } from "@/src/lib/filters";
import {
  API_URL,
  api,
  json,
  getPayouts,
  requestPayout,
  createBooking,
  formatBookingConflict,
} from "@/src/lib/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RoomManagementLive } from "./room-management-live";
import { ReviewsLive } from "./reviews-live";
import { PropertyEditorLive } from "./property-editor-live";
import { LiveDashboard } from "../live-dashboard";
import { BookingDetailLive } from "../booking-detail-live";
import { ChatWorkspace } from "../chat/chat-workspace";

const statusOptions: BookingStatus[] = [
  "New request",
  "Pending",
  "Confirmed",
  "Checked in",
  "Completed",
  "Cancelled",
  "Declined",
  "No-show",
];
const propertySchema = z.object({
  nameKm: z.string().min(2, "Khmer name is required"),
  name: z.string().min(3, "English name is required"),
  type: z.string().min(1, "Choose a property type"),
  province: z.string().min(1, "Choose a province"),
  summary: z.string().min(20, "Add at least 20 characters"),
});
type PropertyForm = z.infer<typeof propertySchema>;

function useText() {
  const language = useAppStore((state) => state.language);
  return {
    language,
    isKhmer: language === "km",
    tx: (english: string, khmer: string) =>
      language === "km" ? khmer : english,
  };
}

export function OwnerPages({ segments = [] }: { segments?: string[] }) {
  const [section, id, action] = segments;
  if (!section) return <LiveDashboard portal="owner" />;
  if (section === "properties") {
    if (id === "new") return <PropertyEditorLive />;
    if (id && action === "edit") return <PropertyEditorLive propertyId={id} />;
    if (id && action === "rooms") return <RoomManagementLive propertyId={id} />;
    if (id) return <PropertyDetail propertyId={id} />;
    return <PropertiesView />;
  }
  if (section === "bookings")
    return id ? (
      <BookingDetailLive bookingId={id} portal="owner" />
    ) : (
      <BookingsView />
    );
  if (section === "calendar") return <CalendarView />;
  if (section === "pricing") return <PricingView />;
  if (section === "earnings") return <EarningsView />;
  if (section === "payouts") return <PayoutsView />;
  if (section === "reviews") return <ReviewsLive />;
  if (section === "messages") return <MessagesView />;
  if (section === "analytics") return <AnalyticsView />;
  if (section === "notifications") return <NotificationsView />;
  if (section === "verification") return <VerificationView />;
  if (section === "account") return <OwnerAccountView />;
  return (
    <EmptyState
      title="Page not found"
      description="This owner workspace page is not available in the demo."
      action={
        <Link href="/owner">
          <Button>Return to dashboard</Button>
        </Link>
      }
    />
  );
}

function OwnerDashboard() {
  const { tx } = useText();
  const currency = useAppStore((state) => state.currency);
  const bookingStatuses = useDemoStore((state) => state.bookingStatuses);
  const activeRequests = Object.values(bookingStatuses).filter(
    (status) => status === "New request",
  ).length;
  return (
    <div>
      <PageHeader
        eyebrow={tx("Owner Portal", "ផ្នែកម្ចាស់ផ្ទះ")}
        title={tx("Good morning, Sokha", "អរុណសួស្តី សុខា")}
        description={tx(
          "Here’s what needs your attention across your stays today.",
          "នេះជាការងារដែលត្រូវការការយកចិត្តទុកដាក់សម្រាប់កន្លែងស្នាក់របស់អ្នកថ្ងៃនេះ។",
        )}
        actions={
          <>
            <Select defaultValue="30d">
              <SelectTrigger
                aria-label="Date range"
                className="min-h-11 w-40 rounded-xl border-[#d9ccb9] bg-white text-sm font-bold shadow-2xs"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="quarter">This quarter</SelectItem>
              </SelectContent>
            </Select>
            <Link href="/owner/properties/new">
              <Button>
                <Plus className="size-4" />
                {tx("Add property", "បន្ថែមកន្លែង")}
              </Button>
            </Link>
          </>
        }
      />
      <AlertBanner
        title={tx(
          "Verification is almost complete",
          "ការផ្ទៀងផ្ទាត់ជិតរួចរាល់",
        )}
        action={
          <Link href="/owner/verification">
            <Button variant="secondary" size="sm">
              {tx("Review details", "ពិនិត្យព័ត៌មាន")}
            </Button>
          </Link>
        }
      >
        {tx(
          "Add one business document to unlock scheduled demo payouts.",
          "បន្ថែមឯកសារអាជីវកម្មមួយ ដើម្បីបើកការបើកប្រាក់សាកល្បង។",
        )}
      </AlertBanner>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label={tx("Total revenue", "ចំណូលសរុប")}
          value={formatMoney(12480, currency)}
          helper="+12.4% vs last month"
          icon={<CircleDollarSign className="size-5" />}
        />
        <StatCard
          label={tx("Upcoming earnings", "ចំណូលនាពេលខាងមុខ")}
          value={formatMoney(2180, currency)}
          helper="8 confirmed stays"
          icon={<WalletCards className="size-5" />}
          accent="green"
        />
        <StatCard
          label={tx("Occupancy", "អត្រាមានភ្ញៀវ")}
          value="78%"
          helper="+5.2% this month"
          icon={<TrendingUp className="size-5" />}
          accent="blue"
        />
        <StatCard
          label={tx("Bookings", "ការកក់")}
          value="127"
          helper={`${activeRequests} need a reply`}
          icon={<BookOpenCheck className="size-5" />}
          accent="rose"
        />
        <StatCard
          label={tx("Average rating", "ពិន្ទុមធ្យម")}
          value="4.8"
          helper="96 guest reviews"
          icon={<Star className="size-5" />}
        />
      </div>
      <div className="mt-5 grid gap-5 xl:grid-cols-[1.45fr_0.85fr]">
        <ChartCard
          title={tx("Earnings & bookings", "ចំណូល និងការកក់")}
          subtitle={tx("Six-month performance", "លទ្ធផលរយៈពេលប្រាំមួយខែ")}
        >
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart
              data={monthlyAnalytics}
              margin={{ left: -18, right: 8, top: 10 }}
            >
              <defs>
                <linearGradient id="ownerRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#b88a44" stopOpacity={0.34} />
                  <stop offset="100%" stopColor="#b88a44" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                stroke="#eadfce"
                strokeDasharray="4 4"
                vertical={false}
              />
              <XAxis
                dataKey="month"
                tick={{ fill: "#776d64", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#776d64", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: "1px solid #e2d4c0" }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#a67735"
                strokeWidth={2.5}
                fill="url(#ownerRevenue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-extrabold">{tx("Today", "ថ្ងៃនេះ")}</h2>
              <p className="mt-1 text-sm text-[#786e65]">4 September 2026</p>
            </div>
            <CalendarDays className="size-5 text-[#9a6d31]" />
          </div>
          <div className="mt-5 space-y-3">
            <TodayItem
              label={tx("Arrivals", "ភ្ញៀវចូល")}
              value="3"
              names="Sreyneang, Piseth +1"
              color="green"
            />
            <TodayItem
              label={tx("Departures", "ភ្ញៀវចេញ")}
              value="2"
              names="Ratha, Chenda"
              color="blue"
            />
            <TodayItem
              label={tx("Pending requests", "សំណើរង់ចាំ")}
              value={String(activeRequests)}
              names="Respond within 3 hours"
              color="rose"
            />
          </div>
        </Card>
      </div>
      <div className="mt-5 grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
        <Card>
          <div className="flex items-center justify-between p-5">
            <div>
              <h2 className="font-extrabold">
                {tx("Recent reservations", "ការកក់ថ្មីៗ")}
              </h2>
              <p className="mt-1 text-sm text-[#786e65]">
                {tx(
                  "Latest activity across your properties",
                  "សកម្មភាពថ្មីៗនៅកន្លែងស្នាក់របស់អ្នក",
                )}
              </p>
            </div>
            <Link
              href="/owner/bookings"
              className="text-sm font-bold text-[#8e652c]"
            >
              {tx("View all", "មើលទាំងអស់")}
            </Link>
          </div>
          <RecentBookingList rows={bookings.slice(0, 5)} />
        </Card>
        <Card className="p-5">
          <h2 className="font-extrabold">
            {tx("Quick actions", "សកម្មភាពរហ័ស")}
          </h2>
          <div className="mt-4 grid gap-2">
            <QuickLink
              href="/owner/properties/new"
              icon={<Plus />}
              label={tx("Add a property", "បន្ថែមកន្លែងស្នាក់")}
            />
            <QuickLink
              href="/owner/calendar"
              icon={<CalendarDays />}
              label={tx("Update calendar", "កែប្រតិទិន")}
            />
            <QuickLink
              href="/owner/pricing"
              icon={<TagsIcon />}
              label={tx("Change pricing", "កែតម្លៃ")}
            />
            <QuickLink
              href="/owner/messages"
              icon={<MessageCircle />}
              label={tx("Message a guest", "ផ្ញើសារទៅភ្ញៀវ")}
            />
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
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="font-extrabold">{title}</h2>
          <p className="mt-1 text-sm text-[#786e65]">{subtitle}</p>
        </div>
        <Button variant="ghost" size="icon" aria-label="Chart options">
          <MoreHorizontal className="size-5" />
        </Button>
      </div>
      {children}
    </Card>
  );
}
function TodayItem({
  label,
  value,
  names,
  color,
}: {
  label: string;
  value: string;
  names: string;
  color: "green" | "blue" | "rose";
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-[#ebe1d3] p-3">
      <span
        className={cn(
          "grid size-10 place-items-center rounded-xl text-sm font-extrabold",
          color === "green" && "bg-[#e7f1ea] text-[#3c7a57]",
          color === "blue" && "bg-[#e8f0f4] text-[#547a91]",
          color === "rose" && "bg-[#f8eae5] text-[#a75f49]",
        )}
      >
        {value}
      </span>
      <div>
        <p className="text-sm font-extrabold">{label}</p>
        <p className="text-xs text-[#7c7269]">{names}</p>
      </div>
    </div>
  );
}
function QuickLink({
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
      className="flex min-h-12 items-center gap-3 rounded-xl border border-[#e8dece] bg-white px-3 text-sm font-bold transition hover:border-[#cfae75] hover:bg-[#fcf7ee]"
    >
      <span className="grid size-8 place-items-center rounded-lg bg-[#f2e8d8] text-[#91662d] [&>svg]:size-4">
        {icon}
      </span>
      {label}
      <ArrowRight className="ml-auto size-4 text-[#92877d]" />
    </Link>
  );
}
function TagsIcon() {
  return <Settings2 className="size-4" />;
}

function RecentBookingList({ rows }: { rows: Booking[] }) {
  const statuses = useDemoStore((state) => state.bookingStatuses);
  return (
    <div>
      {rows.map((booking) => (
        <Link
          key={booking.id}
          href={`/owner/bookings/${booking.id}`}
          className="flex flex-wrap items-center gap-3 border-t border-[#eee5d8] px-5 py-3.5 transition hover:bg-[#fcf7ef]"
        >
          <span className="grid size-9 place-items-center rounded-full bg-[#efe5d6] text-xs font-extrabold">
            {booking.guest
              .split(" ")
              .map((part) => part[0])
              .join("")}
          </span>
          <span className="min-w-44 flex-1">
            <span className="block text-sm font-extrabold">
              {booking.guest}
            </span>
            <span className="block truncate text-xs text-[#7b7168]">
              {booking.property}
            </span>
          </span>
          <span className="hidden text-right text-xs text-[#70675f] sm:block">
            <span className="block font-bold">{booking.checkIn}</span>
            <span>{booking.guests} guests</span>
          </span>
          <StatusBadge status={statuses[booking.id] || booking.status} />
        </Link>
      ))}
    </div>
  );
}

function PropertiesView() {
  const { tx } = useText();
  const currency = useAppStore((state) => state.currency);
  const properties = useDemoStore((state) => state.properties);
  const statuses = useDemoStore((state) => state.propertyStatuses);
  const updateStatus = useDemoStore((state) => state.updatePropertyStatus);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [grid, setGrid] = useState(true);
  const filtered = filterProperties(properties, query, filter, statuses);
  return (
    <div>
      <PageHeader
        eyebrow={tx("Portfolio", "បញ្ជីកន្លែងស្នាក់")}
        title={tx("Your properties", "កន្លែងស្នាក់របស់អ្នក")}
        description={tx(
          "Manage listings, rooms, availability and publishing status.",
          "គ្រប់គ្រងបញ្ជី បន្ទប់ ភាពទំនេរ និងស្ថានភាពផ្សាយ។",
        )}
        actions={
          <Link href="/owner/properties/new">
            <Button>
              <Plus className="size-4" />
              {tx("Add property", "បន្ថែមកន្លែង")}
            </Button>
          </Link>
        }
      />
      <Card className="mb-5 p-3">
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="relative flex-1">
            <Search className="absolute left-3 top-3 size-4 text-[#80766d]" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search properties"
              placeholder={tx("Search properties…", "ស្វែងរកកន្លែងស្នាក់...")}
              className="min-h-11 w-full rounded-xl border border-[#ded2c0] bg-white pl-10 pr-3 text-sm"
            />
          </label>
          <Select value={filter} onValueChange={(val) => setFilter(val)}>
            <SelectTrigger
              aria-label="Property status"
              className="min-h-11 w-44 rounded-xl border-[#ded2c0] bg-white text-sm font-bold shadow-2xs"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All</SelectItem>
              <SelectItem value="Published">Published</SelectItem>
              <SelectItem value="Draft">Draft</SelectItem>
              <SelectItem value="Paused">Paused</SelectItem>
              <SelectItem value="Review pending">Review pending</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex rounded-xl border border-[#ded2c0] bg-white p-1">
            <Button
              variant={grid ? "primary" : "ghost"}
              size="icon"
              className="size-9 min-h-9"
              onClick={() => setGrid(true)}
              aria-label="Grid view"
            >
              <Grid2X2 className="size-4" />
            </Button>
            <Button
              variant={!grid ? "primary" : "ghost"}
              size="icon"
              className="size-9 min-h-9"
              onClick={() => setGrid(false)}
              aria-label="Table view"
            >
              <List className="size-4" />
            </Button>
          </div>
        </div>
      </Card>
      {filtered.length === 0 ? (
        <EmptyState
          title={tx("No properties found", "រកមិនឃើញកន្លែងស្នាក់")}
          description={tx(
            "Try a different filter or add a new property.",
            "សាកល្បងតម្រងផ្សេង ឬបន្ថែមកន្លែងថ្មី។",
          )}
          action={
            <Link href="/owner/properties/new">
              <Button>
                <Plus className="size-4" />
                Add property
              </Button>
            </Link>
          }
        />
      ) : grid ? (
        <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
          {filtered.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              status={statuses[property.id] || property.status}
              currency={currency}
              onStatus={updateStatus}
            />
          ))}
        </div>
      ) : (
        <PropertyTable properties={filtered} />
      )}
      <div className="mt-5">
        <Card>
          <Pagination total={2} />
        </Card>
      </div>
    </div>
  );
}

function PropertyCard({
  property,
  status,
  currency,
  onStatus,
}: {
  property: Property;
  status: PropertyStatus;
  currency: "USD" | "KHR";
  onStatus: (id: string, status: PropertyStatus) => void;
}) {
  return (
    <Card className="overflow-hidden">
      <Link
        href={`/owner/properties/${property.id}`}
        className="relative block aspect-[16/9] overflow-hidden bg-[#e8dcc7]"
      >
        <Image
          src={property.image}
          alt={`${property.name}, fictional demonstration property`}
          fill
          className="object-cover transition duration-500 hover:scale-[1.03]"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
        <span className="absolute left-3 top-3">
          <StatusBadge status={status} />
        </span>
        <span className="absolute bottom-3 right-3 rounded-lg bg-[#2b2118]/85 px-2.5 py-1 text-xs font-bold text-white backdrop-blur">
          Fictional demo
        </span>
      </Link>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <Link
              href={`/owner/properties/${property.id}`}
              className="font-extrabold leading-5 hover:text-[#8e652c]"
            >
              {property.name}
            </Link>
            <p className="khmer mt-1 text-xs text-[#7d736a]">
              {property.nameKm}
            </p>
          </div>
          <Button variant="ghost" size="icon" className="-mr-2 -mt-2">
            <MoreHorizontal className="size-5" />
          </Button>
        </div>
        <p className="mt-3 flex items-center gap-1.5 text-sm text-[#70675f]">
          <MapPin className="size-4" />
          {property.province} · {property.type}
        </p>
        <div className="mt-4 grid grid-cols-3 gap-2 border-y border-[#eee5d8] py-3 text-center">
          <MiniMetric label="Rooms" value={String(property.rooms)} />
          <MiniMetric label="Occupancy" value={`${property.occupancy}%`} />
          <MiniMetric label="Rating" value={`${property.rating} ★`} />
        </div>
        <div className="mt-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-[#7b7168]">From</p>
            <p className="tabular font-extrabold">
              {formatMoney(property.price, currency)}{" "}
              <span className="text-xs font-medium text-[#7b7168]">
                / night
              </span>
            </p>
          </div>
          <div className="flex gap-1">
            <Link href={`/owner/properties/${property.id}/edit`}>
              <Button
                variant="secondary"
                size="icon"
                aria-label={`Edit ${property.name}`}
              >
                <Edit3 className="size-4" />
              </Button>
            </Link>
            <ConfirmDialog
              trigger={
                <Button
                  variant="secondary"
                  size="icon"
                  aria-label={`${status === "Paused" ? "Publish" : "Pause"} ${property.name}`}
                >
                  <ToggleLeft className="size-5" />
                </Button>
              }
              title={
                status === "Paused"
                  ? "Publish this property?"
                  : "Pause this property?"
              }
              description="This updates local demonstration data only."
              confirmLabel={status === "Paused" ? "Publish" : "Pause"}
              onConfirm={() => {
                onStatus(
                  property.id,
                  status === "Paused" ? "Published" : "Paused",
                );
                toast.success("Property status updated");
              }}
            />
          </div>
        </div>
      </div>
    </Card>
  );
}
function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="tabular text-sm font-extrabold">{value}</p>
      <p className="text-[0.68rem] text-[#837970]">{label}</p>
    </div>
  );
}

function PropertyTable({ properties }: { properties: Property[] }) {
  const currency = useAppStore((state) => state.currency);
  const statuses = useDemoStore((state) => state.propertyStatuses);
  const columns = useMemo<ColumnDef<Property>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Property",
        cell: ({ row }) => (
          <Link
            href={`/owner/properties/${row.original.id}`}
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
              <span className="block text-xs font-medium text-[#7c7269]">
                {row.original.province}
              </span>
            </span>
          </Link>
        ),
      },
      { accessorKey: "type", header: "Type" },
      { accessorKey: "rooms", header: "Rooms" },
      {
        accessorKey: "occupancy",
        header: "Occupancy",
        cell: ({ getValue }) => `${getValue<number>()}%`,
      },
      {
        accessorKey: "price",
        header: "From",
        cell: ({ getValue }) => formatMoney(getValue<number>(), currency),
      },
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
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <Link href={`/owner/properties/${row.original.id}/edit`}>
            <Button variant="ghost" size="sm">
              <Edit3 className="size-4" />
              Edit
            </Button>
          </Link>
        ),
      },
    ],
    [currency, statuses],
  );
  return (
    <Card>
      <DemoTable data={properties} columns={columns} />
    </Card>
  );
}

function PropertyDetail({ propertyId }: { propertyId: string }) {
  const property =
    useDemoStore((state) =>
      state.properties.find((item) => item.id === propertyId),
    ) || seedProperties[0];
  const status = useDemoStore(
    (state) => state.propertyStatuses[property.id] || property.status,
  );
  const currency = useAppStore((state) => state.currency);
  return (
    <div>
      <PageHeader
        eyebrow={
          (
            <Link href="/owner/properties" className="hover:underline">
              Properties / {property.id}
            </Link>
          ) as unknown as string
        }
        title={property.name}
        description={property.nameKm}
        actions={
          <>
            <Link href={`/owner/properties/${property.id}/rooms`}>
              <Button variant="secondary">
                <BedDouble className="size-4" />
                Manage rooms
              </Button>
            </Link>
            <Link href={`/owner/properties/${property.id}/edit`}>
              <Button>
                <Edit3 className="size-4" />
                Edit property
              </Button>
            </Link>
          </>
        }
      />
      <div className="grid gap-5 xl:grid-cols-[1.35fr_.65fr]">
        <Card className="overflow-hidden">
          <div className="relative aspect-[16/7]">
            <Image
              src={property.image}
              alt={`${property.name}, fictional demonstration property`}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 1280px) 100vw, 70vw"
            />
            <div className="absolute bottom-4 left-4">
              <StatusBadge status={status} />
            </div>
          </div>
          <div className="p-5">
            <div className="grid gap-4 sm:grid-cols-4">
              <MiniMetric label="Rooms" value={String(property.rooms)} />
              <MiniMetric label="Occupancy" value={`${property.occupancy}%`} />
              <MiniMetric label="Bookings" value={String(property.bookings)} />
              <MiniMetric label="Rating" value={`${property.rating} / 5`} />
            </div>
            <h2 className="mt-6 font-extrabold">About this stay</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#6f665e]">
              A fictional demonstration property inspired by Cambodian
              hospitality, with a quiet garden, locally prepared breakfast,
              flexible guest support, and easy access to {property.province}{" "}
              highlights.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {[
                "Wi-Fi",
                "Breakfast",
                "Air conditioning",
                "Parking",
                "Family friendly",
                "Workspace",
              ].map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-[#ddd0bd] bg-[#faf5ec] px-3 py-1.5 text-xs font-bold"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </Card>
        <div className="space-y-5">
          <Card className="p-5">
            <h2 className="font-extrabold">Listing health</h2>
            <div className="mt-4 space-y-4">
              <ProgressRow label="Content quality" value={92} />
              <ProgressRow label="Photo quality" value={84} />
              <ProgressRow label="Guest response" value={96} />
            </div>
          </Card>
          <Card className="p-5">
            <h2 className="font-extrabold">Nightly price</h2>
            <p className="tabular mt-3 text-3xl font-extrabold">
              {formatMoney(property.price, currency)}
            </p>
            <p className="text-sm text-[#786e65]">Base price · demo</p>
            <Link href="/owner/pricing" className="mt-4 block">
              <Button variant="secondary" className="w-full">
                Adjust pricing
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
function ProgressRow({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1.5 flex justify-between text-xs font-bold">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[#ebe2d6]">
        <div
          className="h-full rounded-full bg-[#b88a44]"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function PropertyWizard({ propertyId }: { propertyId?: string }) {
  const { tx } = useText();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saved, setSaved] = useState(false);
  const source = propertyId
    ? seedProperties.find((item) => item.id === propertyId)
    : undefined;
  const [imageUrl, setImageUrl] = useState(
    source?.image?.replace(API_URL, "") || "/images/siem-reap-homestay.png",
  );
  async function uploadPhoto(file: File) {
    try {
      const form = new FormData();
      form.append("file", file);
      const result = await api<{ url: string }>("/uploads", {
        method: "POST",
        body: form,
      });
      setImageUrl(result.url);
      toast.success("Photo stored on the local API");
    } catch (cause) {
      toast.error(
        cause instanceof Error ? cause.message : "Could not upload photo",
      );
    }
  }
  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors },
    watch,
    setValue,
  } = useForm<PropertyForm>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      nameKm: source?.nameKm || "",
      name: source?.name || "",
      type: source?.type || "",
      province: source?.province || "",
      summary: source
        ? `An intimate stay in ${source.province} with thoughtful local hospitality.`
        : "",
    },
  });
  const values = watch();
  const steps = [
    "Basic information",
    "Property type",
    "Location",
    "Description",
    "Amenities",
    "House rules",
    "Photos",
    "Rooms",
    "Pricing",
    "Availability",
    "Cancellation",
    "Review",
  ];
  async function next() {
    const valid = step > 4 || (await trigger());
    if (valid) {
      setStep((value) => Math.min(12, value + 1));
      setSaved(false);
      window.setTimeout(() => setSaved(true), 500);
    }
  }
  const submit = handleSubmit(async (data) => {
    try {
      if (propertyId) {
        const result = await api<{ property: Property }>(
          `/properties/${propertyId}`,
          json("PATCH", {
            name: data.name,
            nameKm: data.nameKm,
            province: data.province,
            type: data.type,
            description: data.summary,
            image: imageUrl,
          }),
        );
        result.property.image = result.property.image.startsWith("/uploads/")
          ? `${API_URL}${result.property.image}`
          : result.property.image;
        const index = seedProperties.findIndex(
          (item) => item.id === propertyId,
        );
        if (index >= 0) seedProperties[index] = result.property;
        useDemoStore.setState((state) => ({
          properties: state.properties.map((item) =>
            item.id === propertyId ? result.property : item,
          ),
        }));
      } else {
        const created = await api<{ property: Property }>(
          "/properties",
          json("POST", {
            name: data.name,
            nameKm: data.nameKm,
            province: data.province,
            type: data.type,
            description: data.summary,
            image: imageUrl,
            roomTypes: [
              {
                id: "",
                name: "Standard room",
                nameKm: "បន្ទប់ស្តង់ដារ",
                bed: "1 king bed",
                guests: 2,
                price: 35,
                inventory: 1,
              },
            ],
          }),
        );
        const submitted = await api<{ property: Property }>(
          `/properties/${created.property.id}/status`,
          json("POST", { status: "Review pending" }),
        );
        submitted.property.image = submitted.property.image.startsWith(
          "/uploads/",
        )
          ? `${API_URL}${submitted.property.image}`
          : submitted.property.image;
        seedProperties.unshift(submitted.property);
        useDemoStore.setState((state) => ({
          properties: [submitted.property, ...state.properties],
          propertyStatuses: {
            ...state.propertyStatuses,
            [submitted.property.id]: "Review pending",
          },
        }));
      }
      toast.success(
        propertyId ? "Property changes saved" : "Property submitted for review",
      );
      router.push("/owner/properties");
    } catch (cause) {
      toast.error(
        cause instanceof Error ? cause.message : "Could not save property",
      );
    }
  });
  return (
    <form onSubmit={submit}>
      <PageHeader
        eyebrow={tx(
          propertyId ? "Edit property" : "New property",
          propertyId ? "កែកន្លែងស្នាក់" : "កន្លែងស្នាក់ថ្មី",
        )}
        title={tx(
          steps[step - 1],
          [
            "ព័ត៌មានមូលដ្ឋាន",
            "ប្រភេទកន្លែង",
            "ទីតាំង",
            "ការពិពណ៌នា",
            "សេវាកម្ម",
            "ច្បាប់ផ្ទះ",
            "រូបថត",
            "បន្ទប់",
            "តម្លៃ",
            "ភាពទំនេរ",
            "ការលុបចោល",
            "ពិនិត្យឡើងវិញ",
          ][step - 1],
        )}
        description={`${tx("Step", "ជំហាន")} ${step} / 12 · ${saved ? tx("Saved locally", "រក្សាទុកក្នុងឧបករណ៍") : tx("Autosave ready", "រួចរាល់សម្រាប់រក្សាទុក")}`}
        actions={
          <Link href="/owner/properties">
            <Button variant="secondary">Exit</Button>
          </Link>
        }
      />
      <div className="mb-6 h-2 overflow-hidden rounded-full bg-[#e7ddcf]">
        <div
          className="h-full rounded-full bg-[#b88a44] transition-all"
          style={{ width: `${(step / 12) * 100}%` }}
        />
      </div>
      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <Card className="p-5 sm:p-7">
          <WizardStep
            step={step}
            register={register}
            errors={errors}
            values={values}
            imageUrl={imageUrl}
            onUpload={uploadPhoto}
            setValue={setValue}
          />
          <div className="mt-8 flex items-center justify-between border-t border-[#e9dfd1] pt-5">
            <Button
              variant="secondary"
              type="button"
              onClick={() => setStep((value) => Math.max(1, value - 1))}
              disabled={step === 1}
            >
              <ArrowLeft className="size-4" />
              Previous
            </Button>
            {step < 12 ? (
              <Button type="button" onClick={next}>
                Continue
                <ArrowRight className="size-4" />
              </Button>
            ) : (
              <Button type="submit">
                <FileCheck2 className="size-4" />
                {propertyId ? "Save changes" : "Submit for review"}
              </Button>
            )}
          </div>
        </Card>
        <PropertyPreview values={values} imageUrl={imageUrl} />
      </div>
    </form>
  );
}

type WizardRegister = ReturnType<typeof useForm<PropertyForm>>["register"];
type WizardErrors = ReturnType<
  typeof useForm<PropertyForm>
>["formState"]["errors"];
type WizardSetValue = ReturnType<typeof useForm<PropertyForm>>["setValue"];
function WizardStep({
  step,
  register,
  errors,
  values,
  imageUrl,
  onUpload,
  setValue,
}: {
  step: number;
  register: WizardRegister;
  errors: WizardErrors;
  values: Partial<PropertyForm>;
  imageUrl: string;
  onUpload: (file: File) => void;
  setValue: WizardSetValue;
}) {
  if (step === 1)
    return (
      <div>
        <h2 className="text-xl font-extrabold">Name your property</h2>
        <p className="mt-1 text-sm text-[#786e65]">
          Use the name guests will recognize in both languages.
        </p>
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <Field label="Khmer property name" error={errors.nameKm?.message}>
            <Input
              {...register("nameKm")}
              className="form-input khmer"
              placeholder="ផ្ទះស្នាក់..."
            />
          </Field>
          <Field label="English property name" error={errors.name?.message}>
            <Input
              {...register("name")}
              className="form-input"
              placeholder="e.g. Lotus Garden Stay"
            />
          </Field>
          <Field label="Property type" error={errors.type?.message}>
            <Select
              value={values.type || undefined}
              onValueChange={(val) => setValue("type", val, { shouldValidate: true })}
            >
              <SelectTrigger className="form-input min-h-10 w-full rounded-xl bg-white text-sm font-semibold">
                <SelectValue placeholder="Choose type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Heritage homestay">Heritage homestay</SelectItem>
                <SelectItem value="Guesthouse">Guesthouse</SelectItem>
                <SelectItem value="Boutique stay">Boutique stay</SelectItem>
                <SelectItem value="Eco lodge">Eco lodge</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Province" error={errors.province?.message}>
            <Select
              value={values.province || undefined}
              onValueChange={(val) => setValue("province", val, { shouldValidate: true })}
            >
              <SelectTrigger className="form-input min-h-10 w-full rounded-xl bg-white text-sm font-semibold">
                <SelectValue placeholder="Choose province" />
              </SelectTrigger>
              <SelectContent>
                {[
                  "Siem Reap",
                  "Kampot",
                  "Kep",
                  "Battambang",
                  "Mondulkiri",
                  "Phnom Penh",
                ].map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
        <Field
          label="Short summary"
          error={errors.summary?.message}
          className="mt-5"
        >
          <Textarea
            {...register("summary")}
            className="form-input min-h-28 resize-y"
            placeholder="What makes this stay special?"
          />
        </Field>
      </div>
    );
  if (step === 2)
    return (
      <ChoiceGrid
        title="Choose the closest property type"
        options={[
          "Homestay",
          "Guesthouse",
          "Boutique stay",
          "Eco lodge",
          "Wooden house",
          "Island stay",
        ]}
        icon={<Home />}
      />
    );
  if (step === 3)
    return (
      <div>
        <h2 className="text-xl font-extrabold">Pin the local area</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {[
            "City or district",
            "Commune",
            "Village",
            "Street address",
            "Nearby landmark",
          ].map((label) => (
            <Field key={label} label={label}>
              <Input className="form-input" placeholder={label} />
            </Field>
          ))}
        </div>
        <div className="relative mt-5 grid min-h-52 place-items-center overflow-hidden rounded-2xl border border-[#d8cab5] bg-[#efe4d1]">
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                "linear-gradient(#bfa77f 1px, transparent 1px), linear-gradient(90deg, #bfa77f 1px, transparent 1px)",
              backgroundSize: "30px 30px",
            }}
          />
          <div className="relative text-center">
            <MapPin className="mx-auto size-8 text-[#9b6f31]" />
            <p className="mt-2 text-sm font-extrabold">
              Static location preview
            </p>
            <p className="text-xs text-[#74685d]">
              No live map service is connected
            </p>
          </div>
        </div>
      </div>
    );
  if (step === 4)
    return (
      <div>
        <h2 className="text-xl font-extrabold">Tell guests what to expect</h2>
        <Field label="English description" className="mt-5">
          <Textarea
            className="form-input min-h-36"
            defaultValue={values.summary}
          />
        </Field>
        <Field label="Khmer description" className="mt-5">
          <Textarea
            className="form-input khmer min-h-36"
            placeholder="សរសេរការពិពណ៌នាជាភាសាខ្មែរ..."
          />
        </Field>
      </div>
    );
  if (step === 5)
    return (
      <ChoiceGrid
        title="Amenities guests can use"
        options={[
          "Wi-Fi",
          "Air conditioning",
          "Breakfast",
          "Parking",
          "Kitchen",
          "Pool",
          "Workspace",
          "Pet friendly",
          "Family friendly",
          "Airport transfer",
          "Riverside",
          "Mountain view",
        ]}
        icon={<CheckCircle2 />}
        checks
      />
    );
  if (step === 6)
    return (
      <ChoiceGrid
        title="House rules"
        options={[
          "No smoking indoors",
          "Pets allowed",
          "Children welcome",
          "No parties",
          "Quiet after 10 pm",
          "Check-in after 2 pm",
          "Check-out by 11 am",
        ]}
        icon={<Clock3 />}
        checks
      />
    );
  if (step === 7)
    return (
      <div>
        <h2 className="text-xl font-extrabold">Add a welcoming photo</h2>
        <label className="mt-5 grid min-h-64 cursor-pointer place-items-center rounded-2xl border-2 border-dashed border-[#cdb68f] bg-[#fbf6ed] text-center hover:bg-[#f7eddd]">
          <span>
            <ImagePlus className="mx-auto size-9 text-[#9d7134]" />
            <span className="mt-3 block font-extrabold">
              Choose a PNG, JPEG or WebP photo
            </span>
            <span className="mt-1 block text-sm text-[#776d64]">
              Saved to your local API · 5 MB maximum
            </span>
          </span>
          <Input
            className="sr-only"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onUpload(file);
            }}
          />
        </label>
        <p className="mt-3 text-sm text-[#776d64]">
          Current image: {imageUrl.split("/").at(-1)}
        </p>
      </div>
    );
  if (step === 8)
    return (
      <ChoiceGrid
        title="Add your first room"
        options={["Lotus King Room", "Garden Twin Room", "Family Khmer House"]}
        icon={<BedDouble />}
      />
    );
  if (step === 9)
    return (
      <div>
        <h2 className="text-xl font-extrabold">Set your nightly price</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="Base nightly price (USD)">
            <Input type="number" className="form-input" defaultValue="35" />
          </Field>
          <Field label="Weekend price (USD)">
            <Input type="number" className="form-input" defaultValue="42" />
          </Field>
          <Field label="Weekly discount (%)">
            <Input type="number" className="form-input" defaultValue="8" />
          </Field>
          <Field label="Monthly discount (%)">
            <Input type="number" className="form-input" defaultValue="15" />
          </Field>
        </div>
      </div>
    );
  if (step === 10)
    return (
      <ChoiceGrid
        title="Choose availability"
        options={[
          "Available year-round",
          "Open on selected dates",
          "Pause until ready",
        ]}
        icon={<CalendarDays />}
      />
    );
  if (step === 11)
    return (
      <ChoiceGrid
        title="Cancellation policy"
        options={["Flexible · 24 hours", "Moderate · 5 days", "Firm · 14 days"]}
        icon={<FileCheck2 />}
      />
    );
  return (
    <div>
      <h2 className="text-xl font-extrabold">Ready for demo review</h2>
      <AlertBanner title="Demonstration publishing only" tone="info">
        No listing will be sent to a backend or made public.
      </AlertBanner>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {[
          ["Property", values.name || "Untitled"],
          ["Khmer name", values.nameKm || "—"],
          ["Type", values.type || "—"],
          ["Province", values.province || "—"],
          ["Rooms", "1 room"],
          ["Base price", "$35 / night"],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-xl border border-[#e4d8c6] bg-white p-4"
          >
            <p className="text-xs font-bold text-[#7b7168]">{label}</p>
            <p className="mt-1 font-extrabold">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
function Field({
  label,
  error,
  className,
  children,
}: {
  label: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-2 block text-sm font-extrabold">{label}</span>
      {children}
      {error && (
        <span className="mt-1 block text-xs font-semibold text-[#a84c4c]">
          {error}
        </span>
      )}
    </label>
  );
}
function ChoiceGrid({
  title,
  options,
  icon,
  checks = false,
}: {
  title: string;
  options: string[];
  icon: React.ReactNode;
  checks?: boolean;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  function choose(item: string) {
    setSelected((values) =>
      checks
        ? values.includes(item)
          ? values.filter((value) => value !== item)
          : [...values, item]
        : [item],
    );
  }
  return (
    <div>
      <h2 className="text-xl font-extrabold">{title}</h2>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {options.map((item) => (
          <Button
            variant="ghost"
            key={item}
            type="button"
            onClick={() => choose(item)}
            className={cn(
              "flex min-h-16 items-center gap-3 rounded-xl border bg-white p-3 text-left font-bold transition",
              selected.includes(item)
                ? "border-[#b88a44] bg-[#fbf3e4] shadow-[0_0_0_3px_rgba(184,138,68,.12)]"
                : "border-[#dfd3c1] hover:border-[#c5a66f]",
            )}
          >
            <span className="grid size-9 place-items-center rounded-lg bg-[#f1e7d6] text-[#95692f] [&>svg]:size-5">
              {selected.includes(item) ? (
                <CheckCircle2 className="size-5" />
              ) : (
                icon
              )}
            </span>
            {item}
          </Button>
        ))}
      </div>
    </div>
  );
}
function PropertyPreview({
  values,
  imageUrl,
}: {
  values: Partial<PropertyForm>;
  imageUrl: string;
}) {
  return (
    <Card className="sticky top-24 hidden self-start overflow-hidden xl:block">
      <div className="relative aspect-[16/10]">
        <Image
          src={
            imageUrl.startsWith("/uploads/")
              ? `${API_URL}${imageUrl}`
              : imageUrl
          }
          alt="Property preview"
          fill
          className="object-cover"
          sizes="360px"
        />
        <span className="absolute bottom-3 left-3 rounded-lg bg-white/90 px-2 py-1 text-xs font-bold">
          Preview
        </span>
      </div>
      <div className="p-4">
        <p className="font-extrabold">{values.name || "Your property name"}</p>
        <p className="khmer mt-1 text-xs text-[#7b7168]">
          {values.nameKm || "ឈ្មោះកន្លែងស្នាក់"}
        </p>
        <p className="mt-3 flex items-center gap-1 text-sm text-[#6f665e]">
          <MapPin className="size-4" />
          {values.province || "Province"}
        </p>
        <p className="mt-3 text-sm leading-6 text-[#6f665e]">
          {values.summary || "Your summary will appear here as you type."}
        </p>
      </div>
    </Card>
  );
}

function RoomManagement({ propertyId }: { propertyId: string }) {
  const property =
    seedProperties.find((item) => item.id === propertyId) || seedProperties[0];
  const [rooms, setRooms] = useState([
    {
      id: "r1",
      name: "Lotus King Room",
      beds: "1 king bed",
      guests: 2,
      price: 42,
      enabled: true,
    },
    {
      id: "r2",
      name: "Garden Twin Room",
      beds: "2 single beds",
      guests: 3,
      price: 36,
      enabled: true,
    },
  ]);
  return (
    <div>
      <PageHeader
        eyebrow={`Properties / ${property.name}`}
        title="Rooms"
        description="Manage room types, capacity, amenities and local photo previews."
        actions={
          <Button
            onClick={() =>
              setRooms((value) => [
                ...value,
                {
                  id: `r${value.length + 1}`,
                  name: "New room",
                  beds: "1 queen bed",
                  guests: 2,
                  price: 35,
                  enabled: false,
                },
              ])
            }
          >
            <Plus className="size-4" />
            Add room
          </Button>
        }
      />
      <div className="grid gap-5 md:grid-cols-2">
        {rooms.map((room) => (
          <Card key={room.id} className="overflow-hidden">
            <div className="grid grid-cols-[130px_1fr]">
              <div className="relative bg-[#e9dfd0]">
                <Image
                  src={property.image}
                  alt="Local room preview"
                  fill
                  className="object-cover"
                  sizes="130px"
                />
              </div>
              <div className="p-4">
                <div className="flex justify-between gap-2">
                  <div>
                    <h2 className="font-extrabold">{room.name}</h2>
                    <p className="text-sm text-[#786e65]">
                      {room.beds} · up to {room.guests} guests
                    </p>
                  </div>
                  <StatusBadge status={room.enabled ? "Active" : "Paused"} />
                </div>
                <p className="tabular mt-4 text-lg font-extrabold">
                  ${room.price}{" "}
                  <span className="text-xs font-medium text-[#7c7269]">
                    / night
                  </span>
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => toast.success("Room editor opened")}
                  >
                    <Edit3 className="size-4" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setRooms((values) => [
                        ...values,
                        {
                          ...room,
                          id: `${room.id}-copy`,
                          name: `${room.name} copy`,
                        },
                      ]);
                      toast.success("Room duplicated");
                    }}
                  >
                    <Copy className="size-4" />
                    Duplicate
                  </Button>
                  <ConfirmDialog
                    trigger={
                      <Button variant="ghost" size="sm">
                        <Trash2 className="size-4" />
                        Delete
                      </Button>
                    }
                    title="Delete this room?"
                    description="This removes the room from local demo data."
                    confirmLabel="Delete room"
                    danger
                    onConfirm={() =>
                      setRooms((values) =>
                        values.filter((item) => item.id !== room.id),
                      )
                    }
                  />
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function BookingsView() {
  const { tx, isKhmer } = useText();
  const currency = useAppStore((state) => state.currency);
  const statuses = useDemoStore((state) => state.bookingStatuses);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("All");
  const [bookingList, setBookingList] = useState<Booking[]>(bookings);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  // Manual reservation fields
  const [propertyId, setPropertyId] = useState(seedProperties[0]?.id || "");
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [checkIn, setCheckIn] = useState("2026-09-20");
  const [checkOut, setCheckOut] = useState("2026-09-23");
  const [guestsCount, setGuestsCount] = useState(2);
  const [roomName, setRoomName] = useState("Standard Room");
  const [totalAmount, setTotalAmount] = useState(120);

  useEffect(() => {
    const handleRefresh = () => {
      api<{ bookings: Booking[] }>("/bookings")
        .then((res) => {
          if (res?.bookings?.length) {
            setBookingList(res.bookings);
            bookings.splice(0, bookings.length, ...res.bookings);
          }
        })
        .catch(() => {});
    };
    window.addEventListener("khmerstay:refresh-bookings", handleRefresh);
    return () =>
      window.removeEventListener("khmerstay:refresh-bookings", handleRefresh);
  }, []);

  async function handleCreateBooking(e: React.FormEvent) {
    e.preventDefault();
    if (!guestName.trim()) {
      toast.error(isKhmer ? "សូមបញ្ចូលឈ្មោះភ្ញៀវ" : "Guest name is required");
      return;
    }
    setCreating(true);
    try {
      const selectedProp =
        seedProperties.find((p) => p.id === propertyId) || seedProperties[0];
      const payload = {
        propertyId,
        property: selectedProp.name,
        roomId: "",
        room: roomName,
        checkIn,
        checkOut,
        guests: Number(guestsCount),
        amount: Number(totalAmount),
        total: Number(totalAmount),
        guest: guestName,
        guestEmail:
          guestEmail ||
          `${guestName.toLowerCase().replace(/\s+/g, ".")}@example.com`,
        status: "Confirmed",
        payment: "Paid",
      };

      let newBooking: Booking;
      try {
        const res = await createBooking(payload);
        newBooking = res.booking;
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        const conflict = formatBookingConflict(errMsg, isKhmer);
        if (conflict) {
          toast.error(conflict.title, {
            description: conflict.description,
            duration: 6000,
          });
          setCreating(false);
          return;
        }
        if (
          err &&
          typeof err === "object" &&
          "status" in err &&
          (err as { status: number }).status !== 0 &&
          !errMsg.includes("Cannot reach")
        ) {
          toast.error(errMsg || "Failed to create booking");
          setCreating(false);
          return;
        }
        // Local demo fallback
        newBooking = {
          id: `KST-${Date.now().toString().slice(-6)}`,
          guest: guestName,
          property: selectedProp.name,
          room: roomName,
          checkIn,
          checkOut,
          guests: Number(guestsCount),
          total: Number(totalAmount),
          payment: "Demo paid",
          status: "Confirmed",
          owner: selectedProp.owner,
        };
      }

      setBookingList((prev) => [newBooking, ...prev]);
      bookings.unshift(newBooking);
      useDemoStore.getState().updateBookingStatus(newBooking.id, "Confirmed");
      toast.success(
        isKhmer
          ? `បានបង្កើតការកក់ ${newBooking.id} ដោយជោគជ័យ`
          : `Reservation ${newBooking.id} created successfully`,
      );
      setCreateOpen(false);
      setGuestName("");
      setGuestEmail("");
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      const conflict = formatBookingConflict(errMsg, isKhmer);
      if (conflict) {
        toast.error(conflict.title, {
          description: conflict.description,
          duration: 6000,
        });
      } else {
        toast.error(errMsg || "Failed to create booking");
      }
    } finally {
      setCreating(false);
    }
  }

  const rows = bookingList
    .filter(
      (booking) =>
        `${booking.id} ${booking.guest} ${booking.property}`
          .toLowerCase()
          .includes(query.toLowerCase()) &&
        (tab === "All" || (statuses[booking.id] || booking.status) === tab),
    )
    .slice(0, 12);
  const columns = useMemo<ColumnDef<Booking>[]>(
    () => [
      {
        accessorKey: "id",
        header: "Reference",
        cell: ({ row }) => (
          <Link
            href={`/owner/bookings/${row.original.id}`}
            className="font-extrabold text-[#815b29]"
          >
            {row.original.id}
          </Link>
        ),
      },
      {
        accessorKey: "guest",
        header: "Guest",
        cell: ({ getValue }) => (
          <span className="font-bold">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: "property",
        header: "Property",
        cell: ({ row }) => (
          <span>
            {row.original.property}
            <span className="block text-xs text-[#82786f]">
              {row.original.room}
            </span>
          </span>
        ),
      },
      {
        accessorKey: "checkIn",
        header: "Stay",
        cell: ({ row }) => (
          <span className="whitespace-nowrap">
            {row.original.checkIn}
            <span className="block text-xs text-[#82786f]">
              to {row.original.checkOut}
            </span>
          </span>
        ),
      },
      { accessorKey: "guests", header: "Guests" },
      {
        accessorKey: "total",
        header: "Total",
        cell: ({ getValue }) => (
          <span className="tabular font-bold">
            {formatMoney(getValue<number>(), currency)}
          </span>
        ),
      },
      {
        accessorKey: "payment",
        header: "Payment",
        cell: ({ getValue }) => <StatusBadge status={getValue<string>()} />,
      },
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
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <Link href={`/owner/bookings/${row.original.id}`}>
            <Button variant="ghost" size="sm">
              View
            </Button>
          </Link>
        ),
      },
    ],
    [currency, statuses],
  );
  return (
    <div>
      <PageHeader
        eyebrow={tx("Reservations", "ការកក់")}
        title={tx("Bookings", "ការកក់ទាំងអស់")}
        description={tx(
          "Review requests, upcoming stays and booking history.",
          "ពិនិត្យសំណើ ការស្នាក់នៅខាងមុខ និងប្រវត្តិការកក់។",
        )}
        actions={
          <div className="flex items-center gap-2">
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" />
              {tx("New reservation", "ការកក់ថ្មី")}
            </Button>
            <ExportButton />
          </div>
        }
      />
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {tx("Create manual reservation", "បង្កើតការកក់បន្ទប់ថ្មី")}
            </DialogTitle>
            <DialogDescription>
              {tx(
                "Enter guest details and stay dates. Dates will be checked for double-booking conflicts.",
                "បញ្ចូលព័ត៌មានភ្ញៀវ និងកាលបរិច្ឆេទស្នាក់នៅ។ ប្រព័ន្ធនឹងពិនិត្យមើលភាពជាន់គ្នានៃការកក់។",
              )}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateBooking} className="space-y-3 pt-2">
            <div>
              <label className="text-xs font-bold text-[#6a5e53]">
                {tx("Guest Name", "ឈ្មោះភ្ញៀវ")}
              </label>
              <Input
                required
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="e.g., Sokha Chan"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[#6a5e53]">
                {tx("Guest Email (optional)", "អ៊ីមែលភ្ញៀវ (ស្រេចចិត្ត)")}
              </label>
              <Input
                type="email"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                placeholder="sokha@example.com"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[#6a5e53]">
                {tx("Property", "កន្លែងស្នាក់នៅ")}
              </label>
              <Select value={propertyId} onValueChange={setPropertyId}>
                <SelectTrigger className="mt-1 w-full rounded-xl border-[#ded3c2] bg-white">
                  <SelectValue placeholder={tx("Select property", "ជ្រើសរើសកន្លែងស្នាក់")} />
                </SelectTrigger>
                <SelectContent>
                  {seedProperties.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} ({p.province})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-bold text-[#6a5e53]">
                {tx("Room / Unit", "បន្ទប់ / យូនីត")}
              </label>
              <Input
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="e.g., Standard Room or Deluxe Suite"
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-bold text-[#6a5e53]">
                  {tx("Check-in", "ថ្ងៃចូល")}
                </label>
                <Input
                  required
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-[#6a5e53]">
                  {tx("Check-out", "ថ្ងៃចេញ")}
                </label>
                <Input
                  required
                  type="date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-bold text-[#6a5e53]">
                  {tx("Guests", "ចំនួនភ្ញៀវ")}
                </label>
                <Input
                  type="number"
                  min={1}
                  max={12}
                  value={guestsCount}
                  onChange={(e) => setGuestsCount(Number(e.target.value))}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-[#6a5e53]">
                  {tx("Total Amount ($)", "តម្លៃសរុប ($)")}
                </label>
                <Input
                  type="number"
                  min={1}
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(Number(e.target.value))}
                  className="mt-1"
                />
              </div>
            </div>
            <DialogFooter className="mt-4 flex gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setCreateOpen(false)}
              >
                {tx("Cancel", "បោះបង់")}
              </Button>
              <Button type="submit" disabled={creating}>
                {creating
                  ? tx("Checking…", "កំពុងពិនិត្យ…")
                  : tx("Confirm reservation", "បញ្ជាក់ការកក់")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="New requests"
          value="6"
          helper="Respond today"
          icon={<Bell className="size-5" />}
          accent="rose"
        />
        <StatCard
          label="Upcoming"
          value="18"
          helper="Next 30 days"
          icon={<CalendarDays className="size-5" />}
        />
        <StatCard
          label="In house"
          value="4"
          helper="Currently checked in"
          icon={<BedDouble className="size-5" />}
          accent="green"
        />
        <StatCard
          label="This month"
          value={formatMoney(6840, currency)}
          helper="Confirmed value"
          icon={<CircleDollarSign className="size-5" />}
          accent="blue"
        />
      </div>
      <Card className="mt-5">
        <div className="flex flex-col gap-3 border-b border-[#e8dece] p-4">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {["All", ...statusOptions].map((status) => (
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
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search reference, guest or property"
                className="min-h-11 w-full rounded-xl border border-[#ded2c0] bg-white pl-10 pr-3 text-sm"
              />
            </label>
            <Button variant="secondary">
              <Filter className="size-4" />
              Date & property
            </Button>
          </div>
        </div>
        <DemoTable data={rows} columns={columns} />
        <Pagination total={4} />
      </Card>
    </div>
  );
}

function BookingDetail({ bookingId }: { bookingId: string }) {
  const booking = bookings.find((item) => item.id === bookingId) || bookings[0];
  const currency = useAppStore((state) => state.currency);
  const status = useDemoStore(
    (state) => state.bookingStatuses[booking.id] || booking.status,
  );
  const update = useDemoStore((state) => state.updateBookingStatus);
  function actionButton(next: BookingStatus, label: string, danger = false) {
    return (
      <ConfirmDialog
        trigger={
          <Button variant={danger ? "danger" : "secondary"}>{label}</Button>
        }
        title={`${label} booking?`}
        description={`This will move ${booking.id} from ${status} to ${next}. It only changes local demo data.`}
        confirmLabel={label}
        danger={danger}
        onConfirm={() => {
          update(booking.id, next);
          toast.success(`Booking marked ${next}`);
        }}
      />
    );
  }
  return (
    <div>
      <PageHeader
        eyebrow={`Bookings / ${booking.id}`}
        title={booking.guest}
        description={`${booking.property} · ${booking.checkIn} to ${booking.checkOut}`}
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => toast.success("Guest conversation opened")}
            >
              <MessageCircle className="size-4" />
              Message guest
            </Button>
            {status === "New request" && actionButton("Confirmed", "Accept")}
            {actionButton("Declined", "Decline", true)}
          </>
        }
      />
      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-extrabold">Booking summary</h2>
              <StatusBadge status={status} />
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Detail label="Property" value={booking.property} />
              <Detail label="Room" value={booking.room} />
              <Detail label="Check-in" value={booking.checkIn} />
              <Detail label="Check-out" value={booking.checkOut} />
              <Detail label="Guests" value={`${booking.guests} guests`} />
              <Detail label="Payment" value={booking.payment} />
            </div>
          </Card>
          <Card className="p-5">
            <h2 className="font-extrabold">Booking timeline</h2>
            <Timeline
              items={[
                { title: "Booking request received", meta: "Sep 2 · 10:24" },
                { title: "Demo payment authorized", meta: "Sep 2 · 10:25" },
                { title: status, meta: "Current status" },
              ]}
            />
          </Card>
          <Card className="p-5">
            <h2 className="font-extrabold">Special request</h2>
            <p className="mt-2 text-sm leading-6 text-[#71675f]">
              We may arrive after 8 pm. Please let us know the easiest way to
              enter the courtyard.
            </p>
            <label className="mt-4 block">
              <span className="mb-2 block text-sm font-extrabold">
                Internal note
              </span>
              <Textarea
                className="form-input min-h-24"
                placeholder="Visible only in this local demo"
              />
            </label>
            <Button
              className="mt-3"
              variant="secondary"
              onClick={() => toast.success("Internal note saved locally")}
            >
              <Save className="size-4" />
              Save note
            </Button>
          </Card>
        </div>
        <div className="space-y-5">
          <Card className="p-5">
            <h2 className="font-extrabold">Guest</h2>
            <div className="mt-4 flex items-center gap-3">
              <span className="grid size-12 place-items-center rounded-full bg-[#efe5d6] font-extrabold">
                {booking.guest
                  .split(" ")
                  .map((item) => item[0])
                  .join("")}
              </span>
              <div>
                <p className="font-extrabold">{booking.guest}</p>
                <p className="text-sm text-[#776d64]">Verified demo traveler</p>
              </div>
            </div>
            <div className="mt-4 grid gap-2 text-sm">
              <p>guest@khmerstay.demo</p>
              <p>+855 12 345 678</p>
              <p>4 previous stays</p>
            </div>
          </Card>
          <Card className="p-5">
            <h2 className="font-extrabold">Price breakdown</h2>
            <PriceRow
              label="Room total"
              value={formatMoney(booking.total - 12, currency)}
            />
            <PriceRow
              label="Guest service fee"
              value={formatMoney(12, currency)}
            />
            <PriceRow
              label="Total"
              value={formatMoney(booking.total, currency)}
              strong
            />
            <p className="mt-3 rounded-lg bg-[#f5eee4] px-3 py-2 text-xs text-[#776d64]">
              Demo financial information — no real transaction occurred.
            </p>
          </Card>
          <Card className="p-5">
            <h2 className="font-extrabold">Update status</h2>
            <div className="mt-3 grid gap-2">
              {actionButton("Confirmed", "Confirm")}
              {actionButton("Checked in", "Mark checked in")}
              {actionButton("Completed", "Mark completed")}
              {actionButton("No-show", "Mark no-show", true)}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#e7dccd] bg-white p-4">
      <p className="text-xs font-bold text-[#7c7269]">{label}</p>
      <p className="mt-1 text-sm font-extrabold">{value}</p>
    </div>
  );
}
function Timeline({ items }: { items: { title: string; meta: string }[] }) {
  return (
    <div className="mt-5">
      {items.map((item, index) => (
        <div key={item.title} className="relative flex gap-3 pb-5 last:pb-0">
          <span className="relative z-10 mt-1 size-3 shrink-0 rounded-full border-[3px] border-[#f0dfbf] bg-[#a77835]" />
          {index < items.length - 1 && (
            <span className="absolute left-[5px] top-3 h-full w-px bg-[#decdb3]" />
          )}
          <div>
            <p className="text-sm font-extrabold">{item.title}</p>
            <p className="mt-0.5 text-xs text-[#7b7168]">{item.meta}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
function PriceRow({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex justify-between border-b border-[#eee5d8] py-3 text-sm",
        strong && "border-0 text-base font-extrabold",
      )}
    >
      <span>{label}</span>
      <span className="tabular font-bold">{value}</span>
    </div>
  );
}

function CalendarView() {
  const { tx } = useText();
  const [selected, setSelected] = useState<Date | undefined>(
    new Date(2026, 8, 12),
  );
  const blocked = useDemoStore((state) => state.blockedDates);
  const toggle = useDemoStore((state) => state.toggleBlockedDate);
  const selectedKey = selected ? format(selected, "yyyy-MM-dd") : "";
  return (
    <div>
      <PageHeader
        eyebrow={tx("Availability", "ភាពទំនេរ")}
        title={tx("Calendar", "ប្រតិទិន")}
        description={tx(
          "Select a date to adjust availability, price or minimum stay.",
          "ជ្រើសរើសកាលបរិច្ឆេទ ដើម្បីកែភាពទំនេរ តម្លៃ ឬការស្នាក់អប្បបរមា។",
        )}
        actions={
          <>
            <Select defaultValue="Angkor Lotus Heritage Stay">
              <SelectTrigger className="min-h-11 w-64 rounded-xl border-[#d9ccb9] bg-white text-sm font-bold shadow-2xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Angkor Lotus Heritage Stay">Angkor Lotus Heritage Stay</SelectItem>
                <SelectItem value="Kampot Riverstone">Kampot Riverstone</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="secondary">Today</Button>
          </>
        }
      />
      <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
        <Card className="overflow-hidden p-4 sm:p-6">
          <div className="mb-4 flex flex-wrap items-center gap-4 text-xs font-bold">
            <LegendDot color="#eaf4ed" label="Available" />
            <LegendDot color="#dcebf2" label="Booked" />
            <LegendDot color="#f5dddd" label="Blocked" />
            <LegendDot color="#f4e1b9" label="Selected" />
          </div>
          <div className="calendar-wrap">
            <DayPicker
              mode="single"
              selected={selected}
              onSelect={setSelected}
              month={new Date(2026, 8, 1)}
              showOutsideDays
              modifiers={{
                blocked: blocked.map((date) => new Date(`${date}T00:00:00`)),
                booked: [
                  new Date(2026, 8, 7),
                  new Date(2026, 8, 8),
                  new Date(2026, 8, 14),
                  new Date(2026, 8, 15),
                  new Date(2026, 8, 16),
                ],
              }}
              modifiersClassNames={{
                blocked: "calendar-blocked",
                booked: "calendar-booked",
              }}
              className="mx-auto"
            />
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            {[
              ["Sep 7–8", "Piseth Chan", "Confirmed"],
              ["Sep 14–16", "Sreyneang Sok", "Checked in"],
              ["Sep 24–26", "Ratha Kim", "Pending"],
            ].map(([dates, guest, status]) => (
              <Button
                variant="ghost"
                type="button"
                key={dates}
                onClick={() => toast.info(`${guest} · ${status}`)}
                className="rounded-xl border border-[#d9ccb9] bg-white p-3 text-left hover:border-[#b88a44]"
              >
                <p className="text-xs font-bold text-[#776d64]">{dates}</p>
                <p className="mt-1 text-sm font-extrabold">{guest}</p>
                <div className="mt-2">
                  <StatusBadge status={status} />
                </div>
              </Button>
            ))}
          </div>
        </Card>
        <Card className="self-start p-5">
          <h2 className="text-lg font-extrabold">
            {selected ? format(selected, "EEEE, d MMMM") : "Select a date"}
          </h2>
          <p className="mt-1 text-sm text-[#776d64]">Lotus King Room</p>
          {selected && (
            <>
              <div className="mt-5 rounded-xl border border-[#e3d7c5] bg-white p-4">
                <p className="text-xs font-bold text-[#776d64]">Availability</p>
                <p className="mt-1 font-extrabold">
                  {blocked.includes(selectedKey) ? "Blocked" : "Available"}
                </p>
                <p className="tabular mt-3 text-2xl font-extrabold">
                  $42 <span className="text-xs font-medium">/ night</span>
                </p>
                <p className="mt-1 text-xs text-[#776d64]">
                  Minimum stay · 1 night
                </p>
              </div>
              <Button
                className="mt-4 w-full"
                onClick={() => {
                  toggle(selectedKey);
                  toast.success(
                    blocked.includes(selectedKey)
                      ? "Date unblocked"
                      : "Date blocked",
                  );
                }}
              >
                {blocked.includes(selectedKey) ? "Unblock date" : "Block date"}
              </Button>
              <Button
                variant="secondary"
                className="mt-2 w-full"
                onClick={() => toast.success("Nightly price updated locally")}
              >
                Update nightly price
              </Button>
              <Button
                variant="ghost"
                className="mt-2 w-full"
                onClick={() => toast.info("Minimum stay set to 2 nights")}
              >
                Set minimum stay
              </Button>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-2">
      <span
        className="size-3 rounded-sm border border-black/5"
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  );
}

function PricingView() {
  const { tx } = useText();
  const prices = useDemoStore((state) => state.prices);
  const updatePrice = useDemoStore((state) => state.updatePrice);
  const [propertyId, setPropertyId] = useState(seedProperties[0].id);
  const [price, setPrice] = useState(prices[propertyId] || 42);
  const property =
    seedProperties.find((item) => item.id === propertyId) || seedProperties[0];
  return (
    <div>
      <PageHeader
        eyebrow={tx("Revenue management", "ការគ្រប់គ្រងចំណូល")}
        title={tx("Pricing", "ការកំណត់តម្លៃ")}
        description={tx(
          "Adjust local demo rates and discounts. Changes appear in the calendar preview.",
          "កែតម្លៃ និងបញ្ចុះតម្លៃសាកល្បង។ ការផ្លាស់ប្តូរនឹងបង្ហាញក្នុងប្រតិទិន។",
        )}
        actions={
          <ConfirmDialog
            trigger={
              <Button>
                <Save className="size-4" />
                Save pricing
              </Button>
            }
            title="Save pricing changes?"
            description="These prices update local demo state only."
            confirmLabel="Save changes"
            onConfirm={() => {
              updatePrice(propertyId, price);
              toast.success("Pricing saved locally");
            }}
          />
        }
      />
      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <Card className="p-5 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Property">
              <Select
                value={propertyId}
                onValueChange={(val) => {
                  setPropertyId(val);
                  setPrice(prices[val] || 35);
                }}
              >
                <SelectTrigger className="form-input min-h-10 w-full rounded-xl bg-white text-sm font-semibold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {seedProperties.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Room">
              <Select defaultValue="all">
                <SelectTrigger className="form-input min-h-10 w-full rounded-xl bg-white text-sm font-semibold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All rooms</SelectItem>
                  <SelectItem value="king">Lotus King Room</SelectItem>
                  <SelectItem value="twin">Garden Twin Room</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Base nightly price (USD)">
              <Input
                type="number"
                min="1"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="form-input"
              />
            </Field>
            <Field label="Weekend price (USD)">
              <Input
                type="number"
                defaultValue={price + 8}
                className="form-input"
              />
            </Field>
            <Field label="Weekly discount (%)">
              <Input type="number" defaultValue="8" className="form-input" />
            </Field>
            <Field label="Monthly discount (%)">
              <Input type="number" defaultValue="15" className="form-input" />
            </Field>
            <Field label="Last-minute discount (%)">
              <Input type="number" defaultValue="10" className="form-input" />
            </Field>
            <Field label="Early-booking discount (%)">
              <Input type="number" defaultValue="7" className="form-input" />
            </Field>
            <Field label="Minimum stay">
              <Input type="number" defaultValue="1" className="form-input" />
            </Field>
            <Field label="Maximum stay">
              <Input type="number" defaultValue="28" className="form-input" />
            </Field>
          </div>
          <div className="mt-6 rounded-2xl border border-[#e2d4c0] bg-[#fbf6ed] p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-extrabold">Date-range override</p>
                <p className="text-sm text-[#776d64]">
                  Sep 18–Oct 3 · Pchum Ben
                </p>
              </div>
              <Button
                variant="secondary"
                onClick={() => toast.info("Date-range pricing editor opened")}
              >
                Edit override
              </Button>
            </div>
          </div>
        </Card>
        <Card className="self-start overflow-hidden">
          <div className="relative aspect-[16/9]">
            <Image
              src={property.image}
              alt="Property price preview"
              fill
              className="object-cover"
              sizes="360px"
            />
          </div>
          <div className="p-5">
            <p className="font-extrabold">{property.name}</p>
            <p className="mt-1 text-sm text-[#776d64]">
              Price preview · local demo
            </p>
            <p className="tabular mt-5 text-3xl font-extrabold">
              ${price}
              <span className="text-sm font-medium text-[#776d64]">
                {" "}
                / night
              </span>
            </p>
            <div className="mt-4 rounded-xl bg-[#f1e8da] p-3 text-sm">
              <p className="flex justify-between">
                <span>7-night subtotal</span>
                <strong>${price * 7}</strong>
              </p>
              <p className="mt-2 flex justify-between text-[#3c7a57]">
                <span>Weekly discount</span>
                <strong>−${Math.round(price * 7 * 0.08)}</strong>
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function EarningsView() {
  const { tx } = useText();
  const currency = useAppStore((state) => state.currency);
  const columns = useMemo<ColumnDef<(typeof financeRows)[number]>[]>(
    () => [
      { accessorKey: "date", header: "Date" },
      {
        accessorKey: "booking",
        header: "Booking",
        cell: ({ getValue }) => (
          <span className="font-extrabold">{getValue<string>()}</span>
        ),
      },
      { accessorKey: "owner", header: "Property owner" },
      {
        accessorKey: "amount",
        header: "Gross",
        cell: ({ getValue }) => formatMoney(getValue<number>(), currency),
      },
      {
        accessorKey: "commission",
        header: "Commission",
        cell: ({ getValue }) => formatMoney(getValue<number>(), currency),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ getValue }) => <StatusBadge status={getValue<string>()} />,
      },
    ],
    [currency],
  );
  return (
    <div>
      <PageHeader
        eyebrow={tx("Finance · demo", "ហិរញ្ញវត្ថុ · សាកល្បង")}
        title={tx("Earnings", "ចំណូល")}
        description={tx(
          "Track booking value, platform commission and local payout estimates.",
          "តាមដានតម្លៃការកក់ កម្រៃជើងសារ និងការបើកប្រាក់សាកល្បង។",
        )}
        actions={<ExportButton label="Download statement" />}
      />
      <AlertBanner title="Demo financial information" tone="info">
        No real transactions, payouts, refunds or bank services are connected.
      </AlertBanner>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Gross booking value"
          value={formatMoney(21860, currency)}
          icon={<CircleDollarSign className="size-5" />}
        />
        <StatCard
          label="Platform commission"
          value={formatMoney(3279, currency)}
          icon={<TrendingUp className="size-5" />}
          accent="rose"
        />
        <StatCard
          label="Net earnings"
          value={formatMoney(18581, currency)}
          icon={<WalletCards className="size-5" />}
          accent="green"
        />
        <StatCard
          label="Pending"
          value={formatMoney(2180, currency)}
          icon={<Clock3 className="size-5" />}
          accent="blue"
        />
        <StatCard
          label="Refund deductions"
          value={formatMoney(184, currency)}
          icon={<ArrowLeft className="size-5" />}
          accent="rose"
        />
      </div>
      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <ChartCard title="Revenue trend" subtitle="Gross and net demo earnings">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={monthlyAnalytics}>
              <CartesianGrid
                stroke="#eadfce"
                strokeDasharray="4 4"
                vertical={false}
              />
              <XAxis dataKey="month" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} />
              <Tooltip />
              <Legend />
              <Bar
                dataKey="revenue"
                name="Gross"
                fill="#b88a44"
                radius={[6, 6, 0, 0]}
              />
              <Bar
                dataKey="commission"
                name="Commission"
                fill="#8fa38a"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Earnings by property" subtitle="Top five properties">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              layout="vertical"
              data={seedProperties.slice(0, 5).map((item, index) => ({
                name: item.province,
                value: 4100 - index * 480,
              }))}
            >
              <CartesianGrid
                stroke="#eadfce"
                strokeDasharray="4 4"
                horizontal={false}
              />
              <XAxis type="number" axisLine={false} tickLine={false} />
              <YAxis
                type="category"
                dataKey="name"
                axisLine={false}
                tickLine={false}
                width={85}
              />
              <Tooltip />
              <Bar dataKey="value" fill="#547a91" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
      <Card className="mt-5">
        <div className="p-5">
          <h2 className="font-extrabold">Transactions</h2>
        </div>
        <DemoTable data={financeRows} columns={columns} />
        <Pagination total={3} />
      </Card>
    </div>
  );
}

function PayoutsView() {
  const { tx, isKhmer } = useText();
  const currency = useAppStore((state) => state.currency);
  const exchangeRate = useAppStore((state) => state.exchangeRate);
  const [payoutsList, setPayoutsList] = useState<Payout[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState("");
  const [bakongAccount, setBakongAccount] = useState("");

  const completedBookings = useMemo(
    () =>
      bookings.filter(
        (b) =>
          b.status === "Completed" ||
          b.payment === "Paid" ||
          b.payment === "Demo paid",
      ),
    [],
  );

  const loadPayoutsData = () => {
    getPayouts()
      .then((res) => {
        if (res?.payouts) {
          setPayoutsList(res.payouts);
        }
      })
      .catch(() => {
        // Fallback demo initial payouts
        setPayoutsList([
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
            status: "Processing",
            reference: "",
            createdAt: "2026-09-15T09:00:00Z",
            propertyName: "Kampot Riverstone",
            guestName: "Channary Phoung",
          },
        ]);
      });
  };

  useEffect(() => {
    loadPayoutsData();
    window.addEventListener("khmerstay:refresh-bookings", loadPayoutsData);
    return () =>
      window.removeEventListener("khmerstay:refresh-bookings", loadPayoutsData);
  }, []);

  // Eligible bookings not yet requested
  const existingBookingIds = useMemo(
    () => new Set(payoutsList.map((p) => p.bookingId)),
    [payoutsList],
  );

  const eligibleBookings = useMemo(
    () => completedBookings.filter((b) => !existingBookingIds.has(b.id)),
    [completedBookings, existingBookingIds],
  );

  const currentBookingId =
    selectedBookingId ||
    (eligibleBookings.length > 0 ? eligibleBookings[0].id : "");

  // Selected booking calculations
  const targetBooking = useMemo(
    () =>
      completedBookings.find((b) => b.id === currentBookingId) ||
      eligibleBookings[0],
    [completedBookings, eligibleBookings, currentBookingId],
  );

  const selectedGross = targetBooking ? targetBooking.total : 0;
  const selectedCommission = Number((selectedGross * 0.15).toFixed(2));
  const selectedNet = Number((selectedGross - selectedCommission).toFixed(2));

  // Financial totals
  const totalGross = completedBookings.reduce((sum, b) => sum + b.total, 0);
  const totalCommission = Number((totalGross * 0.15).toFixed(2));
  const totalNet = Number((totalGross - totalCommission).toFixed(2));

  const paidPayoutsTotal = payoutsList
    .filter((p) => p.status === "Paid")
    .reduce((sum, p) => sum + p.netAmount, 0);

  const availableBalance = Math.max(0, totalNet - paidPayoutsTotal);

  async function handleRequestPayout(e: React.FormEvent) {
    e.preventDefault();
    const bookingToRequest = currentBookingId;
    if (!bookingToRequest) {
      toast.error(
        isKhmer
          ? "សូមជ្រើសរើសការកក់ដែលបានបញ្ចប់"
          : "Please select a completed booking",
      );
      return;
    }
    if (!bakongAccount.trim()) {
      toast.error(
        isKhmer
          ? "សូមបញ្ចូលគណនី Bakong ID ឬលេខទូរស័ព្ទ"
          : "Please enter your Bakong Account ID or phone number",
      );
      return;
    }

    setSubmitting(true);
    try {
      let createdPayout: Payout;
      try {
        const res = await requestPayout(bookingToRequest, bakongAccount.trim());
        createdPayout = res.payout;
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        if (
          err &&
          typeof err === "object" &&
          "status" in err &&
          (err as { status: number }).status !== 0 &&
          !errMsg.includes("Cannot reach")
        ) {
          toast.error(errMsg || "Could not request payout");
          setSubmitting(false);
          return;
        }
        // Fallback local representation
        createdPayout = {
          id: `PO-${Date.now().toString().slice(-6)}`,
          ownerId: "owner-1",
          bookingId: bookingToRequest,
          grossAmount: selectedGross,
          commissionRate: 15,
          commissionAmount: selectedCommission,
          netAmount: selectedNet,
          currency: "USD",
          bakongAccount: bakongAccount.trim(),
          status: "Pending",
          reference: "",
          createdAt: new Date().toISOString(),
          propertyName: targetBooking?.property || "Stay",
          guestName: targetBooking?.guest || "Guest",
        };
      }

      setPayoutsList((prev) => [createdPayout, ...prev]);
      toast.success(
        isKhmer
          ? `សំណើបើកប្រាក់ ${createdPayout.id} ត្រូវបានដាក់ដោយជោគជ័យ!`
          : `Bakong payout request ${createdPayout.id} submitted successfully!`,
        {
          description: isKhmer
            ? `ចំនួនទឹកប្រាក់សុទ្ធ $${createdPayout.netAmount} នឹងត្រូវផ្ញើទៅ ${createdPayout.bakongAccount}`
            : `Net amount of $${createdPayout.netAmount} will be transferred to ${createdPayout.bakongAccount}`,
          duration: 7000,
        },
      );
      setModalOpen(false);
      setSelectedBookingId("");
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to request Bakong payout",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow={tx("Finance · Bakong", "ហិរញ្ញវត្ថុ · បាគង")}
        title={tx("Payouts & Earnings", "ការបើកប្រាក់ និងចំណូល")}
        description={tx(
          "Track gross booking revenue, 15% platform commission, and request real-time Bakong bank settlements.",
          "តាមដានចំណូលសរុបពីការកក់ កម្រៃជើងសារ ១៥% និងស្នើសុំបើកប្រាក់តាមប្រព័ន្ធបាគងភ្លាមៗ។",
        )}
        actions={
          <Button
            onClick={() => {
              if (eligibleBookings.length > 0) {
                setSelectedBookingId(eligibleBookings[0].id);
              }
              setModalOpen(true);
            }}
          >
            <WalletCards className="size-4" />
            {tx("Request Bakong Payout", "ស្នើសុំបើកប្រាក់ Bakong")}
          </Button>
        }
      />

      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={tx("Total Gross Value", "ចំណូលសរុប (Gross)")}
          value={formatMoney(totalGross, currency)}
          helper={tx("All completed bookings", "ការកក់ដែលបានបញ្ចប់សរុប")}
          icon={<CircleDollarSign className="size-5" />}
          accent="blue"
        />
        <StatCard
          label={tx("Platform Commission (15%)", "កម្រៃជើងសារ (១៥%)")}
          value={formatMoney(totalCommission, currency)}
          helper={tx("KhmerStay service fee", "សេវាថែទាំប្រព័ន្ធ KhmerStay")}
          icon={<TrendingUp className="size-5" />}
        />
        <StatCard
          label={tx("Net Host Payout (85%)", "ចំណូលសុទ្ធម្ចាស់ផ្ទះ (៨៥%)")}
          value={formatMoney(totalNet, currency)}
          helper={tx("Host earnings after fee", "ចំណូលទទួលបានក្រោយកាត់កម្រៃ")}
          icon={<CheckCircle2 className="size-5" />}
          accent="green"
        />
        <StatCard
          label={tx("Available for Payout", "សមតុល្យអាចបើកបាន")}
          value={formatMoney(availableBalance, currency)}
          helper={tx(
            `${eligibleBookings.length} bookings eligible`,
            `មាន ${eligibleBookings.length} ការកក់អាចបើកបាន`,
          )}
          icon={<WalletCards className="size-5" />}
          accent="green"
        />
      </div>

      {/* Request Bakong Payout Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {tx("Request Bakong Payout", "ស្នើសុំបើកប្រាក់តាមប្រព័ន្ធ Bakong")}
            </DialogTitle>
            <DialogDescription>
              {tx(
                "Settle your completed stays directly into your Bakong account with 15% platform commission deducted.",
                "ទូទាត់ប្រាក់ពីការកក់ដែលបានបញ្ចប់ដោយផ្ទាល់ទៅក្នុងគណនីបាគងរបស់អ្នក ដោយកាត់កម្រៃជើងសារ ១៥%។",
              )}
            </DialogDescription>
          </DialogHeader>

          {eligibleBookings.length === 0 && (
            <div className="py-4 text-center">
              <p className="text-sm text-[#73675c]">
                {tx(
                  "No completed bookings currently available for new payout requests.",
                  "មិនមានការកក់ដែលបានបញ្ចប់សម្រាប់ដាក់ស្នើសុំបើកប្រាក់ថ្មីនៅពេលនេះទេ។",
                )}
              </p>
            </div>
          )}

          {eligibleBookings.length > 0 && (
            <form onSubmit={handleRequestPayout} className="space-y-4 pt-2">
              <div>
                <label className="text-xs font-bold text-[#6a5e53]">
                  {tx(
                    "Select Completed Booking",
                    "ជ្រើសរើសការកក់ដែលបានបញ្ចប់",
                  )}
                </label>
                <Select
                  value={currentBookingId}
                  onValueChange={setSelectedBookingId}
                >
                  <SelectTrigger className="mt-1 w-full rounded-xl border-[#ded3c2] bg-white text-xs">
                    <SelectValue placeholder={tx("Select completed booking", "ជ្រើសរើសការកក់")} />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {eligibleBookings.map((b) => (
                      <SelectItem key={b.id} value={b.id} className="text-xs">
                        {b.id} · {b.guest} · {b.property} (${b.total})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Commission Breakdown Card */}
              <div className="rounded-xl border border-[#ded2c0] bg-[#fbf8f2] p-4 text-sm">
                <p className="font-extrabold text-[#3a3028]">
                  {tx(
                    "Settlement Calculation Breakdown",
                    "ការគណនាកម្រៃជើងសារ និងចំណូលសុទ្ធ",
                  )}
                </p>
                <div className="mt-3 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#6d6155]">
                      {tx("Gross Booking Amount:", "តម្លៃការកក់សរុប (Gross):")}
                    </span>
                    <strong className="tabular font-bold">
                      {formatMoney(selectedGross, currency)}
                    </strong>
                  </div>
                  <div className="flex justify-between text-[#a04747]">
                    <span>
                      {tx(
                        "KhmerStay Commission (15%):",
                        "កម្រៃជើងសារ KhmerStay (១៥%):",
                      )}
                    </span>
                    <strong className="tabular font-bold">
                      -{formatMoney(selectedCommission, currency)}
                    </strong>
                  </div>
                  <div className="border-t border-[#e2d5c3] pt-2 flex justify-between text-base font-extrabold text-[#1f4e38]">
                    <span>
                      {tx("Net Host Payout (85%):", "ចំណូលសុទ្ធម្ចាស់ផ្ទះ (៨៥%):")}
                    </span>
                    <strong className="tabular">
                      {formatMoney(selectedNet, currency)}
                    </strong>
                  </div>
                  <div className="text-[0.7rem] text-[#786b5f] text-right">
                    ≈ {(selectedNet * exchangeRate).toLocaleString()} ៛ (NBC rate: {exchangeRate.toLocaleString()} KHR/USD)
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#6a5e53]">
                  {tx(
                    "Bakong Account ID / Phone Number",
                    "គណនី Bakong ID ឬលេខទូរស័ព្ទ",
                  )}
                </label>
                <Input
                  required
                  value={bakongAccount}
                  onChange={(e) => setBakongAccount(e.target.value)}
                  placeholder={tx(
                    "e.g., sokha@aclb, 012345678@aba, or +855 12 345 678",
                    "ឧទាហរណ៍៖ sokha@aclb, 012345678@aba ឬ +855 12 345 678",
                  )}
                  className="mt-1"
                />
                <p className="mt-1 text-[0.7rem] text-[#7d7165]">
                  {tx(
                    "Funds will be routed via the National Bank of Cambodia Bakong network.",
                    "ប្រាក់នឹងត្រូវផ្ទេរតាមប្រព័ន្ធធនាគារជាតិនៃកម្ពុជា (បាគង)។",
                  )}
                </p>
              </div>

              <DialogFooter className="mt-5 flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setModalOpen(false)}
                >
                  {tx("Cancel", "បោះបង់")}
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting
                    ? tx("Submitting…", "កំពុងដាក់ស្នើ…")
                    : tx("Request Settlement", "ស្នើសុំការទូទាត់")}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Payouts & Earnings Ledger Table */}
      <Card className="mt-6">
        <div className="flex flex-col gap-2 p-5 border-b border-[#ece2d4] sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-[#322820]">
              {tx(
                "Payouts & Earnings Ledger",
                "សៀវភៅតាមដានការបើកប្រាក់ និងចំណូល",
              )}
            </h2>
            <p className="text-xs text-[#786c60]">
              {tx(
                "Completed bookings with 15% commission deductions and real-time Bakong transfer statuses.",
                "ការកក់ដែលបានបញ្ចប់ ជាមួយកម្រៃជើងសារ ១៥% និងស្ថានភាពផ្ទេរតាមបាគង។",
              )}
            </p>
          </div>
          <ExportButton />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#e8ded0] bg-[#f9f5ee] text-xs font-bold text-[#685c50]">
                <th className="px-5 py-3.5">
                  {tx("Payout ID / Ref", "លេខកូដបើកប្រាក់")}
                </th>
                <th className="px-4 py-3.5">
                  {tx("Booking ID", "លេខកូដកក់")}
                </th>
                <th className="px-4 py-3.5">
                  {tx("Guest & Stay", "ភ្ញៀវ និងកន្លែងស្នាក់")}
                </th>
                <th className="px-4 py-3.5 text-right">
                  {tx("Gross Amount", "តម្លៃសរុប (Gross)")}
                </th>
                <th className="px-4 py-3.5 text-right text-[#a04747]">
                  {tx("Commission (15%)", "កម្រៃ (១៥%)")}
                </th>
                <th className="px-4 py-3.5 text-right font-extrabold text-[#1f4e38]">
                  {tx("Net Payout (85%)", "ចំណូលសុទ្ធ (៨៥%)")}
                </th>
                <th className="px-4 py-3.5">
                  {tx("Bakong Account", "គណនីបាគង")}
                </th>
                <th className="px-4 py-3.5">{tx("Status", "ស្ថានភាព")}</th>
                <th className="px-4 py-3.5 text-right">
                  {tx("Action", "សកម្មភាព")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ece2d4]">
              {/* Active Payout Requests */}
              {payoutsList.map((payout) => (
                <tr key={payout.id} className="hover:bg-[#fbf7f0] transition">
                  <td className="px-5 py-4 font-extrabold text-[#815b29]">
                    {payout.id}
                    {payout.reference && (
                      <span className="block text-[0.68rem] text-[#6d6155] font-normal">
                        Ref: {payout.reference}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4 font-bold text-[#453c34]">
                    {payout.bookingId}
                  </td>
                  <td className="px-4 py-4">
                    <strong className="block text-[#322820]">
                      {payout.guestName || "Guest"}
                    </strong>
                    <span className="text-xs text-[#776c60]">
                      {payout.propertyName || "Homestay"}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right tabular font-bold">
                    {formatMoney(payout.grossAmount, currency)}
                  </td>
                  <td className="px-4 py-4 text-right tabular text-[#a04747]">
                    -{formatMoney(payout.commissionAmount, currency)}
                  </td>
                  <td className="px-4 py-4 text-right tabular font-extrabold text-[#1f4e38]">
                    {formatMoney(payout.netAmount, currency)}
                  </td>
                  <td className="px-4 py-4">
                    <span className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-[#54493e]">
                      <WalletCards className="size-3 text-[#b58b44]" />
                      {payout.bakongAccount}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <StatusBadge status={payout.status} />
                  </td>
                  <td className="px-4 py-4 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        toast.info(
                          `${payout.id} · ${payout.status} · Bakong: ${payout.bakongAccount}`,
                        )
                      }
                    >
                      {tx("Details", "ព័ត៌មានលម្អិត")}
                    </Button>
                  </td>
                </tr>
              ))}

              {/* Completed Bookings eligible for payout */}
              {eligibleBookings.slice(0, 6).map((booking) => {
                const gross = booking.total;
                const comm = Number((gross * 0.15).toFixed(2));
                const net = Number((gross - comm).toFixed(2));
                return (
                  <tr
                    key={booking.id}
                    className="hover:bg-[#fbf7f0] transition bg-[#fffefb]"
                  >
                    <td className="px-5 py-4 font-mono text-xs text-[#8a7f73]">
                      —
                    </td>
                    <td className="px-4 py-4 font-bold text-[#453c34]">
                      {booking.id}
                    </td>
                    <td className="px-4 py-4">
                      <strong className="block text-[#322820]">
                        {booking.guest}
                      </strong>
                      <span className="text-xs text-[#776c60]">
                        {booking.property}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right tabular font-bold">
                      {formatMoney(gross, currency)}
                    </td>
                    <td className="px-4 py-4 text-right tabular text-[#a04747]">
                      -{formatMoney(comm, currency)}
                    </td>
                    <td className="px-4 py-4 text-right tabular font-extrabold text-[#1f4e38]">
                      {formatMoney(net, currency)}
                    </td>
                    <td className="px-4 py-4 text-xs text-[#84786d]">
                      {tx("Not requested", "មិនទាន់ស្នើ")}
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-800 border border-emerald-200">
                        {tx("Eligible for Payout", "អាចបើកប្រាក់បាន")}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setSelectedBookingId(booking.id);
                          setModalOpen(true);
                        }}
                      >
                        {tx("Request", "ស្នើសុំ")}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function ReviewsView() {
  const [query, setQuery] = useState("");
  const [responses, setResponses] = useState<Record<string, string>>(
    Object.fromEntries(reviews.map((review) => [review.id, review.response])),
  );
  return (
    <div>
      <PageHeader
        eyebrow="Guest feedback"
        title="Reviews"
        description="Read guest feedback, respond publicly and report concerns."
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Average rating"
          value="4.8"
          helper="96 total reviews"
          icon={<Star className="size-5" />}
        />
        <StatCard
          label="Response rate"
          value="82%"
          helper="+6% this month"
          icon={<MessageCircle className="size-5" />}
          accent="green"
        />
        <StatCard
          label="Unanswered"
          value="7"
          helper="Reply when helpful"
          icon={<Clock3 className="size-5" />}
          accent="rose"
        />
      </div>
      <Card className="mt-5 p-3">
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="relative flex-1">
            <Search className="absolute left-3 top-3 size-4 text-[#7b7168]" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="min-h-11 w-full rounded-xl border border-[#ded2c0] pl-10 pr-3 text-sm"
              placeholder="Search reviews"
            />
          </label>
          <Select defaultValue="all">
            <SelectTrigger className="min-h-11 w-40 rounded-xl border-[#ded2c0] bg-white text-sm font-bold shadow-2xs">
              <SelectValue placeholder="All ratings" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All ratings</SelectItem>
              <SelectItem value="5">5 stars</SelectItem>
              <SelectItem value="4">4 stars</SelectItem>
              <SelectItem value="3">3 stars or less</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="all">
            <SelectTrigger className="min-h-11 w-44 rounded-xl border-[#ded2c0] bg-white text-sm font-bold shadow-2xs">
              <SelectValue placeholder="All responses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All responses</SelectItem>
              <SelectItem value="unanswered">Unanswered</SelectItem>
              <SelectItem value="responded">Responded</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>
      <div className="mt-5 space-y-4">
        {reviews
          .filter((review) =>
            `${review.guest} ${review.property} ${review.text}`
              .toLowerCase()
              .includes(query.toLowerCase()),
          )
          .map((review) => (
            <Card key={review.id} className="p-5">
              <div className="flex flex-col gap-4 sm:flex-row">
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-[#efe5d6] font-extrabold">
                  {review.guest
                    .split(" ")
                    .map((part) => part[0])
                    .join("")}
                </span>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-extrabold">{review.guest}</p>
                      <p className="text-xs text-[#776d64]">
                        {review.property} · {review.date}
                      </p>
                    </div>
                    <span className="text-sm font-extrabold text-[#a87430]">
                      {"★".repeat(review.rating)}
                      <span className="text-[#d9cdbc]">
                        {"★".repeat(5 - review.rating)}
                      </span>
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-[#60574f]">
                    {review.text}
                  </p>
                  {responses[review.id] ? (
                    <div className="mt-4 rounded-xl border-l-4 border-[#b88a44] bg-[#faf4e9] p-4">
                      <p className="text-xs font-extrabold uppercase tracking-wide text-[#8e652c]">
                        Your public response
                      </p>
                      <p className="mt-1 text-sm">{responses[review.id]}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2"
                        onClick={() =>
                          setResponses((value) => ({
                            ...value,
                            [review.id]: "",
                          }))
                        }
                      >
                        <Edit3 className="size-4" />
                        Edit response
                      </Button>
                    </div>
                  ) : (
                    <div className="mt-4">
                      <Textarea
                        id={`reply-${review.id}`}
                        className="form-input min-h-20"
                        placeholder="Write a thoughtful public response…"
                      />
                      <div className="mt-2 flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            const field = document.getElementById(
                              `reply-${review.id}`,
                            ) as HTMLTextAreaElement | null;
                            if (field?.value) {
                              setResponses((value) => ({
                                ...value,
                                [review.id]: field.value,
                              }));
                              toast.success("Response published locally");
                            }
                          }}
                        >
                          <Send className="size-4" />
                          Post response
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            toast.info("Report-review dialog opened")
                          }
                        >
                          Report
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
      </div>
    </div>
  );
}

function MessagesView() {
  return <ChatWorkspace mode="owner" />;
}

function AnalyticsView() {
  return (
    <div>
      <PageHeader
        eyebrow="Performance"
        title="Analytics"
        description="Explore local booking, revenue, occupancy and guest patterns."
        actions={<ExportButton label="Download report" />}
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Occupancy"
          value="78%"
          helper="+5.2%"
          icon={<Home className="size-5" />}
        />
        <StatCard
          label="Average daily rate"
          value="$47"
          helper="+$4"
          icon={<CircleDollarSign className="size-5" />}
          accent="green"
        />
        <StatCard
          label="Cancellation rate"
          value="6.2%"
          helper="−1.1%"
          icon={<ArrowLeft className="size-5" />}
          accent="rose"
        />
        <StatCard
          label="Conversion · mock"
          value="8.4%"
          helper="+0.9%"
          icon={<TrendingUp className="size-5" />}
          accent="blue"
        />
        <StatCard
          label="Average stay"
          value="2.8 nights"
          helper="+0.3 night"
          icon={<BedDouble className="size-5" />}
        />
      </div>
      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <ChartCard title="Revenue trend" subtitle="Last six months">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={monthlyAnalytics}>
              <CartesianGrid
                stroke="#eadfce"
                strokeDasharray="4 4"
                vertical={false}
              />
              <XAxis dataKey="month" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#b88a44"
                strokeWidth={3}
                dot={{ fill: "#b88a44", r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Booking trend" subtitle="Confirmed stays">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthlyAnalytics}>
              <CartesianGrid
                stroke="#eadfce"
                strokeDasharray="4 4"
                vertical={false}
              />
              <XAxis dataKey="month" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} />
              <Tooltip />
              <Bar dataKey="bookings" fill="#547a91" radius={[7, 7, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        {[
          [
            "Guest origin",
            [
              ["Phnom Penh", "42%"],
              ["Siem Reap", "18%"],
              ["International · mock", "16%"],
            ],
          ],
          [
            "Booking lead time",
            [
              ["0–3 days", "22%"],
              ["4–14 days", "48%"],
              ["15+ days", "30%"],
            ],
          ],
          [
            "Room performance",
            [
              ["Lotus King", "84%"],
              ["Garden Twin", "76%"],
              ["Family House", "68%"],
            ],
          ],
        ].map(([title, rows]) => (
          <Card key={title as string} className="p-5">
            <h2 className="font-extrabold">{title as string}</h2>
            <div className="mt-4 space-y-3">
              {(rows as string[][]).map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-center justify-between text-sm"
                >
                  <span>{label}</span>
                  <strong className="tabular">{value}</strong>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function NotificationsView() {
  const { tx } = useText();
  const read = useAppStore((state) => state.notificationsRead);
  const mark = useAppStore((state) => state.markNotificationRead);
  const rows = notifications.filter((item) => item.role === "owner");
  return (
    <div>
      <PageHeader
        eyebrow={tx("Updates", "ព័ត៌មានថ្មី")}
        title={tx("Notifications", "ការជូនដំណឹង")}
        description={tx(
          "Booking, message, arrival, review and verification updates.",
          "ព័ត៌មានអំពីការកក់ សារ ការមកដល់ មតិ និងការផ្ទៀងផ្ទាត់។",
        )}
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
                "mt-1 size-3 shrink-0 rounded-full",
                read.includes(item.id) ? "bg-[#d8cfc3]" : "bg-[#b88a44]",
              )}
            />
            <span className="flex-1">
              <span className="flex flex-wrap items-center gap-2">
                <strong>{item.title}</strong>
                <StatusBadge status={item.category} />
              </span>
              <span className="mt-1 block text-sm text-[#756d66]">
                {item.detail}
              </span>
            </span>
            <small className="text-[#81776e]">{item.time}</small>
          </Button>
        ))}
      </Card>
    </div>
  );
}

function VerificationView() {
  const [status, setStatus] = useState("Changes required");
  return (
    <div>
      <PageHeader
        eyebrow="Trust & safety · demo"
        title="Verification"
        description="Review your identity and business information before local submission."
        actions={<StatusBadge status={status} />}
      />
      <AlertBanner title="One change requested">
        Replace the blurred business registration preview, then resubmit for
        demonstration review.
      </AlertBanner>
      <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_360px]">
        <Card className="p-5 sm:p-6">
          <h2 className="text-lg font-extrabold">Identity information</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Full legal name">
              <Input className="form-input" defaultValue="Sokha Chea" />
            </Field>
            <Field label="ID number">
              <Input className="form-input" defaultValue="•••• •••• 8921" />
            </Field>
            <Field label="Business name">
              <Input
                className="form-input"
                defaultValue="Sokha Heritage Hospitality"
              />
            </Field>
            <Field label="Business province">
              <Select defaultValue="Siem Reap">
                <SelectTrigger className="form-input min-h-10 w-full rounded-xl bg-white text-sm font-semibold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Siem Reap">Siem Reap</SelectItem>
                  <SelectItem value="Phnom Penh">Phnom Penh</SelectItem>
                  <SelectItem value="Kampot">Kampot</SelectItem>
                  <SelectItem value="Battambang">Battambang</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
          <h2 className="mt-8 text-lg font-extrabold">Documents</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <DocumentCard name="National ID" status="Approved" />
            <DocumentCard name="Business registration" status={status} />
          </div>
          <Button
            className="mt-5"
            onClick={() => {
              setStatus("Under review");
              toast.success("Verification resubmitted locally");
            }}
          >
            <Upload className="size-4" />
            Resubmit documents
          </Button>
        </Card>
        <Card className="self-start p-5">
          <h2 className="font-extrabold">Verification progress</h2>
          <div className="mt-5">
            <ProgressRow label="Profile" value={100} />
            <div className="mt-4">
              <ProgressRow label="Identity" value={100} />
            </div>
            <div className="mt-4">
              <ProgressRow label="Business" value={70} />
            </div>
          </div>
          <Timeline
            items={[
              { title: "Profile completed", meta: "Aug 20" },
              { title: "Documents submitted", meta: "Aug 22" },
              { title: status, meta: "Aug 25 · Demo reviewer" },
            ]}
          />
          <p className="mt-4 rounded-xl bg-[#f4ece0] p-3 text-xs leading-5 text-[#746a61]">
            All document previews remain local. No verification provider or
            cloud storage is connected.
          </p>
        </Card>
      </div>
    </div>
  );
}
function DocumentCard({ name, status }: { name: string; status: string }) {
  return (
    <div className="rounded-xl border border-[#e1d4c2] bg-white p-4">
      <div className="flex items-start justify-between gap-2">
        <span className="grid size-10 place-items-center rounded-xl bg-[#f1e7d7] text-[#91662e]">
          <FileCheck2 className="size-5" />
        </span>
        <StatusBadge status={status} />
      </div>
      <p className="mt-4 font-extrabold">{name}</p>
      <p className="mt-1 text-xs text-[#776d64]">Local demonstration preview</p>
      <Button variant="ghost" size="sm" className="mt-2">
        <Eye className="size-4" />
        Preview
      </Button>
    </div>
  );
}

function OwnerAccountView() {
  const router = useRouter();
  const { language, tx } = useText();
  const setLanguage = useAppStore((state) => state.setLanguage);
  const currency = useAppStore((state) => state.currency);
  const setCurrency = useAppStore((state) => state.setCurrency);
  const resetApp = useAppStore((state) => state.resetDemo);
  const resetDemo = useDemoStore((state) => state.reset);
  return (
    <div>
      <PageHeader
        eyebrow={tx("Profile & preferences", "ព័ត៌មាន និងចំណូលចិត្ត")}
        title={tx("Account", "គណនី")}
        description={tx(
          "Manage your personal details and local workspace preferences.",
          "គ្រប់គ្រងព័ត៌មានផ្ទាល់ខ្លួន និងចំណូលចិត្តក្នុងឧបករណ៍។",
        )}
      />
      <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
        <Card className="p-5 sm:p-6">
          <h2 className="font-extrabold">Personal information</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Full name">
              <Input className="form-input" defaultValue="Sokha Chea" />
            </Field>
            <Field label="Business name">
              <Input
                className="form-input"
                defaultValue="Sokha Heritage Hospitality"
              />
            </Field>
            <Field label="Email">
              <Input
                className="form-input"
                defaultValue="owner@khmerstay.demo"
              />
            </Field>
            <Field label="Phone">
              <Input className="form-input" defaultValue="+855 12 345 678" />
            </Field>
          </div>
          <Button
            className="mt-5"
            onClick={() => toast.success("Profile saved locally")}
          >
            <Save className="size-4" />
            Save details
          </Button>
          <h2 className="mt-9 font-extrabold">Security · demo</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Current password">
              <Input type="password" className="form-input" />
            </Field>
            <Field label="New password">
              <Input type="password" className="form-input" />
            </Field>
          </div>
          <Button
            variant="secondary"
            className="mt-4"
            onClick={() => toast.success("Demo password form completed")}
          >
            Change demo password
          </Button>
        </Card>
        <div className="space-y-5">
          <Card className="p-5">
            <h2 className="font-extrabold">Preferences</h2>
            <Field label="Language" className="mt-4">
              <Select
                value={language}
                onValueChange={(val) => setLanguage(val as "km" | "en")}
              >
                <SelectTrigger className="form-input min-h-10 w-full rounded-xl bg-white text-sm font-semibold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="km">ខ្មែរ (KM)</SelectItem>
                  <SelectItem value="en">English (EN)</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Currency" className="mt-4">
              <Select
                value={currency}
                onValueChange={(val) => setCurrency(val as "USD" | "KHR")}
              >
                <SelectTrigger className="form-input min-h-10 w-full rounded-xl bg-white text-sm font-semibold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="KHR">KHR (៛)</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <label className="mt-4 flex items-center justify-between rounded-xl border border-[#e1d5c3] p-3 text-sm font-bold">
              Booking notifications
              <Checkbox defaultChecked className="size-5" />
            </label>
            <label className="mt-2 flex items-center justify-between rounded-xl border border-[#e1d5c3] p-3 text-sm font-bold">
              Guest messages
              <Checkbox defaultChecked className="size-5" />
            </label>
          </Card>
          <Card className="p-5">
            <h2 className="font-extrabold text-[#9d4949]">Demo controls</h2>
            <ConfirmDialog
              trigger={
                <Button variant="danger" className="mt-4 w-full">
                  Reset demo data
                </Button>
              }
              title="Reset all local demo data?"
              description="This clears your session, preferences and local record changes."
              confirmLabel="Reset everything"
              danger
              onConfirm={() => {
                resetDemo();
                resetApp();
                router.push("/login");
              }}
            />
          </Card>
        </div>
      </div>
    </div>
  );
}
