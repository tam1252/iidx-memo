import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IIDX Memo",
  description: "beatmania IIDX オプション・ソフランメモ",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "IIDX Memo",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#111827",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-full">
      {/* テーマflash防止: hydration前にlocalStorageからdata-themeを適用 */}
      <script dangerouslySetInnerHTML={{
        __html: `(function(){var t=localStorage.getItem('iidx-theme');if(t)document.documentElement.setAttribute('data-theme',t)})()`,
      }} />
      <body className="min-h-full bg-gray-900 text-white antialiased">{children}</body>
    </html>
  );
}
