"use client";

import Link from "next/link";
import { useState } from "react";
import type { HeroSlide, SiteContent } from "@/lib/types";

const blankSlide = (): HeroSlide => ({ image: "", alt: "首页主视觉", position: "center" });
const mediaUrl = (value: string) => /^(https?:|data:|\/)/.test(value) ? value : `/${value}`;

export default function ContentEditor({ initialContent }: { initialContent: SiteContent }) {
  const [content, setContent] = useState(() => structuredClone(initialContent));
  const [activeSlide, setActiveSlide] = useState(0);
  const [status, setStatus] = useState("");
  const [uploading, setUploading] = useState(false);
  const slide = content.hero.slides[activeSlide] ?? content.hero.slides[0];

  function updateHero<K extends keyof SiteContent["hero"]>(key: K, value: SiteContent["hero"][K]) {
    setContent((current) => ({ ...current, hero: { ...current.hero, [key]: value } }));
  }
  function updateSlide(index: number, key: keyof HeroSlide, value: string) {
    updateHero("slides", content.hero.slides.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item));
  }
  async function uploadSlide(file: File | undefined) {
    if (!file) return;
    setUploading(true); setStatus("正在上传主图…");
    const body = new FormData(); body.append("file", file);
    const response = await fetch("/api/admin/media", { method: "POST", body });
    const result = await response.json();
    if (response.ok) { updateSlide(activeSlide, "image", result.url); setStatus("主图已上传，请储存首页。"); }
    else setStatus(result.error || "上传失败");
    setUploading(false);
  }
  async function save() {
    setStatus("正在同步首页…");
    const response = await fetch("/api/admin/content", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(content) });
    const result = await response.json();
    setStatus(response.ok ? "首页内容已发布，前台重新整理后即可看到。" : (result.error || "储存失败"));
  }

  return <div className="visual-editor-page">
    <header className="admin-header"><div><p className="eyebrow">Visual storefront editor</p><h1>首页与主视觉</h1><p>管理首页文案、色彩和最多 5 张轮播主图。</p></div><div className="admin-actions"><Link className="secondary-link" href="/admin">返回商品后台</Link><Link className="secondary-link" href="/" target="_blank">预览前台</Link><button className="primary-link" type="button" onClick={save}>储存并发布</button></div></header>
    <main className="visual-editor-layout">
      <section className="visual-editor-panel">
        <div className="section-heading"><div><p className="eyebrow">Homepage settings</p><h2>首页内容</h2></div><p>所有变更会同步到 Supabase。</p></div>
        <div className="visual-editor-form">
          <details open><summary>主视觉文案</summary><label>小标题<input value={content.hero.eyebrow} onChange={(event) => updateHero("eyebrow", event.target.value)} /></label><label>主标题<input value={content.hero.title} onChange={(event) => updateHero("title", event.target.value)} /></label><label>说明文字<textarea rows={4} value={content.hero.copy} onChange={(event) => updateHero("copy", event.target.value)} /></label><div className="form-grid"><label>主按钮文字<input value={content.hero.primaryText} onChange={(event) => updateHero("primaryText", event.target.value)} /></label><label>主按钮链接<input value={content.hero.primaryUrl} onChange={(event) => updateHero("primaryUrl", event.target.value)} /></label></div></details>
          <details open><summary>轮播主图</summary><div className="editor-inline-settings"><label className="checkbox-field"><input type="checkbox" checked={content.hero.autoplay} onChange={(event) => updateHero("autoplay", event.target.checked)} /> 自动轮播</label><label>间隔秒数<input type="number" min="3" max="15" value={content.hero.interval} onChange={(event) => updateHero("interval", Number(event.target.value))} /></label></div><div className="hero-slide-tabs">{content.hero.slides.map((_, index) => <button className={activeSlide === index ? "is-active" : ""} type="button" key={index} onClick={() => setActiveSlide(index)}>主图 {index + 1}</button>)}{content.hero.slides.length < 5 && <button type="button" onClick={() => { updateHero("slides", [...content.hero.slides, blankSlide()]); setActiveSlide(content.hero.slides.length); }}>＋ 新增</button>}</div>{slide && <article className="hero-slide-editor-card"><label className="upload-box">{uploading ? "上传中…" : "上传或更换主图"}<input type="file" accept="image/*" disabled={uploading} onChange={(event) => uploadSlide(event.target.files?.[0])} /></label><label>图片网址<input value={slide.image} onChange={(event) => updateSlide(activeSlide, "image", event.target.value)} placeholder="https://..." /></label><label>图片替代说明<input value={slide.alt} onChange={(event) => updateSlide(activeSlide, "alt", event.target.value)} /></label><label>焦点位置<select value={slide.position} onChange={(event) => updateSlide(activeSlide, "position", event.target.value)}><option value="left">靠左</option><option value="center">居中</option><option value="right">靠右</option></select></label>{content.hero.slides.length > 1 && <button className="admin-button admin-button-danger" type="button" onClick={() => { updateHero("slides", content.hero.slides.filter((_, index) => index !== activeSlide)); setActiveSlide(Math.max(0, activeSlide - 1)); }}>移除此主图</button>}</article>}</details>
          <details><summary>顶部公告</summary><label>标签<input value={content.promo.label} onChange={(event) => setContent((current) => ({ ...current, promo: { ...current.promo, label: event.target.value } }))} /></label><label>公告文字<input value={content.promo.text} onChange={(event) => setContent((current) => ({ ...current, promo: { ...current.promo, text: event.target.value } }))} /></label></details>
          <details><summary>主推区域</summary><label>主推标题<input value={content.campaign.title} onChange={(event) => setContent((current) => ({ ...current, campaign: { ...current.campaign, title: event.target.value } }))} /></label><label>主推说明<textarea rows={4} value={content.campaign.copy} onChange={(event) => setContent((current) => ({ ...current, campaign: { ...current.campaign, copy: event.target.value } }))} /></label></details>
          <details><summary>品牌色彩</summary><div className="form-grid"><label>品牌色<input type="color" value={content.theme.brand} onChange={(event) => setContent((current) => ({ ...current, theme: { ...current.theme, brand: event.target.value, accent: event.target.value } }))} /></label><label>背景色<input type="color" value={content.theme.brandDark} onChange={(event) => setContent((current) => ({ ...current, theme: { ...current.theme, brandDark: event.target.value } }))} /></label></div></details>
        </div>
        <div className="editor-save-bar"><button className="primary-link" type="button" onClick={save}>储存并发布</button><p role="status">{status}</p></div>
      </section>

      <aside className="visual-preview-panel"><div className="section-heading"><div><p className="eyebrow">Live preview</p><h2>主视觉预览</h2></div></div><div className="preview-shell" style={{ "--brand": content.theme.brand } as React.CSSProperties}><div className="preview-promo"><span>{content.promo.label}</span><strong>{content.promo.text}</strong></div><section className="preview-hero" style={slide?.image ? { backgroundImage: `linear-gradient(90deg, rgba(8,9,13,.9), rgba(8,9,13,.1)), url(${mediaUrl(slide.image)})`, backgroundPosition: `${slide.position} center` } : undefined}><div><p className="eyebrow">{content.hero.eyebrow}</p><h3>{content.hero.title}</h3><p>{content.hero.copy}</p><span className="preview-button-primary">{content.hero.primaryText}</span></div><aside><span>{content.hero.mainDealLabel}</span><strong>{content.hero.mainDealTitle}</strong></aside></section><div className="preview-services">{content.services.map((service) => <article key={service.title}><strong>{service.title}</strong><span>{service.desc}</span></article>)}</div></div></aside>
    </main>
  </div>;
}
