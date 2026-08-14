"use server";

import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

export async function signIn(_: string | null, formData: FormData): Promise<string | null> {
  if (!isSupabaseConfigured()) return "Supabase 尚未配置，完成云端项目连接后即可登录。";
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return "邮箱或密码不正确。";
  if (data.user.app_metadata?.role !== "admin") {
    await supabase.auth.signOut();
    return "此账号没有后台权限。";
  }
  redirect("/admin");
}

export async function signOut() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/admin/login");
}
