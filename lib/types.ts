export type Variant = {
  id: string;
  sku: string;
  name: string;
  value: string;
  price: number;
  originalPrice: number;
  discount: number;
  stock: number;
  leadTime: string;
  image: string;
  link: string;
};

export type Product = {
  id: string;
  name: string;
  display_name: string;
  category: string;
  brand: string;
  price: number;
  original_price: number;
  badge: string;
  description: string;
  mark: string;
  source_product_id: string | null;
  source_category: string | null;
  images: string[];
  detail_images: string[];
  videos: Array<string | { src: string; type?: string }>;
  variants: Variant[];
  active: boolean;
  position: number;
  updated_at?: string;
};

export type HeroSlide = {
  image: string;
  alt: string;
  position: "left" | "center" | "right";
};

export type SiteContent = {
  theme: Record<string, string>;
  promo: Record<string, string>;
  utility: Record<string, string>;
  brand: Record<string, string>;
  categories: Array<{ title: string; desc: string }>;
  hero: {
    autoplay: boolean;
    interval: number;
    slides: HeroSlide[];
    eyebrow: string;
    title: string;
    copy: string;
    primaryText: string;
    primaryUrl: string;
    secondaryText: string;
    secondaryUrl: string;
    mainDealLabel: string;
    mainDealTitle: string;
    mainDealSub: string;
    miniDealLabel: string;
    miniDealTitle: string;
    miniDealSub: string;
  };
  services: Array<{ title: string; desc: string }>;
  campaign: Record<string, string>;
  categorySection: Record<string, string>;
  productsSection: Record<string, string>;
  customBlocks: Array<Record<string, unknown>>;
  member: {
    eyebrow: string;
    title: string;
    copy: string;
    stats: Array<{ value: string; label: string }>;
  };
  footer: {
    title: string;
    copy: string;
    links: Array<{ text: string; url: string }>;
  };
};

export type CartLine = {
  productId: string;
  variantId: string | null;
  name: string;
  variantLabel: string;
  price: number;
  image: string;
  quantity: number;
};
