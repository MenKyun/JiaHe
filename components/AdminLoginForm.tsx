"use client";

import { useActionState } from "react";
import { signIn } from "@/app/admin/login/actions";

export default function AdminLoginForm() {
  const [message, action, pending] = useActionState(signIn, null);
  return <form action={action} className="admin-login-form">
    <label>管理员邮箱<input name="email" type="email" autoComplete="email" required placeholder="admin@example.com" /></label>
    <label>密码<input name="password" type="password" autoComplete="current-password" required /></label>
    <button className="admin-button admin-button-primary" type="submit" disabled={pending}>{pending ? "正在登录…" : "进入营运后台"}</button>
    {message && <p className="admin-login-message" role="alert">{message}</p>}
  </form>;
}
