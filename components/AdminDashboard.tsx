"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { signOut } from "@/app/admin/login/actions";
import { formatCurrency } from "@/lib/pricing";
import type { Product, Variant } from "@/lib/types";

const blankProduct = (): Product => ({
  id: `TR-${Date.now()}`,
  name: "",
  display_name: "",
  category: "自拍腳架",
  brand: "TR.tw",
  price: 0,
  original_price: 0,
  badge: "TR 精選",
  description: "",
  mark: "TR",
  source_product_id: null,
  source_category: null,
  images: [],
  detail_images: [],
  videos: [],
  variants: [],
  active: true,
  position: 0,
});

const blankVariant = (product: Product): Variant => ({
  id: `${product.id}-SKU-${Date.now()}`,
  sku: "",
  name: "規格",
  value: "",
  price: product.price,
  originalPrice: product.original_price,
  discount: 0,
  stock: 0,
  leadTime: "1",
  image: "",
  link: "",
});

export default function AdminDashboard({ products, orderCount }: { products: Product[]; orderCount: number }) {
  const [selected, setSelected] = useState<Product>(products[0] ? structuredClone(products[0]) : blankProduct());
  const [isNew, setIsNew] = useState(!products.length);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [uploading, setUploading] = useState(false);
  const catalogValue = products.reduce((sum, product) => sum + product.price, 0);
  const filtered = useMemo(() => products.filter((product) => `${product.display_name} ${product.id} ${product.category}`.toLowerCase().includes(query.toLowerCase())), [products, query]);

  function update<K extends keyof Product>(key: K, value: Product[K]) {
    setSelected((current) => ({ ...current, [key]: value }));
  }

  function updateVariant(index: number, key: keyof Variant, value: string | number) {
    setSelected((current) => ({ ...current, variants: current.variants.map((variant, itemIndex) => itemIndex === index ? { ...variant, [key]: value } : variant) }));
  }

  async function uploadFiles(files: FileList | null, target: "images" | "detail_images", variantIndex?: number) {
    if (!files?.length) return;
    setUploading(true); setStatus("正在上传媒体…");
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        const body = new FormData(); body.append("file", file);
        const response = await fetch("/api/admin/media", { method: "POST", body });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "上传失败");
        urls.push(result.url);
      }
      if (typeof variantIndex === "number") updateVariant(variantIndex, "image", urls[0]);
      else update(target, [...selected[target], ...urls] as Product[typeof target]);
      setStatus(`已上传 ${urls.length} 个文件，请储存商品。`);
    } catch (error) { setStatus(error instanceof Error ? error.message : "上传失败"); }
    finally { setUploading(false); }
  }

  async function saveProduct(event: React.FormEvent) {
    event.preventDefault(); setStatus("正在储存商品…");
    const response = await fetch(isNew ? "/api/admin/products" : `/api/admin/products/${encodeURIComponent(selected.id)}`, {
      method: isNew ? "POST" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(selected),
    });
    const result = await response.json();
    if (!response.ok) { setStatus(result.error || "储存失败"); return; }
    setStatus("商品已同步到线上数据库。");
    window.setTimeout(() => window.location.reload(), 500);
  }

  async function deleteProduct() {
    if (isNew || !window.confirm(`确定删除「${selected.display_name}」？此操作无法从后台撤销。`)) return;
    const response = await fetch(`/api/admin/products/${encodeURIComponent(selected.id)}`, { method: "DELETE" });
    if (!response.ok) { const result = await response.json(); setStatus(result.error || "删除失败"); return; }
    window.location.reload();
  }

  return <div className="admin-page"><div className="admin-saas-layout">
    <aside className="admin-sidebar">
      <Link className="admin-brand-box" href="/admin"><span className="admin-brand-icon">TR</span><span className="admin-brand-copy"><strong>TR SELECT</strong><small>Commerce OS / Cloud</small></span></Link>
      <div className="admin-workspace-state"><span /><p>Supabase 线上资料已连接</p></div>
      <nav><p className="admin-nav-label">Workspace</p><ul className="admin-nav-list"><li className="admin-nav-item"><a className="is-active" href="#dashboard"><span className="admin-nav-index">01</span><span>营运总览</span></a></li><li className="admin-nav-item"><a href="#catalog"><span className="admin-nav-index">02</span><span>商品与 SKU</span><span className="nav-badge">{products.length}</span></a></li><li className="admin-nav-item"><Link href="/admin/content"><span className="admin-nav-index">03</span><span>首页与轮播</span></Link></li></ul></nav>
      <div className="admin-sidebar-footer"><p className="admin-nav-label">Quick links</p><Link href="/" target="_blank"><span>开启商店前台</span><span>↗</span></Link><form action={signOut}><button type="submit">退出登录</button></form></div>
    </aside>

    <main className="admin-main-content">
      <header className="admin-top-bar"><div className="admin-page-title"><p className="admin-eyebrow">Store operations</p><h1>商品营运后台</h1><p>管理线上商品、SKU 折扣、库存与媒体。</p></div><div className="admin-top-actions"><Link className="admin-button admin-button-quiet" href="/admin/content">编辑首页</Link><button className="admin-button admin-button-primary" type="button" onClick={() => { setSelected(blankProduct()); setIsNew(true); setStatus(""); }}>新增商品</button></div></header>

      <section id="dashboard" className="admin-tab-content">
        <section className="admin-dashboard-intro"><div><p className="admin-section-code">TR / OPERATIONS / LIVE</p><h2>商品经营的重点，<br />现在全装置同步。</h2></div><div className="admin-intro-note"><span>CLOUD DATA</span><p>商品与首页资料存放在 Supabase，前台会即时读取，不再受单一浏览器限制。</p><Link href="/admin/content">编辑首页轮播 →</Link></div></section>
        <div className="admin-kpi-grid"><article className="admin-kpi-card"><span className="kpi-number">01</span><span className="kpi-label">在售商品</span><strong className="kpi-val">{products.filter((item) => item.active).length}</strong><span className="kpi-sub">线上目录商品</span></article><article className="admin-kpi-card"><span className="kpi-number">02</span><span className="kpi-label">目录售价总值</span><strong className="kpi-val">{formatCurrency(catalogValue)}</strong><span className="kpi-sub">依商品基础售价估算</span></article><article className="admin-kpi-card"><span className="kpi-number">03</span><span className="kpi-label">线上订单</span><strong className="kpi-val">{orderCount}</strong><span className="kpi-sub">Supabase 订单记录</span></article><article className="admin-kpi-card"><span className="kpi-number">04</span><span className="kpi-label">折扣 SKU</span><strong className="kpi-val">{products.reduce((sum, item) => sum + item.variants.filter((variant) => variant.discount > 0).length, 0)}</strong><span className="kpi-sub">目前活动规格</span></article></div>
      </section>

      <section className="admin-product-workbench" id="catalog">
        <section className="admin-card-panel admin-editor-panel">
          <div className="admin-editor-heading"><div><span className="admin-section-code">Product editor</span><h2>{isNew ? "新增商品" : "编辑商品"}</h2></div><span className="admin-editor-status">{selected.active ? "LIVE" : "HIDDEN"}</span></div>
          <form className="product-form" onSubmit={saveProduct}>
            <fieldset className="admin-form-section"><legend><span>01</span> 基本资料</legend>
              <label>前台商品名称<input value={selected.display_name} onChange={(event) => update("display_name", event.target.value)} required /></label>
              <label>内部完整名称<input value={selected.name} onChange={(event) => update("name", event.target.value)} required /></label>
              <div className="form-grid"><label>商品分类<select value={selected.category} onChange={(event) => update("category", event.target.value)}><option>自拍腳架</option><option>補光設備</option><option>收音設備</option><option>行動配件</option><option>手機周邊</option><option>影音周邊</option></select></label><label>品牌<input value={selected.brand} onChange={(event) => update("brand", event.target.value)} /></label></div>
              <div className="form-grid"><label>基础售价 NT$<input type="number" min="0" value={selected.price} onChange={(event) => update("price", Number(event.target.value))} /></label><label>基础原价 NT$<input type="number" min="0" value={selected.original_price} onChange={(event) => update("original_price", Number(event.target.value))} /></label></div>
              <div className="form-grid"><label>商品标签<input value={selected.badge} onChange={(event) => update("badge", event.target.value)} /></label><label>替代字<input maxLength={6} value={selected.mark} onChange={(event) => update("mark", event.target.value)} /></label></div>
              <label>商品描述<textarea rows={5} value={selected.description} onChange={(event) => update("description", event.target.value)} /></label>
              <label className="admin-checkbox"><input type="checkbox" checked={selected.active} onChange={(event) => update("active", event.target.checked)} /> 前台显示此商品</label>
            </fieldset>

            <fieldset className="admin-form-section"><legend><span>02</span> 商品媒体</legend>
              <div className="admin-media-block"><div className="admin-media-heading"><div><h3>商品主图</h3><p>第一张为封面，最多 9 张。</p></div><label className="upload-box admin-compact-upload">{uploading ? "上传中…" : "上传主图"}<input type="file" accept="image/*" multiple disabled={uploading} onChange={(event) => uploadFiles(event.target.files, "images")} /></label></div><div className="upload-grid">{selected.images.map((url, index) => <div className="admin-media-thumb" key={`${url}-${index}`}><img src={url} alt="" /><button type="button" onClick={() => update("images", selected.images.filter((_, itemIndex) => itemIndex !== index))}>×</button></div>)}</div></div>
              <details className="admin-media-disclosure"><summary><span><strong>详情页图片</strong><small>尺寸说明与情境长图</small></span><span>＋</span></summary><div className="admin-disclosure-body"><label className="upload-box">上传详情图片<input type="file" accept="image/*" multiple disabled={uploading} onChange={(event) => uploadFiles(event.target.files, "detail_images")} /></label><div className="detail-upload-list">{selected.detail_images.map((url, index) => <div className="admin-detail-media" key={`${url}-${index}`}><img src={url} alt="" /><button type="button" onClick={() => update("detail_images", selected.detail_images.filter((_, itemIndex) => itemIndex !== index))}>移除</button></div>)}</div></div></details>
            </fieldset>

            <fieldset className="admin-form-section"><div className="admin-fieldset-heading"><h3><span>03</span> SKU 规格与折扣</h3><button className="admin-text-button" type="button" onClick={() => update("variants", [...selected.variants, blankVariant(selected)])}>新增规格</button></div><p className="admin-section-help">折扣按基础售价计算，例如售价 1,000、折扣 20%，顾客实付 800。</p>
              <div className="variant-editor-list">{selected.variants.map((variant, index) => <article className="variant-editor-card" key={variant.id}><div className="variant-editor-title"><strong>SKU {index + 1}</strong><button type="button" onClick={() => update("variants", selected.variants.filter((_, itemIndex) => itemIndex !== index))}>移除</button></div><div className="form-grid"><label>SKU 编号<input value={variant.sku} onChange={(event) => updateVariant(index, "sku", event.target.value)} /></label><label>规格名称<input value={variant.value} onChange={(event) => updateVariant(index, "value", event.target.value)} /></label></div><div className="form-grid form-grid-3"><label>售价<input type="number" min="0" value={variant.price} onChange={(event) => updateVariant(index, "price", Number(event.target.value))} /></label><label>原价<input type="number" min="0" value={variant.originalPrice} onChange={(event) => updateVariant(index, "originalPrice", Number(event.target.value))} /></label><label>折扣 %<input type="number" min="0" max="95" value={variant.discount} onChange={(event) => updateVariant(index, "discount", Number(event.target.value))} /></label></div><div className="form-grid"><label>库存<input type="number" min="0" value={variant.stock} onChange={(event) => updateVariant(index, "stock", Number(event.target.value))} /></label><label>规格图<label className="upload-box admin-inline-upload">上传<input type="file" accept="image/*" onChange={(event) => uploadFiles(event.target.files, "images", index)} /></label></label></div>{variant.image && <div className="variant-image-preview"><img src={variant.image} alt="" /><input value={variant.image} onChange={(event) => updateVariant(index, "image", event.target.value)} /></div>}<output className="variant-discount-result">{variant.discount ? `折扣 ${variant.discount}% · 顾客实付 ${formatCurrency(Math.round(variant.price * (100 - variant.discount) / 100))}` : "未设置折扣"}</output></article>)}</div>
            </fieldset>
            <div className="form-actions"><button className="admin-button admin-button-primary" type="submit">储存并发布</button><button className="admin-button admin-button-danger" type="button" onClick={deleteProduct} disabled={isNew}>删除商品</button><p className="admin-save-status" role="status">{status}</p></div>
          </form>
        </section>

        <section className="admin-card-panel admin-catalog-panel"><div className="admin-card-header admin-catalog-heading"><div><span className="admin-section-code">Live catalog</span><h2>商品目录</h2></div><span>目前 {products.length} 件商品</span></div><div className="admin-catalog-toolbar"><label className="admin-search-field"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜寻商品、编号或分类" /></label></div><div className="admin-product-list">{filtered.map((product) => <button type="button" className={`admin-product-row ${!isNew && selected.id === product.id ? "is-active" : ""}`} key={product.id} onClick={() => { setSelected(structuredClone(product)); setIsNew(false); setStatus(""); }}><span className="admin-product-thumb">{product.images[0] ? <img src={product.images[0]} alt="" /> : product.mark}</span><span><strong>{product.display_name}</strong><small>{product.id} · {product.category}</small></span><span><strong>{formatCurrency(product.price)}</strong><small>{product.variants.length} SKU</small></span></button>)}</div></section>
      </section>
    </main>
  </div></div>;
}
