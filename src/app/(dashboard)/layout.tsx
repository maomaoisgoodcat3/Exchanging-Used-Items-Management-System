import RoleDashboardLayout from "@/components/layout/RoleDashboardLayout";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RoleDashboardLayout>{children}</RoleDashboardLayout>;
}
