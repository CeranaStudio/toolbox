import type { Metadata, Viewport } from "next";
import "./globals.css";
import { RegisterSW } from "@/components/RegisterSW";

export const metadata: Metadata = {
  title: "FB 租屋過濾器",
  description: "貼上 FB 租屋貼文，AI 自動整理，建立你的專屬清單",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "租屋過濾器",
  },
  icons: {
    icon: "/logo.svg",
    apple: "/icons/pwa-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#E8572A",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-Hant">
      <body className="antialiased">
        <RegisterSW />
        {children}
      </body>
    </html>
  );
}
