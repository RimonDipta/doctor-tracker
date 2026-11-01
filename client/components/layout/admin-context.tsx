"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { Admin } from "@/lib/types";

interface AdminContextValue {
  admin: Admin;
  setAdmin: (admin: Admin) => void;
}

const AdminContext = createContext<AdminContextValue | null>(null);

export function AdminProvider({ initial, children }: { initial: Admin; children: ReactNode }) {
  const [admin, setAdmin] = useState(initial);
  const value = useMemo(() => ({ admin, setAdmin }), [admin]);
  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

function useAdminContext() {
  const value = useContext(AdminContext);
  if (!value) throw new Error("useCurrentAdmin must be used inside AdminProvider");
  return value;
}

export const useCurrentAdmin = () => useAdminContext().admin;
export const useSetCurrentAdmin = () => useAdminContext().setAdmin;
