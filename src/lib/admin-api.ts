import { ADMIN_SESSION_KEY } from "@/constants/admin";
import type {
  AdminBanner,
  AdminCategory,
  AdminPujaKit,
  AdminSession,
  ApiResponse,
} from "@/types/admin";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

export function readAdminSession(): AdminSession | null {
  try {
    const rawSession = sessionStorage.getItem(ADMIN_SESSION_KEY);
    if (!rawSession) return null;

    const session: unknown = JSON.parse(rawSession);
    if (!session || typeof session !== "object") {
      sessionStorage.removeItem(ADMIN_SESSION_KEY);
      return null;
    }

    const candidate = session as Record<string, unknown>;
    if (
      typeof candidate.token !== "string" ||
      typeof candidate.name !== "string" ||
      typeof candidate.email !== "string"
    ) {
      sessionStorage.removeItem(ADMIN_SESSION_KEY);
      return null;
    }

    return {
      token: candidate.token,
      name: candidate.name,
      email: candidate.email,
    };
  } catch {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    return null;
  }
}

export function saveAdminSession(session: AdminSession) {
  sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
}

export function clearAdminSession() {
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
}

export async function adminApiRequest<T>(
  path: string,
  token: string,
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });
  const payload = (await response.json()) as ApiResponse<T>;
  if (!response.ok || !payload.success || payload.data === undefined) {
    throw new Error(payload.message || "The request could not be completed.");
  }
  return payload.data;
}

async function adminMutation<T>(
  path: string,
  token: string,
  init: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init.body instanceof Blob
        ? { "Content-Type": init.body.type }
        : { "Content-Type": "application/json" }),
    },
    cache: "no-store",
  });
  const payload = (await response.json()) as ApiResponse<T>;
  if (!response.ok || !payload.success || payload.data === undefined) {
    throw new Error(payload.message || "The request could not be completed.");
  }
  return payload.data;
}

export function getAdminBanners(token: string) {
  return adminApiRequest<AdminBanner[]>("/admin/banners", token);
}

export function updateAdminBanner(
  token: string,
  slot: number,
  banner: Omit<AdminBanner, "slot" | "imageUrl" | "imagePublicId" | "updatedAt">,
) {
  return adminMutation<AdminBanner>(`/admin/banners/${slot}`, token, {
    method: "PUT",
    body: JSON.stringify(banner),
  });
}

export function uploadAdminBannerImage(
  token: string,
  slot: number,
  image: File,
) {
  return adminMutation<AdminBanner>(
    `/admin/banners/${slot}/image`,
    token,
    { method: "POST", body: image },
  );
}

export function getAdminCategories(token: string) {
  return adminApiRequest<AdminCategory[]>("/admin/categories", token);
}

export function saveAdminCategory(
  token: string,
  category: {
    id?: string;
    name: string;
    sortOrder: number;
    isActive: boolean;
    parentId: string | null;
  },
) {
  const { id, ...body } = category;
  return adminMutation<AdminCategory>(
    id ? `/admin/categories/${encodeURIComponent(id)}` : "/admin/categories",
    token,
    {
      method: id ? "PUT" : "POST",
      body: JSON.stringify(body),
    },
  );
}

export function uploadAdminCategoryImage(
  token: string,
  id: string,
  image: File,
) {
  return adminMutation<AdminCategory>(
    `/admin/categories/${encodeURIComponent(id)}/image`,
    token,
    { method: "POST", body: image },
  );
}

export function getAdminPujaKits(token: string) {
  return adminApiRequest<AdminPujaKit[]>("/admin/puja-kits", token);
}

export function saveAdminPujaKit(
  token: string,
  kit: Omit<AdminPujaKit, "id" | "imagePublicId"> & { id?: string },
) {
  const { id, ...body } = kit;
  return adminMutation<AdminPujaKit>(
    id ? `/admin/puja-kits/${encodeURIComponent(id)}` : "/admin/puja-kits",
    token,
    {
      method: id ? "PUT" : "POST",
      body: JSON.stringify(body),
    },
  );
}

export function uploadAdminPujaKitImage(
  token: string,
  id: string,
  image: File,
) {
  return adminMutation<AdminPujaKit>(
    `/admin/puja-kits/${encodeURIComponent(id)}/image`,
    token,
    { method: "POST", body: image },
  );
}

export function uploadAdminPujaKitGalleryImage(
  token: string,
  id: string,
  image: File,
) {
  return adminMutation<AdminPujaKit>(
    `/admin/puja-kits/${encodeURIComponent(id)}/gallery`,
    token,
    { method: "POST", body: image },
  );
}

export async function deleteAdminPujaKit(token: string, id: string) {
  const response = await fetch(
    `${API_BASE_URL}/admin/puja-kits/${encodeURIComponent(id)}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    },
  );
  const payload = (await response.json()) as ApiResponse<undefined>;
  if (!response.ok || !payload.success) {
    throw new Error(payload.message || "Unable to delete puja kit.");
  }
}

export async function deleteAdminCategory(token: string, id: string) {
  const response = await fetch(
    `${API_BASE_URL}/admin/categories/${encodeURIComponent(id)}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    },
  );
  const payload = (await response.json()) as ApiResponse<undefined>;
  if (!response.ok || !payload.success) {
    throw new Error(payload.message || "Unable to delete category.");
  }
}

export async function authenticateAdmin(
  email: string,
  password: string,
): Promise<AdminSession> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email.trim(), password }),
  });
  const payload = (await response.json()) as ApiResponse<{
    user?: { name?: unknown; email?: unknown; role?: unknown };
    token?: unknown;
  }>;

  if (!response.ok || !payload.success) {
    throw new Error(payload.message || "Sign in failed.");
  }

  const user = payload.data?.user;
  const token = payload.data?.token;
  if (
    user?.role !== "ADMIN" ||
    typeof user.name !== "string" ||
    typeof user.email !== "string" ||
    typeof token !== "string"
  ) {
    throw new Error("This account does not have administrator access.");
  }

  return { token, name: user.name, email: user.email };
}
