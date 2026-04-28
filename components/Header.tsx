import Link from "next/link";
import { Pill } from "lucide-react";
import { CommandPaletteTrigger } from "./CommandPaletteTrigger";

export function Header() {
  return (
    <header className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-lg border-b border-outline-variant/50 text-on-surface text-sm tracking-tight font-medium">
      <div className="flex justify-between items-center h-16 px-md max-w-container-max mx-auto gap-sm">
        <div className="flex items-center gap-base min-w-0">
          <Link
            href="/"
            className="flex items-center gap-xs text-lg font-bold tracking-tighter text-primary"
          >
            <Pill className="h-5 w-5" strokeWidth={2.2} />
            DrugCompare
          </Link>
          <nav className="hidden md:flex items-center gap-md">
            <Link
              href="/search"
              className="text-on-surface border-b border-primary pb-1 transition-colors"
            >
              Drug Index
            </Link>
          </nav>
        </div>
        <CommandPaletteTrigger />
      </div>
    </header>
  );
}
