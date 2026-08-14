import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceRoleKey) {
  throw new Error("请先设置 NEXT_PUBLIC_SUPABASE_URL 与 SUPABASE_SERVICE_ROLE_KEY");
}

const root = new URL("../", import.meta.url);
const products = JSON.parse(await readFile(new URL("data/seed-products.json", root), "utf8"));
const content = JSON.parse(await readFile(new URL("data/default-site-content.json", root), "utf8"));
const supabase = createClient(url, serviceRoleKey, { auth: { persistSession: false } });

const { error: productsError } = await supabase.from("products").upsert(products, { onConflict: "id" });
if (productsError) throw productsError;

const { error: contentError } = await supabase
  .from("site_content")
  .upsert({ id: "default", content }, { onConflict: "id" });
if (contentError) throw contentError;

console.log(`Seeded ${products.length} products and the homepage content.`);
