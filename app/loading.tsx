import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <main className="flex-grow flex items-center justify-center px-gutter pb-xl pt-xl">
      <div className="flex flex-col items-center gap-sm text-on-surface-variant">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="font-label-caps text-label-caps uppercase tracking-widest">
          กำลังโหลด...
        </span>
      </div>
    </main>
  );
}
