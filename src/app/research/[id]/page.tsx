import { redirect } from 'next/navigation';
import { getLocale } from '@/i18n';
import { localizedPath } from '@/i18n/routing';
/** Keep older bookmarks on the single, inventory-backed program detail page. */
export default async function LegacyProgramPage({params}: {params: Promise<{id: string}>}) {
  const {id} = await params;
  redirect(localizedPath(`/research/program/${encodeURIComponent(id)}`, await getLocale()));
}
