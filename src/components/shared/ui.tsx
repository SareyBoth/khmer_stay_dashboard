"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { flexRender, getCoreRowModel, type ColumnDef, useReactTable } from "@tanstack/react-table";
import { AlertTriangle, ArrowDownToLine, Check, ChevronLeft, ChevronRight, Inbox, LoaderCircle, X } from "lucide-react";
import { type ButtonHTMLAttributes, type ReactNode } from "react";
import { twMerge } from "tailwind-merge";

export function cn(...classes: Array<string | false | null | undefined>) { return twMerge(classes.filter(Boolean).join(" ")); }

export function Button({ className, variant = "primary", size = "md", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "danger"; size?: "sm" | "md" | "icon" }) {
  return <button className={cn("inline-flex min-h-11 items-center justify-center gap-2 rounded-xl font-bold transition disabled:cursor-not-allowed disabled:opacity-50", variant === "primary" && "bg-[#2b2118] text-white hover:bg-[#463529]", variant === "secondary" && "border border-[#d9ccb8] bg-white text-[#3b332d] hover:bg-[#f8f0e3]", variant === "ghost" && "text-[#5f554c] hover:bg-[#f2e8d8]", variant === "danger" && "bg-[#a94d4d] text-white hover:bg-[#8f3f3f]", size === "md" && "px-4 text-sm", size === "sm" && "min-h-9 rounded-lg px-3 text-xs", size === "icon" && "size-11 p-0", className)} {...props} />;
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn("rounded-2xl border border-[#e3d7c5] bg-[#fffdf8] shadow-[0_8px_28px_rgba(75,52,30,.055)]", className)}>{children}</section>;
}

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description?: string; actions?: ReactNode }) {
  return <header className="mb-6 flex flex-col justify-between gap-4 xl:flex-row xl:items-end"><div><p className="mb-1 text-xs font-extrabold uppercase tracking-[0.15em] text-[#a97936]">{eyebrow}</p><h1 className="text-2xl font-extrabold tracking-[-0.035em] text-[#2b2118] sm:text-[2rem]">{title}</h1>{description && <p className="mt-2 max-w-3xl text-sm leading-6 text-[#756d66] sm:text-base">{description}</p>}</div>{actions && <div className="flex flex-wrap gap-2">{actions}</div>}</header>;
}

const statusStyles: Record<string, string> = {
  Published: "bg-[#eaf4ed] text-[#2f6d4c]", Active: "bg-[#eaf4ed] text-[#2f6d4c]", Approved: "bg-[#eaf4ed] text-[#2f6d4c]", Completed: "bg-[#eaf4ed] text-[#2f6d4c]", Confirmed: "bg-[#eaf4ed] text-[#2f6d4c]", "Checked in": "bg-[#e8f1f6] text-[#466f87]", Paid: "bg-[#eaf4ed] text-[#2f6d4c]",
  Pending: "bg-[#fff3da] text-[#8d6220]", "Review pending": "bg-[#fff3da] text-[#8d6220]", "Under review": "bg-[#fff3da] text-[#8d6220]", Submitted: "bg-[#e8f1f6] text-[#466f87]", Open: "bg-[#fff3da] text-[#8d6220]", "New request": "bg-[#f2e9f6] text-[#775184]",
  Draft: "bg-[#efebe6] text-[#675d54]", Paused: "bg-[#efebe6] text-[#675d54]", Inactive: "bg-[#efebe6] text-[#675d54]", Closed: "bg-[#efebe6] text-[#675d54]", Resolved: "bg-[#eaf4ed] text-[#2f6d4c]",
  Rejected: "bg-[#fbe9e6] text-[#9f4949]", Suspended: "bg-[#fbe9e6] text-[#9f4949]", Failed: "bg-[#fbe9e6] text-[#9f4949]", Cancelled: "bg-[#fbe9e6] text-[#9f4949]", Declined: "bg-[#fbe9e6] text-[#9f4949]", "No-show": "bg-[#fbe9e6] text-[#9f4949]", "Changes required": "bg-[#fbe9e6] text-[#9f4949]",
};
export function StatusBadge({ status }: { status: string }) { const base = status.split(" · ")[0]; return <span className={cn("inline-flex min-h-7 items-center rounded-full px-2.5 py-1 text-xs font-extrabold", statusStyles[status] || statusStyles[base] || "bg-[#ece8e2] text-[#5d554e]")}>{status}</span>; }

export function StatCard({ label, value, helper, icon, accent = "gold" }: { label: string; value: string; helper?: string; icon: ReactNode; accent?: "gold" | "green" | "blue" | "rose" }) {
  const accents = { gold: "bg-[#f5ead5] text-[#966b2f]", green: "bg-[#e8f1e9] text-[#3c7a57]", blue: "bg-[#e7eff3] text-[#547a91]", rose: "bg-[#f7e9e3] text-[#ae654c]" };
  return <Card className="p-4 sm:p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold text-[#756d66]">{label}</p><p className="tabular mt-2 text-2xl font-extrabold tracking-[-0.035em] text-[#2b2118] sm:text-[1.72rem]">{value}</p>{helper && <p className="mt-1 text-xs font-semibold text-[#3c7a57]">{helper}</p>}</div><span className={cn("grid size-10 shrink-0 place-items-center rounded-xl", accents[accent])}>{icon}</span></div></Card>;
}

export function AlertBanner({ title, children, tone = "warning", action }: { title: string; children: ReactNode; tone?: "warning" | "info" | "success"; action?: ReactNode }) {
  const tones = { warning: "border-[#e3c990] bg-[#fff7e8] text-[#704c18]", info: "border-[#bed2dd] bg-[#f0f6f9] text-[#3f6579]", success: "border-[#bdd6c5] bg-[#eef7f0] text-[#2f6748]" };
  return <div className={cn("flex flex-col justify-between gap-3 rounded-2xl border px-4 py-3 sm:flex-row sm:items-center", tones[tone])}><div className="flex gap-3"><AlertTriangle className="mt-0.5 size-5 shrink-0" /><div><p className="font-extrabold">{title}</p><div className="mt-0.5 text-sm opacity-85">{children}</div></div></div>{action}</div>;
}

export function Skeleton({ className }: { className?: string }) { return <div className={cn("animate-pulse rounded-xl bg-[#ece4d8]", className)} aria-hidden="true" />; }

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) { return <Card className="grid min-h-64 place-items-center p-8 text-center"><div className="max-w-md"><span className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#f3e9d8] text-[#9d7134]"><Inbox className="size-6" /></span><h3 className="mt-4 text-lg font-extrabold">{title}</h3><p className="mt-2 text-sm leading-6 text-[#756d66]">{description}</p>{action && <div className="mt-5">{action}</div>}</div></Card>; }

export function ConfirmDialog({ trigger, title, description, confirmLabel = "Confirm", danger = false, onConfirm }: { trigger: ReactNode; title: string; description: string; confirmLabel?: string; danger?: boolean; onConfirm: () => void }) {
  return <Dialog.Root><Dialog.Trigger asChild>{trigger}</Dialog.Trigger><Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-50 bg-[#21170f]/50 backdrop-blur-[2px]" /><Dialog.Content className="fixed bottom-0 left-0 z-50 w-full rounded-t-3xl border border-[#e3d6c3] bg-[#fffdf8] p-6 shadow-2xl sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl"><div className={`grid size-11 place-items-center rounded-xl ${danger ? "bg-[#fae7e4] text-[#a84a4a]" : "bg-[#f5ead5] text-[#8e652c]"}`}>{danger ? <AlertTriangle className="size-5" /> : <Check className="size-5" />}</div><Dialog.Title className="mt-4 text-xl font-extrabold tracking-[-0.025em]">{title}</Dialog.Title><Dialog.Description className="mt-2 text-sm leading-6 text-[#756d66]">{description}</Dialog.Description><div className="mt-6 flex justify-end gap-2"><Dialog.Close asChild><Button variant="secondary">Cancel</Button></Dialog.Close><Dialog.Close asChild><Button variant={danger ? "danger" : "primary"} onClick={onConfirm}>{confirmLabel}</Button></Dialog.Close></div><Dialog.Close className="absolute right-4 top-4 grid size-10 place-items-center rounded-xl text-[#756d66] hover:bg-[#f4ecdf]" aria-label="Close dialog"><X className="size-5" /></Dialog.Close></Dialog.Content></Dialog.Portal></Dialog.Root>;
}

export function DemoTable<T>({ data, columns, empty = "No matching records" }: { data: T[]; columns: ColumnDef<T>[]; empty?: string }) {
  const table = useReactTable({ data, columns, getCoreRowModel: getCoreRowModel() });
  return <div className="overflow-x-auto scrollbar-thin"><table className="w-full min-w-[760px] border-collapse text-left"><thead><tr className="border-b border-[#e6dbc9]">{table.getHeaderGroups()[0]?.headers.map((header) => <th key={header.id} className="px-4 py-3 text-xs font-extrabold uppercase tracking-[0.08em] text-[#81776f]">{header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}</th>)}</tr></thead><tbody>{table.getRowModel().rows.length ? table.getRowModel().rows.map((row) => <tr key={row.id} className="border-b border-[#eee6da] transition last:border-0 hover:bg-[#fbf6ed]">{row.getVisibleCells().map((cell) => <td key={cell.id} className="px-4 py-3.5 text-sm text-[#4a4139]">{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>)}</tr>) : <tr><td colSpan={columns.length} className="px-4 py-14 text-center text-sm text-[#756d66]">{empty}</td></tr>}</tbody></table></div>;
}

export function Pagination({ page = 1, total = 5 }: { page?: number; total?: number }) { return <nav className="flex items-center justify-between border-t border-[#e7ddce] px-4 py-3" aria-label="Pagination"><p className="text-xs font-semibold text-[#81776f]">Page {page} of {total}</p><div className="flex gap-1"><Button variant="ghost" size="icon" aria-label="Previous page" disabled={page === 1}><ChevronLeft className="size-4" /></Button><Button variant="ghost" size="icon" aria-label="Next page" disabled={page === total}><ChevronRight className="size-4" /></Button></div></nav>; }

export function ExportButton({ label = "Export demo" }: { label?: string }) { return <Button variant="secondary" onClick={() => { const blob = new Blob(["KhmerStay demonstration export\nNo real financial data"], { type: "text/plain" }); const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = "khmerstay-demo.txt"; anchor.click(); URL.revokeObjectURL(url); }}><ArrowDownToLine className="size-4" />{label}</Button>; }

export function LoadingScreen() { return <div className="grid min-h-screen place-items-center bg-[#fbf7ef]"><div className="text-center"><LoaderCircle className="mx-auto size-7 animate-spin text-[#a97936]" /><p className="mt-3 text-sm font-semibold text-[#756d66]">Preparing your workspace…</p></div></div>; }
