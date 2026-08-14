import Link from "next/link";
import { redirect } from "next/navigation";
import AdminLoginForm from "@/components/AdminLoginForm";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.app_metadata?.role === "admin") redirect("/admin");
  }
  return <main className="admin-login-page"><section className="admin-login-card"><Link className="admin-brand-box" href="/"><span className="admin-brand-icon">TR</span><span className="admin-brand-copy"><strong>TR SELECT</strong><small>Commerce OS / Secure</small></span></Link><p className="admin-section-code">AUTHORIZED ACCESS</p><h1>管理你的商品与首页</h1><p>登录后可跨装置同步商品、SKU 折扣、库存、轮播主图与订单。</p><AdminLoginForm /><Link className="admin-login-back" href="/">← 返回商店前台</Link></section></main>;
}
