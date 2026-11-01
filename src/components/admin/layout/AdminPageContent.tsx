"use client";

import CustomersTable from "@/components/admin/customers/CustomersTable";
import DashboardOverview from "@/components/admin/dashboard/DashboardOverview";
import BannerManager from "@/components/admin/banners/BannerManager";
import CategoryManager from "@/components/admin/categories/CategoryManager";
import type {
  ActiveSection,
  AdminUser,
  DashboardData,
  UsersData,
} from "@/types/admin";

type AdminPageContentProps = {
  activeSection: ActiveSection;
  adminToken: string;
  dashboard: DashboardData | null;
  users: AdminUser[];
  usersData: UsersData | null;
  search: string;
  page: number;
  isLoading: boolean;
  dataError: string;
  onRetry: () => void;
  onViewCustomers: () => void;
  onSearchChange: (value: string) => void;
  onPageChange: (page: number) => void;
};

export default function AdminPageContent({
  activeSection,
  adminToken,
  dashboard,
  users,
  usersData,
  search,
  page,
  isLoading,
  dataError,
  onRetry,
  onViewCustomers,
  onSearchChange,
  onPageChange,
}: AdminPageContentProps) {
  const isOverview = activeSection === "overview";
  const isCustomers = activeSection === "customers";
  const isCategories = activeSection === "categories";

  return (
    <div className="page-content">
      <section className="page-heading">
        <div>
          <span className="overline">STORE OVERVIEW</span>
          <h1>
            {isOverview
              ? "Good to see you."
              : isCustomers
                ? "Customers"
                : activeSection === "banners"
                  ? "Homepage banners"
                  : "Categories"}
          </h1>
          <p>
            {isOverview
              ? "Here’s what’s happening with your store today."
              : isCustomers
                ? "View and search customer accounts registered with your store."
                : activeSection === "banners"
                  ? "Manage the two slides shown in your storefront homepage carousel."
                  : "Organize Shop by Category and create nested subcategories."}
          </p>
        </div>
        <span className="live-pill"><i /> Live data</span>
      </section>

      {dataError && (
        <div className="data-error" role="alert">
          <span>{dataError}</span>
          <button type="button" onClick={onRetry}>Retry</button>
        </div>
      )}

      {isOverview && (
        <DashboardOverview
          dashboard={dashboard}
          onViewCustomers={onViewCustomers}
        />
      )}
      {isCustomers && (
        <CustomersTable
          activeSection={activeSection}
          users={users}
          usersData={usersData}
          search={search}
          page={page}
          isLoading={isLoading}
          onSearchChange={onSearchChange}
          onPageChange={onPageChange}
        />
      )}
      {activeSection === "banners" && <BannerManager token={adminToken} />}
      {isCategories && <CategoryManager token={adminToken} />}
      <footer className="page-footer">
        <span>© {new Date().getFullYear()} KALASH &amp; KUMKUM</span>
        <span>Admin workspace <i /> Secure connection</span>
      </footer>
    </div>
  );
}
