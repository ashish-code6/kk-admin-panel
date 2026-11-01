"use client";

import AdminLogin from "@/components/admin/auth/AdminLogin";
import AdminLayout from "@/components/admin/layout/AdminLayout";
import { useAdminPanel } from "@/hooks/use-admin-panel";

export default function AdminPanel() {
  const admin = useAdminPanel();
  const session = admin.session;

  if (!admin.hydrated) {
    return <main className="admin-loading">Loading administration…</main>;
  }

  if (!session) {
    return (
      <AdminLogin
        error={admin.error}
        isSigningIn={admin.isSigningIn}
        onSignIn={admin.signIn}
      />
    );
  }

  const displayedUsers =
    admin.activeSection === "customers"
      ? admin.customerUsers
      : admin.dashboard?.recentUsers ?? [];

  return (
    <AdminLayout
      session={session}
      activeSection={admin.activeSection}
      mobileSidebarOpen={admin.mobileSidebarOpen}
      dashboard={admin.dashboard}
      users={displayedUsers}
      usersData={admin.usersData}
      search={admin.search}
      page={admin.page}
      isLoading={admin.isLoading}
      dataError={admin.dataError}
      onToggleSidebar={admin.setMobileSidebarOpen}
      onSelectSection={admin.selectSection}
      onSignOut={admin.signOut}
      onRetry={() => void admin.loadDashboard(session.token)}
      onSearchChange={(value) => {
        admin.setSearch(value);
        admin.setPage(1);
      }}
      onPageChange={admin.setPage}
    />
  );
}
