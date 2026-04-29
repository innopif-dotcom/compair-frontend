"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/lib/cart";

export function CartIndicator() {
  const { count } = useCart();

  return (
    <Link
      href="/cart"
      aria-label={count > 0 ? `ตะกร้า ${count} รายการ` : "ตะกร้า (ว่าง)"}
      title={count > 0 ? `ตะกร้า ${count} รายการ` : "ตะกร้า"}
      className="relative inline-flex items-center justify-center h-10 w-10 rounded border border-outline-variant bg-surface-container/50 hover:bg-surface-container text-on-surface-variant transition-colors"
    >
      <ShoppingCart className="h-4 w-4" />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-on-primary text-[10px] font-mono font-bold">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
