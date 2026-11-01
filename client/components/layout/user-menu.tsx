"use client";

import { LogOut, Settings } from "lucide-react";
import Link from "next/link";
import { UserAvatar } from "@/components/data/user-avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCurrentAdmin } from "@/components/layout/admin-context";
import { useLogout } from "@/components/layout/use-logout";

export function UserMenu() {
  const admin = useCurrentAdmin();
  const logout = useLogout();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Account menu"
        className="rounded-full focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        <UserAvatar name={admin.name} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <span className="block truncate text-sm font-medium text-foreground">{admin.name}</span>
          <span className="block truncate text-xs text-muted-foreground">{admin.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <Settings /> Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={logout}>
          <LogOut /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
