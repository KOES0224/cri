import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { allowRequest } from '@/lib/request-limit';
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return new NextResponse('Sign in to upload.', { status: 401 });
    if (Number(request.headers.get('content-length')) > 6 * 1024 * 1024) return new NextResponse('Maximum upload size is 5 MB.', { status: 413 });
    if (!await allowRequest('upload', session.user.id, 10, 600)) return new NextResponse('Please wait before uploading again.', { status: 429 });
    const form = await request.formData();
    const file = form.get('file');
    if (!(file instanceof File) || file.size === 0 || file.size > 5 * 1024 * 1024) return new NextResponse('Choose a file up to 5 MB.', { status: 400 });
    const data = Buffer.from(await file.arrayBuffer());
    if (file.type === 'application/pdf' && data.subarray(0, 5).toString() === '%PDF-') {
      const document = await prisma.applicationDocument.create({ data: { userId: session.user.id, filename: file.name.slice(0, 180), data } });
      return NextResponse.json({ url: `/api/documents/${document.id}` });
    }
    if (session.user.role !== 'ADMIN') return new NextResponse('Application uploads must be PDF documents.', { status: 400 });
    const jpg = data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff;
    const png = data.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
    const webp = data.subarray(0,4).toString() === 'RIFF' && data.subarray(8,12).toString() === 'WEBP';
    const mp4 = file.type === 'video/mp4' && data.subarray(4,8).toString() === 'ftyp';
    if (!jpg && !png && !webp && !mp4) return new NextResponse('Public media must be JPEG, PNG, WebP or MP4.', { status: 400 });
    const token = process.env.cri_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) return new NextResponse('Image uploads are unavailable. Please try again later.', { status: 503 });
    const blob = await put(`media/${crypto.randomUUID()}.${jpg ? 'jpg' : png ? 'png' : mp4 ? 'mp4' : 'webp'}`, data, { access: 'public', token, contentType: jpg ? 'image/jpeg' : png ? 'image/png' : mp4 ? 'video/mp4' : 'image/webp' });
    return NextResponse.json(blob);
  } catch { return new NextResponse('Upload failed. Please try again.', { status: 500 }); }
}
