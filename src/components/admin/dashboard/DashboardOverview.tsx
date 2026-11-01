"use client";

import Icon from "@/components/admin/shared/Icon";
import type { DashboardData } from "@/types/admin";

type DashboardOverviewProps = {
  dashboard: DashboardData | null;
  onViewCustomers: () => void;
};

export default function DashboardOverview({
  dashboard,
  onViewCustomers,
}: DashboardOverviewProps) {
  const metrics = dashboard?.metrics;

  return (
    <>
      <section className="metric-grid" aria-label="Store metrics">
        <article className="metric-card">
          <div className="metric-top"><span className="metric-icon icon-violet"><Icon name="users" /></span><span className="metric-period">All time</span></div>
          <span className="metric-label">Total accounts</span>
          <strong className="metric-value">{metrics?.totalUsers ?? "—"}</strong>
          <span className="metric-foot">Registered store accounts</span>
        </article>
        <article className="metric-card">
          <div className="metric-top"><span className="metric-icon icon-amber"><Icon name="users" /></span><span className="metric-period">Customers</span></div>
          <span className="metric-label">Customer accounts</span>
          <strong className="metric-value">{metrics?.customers ?? "—"}</strong>
          <span className="metric-foot">Active customer profiles</span>
        </article>
        <article className="metric-card">
          <div className="metric-top"><span className="metric-icon icon-green"><Icon name="arrow" /></span><span className="metric-period">Last 7 days</span></div>
          <span className="metric-label">New this week</span>
          <strong className="metric-value">{metrics?.newUsersThisWeek ?? "—"}</strong>
          <span className="metric-foot">New account registrations</span>
        </article>
        <article className="metric-card">
          <div className="metric-top"><span className="metric-icon icon-rose"><Icon name="shield" /></span><span className="metric-period">Protected</span></div>
          <span className="metric-label">Administrators</span>
          <strong className="metric-value">{metrics?.admins ?? "—"}</strong>
          <span className="metric-foot">Accounts with admin access</span>
        </article>
      </section>
      <section className="insight-banner">
        <span className="insight-icon">✦</span>
        <div>
          <strong>Your workspace, at a glance</strong>
          <p>Customer and account numbers are connected to your live PostgreSQL database.</p>
        </div>
        <button type="button" onClick={onViewCustomers}>View customers <span>→</span></button>
      </section>
    </>
  );
}
