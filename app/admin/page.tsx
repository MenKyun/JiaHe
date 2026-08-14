import { redirect } from "next/navigation";
import AdminDashboard from "@/components/AdminDashboard";
import { isSupabaseConfigured, requireAdmin } from "@/lib/supabase/server";
import type { Product } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!isSupabaseConfigured()) redirect("/admin/login");
  const auth = await requireAdmin();
  if (!auth) redirect("/admin/login");

  const [{ data: products }, { count: orderCount }] = await Promise.all([
    auth.supabase.from("products").select("*").order("position", { ascending: true }),
    auth.supabase.from("orders").select("id", { count: "exact", head: true }),
  ]);
  return <AdminDashboard products={(products ?? []) as Product[]} orderCount={orderCount ?? 0} />;
}
