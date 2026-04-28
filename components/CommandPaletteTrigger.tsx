"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { useCommandPalette } from "./CommandPalette";

export function CommandPaletteTrigger() {
  const { open } = useCommandPalette();
  const [isMac, setIsMac] = useState(true);

  useEffect(() => {
    setIsMac(
      typeof navigator !== "undefined" &&
        /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent)
    );
  }, []);

  return (
    <button
      onClick={open}
      type="button"
      className="inline-flex items-center gap-sm px-sm py-1.5 border border-outline-variant rounded bg-surface-container/50 hover:bg-surface-container text-on-surface-variant transition-colors"
    >
      <Search className="h-4 w-4" />
      <span className="hidden sm:inline text-[13px]">ค้นหายา...</span>
      <kbd className="hidden md:inline-flex items-center justify-center h-5 px-1.5 ml-md rounded bg-surface-container border border-outline-variant text-[10px] font-mono">
        {isMac ? "⌘K" : "Ctrl K"}
      </kbd>
    </button>
  );
}
