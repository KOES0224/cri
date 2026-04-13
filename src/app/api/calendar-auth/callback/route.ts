import { NextResponse } from "next/server";
import { google } from "googleapis";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return new NextResponse("Error: No code provided", { status: 400 });
  }

  const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CALENDAR_CLIENT_SECRET;
  const redirectUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/calendar-auth/callback`;

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    redirectUrl
  );

  try {
    const { tokens } = await oauth2Client.getToken(code);
    
    return new NextResponse(`
      <html>
        <body style="font-family: sans-serif; padding: 40px; background: #f8fafc; color: #0f172a;">
          <h1 style="color: #10b981;">Authentication Successful!</h1>
          <p>Please copy the Refresh Token below and paste it into your <b>.env</b> file.</p>
          
          <div style="background: #1e293b; color: #e2e8f0; padding: 20px; border-radius: 8px; margin-top: 20px; font-family: monospace; word-break: break-all;">
            GOOGLE_CALENDAR_REFRESH_TOKEN="${tokens.refresh_token || 'NO REFRESH TOKEN GENERATED. Make sure you revoked previous access.'}"
          </div>

          <p style="margin-top: 20px; font-size: 14px; color: #475569;">
            Note: If the refresh token says 'undefined', you need to go to your Google Account Settings > Security > Third-party apps with account access, remove the app, and try again.
          </p>
        </body>
      </html>
    `, { headers: { 'Content-Type': 'text/html' } });

  } catch (error) {
    console.error("Error exchanging code for tokens", error);
    return new NextResponse("Error exchanging code for tokens", { status: 500 });
  }
}
