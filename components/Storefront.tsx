"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { formatCurrency, getProductPricing } from "@/lib/pricing";
import type { CartLine, Product, SiteContent } from "@/lib/types";

const CART_KEY = "tr-select-cart-v2";
const WISHLIST_KEY = "tr-select-wishlist-v2";

function mediaUrl(value: string) {
  if (!value) return "";
  if (/^(https?:|data:|\/)/.test(value)) return value;
  return `/${value.replace(/^\.\//, "")}`;
}

function cartKey(line: Pick<CartLine, "productId" | "variantId">) {
  return `${line.productId}:${line.variantId ?? "base"}`;
}

export default function Storefront({ products, content }: { products: Product[]; content: SiteContent }) {
  const [category, setCategory] = useState("全部");
  const [keyword, setKeyword] = useState("");
  const [visibleCount, setVisibleCount] = useState(11);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [slide, setSlide] = useState(0);
  const [checkoutStatus, setCheckoutStatus] = useState("");

  useEffect(() => {
    try {
      setCart(JSON.parse(localStorage.getItem(CART_KEY) || "[]"));
      setWishlist(JSON.parse(localStorage.getItem(WISHLIST_KEY) || "[]"));
    } catch { /* Ignore invalid legacy state. */ }
  }, []);

  useEffect(() => { localStorage.setItem(CART_KEY, JSON.stringify(cart)); }, [cart]);
  useEffect(() => { localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist)); }, [wishlist]);
  useEffect(() => {
    const nodes = document.querySelectorAll(".reveal-on-scroll");
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    }), { threshold: 0.08 });
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  const slides = content.hero.slides?.length ? content.hero.slides.slice(0, 5) : [];
  useEffect(() => {
    if (!content.hero.autoplay || slides.length < 2) return;
    const timer = window.setInterval(
      () => setSlide((current) => (current + 1) % slides.length),
      Math.max(3, Number(content.hero.interval) || 6) * 1000,
    );
    return () => window.clearInterval(timer);
  }, [content.hero.autoplay, content.hero.interval, slides.length]);

  const categories = useMemo(() => ["全部", ...new Set(products.map((product) => product.category))], [products]);
  const filteredProducts = useMemo(() => {
    const query = keyword.trim().toLowerCase();
    return products.filter((product) => {
      const matchesCategory = category === "全部" || product.category === category;
      const haystack = `${product.display_name} ${product.name} ${product.brand} ${product.category}`.toLowerCase();
      return matchesCategory && (!query || haystack.includes(query));
    });
  }, [products, category, keyword]);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  function addToCart(product: Product) {
    const variant = product.variants[0] ?? null;
    const pricing = getProductPricing(product);
    const line: CartLine = {
      productId: product.id,
      variantId: variant?.id ?? null,
      name: product.display_name,
      variantLabel: variant ? [variant.name, variant.value].filter(Boolean).join(" / ") : "",
      price: pricing.salePrice,
      image: mediaUrl(variant?.image || product.images[0] || ""),
      quantity: 1,
    };
    setCart((current) => {
      const key = cartKey(line);
      const found = current.find((item) => cartKey(item) === key);
      return found
        ? current.map((item) => cartKey(item) === key ? { ...item, quantity: item.quantity + 1 } : item)
        : [...current, line];
    });
    setCartOpen(true);
  }

  function changeQuantity(key: string, amount: number) {
    setCart((current) => current
      .map((item) => cartKey(item) === key ? { ...item, quantity: item.quantity + amount } : item)
      .filter((item) => item.quantity > 0));
  }

  async function submitOrder() {
    if (!cart.length) return;
    setCheckoutStatus("正在建立訂單…");
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: cart.map(({ productId, variantId, quantity }) => ({ productId, variantId, quantity })),
      }),
    });
    const result = await response.json();
    if (!response.ok) {
      setCheckoutStatus(result.error || "訂單建立失敗，請稍後再試。");
      return;
    }
    setCart([]);
    setCheckoutStatus(`訂單 ${result.orderNumber} 已建立，我們會盡快與你聯絡。`);
  }

  const themeStyle = {
    "--brand": content.theme.brand,
    "--brand-dark": content.theme.brandDark,
    "--accent": content.theme.accent,
    "--gold": content.theme.gold,
  } as React.CSSProperties;

  return (
    <div className="storefront-page" style={themeStyle}>
      <a className="skip-link" href="#main-content">跳到主要內容</a>
      <div className="promo-bar">
        <span>{content.promo.label}</span><strong>{content.promo.text}</strong><a href={content.promo.linkUrl}>{content.promo.linkText}</a>
      </div>

      <header className="site-header">
        <div className="utility-row">
          <p>{content.utility.appText}</p>
          <nav aria-label="會員工具">
            <a href="#member">{content.utility.favoriteText}</a>
            <a href="#products">{content.utility.loginText}</a>
            <button className="cart-trigger" type="button">收藏 <span>{wishlist.length}</span></button>
            <button className="cart-trigger" type="button" onClick={() => setCartOpen(true)}>購物車 <span>{cartCount}</span></button>
          </nav>
        </div>
        <div className="brand-row">
          <Link className="logo" href="/" aria-label="TR SELECT 首頁">
            <span className="logo-mark">{content.brand.logoMark}</span>
            <span><strong>{content.brand.name}</strong><small>{content.brand.tagline}</small></span>
          </Link>
          <form className="search-box" onSubmit={(event) => event.preventDefault()}>
            <label className="sr-only" htmlFor="search-input">搜尋商品</label>
            <input id="search-input" type="search" value={keyword} onChange={(event) => { setKeyword(event.target.value); setVisibleCount(11); }} placeholder={content.brand.searchPlaceholder} />
            <button type="submit">{content.brand.searchButton}</button>
          </form>
        </div>
        <nav className="category-nav" aria-label="商品分類">
          {categories.map((item) => (
            <button key={item} type="button" className={`category-button ${category === item ? "is-active" : ""}`} onClick={() => { setCategory(item); setVisibleCount(11); }}>
              {item === "全部" ? "全部商品" : item}
            </button>
          ))}
        </nav>
      </header>

      <main id="main-content">
        <section className="hero hero-cinematic" aria-labelledby="hero-title">
          <div className="hero-showcase" role="region" aria-roledescription="carousel" aria-label="首頁主視覺輪播">
            {slides.map((item, index) => (
              <figure key={`${item.image}-${index}`} className={`hero-slide ${slide === index ? "is-active" : ""}`} aria-hidden={slide !== index}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={mediaUrl(item.image)} alt={item.alt} style={{ objectPosition: `${item.position} center` }} />
              </figure>
            ))}
          </div>
          <div className="hero-content">
            <p className="eyebrow">{content.hero.eyebrow}</p>
            <h1 id="hero-title">{content.hero.title}</h1>
            <p className="hero-copy">{content.hero.copy}</p>
            <div className="hero-actions">
              <a className="primary-link" href={content.hero.primaryUrl}>{content.hero.primaryText}</a>
              <a className="secondary-link text-link" href={content.hero.secondaryUrl}>{content.hero.secondaryText}</a>
            </div>
            <div className="hero-trust-bar"><span className="trust-pill">台北現貨 · 24h 出貨</span><span className="trust-pill">4.9/5 創作者好評</span><span className="trust-pill">1 年原廠保固</span></div>
            <ul className="hero-specs" aria-label="主推商品特色">
              <li><strong>180</strong><span>CM 最高高度</span></li><li><strong>10</strong><span>M 藍牙遙控</span></li><li><strong>360°</strong><span>橫直自由旋轉</span></li>
            </ul>
          </div>
          <aside className="hero-feature-note">
            <div className="deal-card main-deal"><span>{content.hero.mainDealLabel}</span><strong>{content.hero.mainDealTitle}</strong><em>{content.hero.mainDealSub}</em></div>
            <div className="deal-card mini-deal"><span>{content.hero.miniDealLabel}</span><strong>{content.hero.miniDealTitle}</strong><em>{content.hero.miniDealSub}</em></div>
          </aside>
          {slides.length > 1 && <div className="hero-carousel-controls">
            <button type="button" onClick={() => setSlide((slide - 1 + slides.length) % slides.length)} aria-label="上一張主視覺">←</button>
            <div className="hero-carousel-dots">{slides.map((_, index) => <button key={index} type="button" className={slide === index ? "is-active" : ""} onClick={() => setSlide(index)} aria-label={`顯示第 ${index + 1} 張主視覺`} />)}</div>
            <button type="button" onClick={() => setSlide((slide + 1) % slides.length)} aria-label="下一張主視覺">→</button>
          </div>}
          <a className="hero-scroll" href="#deals">繼續瀏覽</a>
        </section>

        <section className="service-strip reveal-on-scroll" aria-label="服務優勢">
          {content.services.map((service) => <article key={service.title}><strong>{service.title}</strong><span>{service.desc}</span></article>)}
        </section>

        <section className="campaign-band reveal-on-scroll" id="deals" aria-labelledby="campaign-title">
          <div className="campaign-copy"><span className="campaign-number">01</span><p className="eyebrow">{content.campaign.eyebrow}</p><h2 id="campaign-title">{content.campaign.title}</h2><p>{content.campaign.copy}</p><a href={content.campaign.linkUrl}>{content.campaign.linkText}</a></div>
          <figure className="campaign-visual"><img src="/assets/tripod-gesture-detail.jpg" alt="TR 自拍腳架隱藏式手機夾與伸縮結構特寫" /><figcaption>One-piece hidden structure / TUT160</figcaption></figure>
        </section>

        <section className="reviews-section reveal-on-scroll" aria-labelledby="reviews-title">
          <div className="section-heading"><div><p className="eyebrow">Social Proof / 4.9 Rating</p><h2 id="reviews-title">創作者實測評價</h2></div><p>來自真實使用者的反饋，用過就回不去的順手體驗。</p></div>
          <div className="reviews-grid">
            {[
              ["林", "@林*翰", "Vlog 創作者", "架設速度超快，一個人出外景拍短影音救星！自動展開非常穩定。"],
              ["陳", "@陳*婷", "美妝博主", "台北出貨隔天就收到！180cm 高度取景視角超棒，拍全身照完全不求人。"],
              ["張", "@張*豪", "攝影師", "麥克風收音清晰，戶外降噪也很實用，整套設備工作起來很順手。"],
            ].map(([avatar, name, role, quote]) => <article className="review-card" key={name}><div className="review-stars">5.0 / 5</div><p className="review-quote">「{quote}」</p><div className="review-author"><div className="author-avatar">{avatar}</div><div className="author-info"><strong>{name}</strong><small>已驗證買家 · {role}</small></div></div></article>)}
          </div>
        </section>

        <section className="section-block reveal-on-scroll" id="categories" aria-labelledby="categories-title">
          <div className="section-heading"><div><p className="eyebrow">{content.categorySection.eyebrow}</p><h2 id="categories-title">{content.categorySection.title}</h2></div><p>{content.categorySection.copy}</p></div>
          <div className="category-grid">{content.categories.map((item, index) => <article key={item.title} tabIndex={0} onClick={() => setCategory(item.title)}><span>{String(index + 1).padStart(2, "0")}</span><strong>{item.title}</strong><p>{item.desc}</p></article>)}</div>
        </section>

        <section className="section-block reveal-on-scroll" id="products" aria-labelledby="products-title">
          <div className="section-heading"><div><p className="eyebrow">{content.productsSection.eyebrow}</p><h2 id="products-title">{content.productsSection.title}</h2></div><p>展示 {filteredProducts.length} 件商品</p></div>
          <div className="product-grid" aria-live="polite">
            {filteredProducts.slice(0, visibleCount).map((product, index) => {
              const pricing = getProductPricing(product);
              const cover = product.images[0] || product.variants[0]?.image || "";
              const isSaved = wishlist.includes(product.id);
              return <article className={`product-card ${index === 0 && category === "全部" && !keyword ? "is-featured" : ""}`} key={product.id}>
                <Link className="product-visual" href={`/products/${encodeURIComponent(product.id)}`}>
                  {cover ? <img src={mediaUrl(cover)} alt={product.display_name} loading="lazy" /> : <span>{product.mark}</span>}
                  {pricing.discount > 0 && <span className="product-discount-badge">-{pricing.discount}%</span>}
                </Link>
                <div className="product-body"><p className="product-meta">{product.category} / {product.brand}</p><h3><Link href={`/products/${encodeURIComponent(product.id)}`}>{product.display_name}</Link></h3><p>{product.description.split("\n")[0]}</p>
                  <div className="price-row"><span className="price">{formatCurrency(pricing.salePrice)}</span>{pricing.originalPrice > pricing.salePrice && <span className="original-price">{formatCurrency(pricing.originalPrice)}</span>}</div>
                  <div className="product-actions"><button className="add-to-cart" type="button" onClick={() => addToCart(product)}>加入購物車</button><button type="button" className={`detail-link wishlist-btn ${isSaved ? "is-active" : ""}`} onClick={() => setWishlist((current) => isSaved ? current.filter((id) => id !== product.id) : [...current, product.id])}>{isSaved ? "已收藏" : "收藏"}</button></div>
                </div>
              </article>;
            })}
          </div>
          {visibleCount < filteredProducts.length && <div className="product-load-more"><button type="button" onClick={() => setVisibleCount((count) => count + 8)}>查看更多商品</button></div>}
        </section>

        <section className="lead-capture-box" aria-label="訂閱優惠"><h2>訂閱獲取首購 NT$100 折扣碼</h2><p>第一時間收到全新 Drop、庫存到貨通知與創作者裝備指南。</p><form className="lead-form" onSubmit={(event) => event.preventDefault()}><input type="email" required placeholder="請輸入您的 Email 地址" /><button type="submit">立即領取</button></form></section>
        <section className="member-panel" id="member"><div><p className="eyebrow">{content.member.eyebrow}</p><h2>{content.member.title}</h2><p>{content.member.copy}</p></div><div className="member-stats">{content.member.stats.map((stat) => <article key={stat.label}><strong>{stat.value}</strong><span>{stat.label}</span></article>)}</div></section>
      </main>

      <aside className={`cart-panel ${cartOpen ? "is-open" : ""}`} role="dialog" aria-modal="true" aria-hidden={!cartOpen}>
        <div className="cart-header"><div><p className="eyebrow">Your selection</p><h2>購物車</h2></div><button className="icon-button" type="button" onClick={() => setCartOpen(false)} aria-label="關閉購物車">×</button></div>
        <div className="cart-items">{cart.length ? cart.map((item) => <article className="cart-item" key={cartKey(item)}>{item.image && <img className="cart-item-media" src={item.image} alt="" />}<div><strong>{item.name}</strong><small>{item.variantLabel}</small><span>{formatCurrency(item.price)}</span><div className="quantity-control"><button type="button" onClick={() => changeQuantity(cartKey(item), -1)}>−</button><span>{item.quantity}</span><button type="button" onClick={() => changeQuantity(cartKey(item), 1)}>＋</button></div></div></article>) : <p className="empty-cart">購物車內目前沒有商品</p>}</div>
        <div className="cart-footer"><div><span>小計</span><strong>{formatCurrency(cartTotal)}</strong></div><button type="button" onClick={submitOrder} disabled={!cart.length}>建立訂單</button><p className="cart-status" role="status">{checkoutStatus}</p></div>
      </aside>
      <button className={`cart-backdrop ${cartOpen ? "is-active" : ""}`} type="button" onClick={() => setCartOpen(false)} aria-label="關閉購物車" />

      <footer className="site-footer"><div><strong>{content.footer.title}</strong><p>{content.footer.copy}</p></div><nav><Link href="/admin">商品後台</Link><a href="#categories">選品分類</a><a href="#products">商品目錄</a><a href="#member">選物原則</a></nav></footer>
    </div>
  );
}
