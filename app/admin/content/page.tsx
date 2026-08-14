import { redirect } from "next/navigation";
import ContentEditor from "@/components/ContentEditor";
import { getSiteContent } from "@/lib/data";
import { isSupabaseConfigured, requireAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ContentPage() {
  if (!isSupabaseConfigured()) redirect("/admin/login");
  if (!await requireAdmin()) redirect("/admin/login");
  return <ContentEditor initialContent={await getSiteContent()} />;
}
