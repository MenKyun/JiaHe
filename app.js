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

const state = {
  category: "全部",
  keyword: "",
  cart: {},
  visibleCount: 11
};

const storageKey = "goodLifeMallProducts";
const cartStorageKey = "goodLifeMallCart";
let products = loadProducts();
state.cart = loadCart();

const productGrid = document.querySelector("#product-grid");
const resultSummary = document.querySelector("#result-summary");
const categoryButtons = document.querySelectorAll(".category-button");
const searchForm = document.querySelector("#search-form");
const searchInput = document.querySelector("#search-input");
const cartPanel = document.querySelector("#cart-panel");
const cartBackdrop = document.querySelector("#cart-backdrop");
const cartItems = document.querySelector("#cart-items");
const cartCount = document.querySelector("#cart-count");
const cartTotal = document.querySelector("#cart-total");
const cartTrigger = document.querySelector("#cart-trigger-btn") || document.querySelector("button[aria-controls='cart-panel']");
const closeCart = document.querySelector("#close-cart");
const checkoutButton = document.querySelector("#checkout-button");
const cartStatus = document.querySelector("#cart-status");
const heroProductLink = document.querySelector("#hero-product-link");
const categoryGrid = document.querySelector(".category-grid");
const loadMoreWrap = document.querySelector("#product-load-more");
const loadMoreButton = document.querySelector("#load-more-products");
let lastFocusedElement = null;

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

function normalizeVariant(variant = {}) {
  return {
    ...variant,
    price: Number(variant.price) || 0,
    originalPrice: Number(variant.originalPrice) || 0,
    discount: normalizeDiscount(variant.discount)
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
    videos: Array.isArray(product.videos) ? product.videos.filter((video) => video && video.src) : [],
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

function loadProducts() {
  try {
    const savedProducts = localStorage.getItem(storageKey);
    if (!savedProducts) return defaultProducts.map(normalizeProduct);

    const parsedProducts = JSON.parse(savedProducts);
    if (!Array.isArray(parsedProducts)) return defaultProducts.map(normalizeProduct);

    return parsedProducts
      .filter((product) => product && product.id && product.name)
      .filter((product) => window.isCatalogProductVisible ? window.isCatalogProductVisible(product) : true)
      .map(normalizeProduct);
  } catch (error) {
    console.warn("商品資料讀取失敗，已改用預設商品。", error);
    return defaultProducts.map(normalizeProduct);
  }
}

function loadCart() {
  try {
    const savedCart = JSON.parse(localStorage.getItem(cartStorageKey) || "{}");
    if (!savedCart || typeof savedCart !== "object" || Array.isArray(savedCart)) return {};

    return Object.fromEntries(
      Object.entries(savedCart)
        .map(([productId, quantity]) => [productId, Math.max(0, Number(quantity) || 0)])
        .filter(([, quantity]) => quantity > 0)
    );
  } catch (error) {
    console.warn("購物車資料讀取失敗，已建立新的購物車。", error);
    return {};
  }
}

function saveCart() {
  localStorage.setItem(cartStorageKey, JSON.stringify(state.cart));
}

function getCoverImage(product) {
  const variantImage = product.variants?.find((variant) => variant.image)?.image;
  if (product.sourceProductId === "54805434847" && product.images?.[2]) return product.images[2];
  return variantImage || (product.images && product.images.length ? product.images[0] : "");
}

function getVariantPricing(variant, product) {
  const basePrice = Number(variant?.price) || Number(product?.price) || 0;
  const discount = normalizeDiscount(variant?.discount);
  const salePrice = discount > 0 ? Math.round(basePrice * (100 - discount) / 100) : basePrice;
  const originalPrice = discount > 0
    ? Math.max(Number(variant?.originalPrice) || 0, basePrice)
    : Number(variant?.originalPrice) || 0;

  return {
    variant: variant || null,
    basePrice,
    salePrice,
    originalPrice: originalPrice > salePrice ? originalPrice : 0,
    discount
  };
}

function getProductPricing(product) {
  const variantPrices = (product.variants || [])
    .map((variant) => getVariantPricing(variant, product))
    .filter((pricing) => pricing.salePrice > 0)
    .sort((a, b) => a.salePrice - b.salePrice);

  if (variantPrices.length) return variantPrices[0];

  const salePrice = Number(product.price) || 0;
  const originalPrice = Number(product.originalPrice) || 0;
  return {
    variant: null,
    basePrice: salePrice,
    salePrice,
    originalPrice: originalPrice > salePrice ? originalPrice : 0,
    discount: 0
  };
}

function getDisplayPrice(product) {
  return getProductPricing(product).salePrice;
}

// --- V2 Extensions: Wishlist, Toasts, Quick View & Checkout ---
const wishlistStorageKey = "tr_wishlist_v1";
const ordersStorageKey = "tr_orders_v1";
let wishlist = loadWishlist();

function loadWishlist() {
  try {
    return JSON.parse(localStorage.getItem(wishlistStorageKey) || "[]");
  } catch (e) {
    return [];
  }
}

function saveWishlist() {
  localStorage.setItem(wishlistStorageKey, JSON.stringify(wishlist));
  updateWishlistUI();
}

function toggleWishlist(productId) {
  const index = wishlist.indexOf(productId);
  if (index >= 0) {
    wishlist.splice(index, 1);
    showToast("已從收藏清單移除", "info");
  } else {
    wishlist.push(productId);
    showToast("已加入收藏清單", "success");
  }
  saveWishlist();
  renderProducts();
}

function updateWishlistUI() {
  const countEl = document.querySelector("#wishlist-count");
  if (countEl) countEl.textContent = wishlist.length;
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

function getFilteredProducts() {
  const keyword = state.keyword.trim().toLowerCase();
  return products.filter((product) => {
    const matchesCategory = state.category === "全部" || product.category === state.category;
    const matchesKeyword = !keyword || [
      product.name,
      getProductName(product),
      product.category,
      product.brand,
      product.desc
    ].some((field) => String(field).toLowerCase().includes(keyword));
    return matchesCategory && matchesKeyword;
  });
}

function renderProducts() {
  const filteredProducts = getFilteredProducts();
  const visibleProducts = filteredProducts.slice(0, state.visibleCount);

  resultSummary.textContent = filteredProducts.length
    ? `顯示 ${visibleProducts.length} / ${filteredProducts.length} 件商品`
    : "沒有找到符合條件的商品";

  if (loadMoreWrap && loadMoreButton) {
    const remaining = Math.max(0, filteredProducts.length - visibleProducts.length);
    loadMoreWrap.hidden = remaining === 0;
    loadMoreButton.textContent = remaining ? `查看更多商品（還有 ${remaining} 件）` : "已顯示全部商品";
  }

  if (!filteredProducts.length) {
    productGrid.innerHTML = `<p class="empty-state">沒有找到符合條件的商品，請調整分類或搜尋關鍵字。</p>`;
    return;
  }

  productGrid.innerHTML = visibleProducts.map((product, index) => {
    const coverImage = getCoverImage(product);
    const detailUrl = `product.html?id=${encodeURIComponent(product.id)}`;
    const pricing = getProductPricing(product);
    const displayPrice = pricing.salePrice;
    const originalPrice = pricing.originalPrice;
    const displayName = getProductName(product);
    const isWishlisted = wishlist.includes(product.id);

    return `
      <article class="product-card ${index === 0 && state.category === "全部" && !state.keyword ? "is-featured" : ""}">
        <div class="product-visual">
          <a href="${detailUrl}" aria-label="查看 ${escapeHtml(displayName)}">
            ${coverImage
              ? `<img src="${escapeHtml(coverImage)}" alt="${escapeHtml(displayName)}" loading="lazy" decoding="async">`
              : `<span aria-hidden="true">${escapeHtml(product.mark || displayName.slice(0, 2))}</span>`}
          </a>
          ${pricing.discount ? `<span class="product-discount-badge">-${pricing.discount}%</span>` : ""}
          <button class="wishlist-btn ${isWishlisted ? "is-active" : ""}" type="button" data-wishlist-id="${escapeHtml(product.id)}" title="${isWishlisted ? "取消收藏" : "加入收藏"}">
            ${isWishlisted ? "已收藏" : "收藏"}
          </button>
          <div class="product-card-actions">
            <button class="btn-quick-view" type="button" data-quickview-id="${escapeHtml(product.id)}">快速預覽</button>
            <button class="btn-quick-add" type="button" data-id="${escapeHtml(product.id)}">加購物車</button>
          </div>
        </div>
        <div class="product-body">
          <div class="product-meta">
            <span>${escapeHtml(product.brand)}</span>
            <span class="tag">${escapeHtml(product.badge)}</span>
          </div>
          <h3><a class="product-title-link" href="${detailUrl}">${escapeHtml(displayName)}</a></h3>
          <div class="price-row">
            <span class="price">${formatCurrency(displayPrice)}</span>
            ${originalPrice > displayPrice ? `<span class="original-price">${formatCurrency(originalPrice)}</span>` : ""}
          </div>
          <div class="product-actions">
            <button class="add-to-cart" type="button" data-id="${escapeHtml(product.id)}">加入購物車</button>
            <a class="detail-link" href="${detailUrl}" aria-label="查看商品詳情">詳情</a>
          </div>
        </div>
      </article>
    `;
  }).join("");

  updateWishlistUI();
}

function renderCategoryImagery() {
  categoryGrid?.querySelectorAll("article[data-category]").forEach((card) => {
    const category = card.dataset.category;
    const product = products.find((item) => item.category === category && getCoverImage(item));
    const media = card.querySelector(".category-media");
    if (!product || !media) return;

    media.innerHTML = `<img src="${escapeHtml(getCoverImage(product))}" alt="" loading="lazy" decoding="async">`;
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", `瀏覽${category}`);
  });
}

function renderHeroFeature() {
  if (!heroProductLink) return;
  const featuredProduct = products.find((product) => getCoverImage(product));
  if (!featuredProduct) return;

  const coverImage = getCoverImage(featuredProduct);
  heroProductLink.href = `product.html?id=${encodeURIComponent(featuredProduct.id)}`;
  heroProductLink.setAttribute("aria-label", `查看本期主推：${getProductName(featuredProduct)}`);
  heroProductLink.innerHTML = `<img src="${escapeHtml(coverImage)}" alt="${escapeHtml(getProductName(featuredProduct))}">`;
}

function getCartEntries() {
  return Object.entries(state.cart)
    .map(([cartKey, quantity]) => {
      const separatorIndex = cartKey.indexOf("::");
      const productId = separatorIndex >= 0 ? cartKey.slice(0, separatorIndex) : cartKey;
      const variantId = separatorIndex >= 0 ? cartKey.slice(separatorIndex + 2) : "";
      const product = products.find((item) => item.id === productId);
      const variant = product?.variants?.find((item) => item.id === variantId) || null;
      return { cartKey, product, variant, quantity };
    })
    .filter((entry) => entry.product && entry.quantity > 0);
}

function renderCart() {
  const entries = getCartEntries();
  const totalQuantity = entries.reduce((sum, entry) => sum + entry.quantity, 0);
  const totalPrice = entries.reduce((sum, entry) => {
    const pricing = entry.variant ? getVariantPricing(entry.variant, entry.product) : getProductPricing(entry.product);
    return sum + pricing.salePrice * entry.quantity;
  }, 0);

  cartCount.textContent = totalQuantity;
  cartTotal.textContent = formatCurrency(totalPrice);

  if (!entries.length) {
    cartItems.innerHTML = `<p class="empty-cart">購物車內目前沒有商品</p>`;
    return;
  }

  cartItems.innerHTML = entries.map(({ cartKey, product, variant, quantity }) => {
    const pricing = variant ? getVariantPricing(variant, product) : getProductPricing(product);
    const unitPrice = pricing.salePrice;
    const coverImage = getCoverImage(product);
    const variantLabel = variant ? [variant.name, variant.value].filter(Boolean).join(" / ") : "";
    return `
    <article class="cart-item">
      ${coverImage ? `<img class="cart-item-media" src="${escapeHtml(coverImage)}" alt="">` : `<span class="cart-item-media" aria-hidden="true"></span>`}
      <div>
        <strong>${escapeHtml(getProductName(product))}</strong>
        ${variantLabel ? `<small class="cart-item-variant">${escapeHtml(variantLabel)}${pricing.discount ? ` · -${pricing.discount}%` : ""}</small>` : ""}
        <span>${formatCurrency(unitPrice)} × ${quantity}</span>
        <div class="quantity-control" aria-label="${escapeHtml(getProductName(product))} 數量控制">
          <button type="button" data-action="decrease" data-id="${escapeHtml(cartKey)}" aria-label="減少數量">−</button>
          <span>${quantity}</span>
          <button type="button" data-action="increase" data-id="${escapeHtml(cartKey)}" aria-label="增加數量">+</button>
        </div>
      </div>
      <strong>${formatCurrency(unitPrice * quantity)}</strong>
    </article>
  `;
  }).join("");
}

function addToCart(productId, variantId = "") {
  const cartKey = variantId ? `${productId}::${variantId}` : productId;
  state.cart[cartKey] = (state.cart[cartKey] || 0) + 1;
  saveCart();
  renderCart();
  openCart();
}

function changeQuantity(productId, direction) {
  const currentQuantity = state.cart[productId] || 0;
  const nextQuantity = direction === "increase" ? currentQuantity + 1 : currentQuantity - 1;

  if (nextQuantity <= 0) {
    delete state.cart[productId];
  } else {
    state.cart[productId] = nextQuantity;
  }

  saveCart();
  renderCart();
}

function initHeroCarousel() {
  const carousel = document.querySelector("#hero-carousel");
  const controls = document.querySelector("#hero-carousel-controls");
  const status = document.querySelector("#hero-carousel-status");
  if (!carousel || !controls) return;

  const slides = [...carousel.querySelectorAll(".hero-slide")];
  const dots = [...controls.querySelectorAll("[data-carousel-index]")];
  if (slides.length < 2) return;

  const hero = carousel.closest(".hero");
  const autoplay = carousel.dataset.autoplay !== "false" && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const interval = Math.min(15, Math.max(3, Number(carousel.dataset.interval) || 6)) * 1000;
  let activeIndex = 0;
  let timer = null;

  function showSlide(index, announce = true) {
    activeIndex = (index + slides.length) % slides.length;
    slides.forEach((slide, slideIndex) => {
      const active = slideIndex === activeIndex;
      slide.classList.toggle("is-active", active);
      slide.setAttribute("aria-hidden", String(!active));
    });
    dots.forEach((dot, dotIndex) => {
      const active = dotIndex === activeIndex;
      dot.classList.toggle("is-active", active);
      dot.setAttribute("aria-selected", String(active));
      dot.tabIndex = active ? 0 : -1;
    });
    if (announce && status) status.textContent = `第 ${activeIndex + 1} 張，共 ${slides.length} 張主視覺`;
  }

  function stopAutoplay() {
    if (timer) window.clearInterval(timer);
    timer = null;
  }

  function startAutoplay() {
    stopAutoplay();
    if (autoplay && !document.hidden) timer = window.setInterval(() => showSlide(activeIndex + 1, false), interval);
  }

  controls.addEventListener("click", (event) => {
    const dot = event.target.closest("[data-carousel-index]");
    const action = event.target.closest("[data-carousel-action]")?.dataset.carouselAction;
    if (dot) showSlide(Number(dot.dataset.carouselIndex));
    if (action === "previous") showSlide(activeIndex - 1);
    if (action === "next") showSlide(activeIndex + 1);
    startAutoplay();
  });

  hero?.addEventListener("mouseenter", stopAutoplay);
  hero?.addEventListener("mouseleave", startAutoplay);
  hero?.addEventListener("focusin", stopAutoplay);
  hero?.addEventListener("focusout", startAutoplay);
  document.addEventListener("visibilitychange", startAutoplay);
  showSlide(0, false);
  startAutoplay();
}

function openCart() {
  lastFocusedElement = document.activeElement;
  cartPanel.classList.add("is-open");
  cartPanel.setAttribute("aria-hidden", "false");
  cartBackdrop.classList.add("is-open");
  document.body.classList.add("has-open-cart");
  cartPanel.focus();
}

function closeCartPanel() {
  cartPanel.classList.remove("is-open");
  cartPanel.setAttribute("aria-hidden", "true");
  cartBackdrop.classList.remove("is-open");
  document.body.classList.remove("has-open-cart");
  if (lastFocusedElement instanceof HTMLElement) lastFocusedElement.focus();
}

categoryButtons.forEach((button) => {
  button.addEventListener("click", () => {
    state.category = button.dataset.category;
    state.visibleCount = 11;
    categoryButtons.forEach((item) => item.classList.toggle("is-active", item === button));
    renderProducts();
  });
});

categoryGrid?.addEventListener("click", (event) => {
  const card = event.target.closest("article[data-category]");
  if (!card) return;
  const matchingButton = [...categoryButtons].find((button) => button.dataset.category === card.dataset.category);
  matchingButton?.click();
  document.querySelector("#products")?.scrollIntoView({ behavior: "smooth" });
});

categoryGrid?.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") return;
  const card = event.target.closest("article[data-category]");
  if (!card) return;
  event.preventDefault();
  card.click();
});

searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  state.keyword = searchInput.value;
  state.visibleCount = 11;
  renderProducts();
});

loadMoreButton?.addEventListener("click", () => {
  state.visibleCount += 12;
  renderProducts();
});

// --- Modal Management & Handlers ---
const modalBackdrop = document.querySelector("#modal-backdrop");
const quickViewModal = document.querySelector("#quick-view-modal");
const quickViewContent = document.querySelector("#quick-view-content");
const closeQuickViewBtn = document.querySelector("#close-quick-view");
const checkoutModal = document.querySelector("#checkout-modal");
const checkoutModalContent = document.querySelector("#checkout-modal-content");
const closeCheckoutBtn = document.querySelector("#close-checkout-modal");
const wishlistTrigger = document.querySelector("#wishlist-trigger");

function closeModal() {
  modalBackdrop?.classList.remove("is-open");
  quickViewModal?.classList.remove("is-open");
  checkoutModal?.classList.remove("is-open");
}

modalBackdrop?.addEventListener("click", closeModal);
closeQuickViewBtn?.addEventListener("click", closeModal);
closeCheckoutBtn?.addEventListener("click", closeModal);

function openQuickView(productId) {
  const product = products.find((item) => item.id === productId);
  if (!product || !quickViewModal || !quickViewContent) return;

  const displayName = getProductName(product);
  const coverImage = getCoverImage(product);
  const pricing = getProductPricing(product);
  const allImages = (product.images && product.images.length) ? product.images : [coverImage];

  quickViewContent.innerHTML = `
    <div class="quick-view-media">
      <img class="quick-view-main-image" id="qv-main-img" src="${escapeHtml(allImages[0] || coverImage)}" alt="${escapeHtml(displayName)}">
      ${allImages.length > 1 ? `
        <div class="quick-view-thumbs">
          ${allImages.map((img, i) => `
            <img class="quick-view-thumb ${i === 0 ? "is-active" : ""}" src="${escapeHtml(img)}" onclick="document.querySelector('#qv-main-img').src='${escapeHtml(img)}'; document.querySelectorAll('.quick-view-thumb').forEach(t=>t.classList.remove('is-active')); this.classList.add('is-active');">
          `).join("")}
        </div>
      ` : ""}
    </div>
    <div class="quick-view-info">
      <span class="quick-view-badge">${escapeHtml(product.badge || "TR 精選")}</span>
      <h2 class="quick-view-title">${escapeHtml(displayName)}</h2>
      <div class="quick-view-price">
        <strong>${formatCurrency(pricing.salePrice)}</strong>
        ${pricing.originalPrice > pricing.salePrice ? `<del>${formatCurrency(pricing.originalPrice)}</del>` : ""}
      </div>
      <p class="quick-view-desc">${escapeHtml(product.desc || "高質感選品，台北現貨出貨。")}</p>

      <div style="margin-top: auto; display: flex; gap: 12px;">
        <button class="primary-link" type="button" style="flex: 1; padding: 12px 20px;" onclick="addToCart('${escapeHtml(product.id)}'); closeModal();">
          加入購物車
        </button>
        <a class="secondary-link" href="product.html?id=${encodeURIComponent(product.id)}" style="padding: 12px 20px; display: inline-flex; align-items: center;">
          完整頁面 ↗
        </a>
      </div>
    </div>
  `;

  modalBackdrop?.classList.add("is-open");
  quickViewModal?.classList.add("is-open");
}

function openCheckoutModal() {
  const entries = getCartEntries();
  if (!entries.length) {
    showToast("購物車內尚無商品", "warning");
    return;
  }

  closeCartPanel();

  const totalPrice = entries.reduce((sum, entry) => {
    const pricing = entry.variant ? getVariantPricing(entry.variant, entry.product) : getProductPricing(entry.product);
    return sum + pricing.salePrice * entry.quantity;
  }, 0);

  checkoutModalContent.innerHTML = `
    <div class="checkout-form-group">
      <h3>收件人資訊與結帳</h3>
      <form id="checkout-form">
        <label>收件人姓名 <input type="text" required placeholder="請輸入姓名"></label>
        <label>聯絡電話 <input type="tel" required placeholder="0912-345-678"></label>
        <label>收件地址 <input type="text" required placeholder="縣市/鄉鎮市區/路街號"></label>

        <h4 style="margin-top: 16px; margin-bottom: 8px;">付款方式</h4>
        <div class="payment-options">
          <label class="payment-option is-selected">
            <input type="radio" name="payment" value="credit" checked> 信用卡付款
          </label>
          <label class="payment-option">
            <input type="radio" name="payment" value="linepay"> LINE Pay
          </label>
          <label class="payment-option">
            <input type="radio" name="payment" value="applepay">  Apple Pay
          </label>
          <label class="payment-option">
            <input type="radio" name="payment" value="cod"> 貨到付款
          </label>
        </div>

        <button class="primary-link" type="submit" style="width: 100%; margin-top: 20px; padding: 14px; font-size: 16px;">
          確認送出訂單（${formatCurrency(totalPrice)}）
        </button>
      </form>
    </div>

    <div>
      <h3>訂單小計</h3>
      <div style="background: #fff; padding: 16px; border-radius: 12px; border: 1px solid var(--line);">
        ${entries.map(({ product, variant, quantity }) => {
          const pricing = variant ? getVariantPricing(variant, product) : getProductPricing(product);
          return `
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px;">
              <span>${escapeHtml(getProductName(product))} × ${quantity}</span>
              <strong>${formatCurrency(pricing.salePrice * quantity)}</strong>
            </div>
          `;
        }).join("")}
        <hr style="margin: 12px 0; border: none; border-top: 1px dashed var(--line);">
        <div style="display: flex; justify-content: space-between; font-weight: 700; font-size: 16px;">
          <span>總計</span>
          <span>${formatCurrency(totalPrice)}</span>
        </div>
      </div>
    </div>
  `;

  modalBackdrop?.classList.add("is-open");
  checkoutModal?.classList.add("is-open");

  document.querySelector("#checkout-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    processOrderSuccess(entries, totalPrice);
  });
}

function processOrderSuccess(entries, totalPrice) {
  const orderId = `TR-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
  const order = {
    id: orderId,
    date: new Date().toLocaleString("zh-TW"),
    items: entries.map(e => ({ name: getProductName(e.product), quantity: e.quantity, price: e.product.price })),
    total: totalPrice,
    status: "待處理"
  };

  try {
    const existingOrders = JSON.parse(localStorage.getItem(ordersStorageKey) || "[]");
    existingOrders.unshift(order);
    localStorage.setItem(ordersStorageKey, JSON.stringify(existingOrders));
  } catch(e){}

  state.cart = {};
  saveCart();
  renderCart();

  checkoutModalContent.innerHTML = `
    <div class="order-receipt-card" style="grid-column: 1 / -1;">
      <div class="receipt-header">
        <div class="receipt-icon">✓</div>
        <h2>訂單建立成功！</h2>
        <p style="color: var(--muted);">訂單編號：<strong>${orderId}</strong></p>
      </div>

      <div class="receipt-items-list">
        ${order.items.map(item => `
          <div class="receipt-item-row">
            <span>${escapeHtml(item.name)} × ${item.quantity}</span>
            <strong>${formatCurrency(item.price * item.quantity)}</strong>
          </div>
        `).join("")}
      </div>

      <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: 800; margin-bottom: 24px;">
        <span>實付金額</span>
        <span style="color: var(--brand-dark);">${formatCurrency(totalPrice)}</span>
      </div>

      <div style="display: flex; gap: 12px; justify-content: center;">
        <button class="primary-link" type="button" onclick="window.print()">列印 / 下載收據</button>
        <button class="secondary-link" type="button" onclick="closeModal()">完成並返回</button>
      </div>
    </div>
  `;

  showToast("訂單成功送出。", "success");
}

productGrid.addEventListener("click", (event) => {
  const wishlistBtn = event.target.closest("[data-wishlist-id]");
  if (wishlistBtn) {
    toggleWishlist(wishlistBtn.dataset.wishlistId);
    return;
  }

  const quickViewBtn = event.target.closest("[data-quickview-id]");
  if (quickViewBtn) {
    openQuickView(quickViewBtn.dataset.quickview-id);
    return;
  }

  const button = event.target.closest(".add-to-cart, .btn-quick-add");
  if (!button) return;
  const product = products.find((item) => item.id === button.dataset.id);
  const pricing = product ? getProductPricing(product) : null;
  addToCart(button.dataset.id, pricing?.variant?.id || "");
  showToast(`已加入購物車：${getProductName(product)}`, "success");
});

cartItems.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  changeQuantity(button.dataset.id, button.dataset.action);
});

cartTrigger.addEventListener("click", openCart);
closeCart.addEventListener("click", closeCartPanel);
cartBackdrop.addEventListener("click", closeCartPanel);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeModal();
});

wishlistTrigger?.addEventListener("click", () => {
  if (!wishlist.length) {
    showToast("目前收藏清單是空的", "info");
    return;
  }
  state.category = "全部";
  const wishlistProducts = products.filter(p => wishlist.includes(p.id));
  resultSummary.textContent = `收藏清單（${wishlistProducts.length} 件商品）`;

  productGrid.innerHTML = wishlistProducts.map((product) => {
    const coverImage = getCoverImage(product);
    const detailUrl = `product.html?id=${encodeURIComponent(product.id)}`;
    const pricing = getProductPricing(product);
    const displayName = getProductName(product);
    return `
      <article class="product-card">
        <div class="product-visual">
          <a href="${detailUrl}">
            ${coverImage ? `<img src="${escapeHtml(coverImage)}" alt="">` : `<span>${escapeHtml(displayName.slice(0, 2))}</span>`}
          </a>
          <button class="wishlist-btn is-active" type="button" data-wishlist-id="${escapeHtml(product.id)}">已收藏</button>
        </div>
        <div class="product-body">
          <h3><a href="${detailUrl}">${escapeHtml(displayName)}</a></h3>
          <div class="price-row"><span class="price">${formatCurrency(pricing.salePrice)}</span></div>
          <button class="add-to-cart" type="button" data-id="${escapeHtml(product.id)}">加入購物車</button>
        </div>
      </article>
    `;
  }).join("");
});

checkoutButton.addEventListener("click", openCheckoutModal);

function initCountdownTimer() {
  const cdHours = document.querySelector("#cd-hours");
  const cdMins = document.querySelector("#cd-mins");
  const cdSecs = document.querySelector("#cd-secs");
  if (!cdHours || !cdMins || !cdSecs) return;

  let totalSeconds = 4 * 3600 + 28 * 60 + 45;

  setInterval(() => {
    if (totalSeconds <= 0) totalSeconds = 24 * 3600;
    totalSeconds--;
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;

    cdHours.textContent = String(h).padStart(2, "0");
    cdMins.textContent = String(m).padStart(2, "0");
    cdSecs.textContent = String(s).padStart(2, "0");
  }, 1000);
}

function initHomepageMotion() {
  const hero = document.querySelector(".storefront-page .hero");
  if (!hero || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const introduceHero = () => {
    window.requestAnimationFrame(() => hero.classList.add("is-motion-ready"));
  };

  if (document.readyState === "loading") {
    window.addEventListener("DOMContentLoaded", introduceHero, { once: true });
  } else {
    introduceHero();
  }
}

document.querySelector("#lead-capture-form")?.addEventListener("submit", (e) => {
  e.preventDefault();
  showToast("訂閱成功，首購折扣碼已發送：TRNEW100", "success");
  e.target.reset();
});

renderProducts();
renderCart();
renderHeroFeature();
renderCategoryImagery();
initHeroCarousel();
initCountdownTimer();
initHomepageMotion();
