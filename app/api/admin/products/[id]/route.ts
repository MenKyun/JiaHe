import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/server";
import { normalizeProductInput } from "@/lib/validation";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth) return NextResponse.json({ error: "未授权" }, { status: 401 });
  try {
    const { id } = await params;
    const product = normalizeProductInput({ ...(await request.json()), id: decodeURIComponent(id) });
    const { data, error } = await auth.supabase.from("products").update(product).eq("id", product.id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "商品资料不正确" }, { status: 400 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth) return NextResponse.json({ error: "未授权" }, { status: 401 });
  const { id } = await params;
  const { error } = await auth.supabase.from("products").delete().eq("id", decodeURIComponent(id));
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return new NextResponse(null, { status: 204 });
}
