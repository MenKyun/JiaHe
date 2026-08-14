import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/server";

export async function PUT(request: Request) {
  const auth = await requireAdmin();
  if (!auth) return NextResponse.json({ error: "未授权" }, { status: 401 });
  const content = await request.json().catch(() => null);
  if (!content || typeof content !== "object") return NextResponse.json({ error: "首页资料不正确" }, { status: 400 });
  const { error } = await auth.supabase.from("site_content").upsert({ id: "default", content }, { onConflict: "id" });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
