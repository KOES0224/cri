import type { Locale } from "@/i18n/config";
import { COMPANY } from "@/lib/company";

export type TermsSection = { heading: string; body: string[] };
export type TermsDocument = { metaTitle: string; description: string; eyebrow: string; title: string; effective: string; sections: TermsSection[]; contact: string };

/**
 * 사이버몰 이용약관 (전자상거래법 제10조 제1항 제5호). Structured after the Fair Trade Commission's standard e-commerce terms,
 * adapted to a service business: programme information, application review, online sessions and the applicant portal.
 * Tuition, schedules and refund mechanics stay in the programme pages, the refund policy and each programme contract.
 */
const ko: TermsDocument = {
  metaTitle: "이용약관 | CRI",
  description: "CRI(Elite Research Co., Ltd.) 웹사이트와 리서치 프로그램 지원 서비스의 이용약관입니다.",
  eyebrow: "법적 고지",
  title: "서비스 이용약관",
  effective: `시행일 ${COMPANY.termsEffectiveDate.replace(/-/g, ". ")}.`,
  contact: "약관에 관한 문의",
  sections: [
    { heading: "제1조 (목적)", body: [
      `이 약관은 ${COMPANY.legalName}(이하 "회사")가 운영하는 웹사이트 criglobal.org 및 cri.kr(이하 "사이트")에서 제공하는 리서치 프로그램 안내, 지원서 접수·심사, 온라인 설명회, 지원자 포털 등 서비스(이하 "서비스")의 이용과 관련하여 회사와 이용자의 권리, 의무 및 책임사항을 정함을 목적으로 합니다.`,
    ] },
    { heading: "제2조 (정의)", body: [
      "1. \"이용자\"란 사이트에 접속하여 이 약관에 따라 서비스를 이용하는 회원과 비회원을 말합니다.",
      "2. \"회원\"이란 사이트에 계정을 만든 학생 또는 학부모(보호자)를 말합니다.",
      "3. \"프로그램\"이란 회사가 교수진·조교와 함께 운영하는 Winter Online Research Program, Seoul & Global Research Programs, 1-on-1 Advanced Research Program 등 교육 서비스를 말합니다.",
      "4. \"지원비\"란 지원서 심사 서비스의 대가로 지원서 제출 시 결제하는 금액을 말하며, 프로그램 수업료와는 별개입니다.",
    ] },
    { heading: "제3조 (약관의 게시와 개정)", body: [
      "1. 회사는 이 약관의 내용과 상호, 대표자 성명, 영업소 소재지 주소, 전화번호, 전자우편주소, 사업자등록번호, 통신판매업 신고번호, 개인정보보호책임자 등을 이용자가 쉽게 알 수 있도록 사이트 하단에 게시합니다.",
      "2. 회사는 「전자상거래 등에서의 소비자보호에 관한 법률」, 「약관의 규제에 관한 법률」 등 관련 법령을 위배하지 않는 범위에서 이 약관을 개정할 수 있습니다.",
      "3. 약관을 개정하는 경우 적용일자와 개정 사유를 명시하여 적용일자 7일 전부터(이용자에게 불리한 변경은 30일 전부터) 사이트에 공지합니다.",
      "4. 개정 약관은 적용일자 이후 체결되는 계약에 적용되며, 이미 체결된 계약에는 이용자가 동의한 경우에 한하여 적용됩니다.",
    ] },
    { heading: "제4조 (서비스의 제공 및 변경)", body: [
      "1. 회사는 다음 서비스를 제공합니다: 프로그램 및 교수진 정보 제공, 온라인 지원서 접수와 심사, 온라인 설명회 및 상담, 지원자 포털(지원 현황·결과 확인), 합격자 대상 프로그램 운영.",
      "2. 프로그램의 일정, 교수진, 정원, 진행 방식은 운영 사정에 따라 변경될 수 있으며, 변경이 있을 경우 회사는 지원자 또는 참가자에게 이메일 등으로 알립니다.",
      "3. 프로그램 수업료, 포함 내용, 일정 등 구체적인 조건은 각 프로그램 페이지와 합격 후 체결하는 개별 프로그램 계약에 따릅니다.",
    ] },
    { heading: "제5조 (회원가입과 계정)", body: [
      "1. 이용자는 이름, 이메일 주소, 계정 유형(학생·학부모) 등을 입력하고 이 약관과 개인정보처리방침에 동의함으로써 회원가입을 신청합니다.",
      "2. 만 14세 미만 아동의 가입과 개인정보 제공에는 법정대리인의 동의가 필요하며, 미성년 학생의 지원과 결제는 보호자가 진행하거나 보호자의 동의 하에 진행되어야 합니다.",
      "3. 회원은 계정 정보를 정확하게 유지하고 비밀번호를 안전하게 관리할 책임이 있으며, 계정을 제3자에게 양도하거나 대여할 수 없습니다.",
      `4. 회원은 언제든지 ${COMPANY.email}로 탈퇴를 요청할 수 있으며, 회사는 관련 법령에 따라 보존해야 하는 정보를 제외하고 지체 없이 처리합니다.`,
    ] },
    { heading: "제6조 (지원, 심사 및 계약의 성립)", body: [
      "1. 이용자는 사이트의 지원서 양식을 작성하여 프로그램에 지원할 수 있습니다.",
      "2. 지원비가 적용되는 경우 지원비는 지원서 검토·면접 등 심사 서비스의 대가이며, 결제와 동시에 심사가 시작됩니다. 지원비 납부는 합격을 보장하지 않습니다.",
      "3. 회사는 심사 결과를 이메일과 지원자 포털로 안내하며, 프로그램 참가 계약은 합격 통지 후 회사와 보호자(또는 성인 지원자)가 개별 프로그램 계약을 체결하고 수업료를 납부한 때 성립합니다.",
      "4. 회사는 지원 내용이 허위이거나 다른 사람의 정보를 도용한 경우, 프로그램 운영에 지장을 줄 우려가 있는 경우 지원을 승낙하지 않거나 계약을 해지할 수 있습니다.",
    ] },
    { heading: "제7조 (결제)", body: [
      "1. 지원비와 수업료는 사이트에 표시된 통화로 청구되며, 결제는 회사가 지정한 결제대행사를 통해 신용·체크카드 등으로 처리됩니다.",
      "2. 결제 금액, 통화, 서비스 내용은 결제 전 결제 화면에 표시되며, 이용자는 이를 확인한 후 결제해야 합니다.",
      "3. 환율 차이나 해외 결제 수수료 등 카드사가 부과하는 비용은 이용자와 카드사 간의 계약에 따릅니다.",
    ] },
    { heading: "제8조 (청약철회, 취소 및 환불)", body: [
      "1. 이용자는 「전자상거래 등에서의 소비자보호에 관한 법률」 등 관련 법령에 따라 청약철회를 할 수 있습니다.",
      "2. 지원비와 프로그램의 취소·환불 기준은 사이트의 「취소 및 환불 규정」과 개별 프로그램 계약에 따르며, 이 기준은 관련 법령이 보장하는 이용자의 권리를 제한하지 않습니다.",
      `3. 환불은 원칙적으로 결제 수단과 동일한 방법으로 처리하며, 취소·환불 요청은 ${COMPANY.email} 또는 ${COMPANY.phone}로 접수합니다.`,
    ] },
    { heading: "제9조 (개인정보 보호)", body: [
      "회사는 이용자의 개인정보를 「개인정보 보호법」 등 관련 법령과 사이트에 게시한 개인정보처리방침에 따라 보호하고 처리합니다.",
    ] },
    { heading: "제10조 (회사의 의무)", body: [
      "1. 회사는 관련 법령과 이 약관이 금지하는 행위를 하지 않으며, 지속적이고 안정적으로 서비스를 제공하기 위해 노력합니다.",
      "2. 회사는 이용자가 제기한 의견이나 불만이 정당하다고 인정되는 경우 신속하게 처리하며, 처리에 시간이 걸리는 경우 그 사유와 일정을 알립니다.",
    ] },
    { heading: "제11조 (이용자의 의무)", body: [
      "이용자는 다음 행위를 해서는 안 됩니다: 지원 또는 가입 시 허위 내용 등록, 타인의 정보 도용, 회사 또는 제3자의 지식재산권 침해, 사이트의 정상적인 운영을 방해하는 행위, 교수진·조교·다른 참가자에 대한 명예훼손이나 괴롭힘, 회사가 제공한 강의 자료의 무단 복제·배포.",
    ] },
    { heading: "제12조 (지식재산권 및 연구 결과물)", body: [
      "1. 사이트에 게시된 콘텐츠(문서, 이미지, 영상, 디자인 등)의 저작권은 회사 또는 정당한 권리자에게 있으며, 사전 동의 없이 복제·배포·전송할 수 없습니다.",
      "2. 프로그램에서 학생이 작성한 연구 결과물의 권리 귀속과 활용(출판, 홍보 등)은 개별 프로그램 계약에 따릅니다.",
    ] },
    { heading: "제13조 (책임의 제한)", body: [
      "1. 회사는 프로그램 참여가 특정 대학 합격, 논문 게재, 대회 수상 등 결과를 보장하지 않으며, 사이트의 성과 안내는 과거 사례입니다.",
      "2. 회사는 천재지변, 정보통신 설비의 장애, 교수진의 불가피한 사정 등 회사의 통제를 벗어난 사유로 서비스를 제공할 수 없는 경우 그 범위에서 책임이 면제됩니다. 다만 이미 결제된 금액 중 제공되지 않은 서비스에 해당하는 부분은 제8조에 따라 처리합니다.",
      "3. 회사는 이용자의 귀책사유로 인한 서비스 이용 장애에 대하여 책임을 지지 않습니다.",
    ] },
    { heading: "제14조 (분쟁의 해결 및 준거법)", body: [
      "1. 회사와 이용자 사이에 발생한 분쟁은 상호 협의하여 해결하며, 협의가 이루어지지 않는 경우 이용자는 한국소비자원, 전자문서·전자거래분쟁조정위원회 등에 조정을 신청할 수 있습니다.",
      "2. 이 약관과 서비스 이용에 관하여는 대한민국 법령이 적용되며, 소송은 「민사소송법」에 따른 관할법원에 제기합니다.",
      "3. 대한민국 외에 거주하는 이용자에게는 거주 국가의 강행 법규가 보장하는 소비자 권리가 추가로 적용될 수 있습니다.",
    ] },
  ],
};

const en: TermsDocument = {
  metaTitle: "Terms of Service | CRI",
  description: "Terms of service for the CRI (Elite Research Co., Ltd.) website and research programme application services.",
  eyebrow: "Legal",
  title: "Terms of Service",
  effective: `Effective ${COMPANY.termsEffectiveDate}.`,
  contact: "Questions about these terms",
  sections: [
    { heading: "Article 1 (Purpose)", body: [
      `These terms govern the rights, obligations and responsibilities of ${COMPANY.legalName} (the "Company") and its users in relation to the services offered on criglobal.org and cri.kr (the "Site"): programme information, application intake and review, online information sessions and the applicant portal (the "Services").`,
    ] },
    { heading: "Article 2 (Definitions)", body: [
      "1. \"User\" means any member or visitor who accesses the Site and uses the Services under these terms.",
      "2. \"Member\" means a student or parent (guardian) who has created an account on the Site.",
      "3. \"Programme\" means an educational service the Company runs with faculty and teaching assistants, such as the Winter Online Research Program, the Seoul & Global Research Programs and the 1-on-1 Advanced Research Program.",
      "4. \"Application fee\" means the amount paid when an application is submitted, in consideration of the admissions review service. It is separate from programme tuition.",
    ] },
    { heading: "Article 3 (Posting and amendment of the terms)", body: [
      "1. The Company posts these terms together with its trade name, representative, business address, telephone number, email address, business registration number, mail-order business registration number and privacy officer at the foot of the Site so that users can find them easily.",
      "2. The Company may amend these terms within the limits of applicable law, including the Act on Consumer Protection in Electronic Commerce and the Act on the Regulation of Terms and Conditions.",
      "3. Amendments are announced on the Site with their effective date and reasons at least 7 days in advance, or 30 days in advance when the change is unfavourable to users.",
      "4. Amended terms apply to contracts concluded on or after their effective date. They apply to existing contracts only with the user's consent.",
    ] },
    { heading: "Article 4 (Provision and changes of the Services)", body: [
      "1. The Company provides: programme and faculty information, online application intake and review, online information sessions and consultations, the applicant portal (application status and results) and the delivery of programmes to admitted students.",
      "2. Programme schedules, faculty, capacity and format may change for operational reasons. The Company notifies applicants or participants of such changes by email or similar means.",
      "3. Tuition, inclusions, schedules and other specific conditions of a programme are set out on the programme page and in the individual programme contract concluded after admission.",
    ] },
    { heading: "Article 5 (Membership and accounts)", body: [
      "1. A user applies for membership by entering their name, email address and account type (student or parent) and agreeing to these terms and the privacy policy.",
      "2. Children under 14 need the consent of a legal guardian to register and to provide personal information. Applications and payments for minor students must be made by, or with the consent of, a parent or guardian.",
      "3. Members are responsible for keeping their account details accurate and their password secure, and may not transfer or lend their account to a third party.",
      `4. A member may ask to close their account at any time by writing to ${COMPANY.email}. The Company processes the request without delay, except for records it must retain under applicable law.`,
    ] },
    { heading: "Article 6 (Applications, review and formation of the contract)", body: [
      "1. Users may apply to a programme by completing the application form on the Site.",
      "2. Where an application fee applies, it is consideration for the review service (application review, interview and related work) and the review begins when payment is made. Payment of the application fee does not guarantee admission.",
      "3. The Company communicates review results by email and through the applicant portal. A programme participation contract is formed when, after an offer of admission, the Company and the parent or guardian (or an adult applicant) conclude the individual programme contract and tuition is paid.",
      "4. The Company may decline an application or terminate a contract where the application contains false information, uses another person's information, or is likely to disrupt the operation of a programme.",
    ] },
    { heading: "Article 7 (Payment)", body: [
      "1. Application fees and tuition are charged in the currency shown on the Site and processed by the payment service provider designated by the Company, by credit or debit card or other listed methods.",
      "2. The amount, currency and service are shown on the payment screen before payment. Users should check them before paying.",
      "3. Exchange-rate differences, foreign transaction fees and other charges levied by a card issuer are governed by the agreement between the user and the issuer.",
    ] },
    { heading: "Article 8 (Withdrawal, cancellation and refunds)", body: [
      "1. Users may withdraw from a contract in accordance with applicable law, including the Act on Consumer Protection in Electronic Commerce.",
      "2. The detailed rules for cancelling and refunding application fees and programmes are set out in the Site's Cancellation & Refund Policy and in each programme contract. Those rules do not limit the rights users have under applicable law.",
      `3. Refunds are made, as a rule, by the original payment method. Cancellation and refund requests are accepted at ${COMPANY.email} or ${COMPANY.phone}.`,
    ] },
    { heading: "Article 9 (Personal information)", body: [
      "The Company protects and processes users' personal information in accordance with the Personal Information Protection Act and other applicable law, and with the privacy policy posted on the Site.",
    ] },
    { heading: "Article 10 (Obligations of the Company)", body: [
      "1. The Company does not engage in conduct prohibited by applicable law or these terms, and endeavours to provide the Services continuously and reliably.",
      "2. The Company handles justified opinions and complaints from users promptly. Where handling takes time, it informs the user of the reason and the expected schedule.",
    ] },
    { heading: "Article 11 (Obligations of users)", body: [
      "Users must not: register false information when applying or signing up; use another person's information; infringe the intellectual property rights of the Company or third parties; interfere with the normal operation of the Site; defame or harass faculty, teaching assistants or other participants; or copy or distribute course materials provided by the Company without permission.",
    ] },
    { heading: "Article 12 (Intellectual property and research outputs)", body: [
      "1. Copyright in the content posted on the Site (documents, images, video, design and the like) belongs to the Company or its rightful owners and may not be reproduced, distributed or transmitted without prior consent.",
      "2. Ownership and use of research outputs created by students in a programme (including publication and promotion) are governed by the individual programme contract.",
    ] },
    { heading: "Article 13 (Limitation of liability)", body: [
      "1. Participation in a programme does not guarantee admission to any university, publication of a paper or any competition result. Outcomes described on the Site are past examples.",
      "2. The Company is released from liability to the extent it cannot provide the Services for reasons beyond its control, such as natural disasters, failures of telecommunications facilities or unavoidable circumstances of faculty. Any part of an amount already paid that corresponds to services not provided is handled under Article 8.",
      "3. The Company is not liable for service disruptions caused by the user.",
    ] },
    { heading: "Article 14 (Dispute resolution and governing law)", body: [
      "1. Disputes between the Company and a user are resolved by mutual consultation. Where consultation fails, the user may apply for mediation to the Korea Consumer Agency or the Electronic Documents and Transactions Dispute Mediation Committee.",
      "2. These terms and the use of the Services are governed by the laws of the Republic of Korea. Lawsuits are brought before the court with jurisdiction under the Civil Procedure Act.",
      "3. Users residing outside the Republic of Korea may additionally benefit from consumer rights guaranteed by the mandatory laws of their country of residence.",
    ] },
  ],
};

export const TERMS: Record<Locale, TermsDocument> = { en, ko };
