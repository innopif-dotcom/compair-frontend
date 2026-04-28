import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { CommandPaletteProvider } from "@/components/CommandPalette";

export const metadata: Metadata = {
  title: "DrugCompare — ค้นหาและเทียบราคายา",
  description:
    "ค้นหาราคายาและสินค้าเภสัชจากร้าน MSK / Somsak / SOR ผ่านดัชนี Elasticsearch ที่อัปเดตจากฐานข้อมูล MongoDB"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Public+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-surface-container-lowest min-h-screen flex flex-col antialiased">
        <CommandPaletteProvider>
          <Header />
          <div className="pt-[64px] flex-1 flex flex-col">{children}</div>
          <footer className="w-full py-base mt-auto border-t border-outline-variant bg-surface-container-low text-on-surface-variant text-xs uppercase tracking-widest">
            <div className="flex justify-center px-md max-w-container-max mx-auto">
              <p>© DrugCompare · ข้อมูลอัปเดตจากฐานข้อมูลภายใน</p>
            </div>
          </footer>
        </CommandPaletteProvider>
      </body>
    </html>
  );
}
