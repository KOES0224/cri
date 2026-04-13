import { NextResponse } from "next/server";
import { google } from "googleapis";

export async function GET(req: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/calendar-auth/callback`;

  if (!clientId || !clientSecret) {
    return new NextResponse("Error: GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are required in .env", { status: 400 });
  }

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    redirectUrl
  );

  // Generate a url that asks permissions for Google Calendar scope
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline', // Required to get a refresh token
    scope: ['https://www.googleapis.com/auth/calendar.events'],
    prompt: 'consent' // Force consent to guarantee we get a refresh token
  });

  return NextResponse.redirect(url);
}
