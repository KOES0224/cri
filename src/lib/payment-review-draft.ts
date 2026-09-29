/**
 * Sample application used by the payment-gateway review account, so a reviewer can go straight to the final step
 * and open the checkout without writing essays or uploading a CV. Pure (no database), so tests can validate it
 * against the real application schema.
 */
export const REVIEW_DOCUMENT_FILENAME = "CRI-payment-review-sample.pdf";

export function paymentReviewDraft(input: { accountEmail: string; professors: { name: string }[]; resumeUrl: string }): Record<string, string> {
  const note = "Sample application prepared for the payment gateway review. It is not a real applicant; please do not process it.";
  return {
    studentLevel: "SCHOOL",
    residenceCountry: "US",
    studentFirstName: "Test",
    studentLastName: "Student (payment review)",
    studentEmail: input.accountEmail,
    // 555-01xx numbers are reserved for fiction in North America.
    studentPhone: "+1 415 555 0100",
    parentFirstName: "Payment",
    parentLastName: "Reviewer",
    parentEmail: input.accountEmail,
    parentPhone: "+1 415 555 0101",
    school: "Sample High School (payment review)",
    gradYear: "2028",
    gender: "Prefer not to say",
    tShirtSize: "",
    photoConsent: "No",
    resumeUrl: input.resumeUrl,
    areaOfInterest: "Payment review (sample)",
    initialTopicIdeas: note,
    essay: note,
    shortAnswer: note,
    firstChoiceProfessor: input.professors[0]?.name || "Undecided",
    secondChoiceProfessor: "",
    thirdChoiceProfessor: "",
    previousResearch: "",
    howLearned: "Payment gateway review",
  };
}
