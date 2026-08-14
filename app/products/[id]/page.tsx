import { notFound } from "next/navigation";
import ProductDetail from "@/components/ProductDetail";
import { getProduct, getProducts } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, products] = await Promise.all([getProduct(decodeURIComponent(id)), getProducts()]);
  if (!product) notFound();
  return <ProductDetail product={product} related={products.filter((item) => item.id !== product.id && item.category === product.category).slice(0, 4)} />;
}
