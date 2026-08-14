import type { Metadata } from "next";
import "../styles.css";

export const metadata: Metadata = {
  title: { default: "TR SELECT | 行動影像配件選物", template: "%s | TR SELECT" },
  description: "TR SELECT 精選自拍棒、手機支架、補光燈與行動收音設備，規格清楚、台北現貨出貨。",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-Hant">
      <body>{children}</body>
    </html>
  );
}
