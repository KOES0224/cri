# Referral codes (application fee waived or reduced)

CRI gives a code to an agency or school. An applicant who enters it on the payment step of the application pays a
reduced application fee, or none at all. On the site the field is called **Referral code** / **추천 코드**; the wording
lives only in the `apply.pay.code*` entries of `src/i18n/en.ts` and `src/i18n/ko.ts`.

Codes are only asked for while the application fee is on (`docs/toss-payments.md`). They can be created at any time.

## Managing codes

Admin → **Referral codes** (`/dashboard/fee-codes`).

- **Code**: 4 to 32 letters, digits or hyphens (stored upper-case). "Suggest" fills in a random one.
- **Given to**: the agency or school. Only admins see it.
- **What the applicant pays**: nothing (fee waived) or a reduced fee in whole US dollars, below the normal fee.
- **Uses allowed** and **Last valid day (KST)** are optional limits. The code works through the end of that day in Korea;
  a day that has already passed is refused.
- **Edit** changes who the code is for, the note, the uses allowed and the last valid day (extend a code mid-season
  instead of handing out a new one). The code text and the amount are fixed once created. On an expired code the note
  and the partner can be corrected with the day left as it is; changing the day to a later one, or emptying it, makes
  the code usable again.
- A code is never deleted, so past applications keep theirs. **Switch off** stops new use.
- The number under **Used** links to the spreadsheet view filtered to exactly the applications recorded with the code
  (the sheet's search box also finds codes). Deleting an application in the admin gives its use back. Uses are not
  given back when a whole user account is deleted or when the payment-review account's tests are cleaned up, and
  that account's applications are not listed in the sheet: raise **Uses allowed** with Edit if a limited code was
  used in a test.

Choosing code text: anyone who learns a code can use it, and a short name such as `ABC` can be guessed. Prefer the
partner's name plus a few random characters (`ABC-7KQ2`) or a "Suggest" code, and give waiving codes a use limit or a
last valid day when the partner's numbers are known.

Several codes at once: `npx tsx scripts/referral-codes.ts --file ~/cri-codes.json` shows what would be created,
`--apply` creates them; without `--file` it lists the codes and their use. The file format is in the script's header.
Keep that file outside this repository (the script refuses one inside it): the repository is public, and partner
names and codes must never be committed.

## What the applicant sees

- "Have a referral code?" in the order summary of the last step opens the field. A code is checked when Apply (or
  Enter) is pressed: ten tries per ten minutes per account. Reloads that re-check a code that works do not use up
  tries; misses always do, so codes cannot be guessed quickly.
- Reduced fee: the summary shows the code, the reduction and the new total; the Pay button and the payment window
  charge that total.
- Fee waived: the payment form disappears and the button reads "Submit application".
- A code typed but not applied stops Pay with a reminder, so nobody pays the full fee by oversight. Text the form has
  already refused does not: the applicant was told to continue without it.
- The applied code is remembered for the tab and the account. On another device it comes back from the applicant's own
  unpaid order, if they had pressed Pay with it. A code the applicant removed stays removed in that tab.
- If a code stops working (switched off, expired, used up) between applying it and paying or submitting, the form
  removes it, says so, and shows the full fee before anything is charged.

## How it works

- Rules: `src/lib/fee-code.ts` (pure, unit-tested). Table: `FeeCode`. Actions: `src/app/actions/feeCodes.ts`.
- The form (`src/app/apply/ApplyClient.tsx`) only previews the effect (`checkFeeCode`). The server looks the code up
  again whenever it is used.
- **Reduced fee**: `beginApplicationCheckout(programId, form, code)` prices the order with the code and stores it on the
  checkout row (`ApplicationCheckout.feeCode`). The use is counted when the paid application is recorded.
  An order keeps its price for 30 minutes after it was priced, even if the code is switched off in that time: someone
  in the middle of paying is never surprised. A payment that arrives for an older order is only accepted while the code
  still works; otherwise nothing is charged and the applicant starts again from the form.
- **Fee waived**: no payment form is shown. `submitApplicationWithoutFee(programId, form, code)` checks the code and
  counts the use in one statement, so a limited code cannot be over-used by submissions that arrive together.
- The application record keeps the code in `content.payment.code`; the admissions email, the applications sheet and
  the applicant's receipt mention it.
- A reduced-fee code with a use limit can go slightly over the limit if several people start paying at the same
  moment: someone who has already paid the reduced fee is never refused afterwards.
- `usedCount` goes up when an application is recorded with the code and down when that application is deleted with
  the admin's delete button. Other ways an application disappears (deleting the user, the review-account cleanup
  script) leave it as it is.

## Tests

`tests/fee-code.test.ts` (rules) and `tests/fee-codes.integration.ts` (real database: admin actions, pricing, counting,
limits under simultaneous submissions, recovery of a reduced payment, deleting an application). See "Testing locally"
in `docs/toss-payments.md`.
