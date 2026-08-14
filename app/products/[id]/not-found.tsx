import Link from "next/link";

export default function ProductNotFound() {
  return <main className="missing-product"><p className="eyebrow">Product not found</p><h1>找不到這件商品</h1><p>商品可能已下架，或網址已變更。</p><Link className="primary-link" href="/#products">返回商品目錄</Link></main>;
}
