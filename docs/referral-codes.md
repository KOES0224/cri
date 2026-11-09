# Referral codes (application fee waived or reduced)

CRI gives a code to an agency or school. An applicant who enters it on the payment step of the application pays a
reduced application fee, or none at all. On the site the field is called **Referral code** / **추천 코드**; the wording
lives only in the `apply.pay.code*` entries of `src/i18n/en.ts` and `src/i18n/ko.ts`.

## Managing codes

Admin → **Referral codes** (`/dashboard/fee-codes`).

- **Code**: 4 to 32 letters, digits or hyphens (stored upper-case). "Suggest" fills in a random one.
- **Given to**: the agency or school. Only admins see it.
- **What the applicant pays**: nothing (fee waived) or a reduced fee in whole US dollars, below the normal fee.
- **Uses allowed** and **Last valid day (KST)** are optional limits.
- A code is never deleted, so past applications keep theirs. **Switch off** stops new use.

## How it works

- Rules: `src/lib/fee-code.ts` (pure, unit-tested). Table: `FeeCode`. Actions: `src/app/actions/feeCodes.ts`.
- The form (`src/app/apply/ApplyClient.tsx`) only previews the effect (`checkFeeCode`, 10 tries per 10 minutes per
  account). The server looks the code up again whenever it is used.
- **Reduced fee**: `beginApplicationCheckout(programId, form, code)` prices the order with the code and stores it on the
  checkout row (`ApplicationCheckout.feeCode`). The use is counted when the paid application is recorded.
- **Fee waived**: no payment form is shown. `submitApplicationWithoutFee(programId, form, code)` checks the code and
  counts the use in one statement, so a limited code cannot be over-used by submissions that arrive together.
- The application record keeps the code in `content.payment.code`; the admissions email, the applications sheet and
  the applicant's receipt mention it.
- A reduced-fee code with a use limit can go slightly over the limit if several people start paying at the same
  moment: someone who has already paid the reduced fee is never refused afterwards.
