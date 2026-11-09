/** The confirm call to the payment provider may wait up to 30 seconds for a card network; give the request room. */
export const maxDuration = 90;

export default function PaymentSuccessLayout({ children }: { children: React.ReactNode }) {
  return children;
}
