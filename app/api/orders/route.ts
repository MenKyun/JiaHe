import { NextResponse } from "next/server";
import { getProducts } from "@/lib/data";
import { getProductPricing, getVariantPricing } from "@/lib/pricing";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) return NextResponse.json({ error: "线上数据库尚未配置" }, { status: 503 });

  const body = await request.json().catch(() => null) as { items?: Array<{ productId?: string; variantId?: string | null; quantity?: number }> } | null;
  if (!body?.items?.length || body.items.length > 50) return NextResponse.json({ error: "订单内容不正确" }, { status: 400 });

  const products = await getProducts();
  const orderItems = [];
  let total = 0;
  for (const input of body.items) {
    const product = products.find((item) => item.id === input.productId);
    const quantity = Math.min(99, Math.max(1, Math.round(Number(input.quantity) || 1)));
    if (!product) return NextResponse.json({ error: "订单包含已下架商品" }, { status: 400 });
    const variant = input.variantId ? product.variants.find((item) => item.id === input.variantId) : null;
    if (input.variantId && !variant) return NextResponse.json({ error: "商品规格已变更，请重新选择" }, { status: 400 });
    const pricing = variant ? getVariantPricing(variant) : getProductPricing(product);
    total += pricing.salePrice * quantity;
    orderItems.push({ productId: product.id, variantId: variant?.id ?? null, name: product.display_name, variant: variant?.value ?? "", unitPrice: pricing.salePrice, quantity });
  }

  const orderNumber = `TR-${crypto.randomUUID().replaceAll("-", "").slice(0, 10).toUpperCase()}`;
  const supabase = await createClient();
  const { error } = await supabase.from("orders").insert({ order_number: orderNumber, items: orderItems, total, status: "pending" });
  if (error) return NextResponse.json({ error: "订单储存失败" }, { status: 500 });
  return NextResponse.json({ orderNumber, total }, { status: 201 });
}
