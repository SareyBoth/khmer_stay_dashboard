"use client";

import {
  flexRender,
  getCoreRowModel,
  type ColumnDef,
  useReactTable,
} from "@tanstack/react-table";
import {
  AlertTriangle,
  ArrowDownToLine,
  Check,
  ChevronLeft,
  ChevronRight,
  Inbox,
  LoaderCircle,
} from "lucide-react";
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button as ShadcnButton } from "@/components/ui/button";
import { Card as ShadcnCard } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton as ShadcnSkeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export { cn };

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "icon";

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant;
    size?: ButtonSize;
  }
>(function Button(
  { className, variant = "primary", size = "md", ...props },
  ref,
) {
  const shadcnVariant =
    variant === "primary"
      ? "default"
      : variant === "danger"
        ? "destructive"
        : variant;
  const shadcnSize = size === "md" ? "lg" : size;
  return (
    <ShadcnButton
      ref={ref}
      variant={shadcnVariant}
      size={shadcnSize}
      className={cn(
        "min-h-11 gap-2 rounded-xl px-4 font-bold",
        variant === "primary" && "bg-[#2b2118] text-white hover:bg-[#463529]",
        variant === "secondary" &&
          "border border-[#d9ccb8] bg-white text-[#3b332d] hover:bg-[#f8f0e3]",
        variant === "ghost" && "text-[#5f554c] hover:bg-[#f2e8d8]",
        variant === "danger" && "bg-[#a94d4d] text-white hover:bg-[#8f3f3f]",
        size === "sm" && "min-h-9 rounded-lg px-3 text-xs",
        size === "icon" && "size-11 px-0",
        className,
      )}
      {...props}
    />
  );
});

export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <ShadcnCard
      className={cn(
        "block gap-0 rounded-2xl border border-[#e3d7c5] bg-[#fffdf8] py-0 shadow-[0_8px_28px_rgba(75,52,30,.055)] ring-0",
        className,
      )}
    >
      {children}
    </ShadcnCard>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
      <div>
        <p className="mb-1 text-xs font-extrabold uppercase tracking-[0.15em] text-[#a97936]">
          {eyebrow}
        </p>
        <h1 className="text-2xl font-extrabold tracking-[-0.035em] text-[#2b2118] sm:text-[2rem]">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#756d66] sm:text-base">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

const statusStyles: Record<string, string> = {
  Published: "bg-[#eaf4ed] text-[#2f6d4c]",
  Active: "bg-[#eaf4ed] text-[#2f6d4c]",
  Approved: "bg-[#eaf4ed] text-[#2f6d4c]",
  Completed: "bg-[#eaf4ed] text-[#2f6d4c]",
  Confirmed: "bg-[#eaf4ed] text-[#2f6d4c]",
  "Checked in": "bg-[#e8f1f6] text-[#466f87]",
  Paid: "bg-[#eaf4ed] text-[#2f6d4c]",
  Pending: "bg-[#fff3da] text-[#8d6220]",
  "Review pending": "bg-[#fff3da] text-[#8d6220]",
  "Under review": "bg-[#fff3da] text-[#8d6220]",
  Submitted: "bg-[#e8f1f6] text-[#466f87]",
  Open: "bg-[#fff3da] text-[#8d6220]",
  "New request": "bg-[#f2e9f6] text-[#775184]",
  Draft: "bg-[#efebe6] text-[#675d54]",
  Paused: "bg-[#efebe6] text-[#675d54]",
  Inactive: "bg-[#efebe6] text-[#675d54]",
  Closed: "bg-[#efebe6] text-[#675d54]",
  Resolved: "bg-[#eaf4ed] text-[#2f6d4c]",
  Rejected: "bg-[#fbe9e6] text-[#9f4949]",
  Suspended: "bg-[#fbe9e6] text-[#9f4949]",
  Failed: "bg-[#fbe9e6] text-[#9f4949]",
  Cancelled: "bg-[#fbe9e6] text-[#9f4949]",
  Declined: "bg-[#fbe9e6] text-[#9f4949]",
  "No-show": "bg-[#fbe9e6] text-[#9f4949]",
  "Changes required": "bg-[#fbe9e6] text-[#9f4949]",
};
export function StatusBadge({ status }: { status: string }) {
  const base = status.split(" · ")[0];
  return (
    <Badge
      variant="secondary"
      className={cn(
        "min-h-7 rounded-full border-0 px-2.5 py-1 text-xs font-extrabold",
        statusStyles[status] ||
          statusStyles[base] ||
          "bg-[#ece8e2] text-[#5d554e]",
      )}
    >
      {status}
    </Badge>
  );
}

export function StatCard({
  label,
  value,
  helper,
  icon,
  accent = "gold",
}: {
  label: string;
  value: string;
  helper?: string;
  icon: ReactNode;
  accent?: "gold" | "green" | "blue" | "rose";
}) {
  const accents = {
    gold: "bg-[#f5ead5] text-[#966b2f]",
    green: "bg-[#e8f1e9] text-[#3c7a57]",
    blue: "bg-[#e7eff3] text-[#547a91]",
    rose: "bg-[#f7e9e3] text-[#ae654c]",
  };
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[#756d66]">{label}</p>
          <p className="tabular mt-2 text-2xl font-extrabold tracking-[-0.035em] text-[#2b2118] sm:text-[1.72rem]">
            {value}
          </p>
          {helper && (
            <p className="mt-1 text-xs font-semibold text-[#3c7a57]">
              {helper}
            </p>
          )}
        </div>
        <span
          className={cn(
            "grid size-10 shrink-0 place-items-center rounded-xl",
            accents[accent],
          )}
        >
          {icon}
        </span>
      </div>
    </Card>
  );
}

export function AlertBanner({
  title,
  children,
  tone = "warning",
  action,
}: {
  title: string;
  children: ReactNode;
  tone?: "warning" | "info" | "success";
  action?: ReactNode;
}) {
  const tones = {
    warning: "border-[#e3c990] bg-[#fff7e8] text-[#704c18]",
    info: "border-[#bed2dd] bg-[#f0f6f9] text-[#3f6579]",
    success: "border-[#bdd6c5] bg-[#eef7f0] text-[#2f6748]",
  };
  return (
    <Alert
      className={cn(
        "flex flex-col justify-between gap-3 rounded-2xl px-4 py-3 sm:flex-row sm:items-center",
        tones[tone],
      )}
    >
      <div className="flex gap-3">
        <AlertTriangle className="mt-0.5 size-5 shrink-0" />
        <div>
          <AlertTitle className="font-extrabold">{title}</AlertTitle>
          <AlertDescription className="mt-0.5 text-sm text-current opacity-85">
            {children}
          </AlertDescription>
        </div>
      </div>
      {action}
    </Alert>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <ShadcnSkeleton
      className={cn("rounded-xl bg-[#ece4d8]", className)}
      aria-hidden="true"
    />
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <Card className="grid min-h-64 place-items-center p-8 text-center">
      <div className="max-w-md">
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#f3e9d8] text-[#9d7134]">
          <Inbox className="size-6" />
        </span>
        <h3 className="mt-4 text-lg font-extrabold">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-[#756d66]">{description}</p>
        {action && <div className="mt-5">{action}</div>}
      </div>
    </Card>
  );
}

export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel = "Confirm",
  danger = false,
  onConfirm,
}: {
  trigger: ReactNode;
  title: string;
  description: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="border-[#e3d6c3] bg-[#fffdf8] p-6 sm:max-w-md">
        <DialogHeader>
          <div
            className={`grid size-11 place-items-center rounded-xl ${danger ? "bg-[#fae7e4] text-[#a84a4a]" : "bg-[#f5ead5] text-[#8e652c]"}`}
          >
            {danger ? (
              <AlertTriangle className="size-5" />
            ) : (
              <Check className="size-5" />
            )}
          </div>
          <DialogTitle className="mt-2 text-xl font-extrabold tracking-[-0.025em]">
            {title}
          </DialogTitle>
          <DialogDescription className="text-sm leading-6 text-[#756d66]">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-2 border-0 bg-transparent p-0">
          <DialogClose asChild>
            <Button variant="secondary">Cancel</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button variant={danger ? "danger" : "primary"} onClick={onConfirm}>
              {confirmLabel}
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function DemoTable<T>({
  data,
  columns,
  empty = "No matching records",
}: {
  data: T[];
  columns: ColumnDef<T>[];
  empty?: string;
}) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });
  return (
    <div className="overflow-x-auto scrollbar-thin">
      <Table className="min-w-[760px] border-collapse text-left">
        <TableHeader>
          <TableRow className="border-b border-[#e6dbc9]">
            {table.getHeaderGroups()[0]?.headers.map((header) => (
              <TableHead
                key={header.id}
                className="px-4 py-3 text-xs font-extrabold uppercase tracking-[0.08em] text-[#81776f]"
              >
                {header.isPlaceholder
                  ? null
                  : flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                className="border-b border-[#eee6da] transition last:border-0 hover:bg-[#fbf6ed]"
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className="px-4 py-3.5 text-sm text-[#4a4139]"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="px-4 py-14 text-center text-sm text-[#756d66]"
              >
                {empty}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export function Pagination({
  page = 1,
  total = 5,
}: {
  page?: number;
  total?: number;
}) {
  return (
    <nav
      className="flex items-center justify-between border-t border-[#e7ddce] px-4 py-3"
      aria-label="Pagination"
    >
      <p className="text-xs font-semibold text-[#81776f]">
        Page {page} of {total}
      </p>
      <div className="flex gap-1">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Previous page"
          disabled={page === 1}
        >
          <ChevronLeft className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Next page"
          disabled={page === total}
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </nav>
  );
}

export function ExportButton({ label = "Export demo" }: { label?: string }) {
  return (
    <Button
      variant="secondary"
      onClick={() => {
        const blob = new Blob(
          ["KhmerStay demonstration export\nNo real financial data"],
          { type: "text/plain" },
        );
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = "khmerstay-demo.txt";
        anchor.click();
        URL.revokeObjectURL(url);
      }}
    >
      <ArrowDownToLine className="size-4" />
      {label}
    </Button>
  );
}

export function LoadingScreen() {
  return (
    <div className="grid min-h-screen place-items-center bg-[#fbf7ef]">
      <div className="text-center">
        <LoaderCircle className="mx-auto size-7 animate-spin text-[#a97936]" />
        <p className="mt-3 text-sm font-semibold text-[#756d66]">
          Preparing your workspace…
        </p>
      </div>
    </div>
  );
}
