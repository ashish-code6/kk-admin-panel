"use client";

import Icon from "@/components/admin/shared/Icon";
import { CUSTOMER_PAGE_SIZE } from "@/constants/admin";
import { formatDate, getInitials } from "@/lib/admin-formatters";
import type { AdminUser, ActiveSection, UsersData } from "@/types/admin";

type CustomersTableProps = {
  activeSection: ActiveSection;
  users: AdminUser[];
  usersData: UsersData | null;
  search: string;
  page: number;
  isLoading: boolean;
  onSearchChange: (value: string) => void;
  onPageChange: (page: number) => void;
};

export default function CustomersTable({
  activeSection,
  users,
  usersData,
  search,
  page,
  isLoading,
  onSearchChange,
  onPageChange,
}: CustomersTableProps) {
  const customerSection = activeSection === "customers";

  return (
    <section className="table-card">
      <div className="table-heading">
        <div>
          <h2>{customerSection ? "All customers" : "Recent accounts"}</h2>
          <p>
            {customerSection
              ? `${usersData?.pagination.total ?? 0} customer accounts`
              : "The latest accounts created in your store."}
          </p>
        </div>
        {customerSection && (
          <label className="table-search">
            <Icon name="search" size={16} />
            <input
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search name, email or mobile"
              aria-label="Search customers"
            />
          </label>
        )}
        {isLoading && <span className="refresh-indicator">Updating…</span>}
      </div>
      <div className="table-scroll">
        <table>
          <thead><tr><th>Customer</th><th>Contact</th><th>Role</th><th>Joined</th></tr></thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>
                  <div className="customer-cell">
                    <span className="customer-avatar">{getInitials(user.name)}</span>
                    <span><strong>{user.name}</strong><small>{user.email}</small></span>
                  </div>
                </td>
                <td className="mobile-cell">{user.mobile}</td>
                <td>
                  <span className={`role-badge${user.role === "ADMIN" ? " role-admin" : ""}`}>
                    <i />{user.role === "ADMIN" ? "Admin" : "Customer"}
                  </span>
                </td>
                <td className="date-cell">{formatDate(user.createdAt)}</td>
              </tr>
            ))}
            {!isLoading && users.length === 0 && (
              <tr>
                <td className="empty-table" colSpan={4}>
                  {search ? "No customers match your search." : "No customer accounts yet."}
                </td>
              </tr>
            )}
            {isLoading && users.length === 0 && (
              <tr><td className="empty-table" colSpan={4}>Loading customer data…</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {customerSection && usersData && (
        <div className="table-pagination">
          <span>
            Showing {usersData.pagination.total === 0 ? 0 : (page - 1) * CUSTOMER_PAGE_SIZE + 1}
            –{Math.min(page * CUSTOMER_PAGE_SIZE, usersData.pagination.total)} of {usersData.pagination.total}
          </span>
          <div>
            <button type="button" disabled={page <= 1 || isLoading} onClick={() => onPageChange(page - 1)}>Previous</button>
            <span>Page {page} of {Math.max(usersData.pagination.totalPages, 1)}</span>
            <button
              type="button"
              disabled={page >= usersData.pagination.totalPages || isLoading}
              onClick={() => onPageChange(page + 1)}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
