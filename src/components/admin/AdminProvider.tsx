"use client";

import { createContext, type ReactNode, useContext } from "react";

const AdminContext = createContext(false);

export function AdminProvider({ isAdmin, children }: { isAdmin: boolean; children: ReactNode }) {
  return <AdminContext.Provider value={isAdmin}>{children}</AdminContext.Provider>;
}

export function useIsAdmin() {
  return useContext(AdminContext);
}
