import { redirect } from "next/navigation";
import Link from "next/link";
import { TenantMemberSchema, TenantSchema } from "@tradeos/core";
import { TenantProvider } from "@/components/tenant-provider";
import { getSession } from "@/lib/auth/session";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const { supabase, userId } = session;

  const { data: membershipRows } = await supabase
    .from("tenant_members")
    .select("id, tenant_id, user_id, role, created_at, updated_at, tenants(*)")
    .eq("user_id", userId)
    .limit(1);

  const membership = membershipRows?.[0];
  let tenant = null;
  let role = null;

  if (membership) {
    const memberParsed = TenantMemberSchema.safeParse({
      id: membership.id,
      tenant_id: membership.tenant_id,
      user_id: membership.user_id,
      role: membership.role,
      created_at: membership.created_at,
      updated_at: membership.updated_at,
    });

    if (memberParsed.success) {
      role = memberParsed.data.role;
    }

    const tenantRow = Array.isArray(membership.tenants)
      ? membership.tenants[0]
      : membership.tenants;
    if (tenantRow && typeof tenantRow === "object") {
      const tenantParsed = TenantSchema.safeParse(tenantRow);
      if (tenantParsed.success) {
        tenant = tenantParsed.data;
      }
    }
  }

  return (
    <TenantProvider value={{ tenant, role, isLoading: false }}>
      <div className="shell">
        <aside className="sidebar">
          <strong>TradeOS</strong>
          {tenant ? (
            <p className="muted tenant-label">{tenant.name}</p>
          ) : (
            <p className="muted tenant-label">No workspace yet</p>
          )}
          <nav>
            <Link href="/dashboard">Overview</Link>
            <Link href="/dashboard/journal">Journal</Link>
            <Link href="/dashboard/risk">Risk</Link>
            <Link href="/dashboard/briefing">Briefing</Link>
            <Link href="/dashboard/coach">Coach</Link>
            <Link href="/dashboard/strategy">Strategy</Link>
            <Link href="/dashboard/hermes">Hermes Ops</Link>
          </nav>
          <form action="/auth/signout" method="post" className="signout">
            <button type="submit">Sign out</button>
          </form>
        </aside>
        <main className="content">{children}</main>
      </div>
    </TenantProvider>
  );
}
