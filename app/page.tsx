import Link from "next/link";
import { ArrowRight, Database, SlidersHorizontal } from "lucide-react";
import { search } from "@/lib/api";
import { SearchBar } from "@/components/SearchBar";
import { ResultsTable } from "@/components/ResultsTable";

export const revalidate = 30;

export default async function HomePage() {
  let recent;
  let error: string | null = null;
  try {
    recent = await search({ sort: "recent", size: 8 });
  } catch (cause) {
    error = cause instanceof Error ? cause.message : String(cause);
  }

  return (
    <main className="flex-grow w-full max-w-container-max mx-auto px-gutter pt-[80px] pb-xl flex flex-col gap-xl">
      <section className="flex flex-col items-center w-full max-w-3xl mx-auto text-center">
        <p className="inline-flex items-center gap-xs font-label-caps text-label-caps text-outline uppercase tracking-widest mb-sm">
          <Database className="h-3.5 w-3.5" />
          Pharmacy Index
        </p>
        <h1 className="font-display text-display text-on-surface mb-sm">
          ค้นหายาและเทียบราคา จากร้านยาทั้งสามแห่ง
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant mb-lg max-w-2xl">
          ฐานข้อมูลรวมจาก MSK · Somsak · SOR — ค้นด้วยชื่อสามัญ ชื่อการค้า บาร์โค้ด หรือรหัสสินค้า
          พร้อมประวัติราคาย้อนหลัง
        </p>
        <SearchBar />
        <Link
          href="/search"
          className="mt-sm inline-flex items-center gap-xs text-primary font-body-sm text-body-sm hover:underline transition-all"
        >
          <SlidersHorizontal className="h-4 w-4" />
          เปิดหน้าค้นหาขั้นสูง
        </Link>
      </section>

      <section className="w-full">
        <div className="flex items-baseline justify-between mb-sm">
          <div>
            <p className="font-label-caps text-label-caps text-outline uppercase tracking-widest">
              เพิ่งเห็นล่าสุด
            </p>
            <h2 className="font-h2 text-h2">ตัวอย่างสินค้าจากดัชนี</h2>
          </div>
          <Link href="/search?sort=recent" className="inline-flex items-center gap-xs text-primary font-body-sm hover:underline">
            ดูทั้งหมด <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {error ? (
          <div className="border border-error rounded bg-error-container/40 p-md text-on-error-container">
            ไม่สามารถเชื่อมต่อ API ได้ — ตรวจสอบว่า backend รันอยู่ที่ {process.env.NEXT_PUBLIC_API_URL || "http://localhost:4444"} และ Elasticsearch
            ทำงานปกติ ({error})
          </div>
        ) : (
          <ResultsTable hits={recent?.hits ?? []} />
        )}
      </section>
    </main>
  );
}
