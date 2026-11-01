"use client";

import Icon, { type IconName } from "@/components/admin/shared/Icon";
import { getInitials } from "@/lib/admin-formatters";
import type { ActiveSection, AdminSession } from "@/types/admin";
import { useState } from "react";

const navigation: { id: ActiveSection; label: string; icon: IconName }[] = [
  { id: "overview", label: "Overview", icon: "grid" },
  { id: "customers", label: "Customers", icon: "users" },
];

type AdminSidebarProps = {
  activeSection: ActiveSection;
  session: AdminSession;
  customerCount?: number;
  isOpen: boolean;
  onSelectSection: (section: ActiveSection) => void;
  onSignOut: () => void;
};

export default function AdminSidebar({
  activeSection,
  session,
  customerCount,
  isOpen,
  onSelectSection,
  onSignOut,
}: AdminSidebarProps) {
  const isCatalogSection =
    activeSection === "categories" || activeSection === "banners";
  const [catalogOpen, setCatalogOpen] = useState(isCatalogSection);

  return (
    <aside className={`admin-sidebar${isOpen ? " sidebar-open" : ""}`}>
      <a className="sidebar-brand" href="#" onClick={(event) => event.preventDefault()}>
        <span className="brand-symbol">ॐ</span>
        <span className="brand-name">KALASH <b>&amp;</b> KUMKUM<small>ADMIN CONSOLE</small></span>
      </a>
      <div className="sidebar-store">
        <span className="store-avatar">K</span>
        <span><strong>Kalash &amp; Kumkum</strong><small>Store workspace</small></span>
        <span className="store-menu">⌄</span>
      </div>
      <span className="nav-label">WORKSPACE</span>
      <nav className="sidebar-nav" aria-label="Admin navigation">
        {navigation.slice(0, 2).map((item) => (
          <button
            className={activeSection === item.id ? "nav-item nav-active" : "nav-item"}
            type="button"
            key={item.id}
            onClick={() => onSelectSection(item.id)}
          >
            <Icon name={item.icon} />
            <span>{item.label}</span>
            {item.id === "customers" && customerCount !== undefined && (
              <span className="nav-count">{customerCount}</span>
            )}
          </button>
        ))}
        <button
          className={catalogOpen || isCatalogSection ? "nav-item nav-active" : "nav-item"}
          type="button"
          aria-expanded={catalogOpen}
          onClick={() => setCatalogOpen((open) => !open)}
        >
          <Icon name="grid" />
          <span>Catalog</span>
          <Icon name="chevron-down" size={14} />
        </button>
        {catalogOpen && (
          <div className="sidebar-subnav">
            <button
              type="button"
              className={activeSection === "categories" ? "subnav-item subnav-active" : "subnav-item"}
              onClick={() => onSelectSection("categories")}
            >
              Categories
            </button>
            <button
              type="button"
              className={activeSection === "banners" ? "subnav-item subnav-active" : "subnav-item"}
              onClick={() => onSelectSection("banners")}
            >
              Homepage banners
            </button>
          </div>
        )}
      </nav>
      <div className="sidebar-bottom">
        <div className="sidebar-help">
          <span className="help-mark">?</span>
          <strong>Need a hand?</strong>
          <p>Your workspace is ready for the next step.</p>
        </div>
        <button type="button" className="sign-out-button" onClick={onSignOut}>
          <Icon name="logout" />
          Sign out
        </button>
        <div className="sidebar-profile">
          <span className="profile-avatar">{getInitials(session.name)}</span>
          <span><strong>{session.name}</strong><small>Administrator</small></span>
          <span className="profile-menu">···</span>
        </div>
      </div>
    </aside>
  );
}
