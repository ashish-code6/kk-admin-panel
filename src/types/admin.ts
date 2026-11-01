export type AdminUser = {
  id: string;
  name: string;
  email: string;
  mobile: string;
  role: "ADMIN" | "CUSTOMER";
  createdAt: string;
};

export type DashboardData = {
  metrics: {
    totalUsers: number;
    customers: number;
    admins: number;
    newUsersThisWeek: number;
  };
  recentUsers: AdminUser[];
};

export type UsersData = {
  users: AdminUser[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

export type AdminSession = {
  token: string;
  name: string;
  email: string;
};

export type ActiveSection = "overview" | "customers" | "banners" | "categories";

export type AdminCategory = {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  parentId: string | null;
  _count: { children: number };
};

export type AdminBanner = {
  slot: number;
  eyebrow: string;
  title: string;
  subtitle: string;
  caption: string;
  ctaLabel: string;
  ctaHref: string;
  imageUrl: string;
  imagePublicId: string | null;
  isActive: boolean;
  updatedAt: string;
};

export type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data?: T;
};
