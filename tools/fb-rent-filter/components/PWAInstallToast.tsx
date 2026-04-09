"use client";

import { useEffect, useState } from "react";
import { Home } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISSED_KEY = "pwa-install-dismissed";

export function PWAInstallToast() {
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // 已安裝 or 已 dismiss → 不顯示
    if (typeof window === "undefined") return;
    if (localStorage.getItem(DISMISSED_KEY)) return;
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    if ((window.navigator as Navigator & { standalone?: boolean }).standalone === true) return;

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream;
    setIsIOS(ios);

    if (ios) {
      // iOS 沒有 beforeinstallprompt，延遲 2s 顯示提示
      const timer = setTimeout(() => setShow(true), 2000);
      return () => clearTimeout(timer);
    }

    // Chrome/Android: 等 beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setShow(true), 2000);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // 監聽安裝完成
    window.addEventListener("appinstalled", () => {
      setInstalled(true);
      setTimeout(() => setShow(false), 2000);
    });

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setInstalled(true);
        setTimeout(() => setShow(false), 2000);
      }
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, "1");
    setShow(false);
  };

  if (!show) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "max(24px, env(safe-area-inset-bottom))",
        left: "16px",
        right: "16px",
        zIndex: 999,
        animation: "slideUp 0.25s ease-out",
      }}
    >
      <div
        style={{
          background: "#1A1A18",
          color: "white",
          borderRadius: 14,
          padding: "14px 16px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          boxShadow: "0 8px 32px rgba(0,0,0,0.24)",
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background: "#E8572A",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Home style={{ width: 20, height: 20, color: "white" }} />
        </div>

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {installed ? (
            <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>✓ 已加到主畫面！</p>
          ) : isIOS ? (
            <>
              <p style={{ fontSize: 13, fontWeight: 600, margin: "0 0 2px" }}>加到主畫面</p>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", margin: 0 }}>
                點底部 <strong style={{ color: "white" }}>分享</strong> → <strong style={{ color: "white" }}>加到主畫面</strong>
              </p>
            </>
          ) : (
            <>
              <p style={{ fontSize: 13, fontWeight: 600, margin: "0 0 2px" }}>安裝到手機</p>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", margin: 0 }}>
                下次直接開啟，不用找瀏覽器
              </p>
            </>
          )}
        </div>

        {/* Actions */}
        {!installed && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            {!isIOS && deferredPrompt && (
              <button
                onClick={handleInstall}
                style={{
                  padding: "7px 14px",
                  background: "#E8572A",
                  color: "white",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  touchAction: "manipulation",
                  whiteSpace: "nowrap",
                }}
              >
                安裝
              </button>
            )}
            <button
              onClick={handleDismiss}
              style={{
                width: 28,
                height: 28,
                background: "rgba(255,255,255,0.1)",
                border: "none",
                borderRadius: 6,
                color: "rgba(255,255,255,0.7)",
                fontSize: 16,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                touchAction: "manipulation",
                flexShrink: 0,
              }}
              aria-label="關閉"
            >
              ×
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
