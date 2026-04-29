import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { CommandPaletteProvider } from "@/components/CommandPalette";
import { CartProvider } from "@/lib/cart";
import { SITE_NAME, SITE_URL, buildMetadata, jsonLdScript } from "@/lib/seo";

export const metadata: Metadata = {
  ...buildMetadata({}),
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — ค้นหาและเทียบราคายา 3 ร้าน`,
    template: `%s | ${SITE_NAME}`
  },
  applicationName: SITE_NAME,
  keywords: [
    "เทียบราคายา",
    "ค้นหายา",
    "ราคายา",
    "MSK",
    "Somsak",
    "SOR",
    "หมอยาสิริกร",
    "drug compare",
    "pharmacy price",
    "Thai pharmacy"
  ],
  authors: [{ name: SITE_NAME }],
  generator: "Next.js",
  formatDetection: { email: false, address: false, telephone: false }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0f1e2c"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    inLanguage: "th-TH",
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <html lang="th">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Public+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={jsonLdScript(websiteJsonLd)}
        />
      </head>
      <body className="bg-surface-container-lowest min-h-screen flex flex-col antialiased">
        <CommandPaletteProvider>
          <CartProvider>
            <Header />
            <div className="pt-[64px] flex-1 flex flex-col">{children}</div>
            <footer className="w-full py-base mt-auto border-t border-outline-variant bg-surface-container-low text-on-surface-variant text-xs uppercase tracking-widest">
              <div className="flex justify-center px-md max-w-container-max mx-auto">
                <p>© DrugCompare · ข้อมูลอัปเดตจากฐานข้อมูลภายใน</p>
              </div>
            </footer>
          </CartProvider>
        </CommandPaletteProvider>
      </body>
    </html>
  );
}
