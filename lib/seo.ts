import type { Metadata } from "next";

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://compair.innovicine.com";
export const SITE_NAME = "DrugCompare";
export const SITE_DESCRIPTION =
  "ค้นหาและเทียบราคายาจากร้านขายยา 3 แห่ง — MSK / Somsak / SOR — อัปเดตทุกวัน เลือกราคาถูกที่สุดได้ในที่เดียว";

const DEFAULT_OG_IMAGE = `${SITE_URL}/og-default.png`;

export function buildMetadata(input: {
  title?: string;
  description?: string;
  path?: string;
  noindex?: boolean;
  ogImage?: string;
}): Metadata {
  const url = input.path ? `${SITE_URL}${input.path}` : SITE_URL;
  const title = input.title ? `${input.title} | ${SITE_NAME}` : `${SITE_NAME} — ค้นหาและเทียบราคายา`;
  const description = input.description || SITE_DESCRIPTION;
  const ogImage = input.ogImage || DEFAULT_OG_IMAGE;

  return {
    title,
    description,
    alternates: { canonical: url },
    robots: input.noindex
      ? { index: false, follow: false }
      : { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } },
    openGraph: {
      type: "website",
      url,
      title,
      description,
      siteName: SITE_NAME,
      locale: "th_TH",
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }]
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage]
    }
  };
}

export function jsonLdScript(data: Record<string, unknown>) {
  return {
    __html: JSON.stringify(data)
      .replace(/</g, "\\u003c")
      .replace(/>/g, "\\u003e")
      .replace(/&/g, "\\u0026")
  };
}
