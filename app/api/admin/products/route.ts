import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/server";
import { normalizeProductInput } from "@/lib/validation";

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth) return NextResponse.json({ error: "未授权" }, { status: 401 });
  try {
    const product = normalizeProductInput(await request.json());
    const { data, error } = await auth.supabase.from("products").insert(product).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "商品资料不正确" }, { status: 400 });
  }
}
