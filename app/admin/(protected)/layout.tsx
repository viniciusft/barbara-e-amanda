import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import SessionProvider from "@/components/admin/SessionProvider";
import AdminNav from "@/components/admin/AdminNav";

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
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
        <AdminNav />
        <main className="flex-1 p-6 max-w-6xl mx-auto w-full">{children}</main>
      </div>
    </SessionProvider>
  );
}
