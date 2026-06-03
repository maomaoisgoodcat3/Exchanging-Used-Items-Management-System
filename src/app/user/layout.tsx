import RoleDashboardLayout from "@/components/layout/RoleDashboardLayout";

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RoleDashboardLayout scope="user">{children}</RoleDashboardLayout>;
}
