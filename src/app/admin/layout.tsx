import RoleDashboardLayout from "@/components/layout/RoleDashboardLayout";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RoleDashboardLayout scope="admin">{children}</RoleDashboardLayout>;
}
