export function formatMoney(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Bangkok"
  }).format(new Date(value));
}

export function formatDay(value: string | Date | null | undefined): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeZone: "Asia/Bangkok"
  }).format(new Date(value));
}

export const STOCK_STATUS_LABEL: Record<string, string> = {
  in_stock: "มีสินค้า",
  low_stock: "เหลือน้อย",
  out_of_stock: "หมด",
  unknown: "ไม่ระบุ"
};

export const STOCK_STATUS_TONE: Record<string, string> = {
  in_stock: "bg-secondary-container text-on-secondary-container",
  low_stock: "bg-tertiary-fixed text-on-tertiary-fixed",
  out_of_stock: "bg-error-container text-on-error-container",
  unknown: "bg-surface-container text-on-surface-variant"
};

export const VENDOR_LABEL: Record<string, string> = {
  msk: "MSK",
  somsak: "Somsak",
  sor: "SOR"
};
