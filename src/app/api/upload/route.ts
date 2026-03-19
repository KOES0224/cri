import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const form = await request.formData();
  const file = form.get('file') as File;

  if (!file) {
    return new NextResponse("No file provided", { status: 400 });
  }

  try {
    const blob = await put(file.name, file, { access: 'public' });
    return NextResponse.json(blob);
  } catch (error) {
    console.error("Vercel Blob Upload Error:", error);
    return new NextResponse("Upload failed", { status: 500 });
  }
}
