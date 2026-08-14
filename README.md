# TR SELECT

TR SELECT 已迁移为 Next.js 动态独立站。GitHub 保存源码，Vercel 运行前后台，Supabase 提供数据库、管理员登录与媒体储存。

## 已实现

- 动态首页、分类、搜寻、购物车与订单建立
- 动态商品详情、规格切换与 SKU 独立折扣
- 受保护的商品后台与首页编辑器
- 首页主图上传、最多 5 张轮播、自动播放与间隔设置
- Supabase Row Level Security：公开访客只读在售商品，只有管理员可以修改资料和上传媒体
- 26 件现有商品和 SKU 的初始种子资料

## 本地启动

需要 Node.js 20.9 或更高版本。

```bash
npm install
cp .env.example .env.local
npm run dev
```

打开 `http://localhost:3000`。未配置 Supabase 时，前台会读取本地种子资料，后台保持锁定。

## Supabase 设置

1. 新建 Supabase 项目。
2. 在 SQL Editor 执行 `supabase/migrations/001_init.sql`。
3. 把 Project URL 与 Publishable key 写入 `.env.local`：

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_YOUR_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
```

4. 导入现有商品和首页内容：

```bash
npm run seed
```

`SUPABASE_SERVICE_ROLE_KEY` 只用于本地首次导入，不要提交 Git，也不需要放到 Vercel。

5. 在 Supabase Authentication 创建后台用户，并在 SQL Editor 为该账号写入管理员角色：

```sql
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
where email = '你的管理员邮箱';
```

后台入口为 `/admin`，首页轮播编辑入口为 `/admin/content`。

## Vercel 部署

1. 在 Vercel 导入 GitHub 的 `JiaHe` 仓库。
2. Framework Preset 选择 Next.js。
3. 添加 `NEXT_PUBLIC_SUPABASE_URL` 与 `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` 两个环境变量。
4. 部署后打开站点首页与 `/admin` 验证。

Vercel 连接 GitHub 后，每次向部署分支推送提交都会自动构建并发布。

## 验证命令

```bash
npm run typecheck
npm run build
```
