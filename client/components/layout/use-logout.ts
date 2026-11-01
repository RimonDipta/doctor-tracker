"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";

export function useLogout() {
  const client = useQueryClient();
  return useCallback(async () => {
    try {
      await api<void>("/auth/logout", { method: "POST" });
      client.clear();
      window.location.assign("/login");
    } catch (error) {
      toast.error((error as Error).message);
    }
  }, [client]);
}
