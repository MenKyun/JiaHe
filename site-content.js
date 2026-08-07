const siteContentStorageKey = "goodLifeMallSiteContent";

const defaultSiteContent = {
  theme: {
    brand: "#d7ff3f",
    brandDark: "#101113",
    accent: "#d7ff3f",
    gold: "#b9c7d6"
  },
  promo: {
    label: "NEW DROP",
    text: "180cm 落地自動開腳架現貨到站",
    linkText: "立即選購",
    linkUrl: "#products"
  },
  utility: {
    appText: "Creator gear · Taipei dispatch",
    favoriteText: "選物原則",
    loginText: "商品目錄",
    cartText: "購物車"
  },
  brand: {
    logoMark: "TR",
    name: "TR SELECT",
    tagline: "Objects for mobile life",
    searchPlaceholder: "搜尋自拍棒、補光燈、麥克風",
    searchButton: "搜尋"
  },
  categories: [
    { title: "自拍腳架", desc: "桌面、手持與全高腳架" },
    { title: "補光設備", desc: "磁吸燈、直播燈與柔光配件" },
    { title: "收音設備", desc: "無線麥克風與行動收音" },
    { title: "行動配件", desc: "散熱、遙控與收納工具" }
  ],
  hero: {
    autoplay: true,
    interval: 6,
    slides: [
      {
        image: "assets/tripod-rooftop-hero-v2.jpg",
        alt: "創作者在城市天台使用 TR 自動開腳架拍攝",
        position: "center"
      }
    ],
    eyebrow: "TR Creator System / 2026",
    title: "一支腳架，打開更多視角。",
    copy: "落地自動開腳、180cm 延伸與藍牙遙控。從一個人的日常，到完整的創作現場，只需要幾秒。",
    primaryText: "立即選購",
    primaryUrl: "#products",
    secondaryText: "探索產品 ↘",
    secondaryUrl: "#deals",
    mainDealLabel: "Featured / TUT160",
    mainDealTitle: "丟丟自拍腳架",
    mainDealSub: "落地即開，拿起即拍",
    miniDealLabel: "From",
    miniDealTitle: "NT$978",
    miniDealSub: "台北現貨"
  },
  services: [
    { title: "180 cm", desc: "從桌面視角延伸到全身取景" },
    { title: "10 m", desc: "藍牙遙控，離開手機也能拍" },
    { title: "360°", desc: "橫拍直拍，一轉就能切換" },
    { title: "12 h", desc: "台北現貨，工作日快速處理" }
  ],
  campaign: {
    eyebrow: "Drop & shoot",
    title: "落地，自動打開。",
    copy: "隱藏式腳架在接觸地面時自動展開，收起後依然是一支俐落的自拍棒。少一步調整，多一個不會錯過的畫面。",
    linkText: "查看丟丟系列 →",
    linkUrl: "#products"
  },
  categorySection: {
    eyebrow: "Shop by scene",
    title: "你要拍什麼？",
    copy: "從使用情境開始，更快找到合適裝備。"
  },
  productsSection: {
    eyebrow: "Creator essentials",
    title: "熱門創作裝備"
  },
  customBlocks: [],
  member: {
    eyebrow: "Made to move",
    title: "創作，不該被設備拖慢。",
    copy: "每件裝備都圍繞一個動作：更快架好、更穩拍攝、更輕鬆收回。規格的價值，最後要落在你能不能順手完成一個畫面。",
    stats: [
      { value: "26", label: "件在售選品" },
      { value: "24h", label: "工作日處理" },
      { value: "1:1", label: "規格對應實拍" }
    ]
  },
  footer: {
    title: "TR SELECT",
    copy: "為手機影像、直播和日常記錄挑選順手裝備。Taipei, Taiwan.",
    links: [
      { text: "前台可視化編輯", url: "visual-editor.html" },
      { text: "商品後台", url: "admin.html" },
      { text: "選品分類", url: "#categories" },
      { text: "商品目錄", url: "#products" },
      { text: "選物原則", url: "#member" }
    ]
  }
};

function deepMerge(base, override) {
  if (Array.isArray(base)) return Array.isArray(override) ? override : base;
  if (!base || typeof base !== "object") return override ?? base;

  const result = { ...base };
  Object.keys(base).forEach((key) => {
    if (override && Object.prototype.hasOwnProperty.call(override, key)) {
      result[key] = deepMerge(base[key], override[key]);
    }
  });

  if (override && typeof override === "object" && !Array.isArray(override)) {
    Object.keys(override).forEach((key) => {
      if (!Object.prototype.hasOwnProperty.call(result, key)) result[key] = override[key];
    });
  }

  return result;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function safeUrl(value) {
  const url = String(value || "#").trim();
  if (!url) return "#";
  if (url.startsWith("#") || url.endsWith(".html") || url.startsWith("http://") || url.startsWith("https://")) return url;
  return "#";
}

function safeMediaUrl(value) {
  const url = String(value || "").trim();
  if (!url) return "";
  if (url.startsWith("assets/") || url.startsWith("./assets/")) return url;
  if (url.startsWith("data:image/") || url.startsWith("http://") || url.startsWith("https://")) return url;
  return "";
}

function loadSiteContent() {
  try {
    const savedContent = localStorage.getItem(siteContentStorageKey);
    if (!savedContent) return structuredClone(defaultSiteContent);
    return deepMerge(defaultSiteContent, JSON.parse(savedContent));
  } catch (error) {
    console.warn("前台內容讀取失敗，已套用預設內容。", error);
    return structuredClone(defaultSiteContent);
  }
}

function saveSiteContent(content) {
  localStorage.setItem(siteContentStorageKey, JSON.stringify(deepMerge(defaultSiteContent, content)));
}

function resetSiteContent() {
  localStorage.removeItem(siteContentStorageKey);
}

function setText(selector, text) {
  const node = document.querySelector(selector);
  if (node) node.textContent = text;
}

function setHref(selector, href) {
  const node = document.querySelector(selector);
  if (node) node.setAttribute("href", safeUrl(href));
}

function applyTheme(theme) {
  const root = document.documentElement;
  if (theme.brand) root.style.setProperty("--brand", theme.brand);
  if (theme.brandDark) root.style.setProperty("--brand-dark", theme.brandDark);
  if (theme.accent) root.style.setProperty("--accent", theme.accent);
  if (theme.gold) root.style.setProperty("--gold", theme.gold);
}

function renderHeroCarousel(hero) {
  const carousel = document.querySelector("#hero-carousel");
  const controls = document.querySelector("#hero-carousel-controls");
  const dots = controls?.querySelector(".hero-carousel-dots");
  if (!carousel) return;

  const slides = (Array.isArray(hero.slides) ? hero.slides : [])
    .map((slide) => ({
      image: safeMediaUrl(slide?.image),
      alt: String(slide?.alt || "首頁主視覺"),
      position: ["left", "center", "right"].includes(slide?.position) ? slide.position : "center"
    }))
    .filter((slide) => slide.image)
    .slice(0, 5);

  if (!slides.length) {
    slides.push({
      image: "assets/tripod-rooftop-hero-v2.jpg",
      alt: "創作者在城市天台使用 TR 自動開腳架拍攝",
      position: "center"
    });
  }

  carousel.dataset.autoplay = hero.autoplay === false ? "false" : "true";
  carousel.dataset.interval = String(Math.min(15, Math.max(3, Number(hero.interval) || 6)));
  carousel.innerHTML = slides.map((slide, index) => `
    <figure class="hero-slide ${index === 0 ? "is-active" : ""}" data-slide-index="${index}" aria-hidden="${index === 0 ? "false" : "true"}">
      <img src="${escapeHtml(slide.image)}" alt="${escapeHtml(slide.alt)}" style="object-position:${slide.position} center" ${index === 0 ? 'fetchpriority="high"' : 'loading="lazy"'}>
    </figure>
  `).join("");

  if (!controls || !dots) return;
  controls.hidden = slides.length < 2;
  dots.innerHTML = slides.map((_, index) => `
    <button type="button" role="tab" data-carousel-index="${index}" aria-label="顯示第 ${index + 1} 張主視覺" aria-selected="${index === 0 ? "true" : "false"}" class="${index === 0 ? "is-active" : ""}"></button>
  `).join("");
}

function renderCategoryNav(categories) {
  const nav = document.querySelector(".category-nav");
  if (!nav) return;

  nav.innerHTML = [
    `<button type="button" class="category-button is-active" data-category="全部">全部商品</button>`,
    ...categories.map((category) => `
      <button type="button" class="category-button" data-category="${escapeHtml(category.title)}">${escapeHtml(category.title)}</button>
    `)
  ].join("");
}

function renderServiceStrip(services) {
  const strip = document.querySelector(".service-strip");
  if (!strip) return;
  strip.innerHTML = services.map((service) => `
    <article>
      <strong>${escapeHtml(service.title)}</strong>
      <span>${escapeHtml(service.desc)}</span>
    </article>
  `).join("");
}

function renderCategoryGrid(content) {
  const grid = document.querySelector(".category-grid");
  if (!grid) return;
  grid.innerHTML = content.categories.map((category, index) => `
    <article data-category="${escapeHtml(category.title)}">
      <figure class="category-media" aria-hidden="true"></figure>
      <div class="category-copy">
        <span>${String(index + 1).padStart(2, "0")}</span>
        <strong>${escapeHtml(category.title)}</strong>
        <p>${escapeHtml(category.desc)}</p>
        <em>Explore →</em>
      </div>
    </article>
  `).join("");
}

function renderCustomBlocks(blocks = []) {
  const container = document.querySelector("#custom-blocks");
  if (!container) return;

  const visibleBlocks = blocks.filter((block) => {
    if (!block) return false;
    return block.title || block.eyebrow || block.copy || block.image || block.linkText;
  });

  container.hidden = visibleBlocks.length === 0;
  if (!visibleBlocks.length) {
    container.innerHTML = "";
    return;
  }

  container.innerHTML = visibleBlocks.map((block) => {
    const type = block.type || "textImage";
    const layout = block.layout === "image-left" ? "is-image-left" : "is-image-right";
    const imageUrl = safeMediaUrl(block.image);
    const linkHtml = block.linkText ? `<a href="${safeUrl(block.linkUrl)}">${escapeHtml(block.linkText)}</a>` : "";
    const textHtml = `
      <div class="custom-block-copy">
        ${block.eyebrow ? `<p class="eyebrow">${escapeHtml(block.eyebrow)}</p>` : ""}
        ${block.title ? `<h2>${escapeHtml(block.title)}</h2>` : ""}
        ${block.copy ? `<p>${escapeHtml(block.copy)}</p>` : ""}
        ${linkHtml}
      </div>
    `;
    const imageHtml = imageUrl ? `
      <figure class="custom-block-media">
        <img src="${imageUrl}" alt="${escapeHtml(block.imageAlt || block.title || "自訂圖片")}">
      </figure>
    ` : "";

    if (type === "image") {
      return `<article class="custom-block custom-block-image">${imageHtml}${textHtml}</article>`;
    }

    if (type === "text") {
      return `<article class="custom-block custom-block-text">${textHtml}</article>`;
    }

    return `<article class="custom-block custom-block-text-image ${layout}">${layout === "is-image-left" ? imageHtml + textHtml : textHtml + imageHtml}</article>`;
  }).join("");
}

function renderMemberStats(stats) {
  const grid = document.querySelector(".member-stats");
  if (!grid) return;
  grid.innerHTML = stats.map((stat) => `
    <article>
      <strong>${escapeHtml(stat.value)}</strong>
      <span>${escapeHtml(stat.label)}</span>
    </article>
  `).join("");
}

function renderFooter(content) {
  const footer = document.querySelector(".site-footer");
  if (!footer) return;
  const title = footer.querySelector("strong");
  const copy = footer.querySelector("p");
  const nav = footer.querySelector("nav");

  if (title) title.textContent = content.footer.title;
  if (copy) copy.textContent = content.footer.copy;
  if (nav) {
    nav.innerHTML = content.footer.links.map((link) => `
      <a href="${safeUrl(link.url)}">${escapeHtml(link.text)}</a>
    `).join("");
  }
}

function applySiteContent(content = loadSiteContent()) {
  applyTheme(content.theme);
  renderHeroCarousel(content.hero);
  document.title = `${content.brand.name} | 行動影像配件選物`;

  setText(".promo-bar span", content.promo.label);
  setText(".promo-bar strong", content.promo.text);
  setText(".promo-bar a", content.promo.linkText);
  setHref(".promo-bar a", content.promo.linkUrl);

  setText(".utility-row p", content.utility.appText);
  setText(".utility-row nav a:nth-of-type(1)", content.utility.favoriteText);
  setText(".utility-row nav a:nth-of-type(2)", content.utility.loginText);
  const cartButton = document.querySelector("#cart-trigger-btn") || document.querySelector("button[aria-controls='cart-panel']");
  if (cartButton) {
    const count = cartButton.querySelector("#cart-count")?.textContent || "0";
    cartButton.innerHTML = `${escapeHtml(content.utility.cartText || "購物車")} <span id="cart-count">${escapeHtml(count)}</span>`;
  }

  setText(".logo-mark", content.brand.logoMark);
  setText(".logo strong", content.brand.name);
  setText(".logo small", content.brand.tagline);
  const searchInput = document.querySelector("#search-input");
  if (searchInput) searchInput.setAttribute("placeholder", content.brand.searchPlaceholder);
  setText(".search-box button", content.brand.searchButton);

  renderCategoryNav(content.categories);

  setText(".hero-content .eyebrow", content.hero.eyebrow);
  setText("#hero-title", content.hero.title);
  setText(".hero-copy", content.hero.copy);
  setText(".hero-actions .primary-link", content.hero.primaryText);
  setHref(".hero-actions .primary-link", content.hero.primaryUrl);
  setText(".hero-actions .secondary-link", content.hero.secondaryText);
  setHref(".hero-actions .secondary-link", content.hero.secondaryUrl);
  setText(".main-deal span", content.hero.mainDealLabel);
  setText(".main-deal strong", content.hero.mainDealTitle);
  setText(".main-deal em", content.hero.mainDealSub);
  setText(".mini-deal span", content.hero.miniDealLabel);
  setText(".mini-deal strong", content.hero.miniDealTitle);
  setText(".mini-deal em", content.hero.miniDealSub);

  renderServiceStrip(content.services);

  setText(".campaign-band .eyebrow", content.campaign.eyebrow);
  setText("#campaign-title", content.campaign.title);
  setText(".campaign-band p:not(.eyebrow)", content.campaign.copy);
  setText(".campaign-band a", content.campaign.linkText);
  setHref(".campaign-band a", content.campaign.linkUrl);

  renderCustomBlocks(content.customBlocks);

  setText('[aria-labelledby="categories-title"] .section-heading .eyebrow', content.categorySection.eyebrow);
  setText("#categories-title", content.categorySection.title);
  setText('[aria-labelledby="categories-title"] .section-heading > p', content.categorySection.copy);
  renderCategoryGrid(content);

  setText("#products .section-heading .eyebrow", content.productsSection.eyebrow);
  setText("#products-title", content.productsSection.title);

  setText("#member .eyebrow", content.member.eyebrow);
  setText("#member-title", content.member.title);
  setText("#member > div:first-child p:not(.eyebrow)", content.member.copy);
  renderMemberStats(content.member.stats);

  renderFooter(content);
}

window.defaultSiteContent = defaultSiteContent;
window.loadSiteContent = loadSiteContent;
window.saveSiteContent = saveSiteContent;
window.resetSiteContent = resetSiteContent;
window.applySiteContent = applySiteContent;
window.escapeSiteHtml = escapeHtml;
window.safeSiteUrl = safeUrl;
window.safeSiteMediaUrl = safeMediaUrl;

if (!document.body.classList.contains("visual-editor-page")) {
  applySiteContent();
}
