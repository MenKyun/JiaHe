import type { Product, Variant } from "@/lib/types";

export function normalizeDiscount(value: unknown) {
  return Math.min(95, Math.max(0, Math.round(Number(value) || 0)));
}

export function getVariantPricing(variant: Variant) {
  const basePrice = Number(variant.price) || 0;
  const discount = normalizeDiscount(variant.discount);
  const salePrice = discount > 0 ? Math.round(basePrice * (100 - discount) / 100) : basePrice;
  const original = discount > 0
    ? Math.max(Number(variant.originalPrice) || 0, basePrice)
    : Number(variant.originalPrice) || 0;
  return { basePrice, salePrice, originalPrice: original > salePrice ? original : 0, discount };
}

export function getProductPricing(product: Product) {
  if (product.variants.length) {
    return product.variants
      .map(getVariantPricing)
      .sort((a, b) => a.salePrice - b.salePrice)[0];
  }
  const price = Number(product.price) || 0;
  const original = Number(product.original_price) || 0;
  return { basePrice: price, salePrice: price, originalPrice: original > price ? original : 0, discount: 0 };
}

export function formatCurrency(value: number) {
  return `NT$${new Intl.NumberFormat("zh-TW", { maximumFractionDigits: 0 }).format(value)}`;
}
