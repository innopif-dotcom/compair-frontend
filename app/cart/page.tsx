import type { Metadata } from "next";
import { CartView } from "./CartView";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";  // cart is per-user (localStorage), can't be cached

export const metadata: Metadata = buildMetadata({
  title: "ตะกร้าและรายการสั่งซื้อ",
  description: "ตะกร้ายาที่เลือกไว้ — ระบบเทียบราคา 3 ร้านและแนะนำการสั่งซื้อแบบกระจายเพื่อให้ได้ราคาดีที่สุด",
  path: "/cart",
  noindex: true  // private user list
});

export default function CartPage() {
  return (
    <main className="flex-grow w-full max-w-container-max mx-auto px-sm sm:px-gutter pt-md pb-xl flex flex-col gap-md">
      <header className="flex flex-col gap-xs">
        <p className="font-label-caps text-label-caps text-outline uppercase tracking-widest">
          Shopping list
        </p>
        <h1 className="font-h1 text-[24px] sm:text-h1">ตะกร้า · เทียบราคาแบบกระจาย</h1>
        <p className="text-body-sm text-on-surface-variant">
          ใส่รายการยาที่อยากซื้อ — ระบบจะดึงราคาจาก MSK · Somsak · SOR
          และแนะนำว่ายาแต่ละตัวควรซื้อจากร้านไหนเพื่อประหยัดที่สุด
        </p>
      </header>
      <CartView />
    </main>
  );
}
