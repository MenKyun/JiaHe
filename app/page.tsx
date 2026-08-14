import Storefront from "@/components/Storefront";
import { getProducts, getSiteContent } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [products, content] = await Promise.all([getProducts(), getSiteContent()]);
  return <Storefront products={products} content={content} />;
}
