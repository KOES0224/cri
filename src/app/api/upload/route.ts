import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { allowRequest } from '@/lib/request-limit';
// The body stays English for existing callers; the X-Error-Code header names a key in t.apply.errors for localized display.
const reject = (message: string, status: number, code: string) => new NextResponse(message, { status, headers: { 'X-Error-Code': code } });
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return reject('Sign in to upload.', 401, 'uploadSignIn');
    if (Number(request.headers.get('content-length')) > 6 * 1024 * 1024) return reject('Maximum upload size is 5 MB.', 413, 'uploadTooLarge');
    if (!await allowRequest('upload', session.user.id, 10, 600)) return reject('Please wait before uploading again.', 429, 'uploadRateLimit');
    const form = await request.formData();
    const file = form.get('file');
    if (!(file instanceof File) || file.size === 0 || file.size > 5 * 1024 * 1024) return reject('Choose a file up to 5 MB.', 400, 'uploadTooLarge');
    const data = Buffer.from(await file.arrayBuffer());
    if (file.type === 'application/pdf' && data.subarray(0, 5).toString() === '%PDF-') {
      const document = await prisma.applicationDocument.create({ data: { userId: session.user.id, filename: file.name.slice(0, 180), data } });
      return NextResponse.json({ url: `/api/documents/${document.id}` });
    }
    if (session.user.role !== 'ADMIN') return reject('Application uploads must be PDF documents.', 400, 'uploadPdfOnly');
    const jpg = data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff;
    const png = data.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
    const webp = data.subarray(0,4).toString() === 'RIFF' && data.subarray(8,12).toString() === 'WEBP';
    const mp4 = file.type === 'video/mp4' && data.subarray(4,8).toString() === 'ftyp';
    if (!jpg && !png && !webp && !mp4) return new NextResponse('Public media must be JPEG, PNG, WebP or MP4.', { status: 400 });
    const token = process.env.cri_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) return new NextResponse('Image uploads are unavailable. Please try again later.', { status: 503 });
    const blob = await put(`media/${crypto.randomUUID()}.${jpg ? 'jpg' : png ? 'png' : mp4 ? 'mp4' : 'webp'}`, data, { access: 'public', token, contentType: jpg ? 'image/jpeg' : png ? 'image/png' : mp4 ? 'video/mp4' : 'image/webp' });
    return NextResponse.json(blob);
  } catch { return reject('Upload failed. Please try again.', 500, 'uploadFailed'); }
}
