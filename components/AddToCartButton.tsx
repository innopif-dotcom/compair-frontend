"use client";

import { Check, Plus } from "lucide-react";
import { useCart } from "@/lib/cart";

interface Props {
  matchKey: string;
  rawName: string;
  size?: "sm" | "md";
  variant?: "icon" | "text";
}

export function AddToCartButton({ matchKey, rawName, size = "sm", variant = "text" }: Props) {
  const { add, remove, has } = useCart();
  const inCart = has(matchKey);

  function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (inCart) remove(matchKey);
    else add({ matchKey, rawName });
  }

  const dim = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  const pad = size === "sm" ? "px-1.5 py-0.5" : "px-2 py-1";

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={toggle}
        aria-label={inCart ? `เอาออกจากตะกร้า: ${rawName}` : `เพิ่มลงตะกร้า: ${rawName}`}
        title={inCart ? "อยู่ในตะกร้าแล้ว — กดเพื่อเอาออก" : "เพิ่มลงตะกร้า"}
        className={`inline-flex items-center justify-center rounded border transition-colors ${pad} ${
          inCart
            ? "border-secondary bg-secondary-container text-on-secondary-container"
            : "border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary"
        }`}
      >
        {inCart ? <Check className={dim} /> : <Plus className={dim} />}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={inCart}
      className={`inline-flex items-center gap-xs rounded border font-label-caps text-[10px] uppercase tracking-widest transition-colors ${pad} ${
        inCart
          ? "border-secondary bg-secondary-container text-on-secondary-container"
          : "border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary"
      }`}
    >
      {inCart ? <Check className={dim} /> : <Plus className={dim} />}
      {inCart ? "ในตะกร้า" : "เพิ่มลงตะกร้า"}
    </button>
  );
}
