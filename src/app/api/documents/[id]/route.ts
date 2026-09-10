import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return new Response('Sign in to access this document.', { status: 401 });
  const { id } = await params;
  const document = await prisma.applicationDocument.findUnique({ where: { id } });
  if (!document || (document.userId !== session.user.id && session.user.role !== 'ADMIN')) return new Response('Document not found.', { status: 404 });
  return new Response(new Uint8Array(document.data), { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(document.filename)}`, 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' } });
}
