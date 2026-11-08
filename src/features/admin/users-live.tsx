"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { api, json } from "@/src/lib/api";
import {
  Button,
  Card,
  ConfirmDialog,
  PageHeader,
  StatusBadge,
} from "@/src/components/shared/ui";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type User = {
  id: string;
  email: string;
  name: string;
  role: "owner" | "traveler" | "admin";
  status: string;
  createdAt: string;
};

export function UsersLive({ role }: { role: "owner" | "traveler" }) {
  const [users, setUsers] = useState<User[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    api<{ users: User[] }>("/users")
      .then(({ users }) => {
        if (active) setUsers(users);
      })
      .catch((cause) => {
        if (active)
          setError(
            cause instanceof Error ? cause.message : "Could not load users",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);
  const rows = useMemo(
    () =>
      users.filter(
        (item) =>
          item.role === role &&
          `${item.name} ${item.email}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [users, query, role],
  );

  async function toggle(user: User) {
    const status = user.status === "Suspended" ? "Active" : "Suspended";
    try {
      await api(`/users/${user.id}/status`, json("POST", { status }));
      setUsers((current) =>
        current.map((item) =>
          item.id === user.id ? { ...item, status } : item,
        ),
      );
      toast.success(`${user.name} is now ${status.toLowerCase()}`);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not update account",
      );
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="People"
        title={role === "owner" ? "Property owners" : "Travelers"}
        description={`${rows.length} ${role === "owner" ? "owners" : "travelers"} on the local server`}
      />
      <Input
        className="form-input mb-5 max-w-md"
        aria-label="Search users"
        placeholder="Search name or email"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      {error && (
        <p role="alert" className="mb-4 rounded-xl bg-red-50 p-4 text-red-700">
          {error}
        </p>
      )}
      <Card className="overflow-x-auto">
        <Table className="min-w-[650px] text-left text-sm">
          <TableHeader className="bg-[#f7f0e6]">
            <TableRow>
              <TableHead className="p-4">Name</TableHead>
              <TableHead className="p-4">Email</TableHead>
              <TableHead className="p-4">Joined</TableHead>
              <TableHead className="p-4">Status</TableHead>
              <TableHead className="p-4">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((item) => (
              <TableRow key={item.id} className="border-t border-[#e9dfd1]">
                <TableCell className="p-4 font-bold">{item.name}</TableCell>
                <TableCell className="p-4">{item.email}</TableCell>
                <TableCell className="p-4">
                  {item.createdAt.slice(0, 10)}
                </TableCell>
                <TableCell className="p-4">
                  <StatusBadge status={item.status} />
                </TableCell>
                <TableCell className="p-4">
                  <ConfirmDialog
                    trigger={
                      <Button variant="secondary" size="sm">
                        {item.status === "Suspended" ? "Reactivate" : "Suspend"}
                      </Button>
                    }
                    title={`${item.status === "Suspended" ? "Reactivate" : "Suspend"} ${item.name}?`}
                    description="This changes the account status on the local server."
                    confirmLabel="Confirm"
                    onConfirm={() => toggle(item)}
                  />
                </TableCell>
              </TableRow>
            ))}
            {!loading && rows.length === 0 && (
              <TableRow>
                <TableCell className="p-5 text-center" colSpan={5}>
                  No accounts found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        {loading && <p className="p-5">Loading accounts…</p>}
      </Card>
    </div>
  );
}
