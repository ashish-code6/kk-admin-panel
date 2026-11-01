"use client";

import AdminPageContent from "@/components/admin/layout/AdminPageContent";
import AdminSidebar from "@/components/admin/layout/AdminSidebar";
import AdminTopbar from "@/components/admin/layout/AdminTopbar";
import type {
  ActiveSection,
  AdminSession,
  AdminUser,
  DashboardData,
  UsersData,
} from "@/types/admin";

type AdminLayoutProps = {
  session: AdminSession;
  activeSection: ActiveSection;
  mobileSidebarOpen: boolean;
  dashboard: DashboardData | null;
  users: AdminUser[];
  usersData: UsersData | null;
  search: string;
  page: number;
  isLoading: boolean;
  dataError: string;
  onToggleSidebar: (open: boolean) => void;
  onSelectSection: (section: ActiveSection) => void;
  onSignOut: () => void;
  onRetry: () => void;
  onSearchChange: (value: string) => void;
  onPageChange: (page: number) => void;
};

export default function AdminLayout({
  session,
  activeSection,
  mobileSidebarOpen,
  dashboard,
  users,
  usersData,
  search,
  page,
  isLoading,
  dataError,
  onToggleSidebar,
  onSelectSection,
  onSignOut,
  onRetry,
  onSearchChange,
  onPageChange,
}: AdminLayoutProps) {
  return (
    <main className="admin-shell">
      {mobileSidebarOpen && (
        <button
          className="sidebar-backdrop"
          type="button"
          aria-label="Close navigation"
          onClick={() => onToggleSidebar(false)}
        />
      )}
      <AdminSidebar
        activeSection={activeSection}
        session={session}
        customerCount={dashboard?.metrics.customers}
        isOpen={mobileSidebarOpen}
        onSelectSection={onSelectSection}
        onSignOut={onSignOut}
      />
      <section className="admin-main">
        <AdminTopbar
          activeSection={activeSection}
          session={session}
          onOpenNavigation={() => onToggleSidebar(true)}
        />
        <AdminPageContent
          activeSection={activeSection}
          adminToken={session.token}
          dashboard={dashboard}
          users={users}
          usersData={usersData}
          search={search}
          page={page}
          isLoading={isLoading}
          dataError={dataError}
          onRetry={onRetry}
          onViewCustomers={() => onSelectSection("customers")}
          onSearchChange={onSearchChange}
          onPageChange={onPageChange}
        />
      </section>
    </main>
  );
}
