// This layout is intentionally a passthrough — it covers /admin/login (public)
// and the (protected) route group adds auth checking for all dashboard routes.
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
