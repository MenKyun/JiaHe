import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/server";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "video/mp4", "video/webm"]);

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth) return NextResponse.json({ error: "未授权" }, { status: 401 });
  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File) || !allowedTypes.has(file.type) || file.size > 15 * 1024 * 1024) {
    return NextResponse.json({ error: "文件格式不支持或超过 15MB" }, { status: 400 });
  }
  const extension = file.name.split(".").pop()?.replace(/[^a-zA-Z0-9]/g, "") || "bin";
  const path = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${extension}`;
  const { error } = await auth.supabase.storage.from("media").upload(path, file, { contentType: file.type, upsert: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  const { data } = auth.supabase.storage.from("media").getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl }, { status: 201 });
}
