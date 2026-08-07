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
const maxMainImages = 9;
const maxVideoFiles = 3;
const form = document.querySelector("#product-form");
const formTitle = document.querySelector("#form-title");
const productList = document.querySelector("#admin-product-list");
const adminSummary = document.querySelector("#admin-summary");
const mainImagesInput = document.querySelector("#product-main-images");
const detailImagesInput = document.querySelector("#product-detail-images");
const videoInput = document.querySelector("#product-videos");
const videoUrlInput = document.querySelector("#product-video-url");
const mainImagePreview = document.querySelector("#main-image-preview");
const detailImagePreview = document.querySelector("#detail-image-preview");
const videoPreview = document.querySelector("#video-preview");
const variantEditorList = document.querySelector("#variant-editor-list");
const addVariantButton = document.querySelector("#add-variant");
const clearFormButton = document.querySelector("#clear-form");
const resetButton = document.querySelector("#reset-products");
const exportButton = document.querySelector("#export-products");
const importInput = document.querySelector("#import-products");

const fields = {
  id: document.querySelector("#product-id"),
  name: document.querySelector("#product-name"),
  category: document.querySelector("#product-category"),
  brand: document.querySelector("#product-brand"),
  price: document.querySelector("#product-price"),
  originalPrice: document.querySelector("#product-original-price"),
  badge: document.querySelector("#product-badge"),
  mark: document.querySelector("#product-mark"),
  desc: document.querySelector("#product-desc")
};

let noticeTimer;
let products = loadProducts();
let pendingMainImages = [];
let pendingDetailImages = [];
let pendingVideos = [];
let pendingVariants = [];

function showNotice(message, tone = "info") {
  let notice = document.querySelector("#app-notice");
  if (!notice) {
    notice = document.createElement("div");
    notice.id = "app-notice";
    notice.className = "app-toast";
    notice.setAttribute("role", "status");
    notice.setAttribute("aria-live", "polite");
    document.body.append(notice);
  }

  clearTimeout(noticeTimer);
  notice.textContent = message;
  notice.dataset.tone = tone;
  requestAnimationFrame(() => notice.classList.add("is-visible"));
  noticeTimer = setTimeout(() => notice.classList.remove("is-visible"), 3600);
}

function formatCurrency(value) {
  return new Intl.NumberFormat("zh-TW", {
    style: "currency",
    currency: "TWD",
    maximumFractionDigits: 0
  }).format(Number(value) || 0);
}

function normalizeDiscount(value) {
  return Math.min(95, Math.max(0, Number(value) || 0));
}

function getVariantPricing(variant, fallbackPrice = 0) {
  const basePrice = Number(variant.price) || Number(fallbackPrice) || 0;
  const discount = normalizeDiscount(variant.discount);
  const salePrice = discount > 0 ? Math.round(basePrice * (100 - discount) / 100) : basePrice;
  const originalPrice = discount > 0
    ? Math.max(Number(variant.originalPrice) || 0, basePrice)
    : Number(variant.originalPrice) || 0;

  return { basePrice, salePrice, originalPrice, discount };
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
  const url = String(value || "").trim();
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) return url;
  return "";
}

function createProductId() {
  return `P${Date.now()}`;
}

function createVariantId() {
  return `V${Date.now()}${Math.floor(Math.random() * 1000)}`;
}

function normalizeVariant(variant = {}) {
  return {
    id: variant.id || createVariantId(),
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
    images: images.filter(Boolean).slice(0, maxMainImages),
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

function getDisplayPrice(product) {
  const prices = product.variants
    .map((variant) => getVariantPricing(variant, product.price).salePrice)
    .filter((price) => price > 0);
  return prices.length ? Math.min(...prices) : Number(product.price) || 0;
}

function loadProducts() {
  try {
    const savedProducts = localStorage.getItem(storageKey);
    if (!savedProducts) return defaultProducts.map(normalizeProduct);

    const parsedProducts = JSON.parse(savedProducts);
    if (!Array.isArray(parsedProducts)) return defaultProducts.map(normalizeProduct);
    return parsedProducts.filter((product) => product && product.id && product.name).map(normalizeProduct);
  } catch (error) {
    showNotice("商品資料讀取失敗，已改用預設商品。", "error");
    return defaultProducts.map(normalizeProduct);
  }
}

function saveProducts() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(products.map(normalizeProduct)));
  } catch (error) {
    showNotice("儲存失敗。圖片或影片可能太大，請減少數量或改用網址。", "error");
    throw error;
  }
}

function resizeImage(file, options) {
  const { maxWidth, maxHeight, square, quality } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("圖片讀取失敗"));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("圖片載入失敗"));
      image.onload = () => {
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        if (square) {
          const sourceSize = Math.min(image.width, image.height);
          const sourceX = (image.width - sourceSize) / 2;
          const sourceY = (image.height - sourceSize) / 2;
          const outputSize = Math.min(maxWidth, maxHeight);

          canvas.width = outputSize;
          canvas.height = outputSize;
          context.drawImage(image, sourceX, sourceY, sourceSize, sourceSize, 0, 0, outputSize, outputSize);
        } else {
          const scale = Math.min(1, maxWidth / image.width);
          canvas.width = Math.round(image.width * scale);
          canvas.height = Math.round(image.height * scale);
          context.drawImage(image, 0, 0, canvas.width, canvas.height);
        }

        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("檔案讀取失敗"));
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });
}

async function processMainImages(files) {
  const selectedFiles = Array.from(files).slice(0, maxMainImages - pendingMainImages.length);
  if (!selectedFiles.length) return;

  const processedImages = [];
  for (const file of selectedFiles) {
    processedImages.push(await resizeImage(file, {
      maxWidth: 1200,
      maxHeight: 1200,
      square: true,
      quality: 0.86
    }));
  }

  pendingMainImages = [...pendingMainImages, ...processedImages].slice(0, maxMainImages);
  renderMainImagePreview();
}

async function processDetailImages(files) {
  const selectedFiles = Array.from(files);
  if (!selectedFiles.length) return;

  const processedImages = [];
  for (const file of selectedFiles) {
    processedImages.push(await resizeImage(file, {
      maxWidth: 1200,
      maxHeight: 9999,
      square: false,
      quality: 0.86
    }));
  }

  pendingDetailImages = [...pendingDetailImages, ...processedImages];
  renderDetailImagePreview();
}

async function processVideos(files) {
  const selectedFiles = Array.from(files).slice(0, maxVideoFiles - pendingVideos.length);
  if (!selectedFiles.length) return;

  for (const file of selectedFiles) {
    pendingVideos.push({
      type: "file",
      src: await readFileAsDataUrl(file),
      name: file.name
    });
  }

  renderVideoPreview();
}

function getAllVideosForPreview() {
  const url = safeUrl(videoUrlInput.value);
  return url ? [...pendingVideos, { type: "url", src: url, name: "影片網址" }] : pendingVideos;
}

function renderMainImagePreview() {
  if (!pendingMainImages.length) {
    mainImagePreview.innerHTML = `<p class="empty-upload">尚未上傳主圖</p>`;
    return;
  }

  mainImagePreview.innerHTML = pendingMainImages.map((image, index) => `
    <article class="upload-thumb">
      <img src="${escapeHtml(image)}" alt="主圖 ${index + 1}">
      <div>
        <span>${index === 0 ? "封面" : `主圖 ${index + 1}`}</span>
        <button type="button" data-remove-main="${index}">移除</button>
      </div>
    </article>
  `).join("");
}

function renderDetailImagePreview() {
  if (!pendingDetailImages.length) {
    detailImagePreview.innerHTML = `<p class="empty-upload">尚未上傳詳情頁圖片</p>`;
    return;
  }

  detailImagePreview.innerHTML = pendingDetailImages.map((image, index) => `
    <article class="detail-upload-item">
      <img src="${escapeHtml(image)}" alt="詳情圖 ${index + 1}">
      <div>
        <span>詳情圖 ${index + 1}</span>
        <button type="button" data-remove-detail="${index}">移除</button>
      </div>
    </article>
  `).join("");
}

function renderVideoPreview() {
  const videos = getAllVideosForPreview();
  if (!videos.length) {
    videoPreview.innerHTML = `<p class="empty-upload">尚未上傳影片或設定影片網址</p>`;
    return;
  }

  videoPreview.innerHTML = videos.map((video, index) => `
    <article class="video-upload-item">
      <video src="${escapeHtml(video.src)}" controls muted></video>
      <div>
        <strong>${escapeHtml(video.name)}</strong>
        ${video.type === "file"
          ? `<button type="button" data-remove-video="${index}">移除</button>`
          : `<button type="button" data-clear-video-url>清除網址</button>`}
      </div>
    </article>
  `).join("");
}

function renderVariantEditor() {
  if (!pendingVariants.length) {
    variantEditorList.innerHTML = `<p class="empty-upload">尚未新增規格。請點「新增規格」。</p>`;
    return;
  }

  variantEditorList.innerHTML = pendingVariants.map((variant, index) => `
    <article class="variant-editor-card">
      <div class="variant-editor-head">
        <strong>規格 ${index + 1}</strong>
        <button type="button" data-remove-variant="${index}">刪除規格</button>
      </div>
      <div class="form-grid">
        <label>
          SKU 編號
          <input type="text" data-variant-field="sku" data-variant-index="${index}" value="${escapeHtml(variant.sku)}" placeholder="例：DL-65W-BK">
        </label>
        <label>
          規格名稱
          <input type="text" data-variant-field="name" data-variant-index="${index}" value="${escapeHtml(variant.name)}" placeholder="例：顏色">
        </label>
      </div>
      <div class="form-grid">
        <label>
          規格值
          <input type="text" data-variant-field="value" data-variant-index="${index}" value="${escapeHtml(variant.value)}" placeholder="例：霧黑色">
        </label>
        <label>
          SKU 基礎售價 NT$
          <input type="number" min="0" step="1" data-variant-field="price" data-variant-index="${index}" value="${Number(variant.price) || ""}">
        </label>
        <label>
          SKU 劃線原價 NT$
          <input type="number" min="0" step="1" data-variant-field="originalPrice" data-variant-index="${index}" value="${Number(variant.originalPrice) || ""}">
        </label>
        <label>
          SKU 折扣（%）
          <input type="number" min="0" max="95" step="1" data-variant-field="discount" data-variant-index="${index}" value="${normalizeDiscount(variant.discount) || ""}" placeholder="例：20">
        </label>
      </div>
      <output class="variant-discount-result" data-variant-discount-result="${index}">
        ${variant.discount
          ? `折扣 ${normalizeDiscount(variant.discount)}% · 顧客實付 ${formatCurrency(getVariantPricing(variant).salePrice)}`
          : `未設定折扣 · 顧客實付 ${formatCurrency(getVariantPricing(variant).salePrice)}`}
      </output>
      <label>
        產品連結
        <input type="url" data-variant-field="link" data-variant-index="${index}" value="${escapeHtml(variant.link)}" placeholder="https://example.com/buy">
      </label>
      <div class="variant-image-row">
        <label class="upload-box">
          上傳規格圖
          <input type="file" accept="image/*" data-variant-image="${index}">
        </label>
        <div class="variant-image-preview">
          ${variant.image
            ? `<img src="${escapeHtml(variant.image)}" alt="${escapeHtml(variant.name || "規格圖")}">`
            : `<span>尚未上傳規格圖</span>`}
        </div>
      </div>
    </article>
  `).join("");
}

function resetForm() {
  form.reset();
  fields.id.value = "";
  pendingMainImages = [];
  pendingDetailImages = [];
  pendingVideos = [];
  pendingVariants = [];
  mainImagesInput.value = "";
  detailImagesInput.value = "";
  videoInput.value = "";
  videoUrlInput.value = "";
  formTitle.textContent = "新增商品";
  renderMainImagePreview();
  renderDetailImagePreview();
  renderVideoPreview();
  renderVariantEditor();
}

function readFormProduct() {
  const videos = getAllVideosForPreview().map(normalizeVideo);
  const variants = pendingVariants.map(normalizeVariant).filter((variant) => variant.name || variant.value || variant.price || variant.discount || variant.link || variant.image);
  const variantPrices = variants.map((variant) => getVariantPricing(variant).salePrice).filter((price) => price > 0);
  const basePrice = Number(fields.price.value) || (variantPrices.length ? Math.min(...variantPrices) : 0);

  return normalizeProduct({
    id: fields.id.value || createProductId(),
    name: fields.name.value.trim(),
    category: fields.category.value,
    brand: fields.brand.value.trim(),
    price: basePrice,
    originalPrice: Number(fields.originalPrice.value),
    badge: fields.badge.value.trim(),
    desc: fields.desc.value.trim(),
    mark: fields.mark.value.trim() || fields.name.value.trim().slice(0, 2),
    images: pendingMainImages,
    detailImages: pendingDetailImages,
    videos,
    variants
  });
}

function fillForm(product) {
  const normalizedProduct = normalizeProduct(product);
  const urlVideo = normalizedProduct.videos.find((video) => video.type === "url");

  fields.id.value = normalizedProduct.id;
  fields.name.value = normalizedProduct.name;
  fields.category.value = normalizedProduct.category;
  fields.brand.value = normalizedProduct.brand;
  fields.price.value = normalizedProduct.price;
  fields.originalPrice.value = normalizedProduct.originalPrice;
  fields.badge.value = normalizedProduct.badge;
  fields.mark.value = normalizedProduct.mark || "";
  fields.desc.value = normalizedProduct.desc;
  pendingMainImages = [...normalizedProduct.images];
  pendingDetailImages = [...normalizedProduct.detailImages];
  pendingVideos = normalizedProduct.videos.filter((video) => video.type !== "url");
  pendingVariants = [...normalizedProduct.variants];
  videoUrlInput.value = urlVideo ? urlVideo.src : "";
  formTitle.textContent = "編輯商品";
  renderMainImagePreview();
  renderDetailImagePreview();
  renderVideoPreview();
  renderVariantEditor();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function deleteProduct(productId) {
  const product = products.find((item) => item.id === productId);
  if (!product) return;

  const confirmed = confirm(`確定要刪除「${product.name}」嗎？`);
  if (!confirmed) return;

  products = products.filter((item) => item.id !== productId);
  saveProducts();
  renderProductList();
  resetForm();
}

function renderProductList() {
  adminSummary.textContent = `目前 ${products.length} 件商品`;

  if (!products.length) {
    productList.innerHTML = `
      <tr>
        <td colspan="5">目前沒有商品，請先新增一筆。</td>
      </tr>
    `;
    return;
  }

  productList.innerHTML = products.map((product) => {
    const normalizedProduct = normalizeProduct(product);
    const coverImage = normalizedProduct.images[0] || normalizedProduct.variants.find((variant) => variant.image)?.image;

    return `
      <tr>
        <td>
          <div class="admin-product-name">
            <span>
              ${coverImage
                ? `<img src="${escapeHtml(coverImage)}" alt="${escapeHtml(normalizedProduct.name)}">`
                : escapeHtml(normalizedProduct.mark || "無圖")}
            </span>
            <div>
              <strong>${escapeHtml(normalizedProduct.name)}</strong>
              <small>${escapeHtml(normalizedProduct.brand)}</small>
            </div>
          </div>
        </td>
        <td>${escapeHtml(normalizedProduct.category)}</td>
        <td>${formatCurrency(getDisplayPrice(normalizedProduct))}</td>
        <td>${normalizedProduct.images.length} 主圖 / ${normalizedProduct.detailImages.length} 詳情圖 / ${normalizedProduct.videos.length} 影片 / ${normalizedProduct.variants.length} 規格</td>
        <td>
          <div class="table-actions">
            <a href="product.html?id=${encodeURIComponent(normalizedProduct.id)}">預覽</a>
            <button type="button" data-action="edit" data-id="${normalizedProduct.id}">編輯</button>
            <button type="button" data-action="delete" data-id="${normalizedProduct.id}">刪除</button>
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

function exportProducts() {
  const blob = new Blob([JSON.stringify(products.map(normalizeProduct), null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "good-life-products.json";
  link.click();
  URL.revokeObjectURL(url);
}

function importProducts(file) {
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const importedProducts = JSON.parse(reader.result);
      if (!Array.isArray(importedProducts)) {
        showNotice("匯入檔案格式不正確。", "error");
        return;
      }

      products = importedProducts
        .filter((product) => product && product.id && product.name)
        .map(normalizeProduct);
      saveProducts();
      renderProductList();
      resetForm();
      showNotice("商品資料已匯入。", "success");
    } catch (error) {
      showNotice("JSON 解析失敗，請確認檔案內容。", "error");
    }
  };
  reader.readAsText(file);
}

mainImagesInput.addEventListener("change", async () => {
  try {
    await processMainImages(mainImagesInput.files);
  } catch (error) {
    showNotice("主圖處理失敗，請換一張圖片再試。", "error");
  } finally {
    mainImagesInput.value = "";
  }
});

detailImagesInput.addEventListener("change", async () => {
  try {
    await processDetailImages(detailImagesInput.files);
  } catch (error) {
    showNotice("詳情頁圖片處理失敗，請換一張圖片再試。", "error");
  } finally {
    detailImagesInput.value = "";
  }
});

videoInput.addEventListener("change", async () => {
  try {
    await processVideos(videoInput.files);
  } catch (error) {
    showNotice("影片處理失敗，請改用網址或較小的影片檔。", "error");
  } finally {
    videoInput.value = "";
  }
});

videoUrlInput.addEventListener("input", renderVideoPreview);

mainImagePreview.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-remove-main]");
  if (!button) return;

  pendingMainImages.splice(Number(button.dataset.removeMain), 1);
  renderMainImagePreview();
});

detailImagePreview.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-remove-detail]");
  if (!button) return;

  pendingDetailImages.splice(Number(button.dataset.removeDetail), 1);
  renderDetailImagePreview();
});

videoPreview.addEventListener("click", (event) => {
  const removeButton = event.target.closest("button[data-remove-video]");
  const clearUrlButton = event.target.closest("button[data-clear-video-url]");

  if (removeButton) {
    pendingVideos.splice(Number(removeButton.dataset.removeVideo), 1);
    renderVideoPreview();
  }

  if (clearUrlButton) {
    videoUrlInput.value = "";
    renderVideoPreview();
  }
});

addVariantButton.addEventListener("click", () => {
  pendingVariants.push(normalizeVariant({ name: "規格", value: "", price: fields.price.value || 0, originalPrice: fields.originalPrice.value || 0, discount: 0 }));
  renderVariantEditor();
});

function updateVariantDiscountPreview(index) {
  const output = variantEditorList.querySelector(`[data-variant-discount-result="${index}"]`);
  const variant = pendingVariants[index];
  if (!output || !variant) return;

  const pricing = getVariantPricing(variant);
  output.textContent = pricing.discount
    ? `折扣 ${pricing.discount}% · 顧客實付 ${formatCurrency(pricing.salePrice)}`
    : `未設定折扣 · 顧客實付 ${formatCurrency(pricing.salePrice)}`;
}

variantEditorList.addEventListener("input", (event) => {
  const field = event.target.dataset.variantField;
  const index = Number(event.target.dataset.variantIndex);
  if (!field || Number.isNaN(index) || !pendingVariants[index]) return;

  pendingVariants[index][field] = field === "price" || field === "originalPrice" || field === "discount"
    ? Number(event.target.value)
    : event.target.value;
  if (field === "price" || field === "originalPrice" || field === "discount") updateVariantDiscountPreview(index);
});

variantEditorList.addEventListener("change", async (event) => {
  const input = event.target.closest("input[data-variant-image]");
  if (!input) return;

  const index = Number(input.dataset.variantImage);
  const file = input.files[0];
  if (!file || !pendingVariants[index]) return;

  try {
    pendingVariants[index].image = await resizeImage(file, {
      maxWidth: 900,
      maxHeight: 900,
      square: true,
      quality: 0.86
    });
    renderVariantEditor();
  } catch (error) {
    showNotice("規格圖處理失敗，請換一張圖片再試。", "error");
  }
});

variantEditorList.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-remove-variant]");
  if (!button) return;

  pendingVariants.splice(Number(button.dataset.removeVariant), 1);
  renderVariantEditor();
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const product = readFormProduct();

  if (!product.name || !product.brand || !product.desc) {
    showNotice("請完整填寫商品資料。", "error");
    return;
  }

  const existingIndex = products.findIndex((item) => item.id === product.id);
  if (existingIndex >= 0) {
    products[existingIndex] = product;
  } else {
    products.unshift(product);
  }

  saveProducts();
  renderProductList();
  resetForm();
});

productList.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const product = products.find((item) => item.id === button.dataset.id);
  if (button.dataset.action === "edit" && product) fillForm(product);
  if (button.dataset.action === "delete") deleteProduct(button.dataset.id);
});

clearFormButton.addEventListener("click", resetForm);

resetButton.addEventListener("click", () => {
  const confirmed = confirm("確定要還原預設商品嗎？目前自訂商品會被覆蓋。");
  if (!confirmed) return;

  products = defaultProducts.map(normalizeProduct);
  saveProducts();
  renderProductList();
  resetForm();
});

exportButton.addEventListener("click", exportProducts);
importInput.addEventListener("change", () => importProducts(importInput.files[0]));

renderProductList();
renderMainImagePreview();
renderDetailImagePreview();
renderVideoPreview();
renderVariantEditor();

// --- V2 Extensions: SaaS Dashboard Tabs, SVG Charts & Orders Management ---
const ordersStorageKey = "tr_orders_v1";

function getOrders() {
  try {
    const saved = localStorage.getItem(ordersStorageKey);
    if (saved) return JSON.parse(saved);
  } catch (e) {}

  return [
    { id: "TR-2026-94812", date: "2026/08/07 14:22", items: [{ name: "180cm 落地自動開腳架", quantity: 1, price: 978 }], total: 978, status: "待處理" },
    { id: "TR-2026-94790", date: "2026/08/07 11:05", items: [{ name: "65W 三孔快充充電器", quantity: 2, price: 169 }], total: 338, status: "處理中" },
    { id: "TR-2026-94755", date: "2026/08/06 18:40", items: [{ name: "主動降噪藍牙耳機", quantity: 1, price: 399 }], total: 399, status: "已發貨" },
    { id: "TR-2026-94611", date: "2026/08/05 09:15", items: [{ name: "6L 智慧除濕機", quantity: 1, price: 899 }], total: 899, status: "已完成" }
  ];
}

function saveOrders(orders) {
  localStorage.setItem(ordersStorageKey, JSON.stringify(orders));
  updateDashboardKPIs();
}

function initAdminTabs() {
  const tabButtons = document.querySelectorAll("[data-admin-tab]");
  const tabContents = document.querySelectorAll(".admin-tab-content");
  const tabTitle = document.querySelector("#tab-title");
  const tabDesc = document.querySelector("#tab-desc");

  const titles = {
    dashboard: { title: "儀表板概覽", desc: "即時掌握商店銷售狀況、庫存資產與熱銷品類。" },
    products: { title: "商品管理工作台", desc: "集中管理商品資料、媒體、SKU 折扣、價格與外部購買連結。" },
    orders: { title: "訂單履約中心", desc: "查看前台顧客訂單，管理發貨狀態與履約流程。" },
    analytics: { title: "數據分析與備份", desc: "數據導出備份與原廠資料恢復。" }
  };

  tabButtons.forEach(button => {
    button.addEventListener("click", () => {
      const targetTab = button.dataset.adminTab;
      tabButtons.forEach(b => b.classList.toggle("is-active", b === button));
      tabContents.forEach(c => c.hidden = c.id !== `tab-content-${targetTab}`);

      if (titles[targetTab]) {
        tabTitle.textContent = titles[targetTab].title;
        tabDesc.textContent = titles[targetTab].desc;
      }

      if (targetTab === "dashboard") updateDashboardKPIs();
      if (targetTab === "orders") renderOrdersList();
    });
  });
}

function updateDashboardKPIs() {
  const orders = getOrders();
  const kpiProductTotal = document.querySelector("#kpi-product-total");
  const kpiCatalogValue = document.querySelector("#kpi-catalog-value");
  const kpiOrdersCount = document.querySelector("#kpi-orders-count");
  const kpiAvgPrice = document.querySelector("#kpi-avg-price");
  const navProductCount = document.querySelector("#nav-product-count");
  const navOrderCount = document.querySelector("#nav-order-count");

  if (navProductCount) navProductCount.textContent = products.length;
  if (navOrderCount) navOrderCount.textContent = orders.length;

  if (kpiProductTotal) kpiProductTotal.textContent = products.length;

  const totalValue = products.reduce((sum, p) => sum + (Number(p.price) || 0), 0);
  if (kpiCatalogValue) kpiCatalogValue.textContent = formatCurrency(totalValue);
  if (kpiOrdersCount) kpiOrdersCount.textContent = orders.length;

  const avg = products.length ? Math.round(totalValue / products.length) : 0;
  if (kpiAvgPrice) kpiAvgPrice.textContent = formatCurrency(avg);

  renderSalesChart();
  renderCategoryChart();
}

function renderSalesChart() {
  const box = document.querySelector("#sales-chart-box");
  if (!box) return;

  const data = [1200, 1800, 1500, 2400, 3100, 2800, 4200, 3900, 5100, 4800, 6200, 5800, 7400, 8900, 9500];
  const max = Math.max(...data);

  box.innerHTML = data.map((val, i) => {
    const heightPct = Math.round((val / max) * 100);
    return `
      <div style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 8px; height: 100%; justify-content: flex-end;">
        <div style="width: 100%; max-width: 18px; height: ${heightPct}%; background: ${i === data.length - 1 ? "var(--brand)" : "#242b3b"}; border-radius: 4px; transition: height 0.4s ease;" title="NT$ ${val}"></div>
        <span style="font-size: 9px; color: #64748b;">8/${i + 1}</span>
      </div>
    `;
  }).join("");
}

function renderCategoryChart() {
  const box = document.querySelector("#category-chart-box");
  if (!box) return;

  const counts = {};
  products.forEach(p => {
    const cat = p.category || "自拍腳架";
    counts[cat] = (counts[cat] || 0) + 1;
  });

  const colors = ["#d7ff3f", "#60a5fa", "#c084fc", "#4ade80", "#f59e0b"];
  const categories = Object.keys(counts);
  const total = products.length || 1;

  box.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 12px; width: 100%;">
      ${categories.map((cat, i) => {
        const pct = Math.round((counts[cat] / total) * 100);
        const color = colors[i % colors.length];
        return `
          <div>
            <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px;">
              <span style="color: #f8fafc; font-weight: 600;">${escapeHtml(cat)}</span>
              <span style="color: #94a3b8;">${counts[cat]} 件 (${pct}%)</span>
            </div>
            <div style="height: 8px; background: #0f1115; border-radius: 99px; overflow: hidden;">
              <div style="width: ${pct}%; height: 100%; background: ${color}; border-radius: 99px;"></div>
            </div>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

function renderOrdersList() {
  const tbody = document.querySelector("#admin-orders-list");
  if (!tbody) return;

  const orders = getOrders();
  if (!orders.length) {
    tbody.innerHTML = `<tr><td colspan="5" style="padding: 24px; text-align: center; color: #64748b;">目前尚無訂單記錄</td></tr>`;
    return;
  }

  tbody.innerHTML = orders.map((order, idx) => `
    <tr style="border-bottom: 1px solid #242b3b;">
      <td style="padding: 12px; font-weight: 700; color: #f8fafc;">${escapeHtml(order.id)}</td>
      <td style="padding: 12px; color: #94a3b8; font-size: 12px;">${escapeHtml(order.date)}</td>
      <td style="padding: 12px; color: #cbd5e1;">
        ${order.items.map(i => `${escapeHtml(i.name)} × ${i.quantity}`).join(", ")}
      </td>
      <td style="padding: 12px; font-weight: 700; color: var(--brand);">${formatCurrency(order.total)}</td>
      <td style="padding: 12px;">
        <select data-order-idx="${idx}" class="status-pill status-${order.status === "待處理" ? "pending" : order.status === "處理中" ? "processing" : order.status === "已發貨" ? "shipped" : "completed"}" style="background: #161922; border: 1px solid #242b3b; color: inherit; cursor: pointer;">
          <option value="待處理" ${order.status === "待處理" ? "selected" : ""}>待處理</option>
          <option value="處理中" ${order.status === "處理中" ? "selected" : ""}>處理中</option>
          <option value="已發貨" ${order.status === "已發貨" ? "selected" : ""}>已發貨</option>
          <option value="已完成" ${order.status === "已完成" ? "selected" : ""}>已完成</option>
        </select>
      </td>
    </tr>
  `).join("");

  tbody.querySelectorAll("select[data-order-idx]").forEach(sel => {
    sel.addEventListener("change", (e) => {
      const idx = Number(e.target.dataset.orderIdx);
      orders[idx].status = e.target.value;
      saveOrders(orders);
      showNotice(`訂單 ${orders[idx].id} 狀態已更新為「${e.target.value}」`, "success");
    });
  });
}

initAdminTabs();
updateDashboardKPIs();
