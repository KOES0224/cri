export const metadata = {
  title: 'B2B Partnership | CRI Global',
  description: 'Premium B2B Academic Infrastructure Partnership',
};

export default function PartnersPage() {
  return (
    <div className="fixed inset-0 z-[9999] bg-black">
      <iframe
        src="/partners-presentation.html"
        className="w-full h-full border-none"
        title="B2B Partnership Presentation"
      />
    </div>
  );
}
