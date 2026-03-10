import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import SessionProvider from "@/components/admin/SessionProvider";
import AdminNav from "@/components/admin/AdminNav";
import ThemeApplier from "@/components/admin/ThemeApplier";

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/admin/login");
  }

  return (
    <SessionProvider session={session}>
      <ThemeApplier />
      <div className="admin-root min-h-screen">
        <AdminNav />
        {/* lg:pl-56 offsets fixed sidebar; pb-20 offsets mobile bottom nav */}
        <main className="lg:pl-56 pb-20 lg:pb-0">
          <div className="max-w-6xl mx-auto px-4 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </SessionProvider>
  );
}
