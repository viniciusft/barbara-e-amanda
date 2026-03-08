import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { createServerSupabaseClient } from "./supabase";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          access_type: "offline",
          prompt: "consent",
          scope:
            "openid email profile https://www.googleapis.com/auth/calendar",
        },
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({ user, account }) {
      const adminEmail = process.env.ADMIN_EMAIL;
      if (!adminEmail || user.email !== adminEmail) {
        return false;
      }

      // Save tokens to admin_config if present
      if (account?.refresh_token || account?.access_token) {
        try {
          const supabaseServer = createServerSupabaseClient();

          // Get or create admin_config row
          const { data: existing } = await supabaseServer
            .from("admin_config")
            .select("id")
            .limit(1)
            .single();

          const tokenExpiry = account.expires_at
            ? new Date(account.expires_at * 1000).toISOString()
            : null;

          if (existing) {
            const updates: Record<string, string | null> = {
              updated_at: new Date().toISOString(),
            };
            if (account.refresh_token) {
              updates.google_refresh_token = account.refresh_token;
            }
            if (account.access_token) {
              updates.google_access_token = account.access_token;
            }
            if (tokenExpiry) {
              updates.google_token_expiry = tokenExpiry;
            }
            await supabaseServer
              .from("admin_config")
              .update(updates)
              .eq("id", existing.id);
          } else {
            await supabaseServer.from("admin_config").insert({
              google_refresh_token: account.refresh_token ?? null,
              google_access_token: account.access_token ?? null,
              google_token_expiry: tokenExpiry,
            });
          }
        } catch (err) {
          console.error("Failed to save Google tokens:", err);
        }
      }

      return true;
    },
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Always use HTTPS on production — prevent http:// redirect loops on Vercel
      const safeBase = baseUrl.startsWith("http://")
        ? baseUrl.replace("http://", "https://")
        : baseUrl;

      if (url.startsWith("/")) return `${safeBase}${url}`;
      if (url.startsWith(safeBase)) return url;
      // Also accept http variant of the same host (Vercel internal)
      if (url.startsWith(safeBase.replace("https://", "http://"))) {
        return url.replace("http://", "https://");
      }
      return safeBase;
    },
  },
  pages: {
    signIn: "/admin/login",
    error: "/admin/login",
  },
  // Trust the NEXTAUTH_URL env var — critical for Vercel
  ...(process.env.NEXTAUTH_URL ? { url: process.env.NEXTAUTH_URL } : {}),
};

declare module "next-auth" {
  interface Session {
    accessToken?: string;
  }
}
