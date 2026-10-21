import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { ToastProvider } from "@/components/ui/toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dating Journal — Nhật ký tình yêu",
  description: "Ghi lại những khoảnh khắc yêu thương, khám phá tình yêu bằng AI",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Dating Journal",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  themeColor: "#e8507b",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="vi"
      className="h-full antialiased"
      suppressHydrationWarning
    >
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className="min-h-full flex flex-col font-body bg-bg text-text">
        <QueryProvider>
          <ThemeProvider defaultTheme="system" enableSystem>
            <ToastProvider>
              {children}
            </ToastProvider>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
