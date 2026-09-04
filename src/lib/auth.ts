import type { DemoRole } from "@/src/stores/app-store";

export const demoAccounts = {
  admin: { email: "admin@khmerstay.demo", password: "Demo123!" },
  owner: { email: "owner@khmerstay.demo", password: "Demo123!" },
} as const;

export function authenticateDemo(email: string, password: string): DemoRole | null {
  return (Object.keys(demoAccounts) as DemoRole[]).find(
    (role) => demoAccounts[role].email === email && demoAccounts[role].password === password,
  ) ?? null;
}

export function canAccessPortal(sessionRole: DemoRole | null, portal: DemoRole) {
  return sessionRole === portal;
}
