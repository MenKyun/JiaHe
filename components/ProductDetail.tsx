"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { formatCurrency, getProductPricing, getVariantPricing } from "@/lib/pricing";
import type { CartLine, Product } from "@/lib/types";

const CART_KEY = "tr-select-cart-v2";
const WISHLIST_KEY = "tr-select-wishlist-v2";
const mediaUrl = (value: string) => /^(https?:|data:|\/)/.test(value) ? value : `/${value}`;

export default function ProductDetail({ product, related }: { product: Product; related: Product[] }) {
  const images = useMemo(() => product.images.length ? product.images : product.variants.map((item) => item.image).filter(Boolean), [product]);
  const [selectedImage, setSelectedImage] = useState(images[0] || "");
  const [selectedVariant, setSelectedVariant] = useState(0);
  const [saved, setSaved] = useState(false);
  const [feedback, setFeedback] = useState("");
  const variant = product.variants[selectedVariant] ?? null;
  const pricing = variant ? getVariantPricing(variant) : getProductPricing(product);

  useEffect(() => {
    try { setSaved(JSON.parse(localStorage.getItem(WISHLIST_KEY) || "[]").includes(product.id)); } catch { /* noop */ }
  }, [product.id]);

  function chooseVariant(index: number) {
    setSelectedVariant(index);
    if (product.variants[index]?.image) setSelectedImage(product.variants[index].image);
  }

  function addToCart() {
    let cart: CartLine[] = [];
    try { cart = JSON.parse(localStorage.getItem(CART_KEY) || "[]"); } catch { /* noop */ }
    const line: CartLine = {
      productId: product.id,
      variantId: variant?.id ?? null,
      name: product.display_name,
      variantLabel: variant ? [variant.name, variant.value].filter(Boolean).join(" / ") : "",
      price: pricing.salePrice,
      image: mediaUrl(variant?.image || product.images[0] || ""),
      quantity: 1,
    };
    const key = `${line.productId}:${line.variantId ?? "base"}`;
    const found = cart.find((item) => `${item.productId}:${item.variantId ?? "base"}` === key);
    cart = found
      ? cart.map((item) => `${item.productId}:${item.variantId ?? "base"}` === key ? { ...item, quantity: item.quantity + 1 } : item)
      : [...cart, line];
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    setFeedback(`已加入購物車：${line.variantLabel || "基本規格"}`);
  }

  function toggleWishlist() {
    let wishlist: string[] = [];
    try { wishlist = JSON.parse(localStorage.getItem(WISHLIST_KEY) || "[]"); } catch { /* noop */ }
    wishlist = saved ? wishlist.filter((id) => id !== product.id) : [...new Set([...wishlist, product.id])];
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
    setSaved(!saved);
    setFeedback(saved ? "已從收藏移除" : "已加入收藏");
  }

  return <div className="product-page">
    <a className="skip-link" href="#product-detail">跳到商品內容</a>
    <div className="promo-bar"><span>PRODUCT FILE</span><strong>台北現貨 · 規格與圖片一一對應</strong><Link href="/#products">回商品目錄</Link></div>
    <header className="site-header"><div className="brand-row"><Link className="logo" href="/"><span className="logo-mark">TR</span><span><strong>TR SELECT</strong><small>Objects for mobile life</small></span></Link><nav className="product-top-nav"><Link href="/">首頁</Link><Link href="/#categories">分類</Link><Link href="/#products">全部商品</Link></nav></div></header>

    <main className="product-detail-page" id="product-detail">
      <section className="detail-hero">
        <div className="detail-gallery">
          <div className="detail-main-image">{selectedImage ? <img src={mediaUrl(selectedImage)} alt={product.display_name} /> : <span>{product.mark}</span>}</div>
          <div className="detail-thumbs">{images.map((image, index) => <button className={selectedImage === image ? "is-active" : ""} type="button" key={`${image}-${index}`} onClick={() => setSelectedImage(image)}><img src={mediaUrl(image)} alt={`${product.display_name} 主圖 ${index + 1}`} /></button>)}</div>
        </div>
        <article className="detail-summary">
          <p className="detail-category">{product.category}</p><h1>{product.display_name}</h1><p className="detail-brand">{product.brand} / {product.badge} / No. {product.id}</p><p className="detail-desc">{product.description}</p>
          <div className="detail-price"><strong>{formatCurrency(pricing.salePrice)}</strong>{pricing.originalPrice > pricing.salePrice && <span>{formatCurrency(pricing.originalPrice)}</span>}{pricing.discount > 0 && <span className="detail-discount">-{pricing.discount}%</span>}</div>
          <section className="detail-variant-section"><h2>商品規格</h2><div className="variant-card-grid">{product.variants.length ? product.variants.map((item, index) => {
            const itemPricing = getVariantPricing(item); const label = [item.name, item.value].filter(Boolean).join(" / ");
            return <button className={`variant-card ${selectedVariant === index ? "is-active" : ""}`} type="button" key={item.id} onClick={() => chooseVariant(index)}><span className="variant-image">{item.image ? <img src={mediaUrl(item.image)} alt={label} /> : <em>{label.slice(0, 2)}</em>}</span><span className="variant-copy"><strong>{label}</strong>{item.sku && <em>SKU：{item.sku}</em>}<span className="variant-price-line"><small>{formatCurrency(itemPricing.salePrice)}</small>{itemPricing.originalPrice > itemPricing.salePrice && <del>{formatCurrency(itemPricing.originalPrice)}</del>}{itemPricing.discount > 0 && <b>-{itemPricing.discount}%</b>}</span></span></button>;
          }) : <p className="empty-variant-note">單一規格商品</p>}</div></section>
          <div className="detail-actions"><button className="primary-link" type="button" onClick={addToCart}>加入購物車</button><button className="secondary-link" type="button" onClick={toggleWishlist}>{saved ? "已收藏" : "加入收藏"}</button>{variant?.link && <a className="secondary-link" href={variant.link} target="_blank" rel="noreferrer">原始產品連結</a>}<Link className="secondary-link" href="/#products">繼續選購</Link><p className="product-feedback" role="status">{feedback}</p></div>
        </article>
      </section>

      {product.detail_images.length > 0 && <section className="detail-content-section"><div className="section-heading"><div><p className="eyebrow">Product detail</p><h2>商品詳情</h2></div><p>完整規格與使用情境</p></div><div className="detail-images">{product.detail_images.map((image, index) => <img src={mediaUrl(image)} alt={`${product.display_name} 詳情圖 ${index + 1}`} key={`${image}-${index}`} />)}</div></section>}
      {related.length > 0 && <section className="section-block"><div className="section-heading"><div><p className="eyebrow">Recommendations</p><h2>同分類推薦商品</h2></div></div><div className="product-grid">{related.map((item) => <article className="product-card" key={item.id}><Link className="product-visual" href={`/products/${encodeURIComponent(item.id)}`}>{item.images[0] ? <img src={mediaUrl(item.images[0])} alt={item.display_name} /> : <span>{item.mark}</span>}</Link><div className="product-body"><h3><Link href={`/products/${encodeURIComponent(item.id)}`}>{item.display_name}</Link></h3><div className="price-row"><span className="price">{formatCurrency(getProductPricing(item).salePrice)}</span></div></div></article>)}</div></section>}
    </main>
    <footer className="site-footer"><div><strong>TR SELECT</strong><p>為手機影像、直播和日常記錄挑選順手裝備。Taipei, Taiwan.</p></div><nav><Link href="/">商城首頁</Link><Link href="/#categories">選品分類</Link><Link href="/#products">商品目錄</Link></nav></footer>
  </div>;
}
