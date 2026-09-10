import { redirect } from 'next/navigation';
/** Keep older bookmarks on the single, inventory-backed program detail page. */
export default async function LegacyProgramPage({params}: {params: Promise<{id: string}>}) {
  const {id} = await params;
  redirect(`/research/program/${encodeURIComponent(id)}`);
}
