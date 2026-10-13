import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/providers/providers";

export const metadata: Metadata = {
  title: "Amazon Seller OS",
  description: "亚马逊跨境电商智能运营管理平台",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
