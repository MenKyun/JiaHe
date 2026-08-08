let editorContent = loadSiteContent();

const form = document.querySelector("#visual-editor-form");
const preview = document.querySelector("#visual-preview");
const saveStatus = document.querySelector("#save-status");
const saveButtons = [
  document.querySelector("#save-content"),
  document.querySelector("#save-content-bottom")
];
const resetButton = document.querySelector("#reset-content");
const customBlocksEditor = document.querySelector("#custom-blocks-editor");
const heroSlidesEditor = document.querySelector("#hero-slides-editor");
const addHeroSlideButton = document.querySelector("#add-hero-slide");
let noticeTimer;

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

function getValueByPath(target, path) {
  return path.split(".").reduce((value, key) => value?.[key], target);
}

function setValueByPath(target, path, value) {
  const parts = path.split(".");
  const lastKey = parts.pop();
  const parent = parts.reduce((object, key) => object[key], target);
  parent[lastKey] = value;
}

function ensureCustomBlocks() {
  if (!Array.isArray(editorContent.customBlocks)) editorContent.customBlocks = [];
}

function ensureHeroSlides() {
  if (!editorContent.hero || typeof editorContent.hero !== "object") editorContent.hero = {};
  if (!Array.isArray(editorContent.hero.slides) || !editorContent.hero.slides.length) {
    editorContent.hero.slides = structuredClone(defaultSiteContent.hero.slides);
  }
}

function createHeroSlide() {
  return {
    image: "",
    alt: "首頁主視覺",
    position: "center"
  };
}

function renderHeroSlidesEditor() {
  ensureHeroSlides();
  addHeroSlideButton.disabled = editorContent.hero.slides.length >= 5;

  heroSlidesEditor.innerHTML = editorContent.hero.slides.map((slide, index) => {
    const imageUrl = safeSiteMediaUrl(slide.image);
    return `
      <fieldset class="hero-slide-editor-card" data-hero-slide-index="${index}">
        <div class="hero-slide-editor-head">
          <legend>主圖 ${index + 1}${index === 0 ? " · 首張" : ""}</legend>
          <div>
            <button type="button" data-hero-slide-action="up" data-hero-slide-index="${index}" ${index === 0 ? "disabled" : ""}>上移</button>
            <button type="button" data-hero-slide-action="down" data-hero-slide-index="${index}" ${index === editorContent.hero.slides.length - 1 ? "disabled" : ""}>下移</button>
            <button type="button" data-hero-slide-action="remove" data-hero-slide-index="${index}">移除</button>
          </div>
        </div>
        <div class="hero-slide-editor-body">
          <div class="hero-slide-editor-preview">
            ${imageUrl ? `<img src="${imageUrl}" alt="${escapeSiteHtml(slide.alt || `主圖 ${index + 1}`)}">` : `<span>尚未設定圖片</span>`}
          </div>
          <div>
            <label>直接上傳
              <input type="file" accept="image/*" data-hero-slide-image="${index}">
            </label>
            <label>圖片網址
              <input type="text" data-hero-slide-field="image" data-hero-slide-index="${index}" value="${escapeSiteHtml(slide.image)}" placeholder="https://... 或 assets/hero.jpg">
            </label>
            <label>圖片替代文字
              <input type="text" data-hero-slide-field="alt" data-hero-slide-index="${index}" value="${escapeSiteHtml(slide.alt)}">
            </label>
            <label>畫面焦點
              <select data-hero-slide-field="position" data-hero-slide-index="${index}">
                <option value="left" ${slide.position === "left" ? "selected" : ""}>靠左</option>
                <option value="center" ${slide.position !== "left" && slide.position !== "right" ? "selected" : ""}>置中</option>
                <option value="right" ${slide.position === "right" ? "selected" : ""}>靠右</option>
              </select>
            </label>
          </div>
        </div>
      </fieldset>
    `;
  }).join("");
}

function createCustomBlock(type) {
  return {
    id: `block-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    type,
    layout: "image-right",
    eyebrow: "",
    title: type === "image" ? "新增圖片區塊" : "新增文字區塊",
    copy: "",
    image: "",
    imageAlt: "",
    linkText: "",
    linkUrl: "#products"
  };
}

function renderRepeater(containerId, items, fieldPrefix, labels) {
  const container = document.querySelector(containerId);
  container.innerHTML = items.map((item, index) => `
    <fieldset class="editor-repeater-item">
      <legend>${labels.legend} ${index + 1}</legend>
      ${labels.fields.map((field) => `
        <label>${field.label}
          <input data-field="${fieldPrefix}.${index}.${field.key}" type="text" value="${escapeSiteHtml(item[field.key])}">
        </label>
      `).join("")}
    </fieldset>
  `).join("");
}

function renderCustomBlocksEditor() {
  ensureCustomBlocks();

  if (!editorContent.customBlocks.length) {
    customBlocksEditor.innerHTML = `<p class="empty-editor-note">尚未新增自訂區塊，可先新增文字、圖片或圖文區塊。</p>`;
    return;
  }

  customBlocksEditor.innerHTML = editorContent.customBlocks.map((block, index) => {
    const imageUrl = safeSiteMediaUrl(block.image);
    const showImageFields = block.type !== "text";
    const showLayoutField = block.type === "textImage";

    return `
      <fieldset class="custom-block-editor-card" data-block-index="${index}">
        <div class="custom-block-editor-head">
          <legend>自訂區塊 ${index + 1}</legend>
          <button type="button" data-remove-block="${index}">刪除</button>
        </div>

        <div class="form-grid">
          <label>區塊類型
            <select data-block-field="type" data-block-index="${index}">
              <option value="text" ${block.type === "text" ? "selected" : ""}>純文字</option>
              <option value="image" ${block.type === "image" ? "selected" : ""}>純圖片</option>
              <option value="textImage" ${block.type === "textImage" ? "selected" : ""}>圖文混排</option>
            </select>
          </label>
          <label ${showLayoutField ? "" : "hidden"}>圖文排列
            <select data-block-field="layout" data-block-index="${index}">
              <option value="image-right" ${block.layout !== "image-left" ? "selected" : ""}>圖片在右</option>
              <option value="image-left" ${block.layout === "image-left" ? "selected" : ""}>圖片在左</option>
            </select>
          </label>
        </div>

        <label>小標
          <input data-block-field="eyebrow" data-block-index="${index}" type="text" value="${escapeSiteHtml(block.eyebrow)}">
        </label>
        <label>標題
          <input data-block-field="title" data-block-index="${index}" type="text" value="${escapeSiteHtml(block.title)}">
        </label>
        <label>文字內容
          <textarea data-block-field="copy" data-block-index="${index}" rows="4">${escapeSiteHtml(block.copy)}</textarea>
        </label>

        <div class="custom-block-image-fields" ${showImageFields ? "" : "hidden"}>
          <div class="block-image-row">
            <div class="block-image-preview">
              ${imageUrl ? `<img src="${imageUrl}" alt="${escapeSiteHtml(block.imageAlt || block.title || "自訂圖片")}">` : `<span>尚未上傳圖片</span>`}
            </div>
            <div>
              <label>上傳圖片
                <input data-block-image="${index}" type="file" accept="image/*">
              </label>
              <label>圖片網址
                <input data-block-field="image" data-block-index="${index}" type="text" value="${escapeSiteHtml(block.image)}" placeholder="可貼上圖片網址，或直接上傳圖片">
              </label>
              <label>圖片替代文字
                <input data-block-field="imageAlt" data-block-index="${index}" type="text" value="${escapeSiteHtml(block.imageAlt)}">
              </label>
            </div>
          </div>
        </div>

        <div class="form-grid">
          <label>按鈕文字
            <input data-block-field="linkText" data-block-index="${index}" type="text" value="${escapeSiteHtml(block.linkText)}" placeholder="留空則不顯示按鈕">
          </label>
          <label>按鈕連結
            <input data-block-field="linkUrl" data-block-index="${index}" type="text" value="${escapeSiteHtml(block.linkUrl)}">
          </label>
        </div>
      </fieldset>
    `;
  }).join("");
}

function fillForm() {
  ensureCustomBlocks();
  ensureHeroSlides();

  form.querySelectorAll("[data-field]").forEach((input) => {
    const value = getValueByPath(editorContent, input.dataset.field);
    if (input.type === "checkbox") {
      input.checked = Boolean(value);
    } else {
      input.value = value ?? "";
    }
  });

  renderRepeater("#services-editor", editorContent.services, "services", {
    legend: "服務",
    fields: [
      { key: "title", label: "標題" },
      { key: "desc", label: "說明" }
    ]
  });

  renderRepeater("#categories-editor", editorContent.categories, "categories", {
    legend: "分類",
    fields: [
      { key: "title", label: "分類名稱" },
      { key: "desc", label: "分類描述" }
    ]
  });

  renderRepeater("#member-stats-editor", editorContent.member.stats, "member.stats", {
    legend: "會員數據",
    fields: [
      { key: "value", label: "數值" },
      { key: "label", label: "說明" }
    ]
  });

  renderRepeater("#footer-links-editor", editorContent.footer.links, "footer.links", {
    legend: "連結",
    fields: [
      { key: "text", label: "文字" },
      { key: "url", label: "網址" }
    ]
  });

  renderHeroSlidesEditor();
  renderCustomBlocksEditor();
}

function renderPreviewCustomBlocks(blocks = []) {
  const visibleBlocks = blocks.filter((block) => block?.title || block?.eyebrow || block?.copy || block?.image || block?.linkText);
  if (!visibleBlocks.length) return "";

  return `
    <section class="preview-custom-blocks">
      ${visibleBlocks.map((block) => {
        const imageUrl = safeSiteMediaUrl(block.image);
        const layout = block.layout === "image-left" ? "is-image-left" : "is-image-right";
        const textHtml = `
          <div>
            ${block.eyebrow ? `<p class="eyebrow">${escapeSiteHtml(block.eyebrow)}</p>` : ""}
            ${block.title ? `<h3>${escapeSiteHtml(block.title)}</h3>` : ""}
            ${block.copy ? `<p>${escapeSiteHtml(block.copy)}</p>` : ""}
            ${block.linkText ? `<span class="preview-button-primary">${escapeSiteHtml(block.linkText)}</span>` : ""}
          </div>
        `;
        const imageHtml = imageUrl ? `
          <figure>
            <img src="${imageUrl}" alt="${escapeSiteHtml(block.imageAlt || block.title || "自訂圖片")}">
          </figure>
        ` : "";

        if (block.type === "image") return `<article class="preview-custom-block is-image">${imageHtml}${textHtml}</article>`;
        if (block.type === "text") return `<article class="preview-custom-block is-text">${textHtml}</article>`;
        return `<article class="preview-custom-block is-text-image ${layout}">${layout === "is-image-left" ? imageHtml + textHtml : textHtml + imageHtml}</article>`;
      }).join("")}
    </section>
  `;
}

function renderPreview() {
  const content = editorContent;
  ensureHeroSlides();
  const previewHeroImage = safeSiteMediaUrl(content.hero.slides.find((slide) => safeSiteMediaUrl(slide.image))?.image);
  preview.style.setProperty("--brand", content.theme.brand);
  preview.style.setProperty("--brand-dark", content.theme.brandDark);
  preview.style.setProperty("--accent", content.theme.accent);
  preview.style.setProperty("--gold", content.theme.gold);

  preview.innerHTML = `
    <div class="preview-promo">
      <span>${escapeSiteHtml(content.promo.label)}</span>
      <strong>${escapeSiteHtml(content.promo.text)}</strong>
      <em>${escapeSiteHtml(content.promo.linkText)}</em>
    </div>
    <div class="preview-header">
      <div class="logo">
        <span class="logo-mark">${escapeSiteHtml(content.brand.logoMark)}</span>
        <span>
          <strong>${escapeSiteHtml(content.brand.name)}</strong>
          <small>${escapeSiteHtml(content.brand.tagline)}</small>
        </span>
      </div>
      <div class="preview-search">${escapeSiteHtml(content.brand.searchPlaceholder)}</div>
    </div>
    <section class="preview-hero">
      ${previewHeroImage ? `<img class="preview-hero-image" src="${previewHeroImage}" alt="">` : ""}
      <div>
        <p class="eyebrow">${escapeSiteHtml(content.hero.eyebrow)}</p>
        <h3>${escapeSiteHtml(content.hero.title)}</h3>
        <p>${escapeSiteHtml(content.hero.copy)}</p>
        <div>
          <span class="preview-button-primary">${escapeSiteHtml(content.hero.primaryText)}</span>
          <span class="preview-button-secondary">${escapeSiteHtml(content.hero.secondaryText)}</span>
        </div>
      </div>
      <aside>
        <span>${escapeSiteHtml(content.hero.mainDealLabel)}</span>
        <strong>${escapeSiteHtml(content.hero.mainDealTitle)}</strong>
        <em>${escapeSiteHtml(content.hero.mainDealSub)}</em>
      </aside>
    </section>
    <section class="preview-services">
      ${content.services.map((service) => `
        <article>
          <strong>${escapeSiteHtml(service.title)}</strong>
          <span>${escapeSiteHtml(service.desc)}</span>
        </article>
      `).join("")}
    </section>
    <section class="preview-campaign">
      <p class="eyebrow">${escapeSiteHtml(content.campaign.eyebrow)}</p>
      <h3>${escapeSiteHtml(content.campaign.title)}</h3>
      <p>${escapeSiteHtml(content.campaign.copy)}</p>
    </section>
    ${renderPreviewCustomBlocks(content.customBlocks)}
    <section class="preview-categories">
      <p class="eyebrow">${escapeSiteHtml(content.categorySection.eyebrow)}</p>
      <h3>${escapeSiteHtml(content.categorySection.title)}</h3>
      <p>${escapeSiteHtml(content.categorySection.copy)}</p>
      <div>
        ${content.categories.map((category) => `
          <article>
            <strong>${escapeSiteHtml(category.title)}</strong>
            <span>${escapeSiteHtml(category.desc)}</span>
          </article>
        `).join("")}
      </div>
    </section>
    <section class="preview-member">
      <p class="eyebrow">${escapeSiteHtml(content.member.eyebrow)}</p>
      <h3>${escapeSiteHtml(content.member.title)}</h3>
      <p>${escapeSiteHtml(content.member.copy)}</p>
      <div>
        ${content.member.stats.map((stat) => `
          <article><strong>${escapeSiteHtml(stat.value)}</strong><span>${escapeSiteHtml(stat.label)}</span></article>
        `).join("")}
      </div>
    </section>
  `;
}

function readImageAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("圖片讀取失敗"));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => resolve(reader.result);
      image.onload = () => {
        const maxSize = 1600;
        const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const context = canvas.getContext("2d");

        if (!context) {
          resolve(reader.result);
          return;
        }

        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.88));
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function markUnsaved() {
  saveStatus.textContent = "尚未儲存";
  saveStatus.classList.remove("is-saved");
}

function markSaved() {
  saveStatus.textContent = "已儲存";
  saveStatus.classList.add("is-saved");
}

function updateCustomBlock(index, field, value) {
  ensureCustomBlocks();
  if (!editorContent.customBlocks[index]) return;
  editorContent.customBlocks[index][field] = value;
  renderPreview();
  markUnsaved();
}

form.addEventListener("input", (event) => {
  const heroSlideField = event.target.dataset.heroSlideField;
  if (heroSlideField) {
    const index = Number(event.target.dataset.heroSlideIndex);
    if (!editorContent.hero.slides[index]) return;
    editorContent.hero.slides[index][heroSlideField] = event.target.value;
    renderPreview();
    markUnsaved();
    return;
  }

  const blockField = event.target.dataset.blockField;
  if (blockField) {
    updateCustomBlock(Number(event.target.dataset.blockIndex), blockField, event.target.value);
    return;
  }

  const field = event.target.dataset.field;
  if (!field) return;

  const value = event.target.type === "checkbox" ? event.target.checked : event.target.value;
  setValueByPath(editorContent, field, value);
  renderPreview();
  markUnsaved();
});

form.addEventListener("change", async (event) => {
  const heroSlideImageIndex = event.target.dataset.heroSlideImage;
  if (heroSlideImageIndex !== undefined) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const imageData = await readImageAsDataUrl(file);
      editorContent.hero.slides[Number(heroSlideImageIndex)].image = imageData;
      renderHeroSlidesEditor();
      renderPreview();
      markUnsaved();
    } catch (error) {
      showNotice("主視覺上傳失敗，請換一張圖片再試。", "error");
      console.error(error);
    }
    return;
  }

  const blockField = event.target.dataset.blockField;
  if (blockField) {
    updateCustomBlock(Number(event.target.dataset.blockIndex), blockField, event.target.value);
    renderCustomBlocksEditor();
    return;
  }

  const imageIndex = event.target.dataset.blockImage;
  if (imageIndex === undefined) return;

  const file = event.target.files?.[0];
  if (!file) return;

  try {
    const imageData = await readImageAsDataUrl(file);
    updateCustomBlock(Number(imageIndex), "image", imageData);
    renderCustomBlocksEditor();
  } catch (error) {
    showNotice("圖片上傳失敗，請換一張圖片再試。", "error");
    console.error(error);
  }
});

form.addEventListener("click", (event) => {
  const heroSlideButton = event.target.closest("button[data-hero-slide-action]");
  if (heroSlideButton) {
    const action = heroSlideButton.dataset.heroSlideAction;
    const index = Number(heroSlideButton.dataset.heroSlideIndex);
    const slides = editorContent.hero.slides;

    if (action === "remove") {
      if (slides.length === 1) {
        slides[0] = createHeroSlide();
      } else {
        slides.splice(index, 1);
      }
    }
    if (action === "up" && index > 0) [slides[index - 1], slides[index]] = [slides[index], slides[index - 1]];
    if (action === "down" && index < slides.length - 1) [slides[index + 1], slides[index]] = [slides[index], slides[index + 1]];

    renderHeroSlidesEditor();
    renderPreview();
    markUnsaved();
    return;
  }

  const removeIndex = event.target.dataset.removeBlock;
  if (removeIndex === undefined) return;

  editorContent.customBlocks.splice(Number(removeIndex), 1);
  renderCustomBlocksEditor();
  renderPreview();
  markUnsaved();
});

document.querySelector("#add-text-block").addEventListener("click", () => {
  ensureCustomBlocks();
  editorContent.customBlocks.push(createCustomBlock("text"));
  renderCustomBlocksEditor();
  renderPreview();
  markUnsaved();
});

addHeroSlideButton.addEventListener("click", () => {
  ensureHeroSlides();
  if (editorContent.hero.slides.length >= 5) {
    showNotice("首頁主圖最多 5 張。", "error");
    return;
  }

  editorContent.hero.slides.push(createHeroSlide());
  renderHeroSlidesEditor();
  renderPreview();
  markUnsaved();
});

document.querySelector("#add-image-block").addEventListener("click", () => {
  ensureCustomBlocks();
  editorContent.customBlocks.push(createCustomBlock("image"));
  renderCustomBlocksEditor();
  renderPreview();
  markUnsaved();
});

document.querySelector("#add-text-image-block").addEventListener("click", () => {
  ensureCustomBlocks();
  editorContent.customBlocks.push(createCustomBlock("textImage"));
  renderCustomBlocksEditor();
  renderPreview();
  markUnsaved();
});

saveButtons.forEach((button) => {
  button.addEventListener("click", () => {
    try {
      saveSiteContent(editorContent);
      markSaved();
      showNotice("首頁內容已儲存。", "success");
    } catch (error) {
      showNotice("儲存失敗，主圖檔案可能過大；請改用圖片網址或減少圖片。", "error");
    }
  });
});

resetButton.addEventListener("click", () => {
  const confirmed = confirm("確定要還原前台預設內容嗎？目前編輯內容會被覆蓋。");
  if (!confirmed) return;

  resetSiteContent();
  editorContent = loadSiteContent();
  fillForm();
  renderPreview();
  markSaved();
});

fillForm();
renderPreview();

const presetThemes = {
  cyberpunk: { brand: "#00ffcc", brandDark: "#0a0a12", accent: "#ff0055", gold: "#00e5ff" },
  luxury: { brand: "#d4af37", brandDark: "#111111", accent: "#d4af37", gold: "#f3e5ab" },
  emerald: { brand: "#34d399", brandDark: "#064e3b", accent: "#10b981", gold: "#a7f3d0" },
  obsidian: { brand: "#e2e8f0", brandDark: "#090a0f", accent: "#38bdf8", gold: "#94a3b8" },
  warm: { brand: "#c6d39f", brandDark: "#1d221e", accent: "#c6d39f", gold: "#b7b09d" }
};

document.querySelector("#preset-theme-select")?.addEventListener("change", (e) => {
  const presetKey = e.target.value;
  if (presetThemes[presetKey]) {
    editorContent.theme = { ...presetThemes[presetKey] };
    fillForm();
    renderPreview();
    markUnsaved();
    showNotice(`已套用「${e.target.options[e.target.selectedIndex].text}」配色方案`, "success");
  }
});
