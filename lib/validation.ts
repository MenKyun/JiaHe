import { normalizeDiscount } from "@/lib/pricing";
import type { Product, Variant } from "@/lib/types";

const text = (value: unknown, fallback = "") => String(value ?? fallback).trim();
const amount = (value: unknown) => Math.max(0, Math.round(Number(value) || 0));

export function normalizeProductInput(value: unknown): Product {
  const input = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
  const id = text(input.id) || `TR-${Date.now()}`;
  const name = text(input.name || input.display_name);
  const displayName = text(input.display_name || input.name);
  if (!name || !displayName) throw new Error("商品名称不能为空");

  const variants = (Array.isArray(input.variants) ? input.variants : []).map((entry, index): Variant => {
    const item = (entry && typeof entry === "object" ? entry : {}) as Record<string, unknown>;
    return {
      id: text(item.id) || `${id}-SKU-${index + 1}`,
      sku: text(item.sku),
      name: text(item.name, "規格"),
      value: text(item.value),
      price: amount(item.price),
      originalPrice: amount(item.originalPrice),
      discount: normalizeDiscount(item.discount),
      stock: amount(item.stock),
      leadTime: text(item.leadTime, "1"),
      image: text(item.image),
      link: text(item.link),
    };
  });

  return {
    id,
    name,
    display_name: displayName,
    category: text(input.category, "行動配件"),
    brand: text(input.brand, "TR.tw"),
    price: amount(input.price),
    original_price: amount(input.original_price),
    badge: text(input.badge, "TR 精選"),
    description: text(input.description),
    mark: text(input.mark, "TR").slice(0, 6),
    source_product_id: text(input.source_product_id) || null,
    source_category: text(input.source_category) || null,
    images: (Array.isArray(input.images) ? input.images : []).map(String).filter(Boolean).slice(0, 9),
    detail_images: (Array.isArray(input.detail_images) ? input.detail_images : []).map(String).filter(Boolean),
    videos: (Array.isArray(input.videos) ? input.videos : []).filter(Boolean) as Product["videos"],
    variants,
    active: input.active !== false,
    position: amount(input.position),
  };
}
