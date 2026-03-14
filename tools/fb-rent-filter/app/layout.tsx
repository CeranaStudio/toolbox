import type { Metadata, Viewport } from "next";
import "./globals.css";
import { RegisterSW } from "@/components/RegisterSW";

export const metadata: Metadata = {
  title: "有室再說",
  description: "AI 幫你從社群貼文找出好室，整理、比較、分享，找房不再頭痛",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "有室再說",
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
