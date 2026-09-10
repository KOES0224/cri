import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
export async function requireAdmin() {
  const session = await getServerSession(authOptions);
  const user = session?.user?.id ? await prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true, role: true } }) : null;
  if (user?.role !== 'ADMIN') throw new Error('Administrator access required.');
  return user;
}
