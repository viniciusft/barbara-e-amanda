import { google } from "googleapis";
import { createServerSupabaseClient } from "./supabase";

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.NEXTAUTH_URL}/api/auth/callback/google`
);

async function getTokensFromDB() {
  const supabaseServer = createServerSupabaseClient();
  const { data, error } = await supabaseServer
    .from("admin_config")
    .select("google_refresh_token, google_access_token, google_token_expiry")
    .limit(1)
    .single();

  if (error || !data) {
    throw new Error("Google tokens not found. Admin must login first.");
  }

  if (!data.google_refresh_token) {
    throw new Error("No refresh token found. Admin must re-login to grant offline access.");
  }

  return {
    refresh_token: data.google_refresh_token,
    access_token: data.google_access_token,
    token_expiry: data.google_token_expiry,
  };
}

async function refreshAndSaveToken(refreshToken: string) {
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  const { credentials } = await oauth2Client.refreshAccessToken();

  if (credentials.access_token) {
    const supabaseServer = createServerSupabaseClient();
    await supabaseServer
      .from("admin_config")
      .update({
        google_access_token: credentials.access_token,
        google_token_expiry: credentials.expiry_date
          ? new Date(credentials.expiry_date).toISOString()
          : null,
        updated_at: new Date().toISOString(),
      })
      .not("id", "is", null);
  }

  return credentials;
}

async function getAuthenticatedClient() {
  const tokens = await getTokensFromDB();

  // Check if token is expired or will expire in next 5 minutes
  const isExpired = tokens.token_expiry
    ? new Date(tokens.token_expiry).getTime() < Date.now() + 5 * 60 * 1000
    : true;

  if (isExpired) {
    const freshCreds = await refreshAndSaveToken(tokens.refresh_token);
    oauth2Client.setCredentials(freshCreds);
  } else {
    oauth2Client.setCredentials({
      refresh_token: tokens.refresh_token,
      access_token: tokens.access_token,
    });
  }

  return oauth2Client;
}

export async function createCalendarEvent({
  summary,
  description,
  startDateTime,
  endDateTime,
}: {
  summary: string;
  description: string;
  startDateTime: string; // ISO string
  endDateTime: string; // ISO string
}) {
  const auth = await getAuthenticatedClient();
  const calendar = google.calendar({ version: "v3", auth });

  const response = await calendar.events.insert({
    calendarId: "primary",
    requestBody: {
      summary,
      description,
      start: {
        dateTime: startDateTime,
        timeZone: "America/Sao_Paulo",
      },
      end: {
        dateTime: endDateTime,
        timeZone: "America/Sao_Paulo",
      },
    },
  });

  return response.data;
}

export async function deleteCalendarEvent(eventId: string) {
  const auth = await getAuthenticatedClient();
  const calendar = google.calendar({ version: "v3", auth });

  await calendar.events.delete({
    calendarId: "primary",
    eventId,
  });
}
