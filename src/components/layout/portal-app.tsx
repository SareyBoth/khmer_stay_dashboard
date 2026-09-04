import type { DemoRole } from "@/src/stores/app-store";
import { PortalShell } from "@/src/components/layout/portal-shell";
import { OwnerPages } from "@/src/features/owner/owner-pages";
import { AdminPages } from "@/src/features/admin/admin-pages";

export function PortalApp({ portal, segments }: { portal: DemoRole; segments?: string[] }) {
  return (
    <PortalShell portal={portal}>
      <main className="mx-auto w-full max-w-[1640px] px-4 py-6 sm:px-6 sm:py-8 xl:px-8">
        {portal === "owner" ? <OwnerPages segments={segments} /> : <AdminPages segments={segments} />}
      </main>
    </PortalShell>
  );
}
