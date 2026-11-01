"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CUSTOMER_PAGE_SIZE } from "@/constants/admin";
import {
  adminApiRequest,
  authenticateAdmin,
  clearAdminSession,
  readAdminSession,
  saveAdminSession,
} from "@/lib/admin-api";
import type {
  ActiveSection,
  AdminSession,
  DashboardData,
  UsersData,
} from "@/types/admin";

export function useAdminPanel() {
  const [session, setSession] = useState<AdminSession | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [activeSection, setActiveSection] = useState<ActiveSection>("overview");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [usersData, setUsersData] = useState<UsersData | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [dataError, setDataError] = useState("");

  useEffect(() => {
    setSession(readAdminSession());
    setHydrated(true);
  }, []);

  const loadDashboard = useCallback(
    async (token: string, signal?: AbortSignal) => {
      setIsLoading(true);
      setDataError("");
      try {
        const dashboardData = await adminApiRequest<DashboardData>(
          "/admin/dashboard",
          token,
        );
        if (signal?.aborted) return;
        setDashboard(dashboardData);
      } catch (requestError) {
        if (signal?.aborted) return;
        const message =
          requestError instanceof Error
            ? requestError.message
            : "Unable to load admin data.";
        setDataError(message);
        if (message.includes("token") || message.includes("Authentication")) {
          clearAdminSession();
          setSession(null);
        }
      } finally {
        if (!signal?.aborted) setIsLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (!session) return;
    const controller = new AbortController();
    void loadDashboard(session.token, controller.signal);
    return () => controller.abort();
  }, [session, loadDashboard]);

  useEffect(() => {
    if (!session || activeSection !== "customers") return;
    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setIsLoading(true);
      setDataError("");
      try {
        const data = await adminApiRequest<UsersData>(
          `/admin/users?page=${page}&pageSize=${CUSTOMER_PAGE_SIZE}&role=CUSTOMER&search=${encodeURIComponent(search.trim())}`,
          session.token,
        );
        if (!controller.signal.aborted) setUsersData(data);
      } catch (requestError) {
        if (!controller.signal.aborted) {
          setDataError(
            requestError instanceof Error
              ? requestError.message
              : "Unable to load customers.",
          );
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }, 250);
    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [activeSection, page, search, session]);

  const customerUsers = useMemo(
    () => usersData?.users.filter((user) => user.role === "CUSTOMER") ?? [],
    [usersData],
  );

  async function signIn(email: string, password: string) {
    setError("");
    setIsSigningIn(true);
    try {
      const adminSession = await authenticateAdmin(email, password);
      saveAdminSession(adminSession);
      setSession(adminSession);
      return true;
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to sign in. Please try again.",
      );
      return false;
    } finally {
      setIsSigningIn(false);
    }
  }

  function signOut() {
    clearAdminSession();
    setSession(null);
    setDashboard(null);
    setUsersData(null);
    setActiveSection("overview");
  }

  function selectSection(section: ActiveSection) {
    setActiveSection(section);
    setMobileSidebarOpen(false);
  }

  return {
    session,
    hydrated,
    activeSection,
    mobileSidebarOpen,
    setMobileSidebarOpen,
    dashboard,
    usersData,
    customerUsers,
    search,
    setSearch,
    page,
    setPage,
    isSigningIn,
    isLoading,
    error,
    dataError,
    loadDashboard,
    signIn,
    signOut,
    selectSection,
  };
}
