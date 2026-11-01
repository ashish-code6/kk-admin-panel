"use client";

import Icon from "@/components/admin/shared/Icon";
import { getInitials } from "@/lib/admin-formatters";
import type { ActiveSection, AdminSession } from "@/types/admin";

type AdminTopbarProps = {
  activeSection: ActiveSection;
  session: AdminSession;
  onOpenNavigation: () => void;
};

export default function AdminTopbar({
  activeSection,
  session,
  onOpenNavigation,
}: AdminTopbarProps) {
  return (
    <header className="topbar">
      <button
        type="button"
        className="mobile-menu-button"
        aria-label="Open navigation"
        onClick={onOpenNavigation}
      >
        <Icon name="menu" />
      </button>
      <div className="breadcrumbs">
        <span>Workspace</span>
        <Icon name="chevron" size={14} />
        <strong>
          {activeSection === "overview"
            ? "Overview"
            : activeSection === "customers"
              ? "Customers"
              : activeSection === "banners"
                ? "Homepage banners"
                : activeSection === "puja-kits"
                  ? "Puja Kits"
                  : "Categories"}
        </strong>
      </div>
      <div className="topbar-actions">
        <span className="today-label">
          <Icon name="calendar" size={16} />
          {new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date())}
        </span>
        <button type="button" className="notification-button" aria-label="Notifications">
          <Icon name="bell" />
          <i />
        </button>
        <span className="topbar-avatar">{getInitials(session.name)}</span>
      </div>
    </header>
  );
}
