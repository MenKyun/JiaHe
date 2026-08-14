import seedProducts from "@/data/seed-products.json";
import defaultSiteContent from "@/data/default-site-content.json";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type { Product, SiteContent } from "@/lib/types";

const fallbackProducts = seedProducts as Product[];
const fallbackContent = defaultSiteContent as SiteContent;

export async function getProducts({ includeInactive = false } = {}) {
  if (!isSupabaseConfigured()) {
    return includeInactive ? fallbackProducts : fallbackProducts.filter((product) => product.active);
  }

  const supabase = await createClient();
  let query = supabase.from("products").select("*").order("position", { ascending: true });
  if (!includeInactive) query = query.eq("active", true);
  const { data, error } = await query;
  if (error) {
    console.error("Unable to load products from Supabase", error);
    return fallbackProducts.filter((product) => includeInactive || product.active);
  }
  return data as Product[];
}

export async function getProduct(id: string) {
  if (!isSupabaseConfigured()) return fallbackProducts.find((product) => product.id === id && product.active) ?? null;

  const supabase = await createClient();
  const { data, error } = await supabase.from("products").select("*").eq("id", id).eq("active", true).maybeSingle();
  if (error) console.error("Unable to load product from Supabase", error);
  return (data as Product | null) ?? null;
}

export async function getSiteContent() {
  if (!isSupabaseConfigured()) return fallbackContent;

  const supabase = await createClient();
  const { data, error } = await supabase.from("site_content").select("content").eq("id", "default").maybeSingle();
  if (error) console.error("Unable to load site content from Supabase", error);
  return (data?.content as SiteContent | undefined) ?? fallbackContent;
}

export { fallbackContent, fallbackProducts };
