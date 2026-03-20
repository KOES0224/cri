import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized. You must be logged in as an admin.", { status: 401 });
    }

    const form = await request.formData();
    const file = form.get('file') as File;

    if (!file) {
      return new NextResponse("No file provided in the request body.", { status: 400 });
    }

    const blob = await put(file.name, file, { access: 'public' });
    return NextResponse.json(blob);
  } catch (error: any) {
    console.error("Vercel Blob Upload Error:", error);
    return new NextResponse(`Upload failed: ${error.message || "Unknown error"}`, { status: 500 });
  }
}
