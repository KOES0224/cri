import type { Locale } from "@/i18n/config";

/**
 * Legal identity of the operator, shown in the footer and on the legal pages. Korean e-commerce law (전자상거래법 제10조,
 * 시행령 제10조) requires an online seller to display its trade name, representative, address, phone, email, business
 * registration number, mail-order-business registration number, terms of use and hosting provider, and payment-gateway
 * reviews check the same block, so every fact lives here once.
 */
export const COMPANY = {
  legalName: "Elite Research Co., Ltd.",
  /** 사업자등록증상 한글 상호. Empty until confirmed; the English name is shown alone meanwhile. */
  legalNameKo: "",
  brand: "CRI",
  representative: { en: "Eunsol Ko", ko: "고은솔 (Eunsol Ko)" } satisfies Record<Locale, string>,
  businessRegistrationNumber: "863-87-02851",
  /** 통신판매업 신고번호 as issued, e.g. "제2026-서울강남-01234호". The footer row stays hidden while this is empty. */
  mailOrderRegistrationNumber: "",
  postalCode: "06036",
  address: { en: "53, Nonhyeon-ro 153-gil, Gangnam-gu, Seoul, Republic of Korea", ko: "서울특별시 강남구 논현로153길 53" } satisfies Record<Locale, string>,
  phone: "+82 2-6203-8999",
  phoneHref: "tel:+82262038999",
  email: "support@cri.kr",
  hostingProvider: "Vercel Inc.",
  termsEffectiveDate: "2026-10-20",
};

/** Trade name for the page language: the registered Korean name on Korean pages once it is known, otherwise the English one. */
export function companyLegalName(locale: Locale): string {
  return locale === "ko" && COMPANY.legalNameKo ? COMPANY.legalNameKo : COMPANY.legalName;
}

/** Fair Trade Commission mail-order-business lookup for this registration number (has a record only once the 통신판매업 신고 exists). */
export const FTC_LOOKUP_URL = `https://www.ftc.go.kr/bizCommPop.do?wrkr_no=${COMPANY.businessRegistrationNumber.replace(/-/g, "")}`;
