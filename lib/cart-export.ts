import type { OptimizeSummary, OptimizeRow } from "./cart-optimizer";
import type { Vendor } from "./cart-api";

const VENDOR_LABELS: Record<Vendor, string> = {
  msk: "MSK",
  somsak: "Somsak",
  sor: "SOR"
};

function fmtMoney(value: number): string {
  return value.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * CSV with one row per line item, grouped by picked vendor. Spreadsheet-friendly.
 * Columns: vendor, rawName, qty, unit, unitPrice, total
 */
export function summaryToCsv(summary: OptimizeSummary): string {
  const header = "vendor,product,qty,unit,unitPrice,total";
  const rows: string[] = [header];
  for (const vendor of ["msk", "somsak", "sor"] as Vendor[]) {
    for (const row of summary.perVendorBreakdown[vendor]) {
      const product = row.vendors[vendor].product;
      const unit = product?.unit ?? "";
      const unitPrice = row.pickedPrice ?? "";
      const escaped = (s: string | number | null) => {
        const v = s == null ? "" : String(s);
        if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
        return v;
      };
      rows.push(
        [
          VENDOR_LABELS[vendor],
          escaped(row.rawName),
          row.qty,
          escaped(unit),
          unitPrice,
          row.pickedTotal
        ].join(",")
      );
    }
  }
  if (summary.unmatchedCount > 0) {
    rows.push("");
    rows.push("# unmatched (no vendor available)");
    for (const row of summary.rows.filter((r) => r.pickedVendor === null)) {
      rows.push(`,${row.rawName.replace(/,/g, " ")},${row.qty},,,`);
    }
  }
  rows.push("");
  rows.push(`# total,,,,,${summary.totals.bySplit}`);
  return rows.join("\n");
}

/**
 * Plain-text per-vendor summary suitable for pasting into LINE/email.
 * Returns one block per vendor that has rows.
 */
export function summaryToTextBlocks(summary: OptimizeSummary): { vendor: Vendor; text: string }[] {
  const blocks: { vendor: Vendor; text: string }[] = [];
  for (const vendor of ["msk", "somsak", "sor"] as Vendor[]) {
    const rows = summary.perVendorBreakdown[vendor];
    if (rows.length === 0) continue;
    const lines: string[] = [];
    lines.push(`สั่ง ${VENDOR_LABELS[vendor]} ${rows.length} รายการ:`);
    rows.forEach((r, i) => {
      const product = r.vendors[vendor].product;
      const unit = product?.unit ? ` ${product.unit}` : "";
      lines.push(`${i + 1}. ${r.rawName} × ${r.qty}${unit}  ฿${fmtMoney(r.pickedTotal)}`);
    });
    const total = rows.reduce((sum, r) => sum + r.pickedTotal, 0);
    lines.push(`รวม ฿${fmtMoney(total)}`);
    blocks.push({ vendor, text: lines.join("\n") });
  }
  return blocks;
}
