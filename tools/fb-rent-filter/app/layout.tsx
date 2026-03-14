import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FB 租屋過濾器",
  description: "從 Facebook 租屋社團貼文萃取結構化租屋資料",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-Hant">
      <body className="bg-white text-gray-900 antialiased">{children}</body>
    </html>
  );
}
