const defaultProducts = [
  {
    id: "P1001",
    name: "65W 三孔快充充電器",
    category: "手機周邊",
    brand: "ChargePro",
    price: 169,
    originalPrice: 239,
    badge: "熱銷",
    desc: "適合手機、平板與輕薄筆電，多裝置同時快充。",
    mark: "65W",
    images: [],
    detailImages: [],
    videos: [],
    variants: []
  },
  {
    id: "P1002",
    name: "主動降噪藍牙耳機",
    category: "影音周邊",
    brand: "SoundGo",
    price: 399,
    originalPrice: 599,
    badge: "新品",
    desc: "通勤、運動、遠端會議都能穩定使用。",
    mark: "ANC",
    images: [],
    detailImages: [],
    videos: [],
    variants: []
  },
  {
    id: "P1003",
    name: "6L 智慧除濕機",
    category: "季節家電",
    brand: "DryHome",
    price: 899,
    originalPrice: 1299,
    badge: "限時",
    desc: "臥室、書房與衣帽間適用，支援濕度自動控制。",
    mark: "6L",
    images: [],
    detailImages: [],
    videos: [],
    variants: []
  },
  {
    id: "P1004",
    name: "高速吹風護髮機",
    category: "健康護理",
    brand: "CareFlow",
    price: 699,
    originalPrice: 899,
    badge: "推薦",
    desc: "低溫速乾，適合日常護理與禮品組合。",
    mark: "HD",
    images: [],
    detailImages: [],
    videos: [],
    variants: []
  }
];

const storageKey = "goodLifeMallProducts";
const cartStorageKey = "goodLifeMallCart";
const detailRoot = document.querySelector("#product-detail");

function formatCurrency(value) {
  return new Intl.NumberFormat("zh-TW", {
    style: "currency",
    currency: "TWD",
    maximumFractionDigits: 0
  }).format(Number(value) || 0);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getProductName(product) {
  return window.getCatalogProductName ? window.getCatalogProductName(product) : product.name;
}

function normalizeDiscount(value) {
  return Math.min(95, Math.max(0, Number(value) || 0));
}

function safeUrl(value) {
  const url = String(value || "").trim();
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) return url;
  return "";
}

function normalizeVariant(variant = {}) {
  return {
    id: variant.id || "",
    sku: variant.sku || "",
    name: variant.name || "",
    value: variant.value || "",
    price: Number(variant.price) || 0,
    originalPrice: Number(variant.originalPrice) || 0,
    discount: normalizeDiscount(variant.discount),
    stock: Number(variant.stock) || 0,
    leadTime: variant.leadTime || "",
    image: variant.image || "",
    link: variant.link || ""
  };
}

function normalizeVideo(video = {}) {
  if (typeof video === "string") {
    return { type: video.startsWith("data:") ? "file" : "url", src: video, name: "商品影片" };
  }

  return {
    type: video.type || (String(video.src || "").startsWith("data:") ? "file" : "url"),
    src: video.src || "",
    name: video.name || "商品影片"
  };
}

function normalizeProduct(product) {
  const images = Array.isArray(product.images)
    ? product.images
    : product.image
      ? [product.image]
      : [];

  return {
    ...product,
    category: inferCategory(product),
    badge: product.badge === "TR ??" || !product.badge ? "TR 精選" : product.badge,
    price: Number(product.price) || 0,
    originalPrice: Number(product.originalPrice) || 0,
    images: images.filter(Boolean).slice(0, 9),
    detailImages: Array.isArray(product.detailImages) ? product.detailImages.filter(Boolean) : [],
    videos: Array.isArray(product.videos) ? product.videos.map(normalizeVideo).filter((video) => video.src) : [],
    variants: Array.isArray(product.variants) ? product.variants.map(normalizeVariant) : []
  };
}

function inferCategory(product) {
  if (product.category && product.category !== "????") return product.category;

  const source = String(product.sourceCategory || "").toLowerCase();
  if (source.includes("microphone") || source.includes("audio")) return "收音設備";
  if (source.includes("flashes") || source.includes("selfie lights")) return "補光設備";
  if (source.includes("selfie") || source.includes("remote shutters")) return "自拍腳架";
  return "行動配件";
}

function getVariantPricing(variant, product) {
  const basePrice = Number(variant?.price) || Number(product?.price) || 0;
  const discount = normalizeDiscount(variant?.discount);
  const salePrice = discount > 0 ? Math.round(basePrice * (100 - discount) / 100) : basePrice;
  const originalPrice = discount > 0
    ? Math.max(Number(variant?.originalPrice) || 0, basePrice)
    : Number(variant?.originalPrice) || 0;

  return {
    salePrice,
    originalPrice: originalPrice > salePrice ? originalPrice : 0,
    discount
  };
}

function getProductPricing(product) {
  const variantPrices = product.variants
    .map((variant) => ({ ...getVariantPricing(variant, product), variant }))
    .filter((pricing) => pricing.salePrice > 0)
    .sort((a, b) => a.salePrice - b.salePrice);

  if (variantPrices.length) return variantPrices[0];

  const salePrice = Number(product.price) || 0;
  const originalPrice = Number(product.originalPrice) || 0;
  return {
    variant: null,
    salePrice,
    originalPrice: originalPrice > salePrice ? originalPrice : 0,
    discount: 0
  };
}

function getDisplayPrice(product) {
  return getProductPricing(product).salePrice;
}

function getDisplayOriginalPrice(product) {
  return getProductPricing(product).originalPrice;
}

function loadProducts() {
  try {
    const savedProducts = localStorage.getItem(storageKey);
    if (!savedProducts) return defaultProducts.map(normalizeProduct);

    const parsedProducts = JSON.parse(savedProducts);
    if (!Array.isArray(parsedProducts)) return defaultProducts.map(normalizeProduct);

    return parsedProducts
      .filter((product) => product && product.id && product.name)
      .map(normalizeProduct);
  } catch (error) {
    return defaultProducts.map(normalizeProduct);
  }
}

function getProductId() {
  return new URLSearchParams(window.location.search).get("id");
}

function addProductToCart(productId, variantId = "") {
  try {
    const cart = JSON.parse(localStorage.getItem(cartStorageKey) || "{}");
    const safeCart = cart && typeof cart === "object" && !Array.isArray(cart) ? cart : {};
    const cartKey = variantId ? `${productId}::${variantId}` : productId;
    safeCart[cartKey] = (Number(safeCart[cartKey]) || 0) + 1;
    localStorage.setItem(cartStorageKey, JSON.stringify(safeCart));
    return true;
  } catch (error) {
    console.warn("購物車儲存失敗。", error);
    return false;
  }
}

function renderMissingProduct() {
  detailRoot.innerHTML = `
    <section class="empty-detail">
      <p class="eyebrow">Product Not Found</p>
      <h1>找不到這款商品</h1>
      <p>商品可能已被刪除，或網址缺少商品編號。</p>
      <a class="primary-link" href="index.html#products">回商品列表</a>
    </section>
  `;
}

function renderVideos(videos) {
  if (!videos.length) return "";

  return `
    <section class="detail-video-section">
      <p class="eyebrow">Product Video</p>
      <h2>商品影片</h2>
      <div class="detail-video-grid">
        ${videos.map((video) => `
          <article>
            <video src="${escapeHtml(video.src)}" controls></video>
            <span>${escapeHtml(video.name)}</span>
          </article>
        `).join("")}
      </div>
    </section>
  `;
}

function renderVariantCards(product) {
  if (!product.variants.length) {
    return `<p class="empty-variant-note">尚未設定商品規格。</p>`;
  }

  return product.variants.map((variant, index) => {
    const label = [variant.name, variant.value].filter(Boolean).join(" / ") || `規格 ${index + 1}`;
    const pricing = getVariantPricing(variant, product);
    return `
      <button class="variant-card ${index === 0 ? "is-active" : ""}" type="button" data-variant-index="${index}">
        <span class="variant-image">
          ${variant.image
            ? `<img src="${escapeHtml(variant.image)}" alt="${escapeHtml(label)}">`
            : `<em>${escapeHtml(label.slice(0, 2))}</em>`}
        </span>
        <span class="variant-copy">
          <strong>${escapeHtml(label)}</strong>
          ${variant.sku ? `<em>SKU：${escapeHtml(variant.sku)}</em>` : ""}
          <span class="variant-price-line">
            <small>${formatCurrency(pricing.salePrice)}</small>
            ${pricing.originalPrice ? `<del>${formatCurrency(pricing.originalPrice)}</del>` : ""}
            ${pricing.discount ? `<b>-${pricing.discount}%</b>` : ""}
          </span>
        </span>
      </button>
    `;
  }).join("");
}

function renderProduct(product) {
  const displayName = getProductName(product);
  const sourceImages = product.images.length
    ? product.images
    : product.variants.map((variant) => variant.image).filter(Boolean).slice(0, 9);
  const images = product.sourceProductId === "54805434847" && sourceImages[2]
    ? [sourceImages[2], ...sourceImages.filter((_, index) => index !== 2)]
    : sourceImages;
  const firstImage = images[0] || "";
  const firstVariant = product.variants[0];
  const selectedPricing = firstVariant ? getVariantPricing(firstVariant, product) : getProductPricing(product);
  const selectedPrice = selectedPricing.salePrice;
  const selectedOriginalPrice = selectedPricing.originalPrice;
  const selectedLink = safeUrl(firstVariant?.link);

  document.title = `${displayName} | TR SELECT`;
  detailRoot.innerHTML = `
    <section class="detail-hero">
      <div class="detail-gallery">
        <div class="detail-main-image" id="detail-main-image">
          ${firstImage
            ? `<img src="${escapeHtml(firstImage)}" alt="${escapeHtml(displayName)}">`
            : `<span>${escapeHtml(product.mark || displayName.slice(0, 2))}</span>`}
        </div>
        <div class="detail-thumbs" id="detail-thumbs">
          ${images.length
            ? images.map((image, index) => `
                <button class="${index === 0 ? "is-active" : ""}" type="button" data-image="${escapeHtml(image)}" aria-label="查看第 ${index + 1} 張主圖">
                  <img src="${escapeHtml(image)}" alt="${escapeHtml(displayName)}主圖 ${index + 1}">
                </button>
              `).join("")
            : `<p>尚未上傳主圖或規格圖</p>`}
        </div>
      </div>

      <article class="detail-summary">
        <p class="detail-category">${escapeHtml(product.category)}</p>
        <h1>${escapeHtml(displayName)}</h1>
        <p class="detail-brand">${escapeHtml(product.brand)} / ${escapeHtml(product.badge)} / No. ${escapeHtml(product.id)}</p>
        <p class="detail-desc">${escapeHtml(product.desc)}</p>
        <div class="detail-price">
          <strong id="selected-price">${formatCurrency(selectedPrice)}</strong>
          <span id="selected-original-price" ${selectedOriginalPrice <= selectedPrice ? "hidden" : ""}>${formatCurrency(selectedOriginalPrice)}</span>
          <span class="detail-discount" id="selected-discount" ${selectedPricing.discount ? "" : "hidden"}>-${selectedPricing.discount}%</span>
        </div>

        <section class="detail-variant-section" aria-labelledby="variant-title">
          <h2 id="variant-title">商品規格</h2>
          <div class="variant-card-grid" id="variant-card-grid">
            ${renderVariantCards(product)}
          </div>
        </section>

        <div class="detail-actions">
          <button class="primary-link" type="button" id="detail-add-cart">加入購物車</button>
          <button class="secondary-link" type="button" id="detail-toggle-wishlist">加入收藏</button>
          <a class="secondary-link ${selectedLink ? "" : "is-disabled"}" id="variant-link" href="${selectedLink || "#"}" target="_blank" rel="noreferrer">打開產品連結</a>
          <a class="secondary-link" href="index.html#products">繼續選購</a>
          <p class="product-feedback" id="product-feedback" role="status" aria-live="polite"></p>
        </div>
      </article>
    </section>

    ${renderVideos(product.videos)}

    <section class="detail-content-section">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Product Detail</p>
          <h2>商品詳情</h2>
        </div>
        <p>這裡會顯示後台上傳的詳情頁圖片。</p>
      </div>
      <div class="detail-images">
        ${product.detailImages.length
          ? product.detailImages.map((image, index) => `
              <img src="${escapeHtml(image)}" alt="${escapeHtml(displayName)}詳情圖 ${index + 1}">
            `).join("")
          : `<div class="empty-state">尚未上傳詳情頁圖片。</div>`}
      </div>
    </section>

    <!-- Recommended Products Section -->
    <section class="section-block" style="margin-top: 48px;">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Recommendations</p>
          <h2>同分類推薦商品</h2>
        </div>
      </div>
      <div class="product-grid">
        ${products.filter(p => p.id !== product.id && p.category === product.category).slice(0, 4).map(p => `
          <article class="product-card">
            <a class="product-visual" href="product.html?id=${encodeURIComponent(p.id)}">
              ${p.images?.[0] ? `<img src="${escapeHtml(p.images[0])}" alt="">` : `<span>${escapeHtml(getProductName(p).slice(0,2))}</span>`}
            </a>
            <div class="product-body">
              <h3><a href="product.html?id=${encodeURIComponent(p.id)}">${escapeHtml(getProductName(p))}</a></h3>
              <div class="price-row"><span class="price">${formatCurrency(p.price)}</span></div>
            </div>
          </article>
        `).join("")}
      </div>
    </section>
  `;

  const thumbs = document.querySelector("#detail-thumbs");
  const mainImage = document.querySelector("#detail-main-image");
  const animateMainImage = () => {
    if (!mainImage || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    mainImage.animate([
      { opacity: 0.58, transform: "scale(0.985)", clipPath: "inset(2.5% round 10px)" },
      { opacity: 1, transform: "scale(1)", clipPath: "inset(0 round 10px)" }
    ], {
      duration: 340,
      easing: "cubic-bezier(0.16, 1, 0.3, 1)"
    });
  };

  thumbs?.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-image]");
    if (!button) return;

    thumbs.querySelectorAll("button").forEach((item) => item.classList.toggle("is-active", item === button));
    mainImage.innerHTML = `<img src="${button.dataset.image}" alt="${escapeHtml(displayName)}">`;
    animateMainImage();
  });

  const variantGrid = document.querySelector("#variant-card-grid");
  variantGrid?.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-variant-index]");
    if (!button) return;

    const variant = product.variants[Number(button.dataset.variantIndex)];
    if (!variant) return;

    variantGrid.querySelectorAll(".variant-card").forEach((item) => item.classList.toggle("is-active", item === button));
    const pricing = getVariantPricing(variant, product);
    document.querySelector("#selected-price").textContent = formatCurrency(pricing.salePrice);
    const nextPrice = pricing.salePrice;
    const nextOriginalPrice = pricing.originalPrice;
    const originalPriceNode = document.querySelector("#selected-original-price");
    originalPriceNode.textContent = formatCurrency(nextOriginalPrice);
    originalPriceNode.hidden = nextOriginalPrice <= nextPrice;
    const discountNode = document.querySelector("#selected-discount");
    discountNode.textContent = pricing.discount ? `-${pricing.discount}%` : "";
    discountNode.hidden = !pricing.discount;

    const link = document.querySelector("#variant-link");
    const variantLink = safeUrl(variant.link);
    link.href = variantLink || "#";
    link.classList.toggle("is-disabled", !variantLink);

    if (variant.image) {
      mainImage.innerHTML = `<img src="${escapeHtml(variant.image)}" alt="${escapeHtml(displayName)}">`;
      animateMainImage();
    }
  });

  document.querySelector("#detail-add-cart")?.addEventListener("click", () => {
    const activeVariantButton = document.querySelector(".variant-card.is-active");
    const activeVariant = activeVariantButton?.querySelector("strong")?.textContent || "基本規格";
    const selectedVariant = product.variants[Number(activeVariantButton?.dataset.variantIndex)] || null;
    if (addProductToCart(product.id, selectedVariant?.id || "")) {
      showToast(`已加入購物車：${displayName} (${activeVariant})`, "success");
    } else {
      showToast("加入購物車失敗，請稍後再試", "error");
    }
  });

  document.querySelector("#detail-toggle-wishlist")?.addEventListener("click", () => {
    let wishlist = [];
    try { wishlist = JSON.parse(localStorage.getItem("tr_wishlist_v1") || "[]"); } catch(e){}
    const idx = wishlist.indexOf(product.id);
    if (idx >= 0) {
      wishlist.splice(idx, 1);
      showToast("已從收藏清單移除", "info");
    } else {
      wishlist.push(product.id);
      showToast("已加入收藏清單", "success");
    }
    localStorage.setItem("tr_wishlist_v1", JSON.stringify(wishlist));
    updateWishlistDetailCount();
  });
}

function showToast(message, type = "info") {
  const container = document.querySelector("#toast-container");
  if (!container) return;
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${type === "success" ? "✓" : type === "error" ? "✕" : "ℹ"}</span>
    <span>${escapeHtml(message)}</span>
  `;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add("toast-closing");
    setTimeout(() => toast.remove(), 250);
  }, 2800);
}

function updateWishlistDetailCount() {
  let wishlist = [];
  try { wishlist = JSON.parse(localStorage.getItem("tr_wishlist_v1") || "[]"); } catch(e){}
  const badge = document.querySelector("#wishlist-count-detail");
  if (badge) badge.textContent = wishlist.length;
}

const products = loadProducts();
const product = products.find((item) => item.id === getProductId());

if (product) {
  renderProduct(product);
  updateWishlistDetailCount();
} else {
  renderMissingProduct();
}
