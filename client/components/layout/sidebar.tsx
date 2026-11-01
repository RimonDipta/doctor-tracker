"use client";

import { LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserAvatar } from "@/components/data/user-avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useCurrentAdmin } from "@/components/layout/admin-context";
import { Logo, LogoMark } from "@/components/layout/logo";
import { isActivePath, NAV_ITEMS } from "@/components/layout/nav";
import { useLogout } from "@/components/layout/use-logout";
import { cn } from "@/lib/utils";

/** Icon rail on tablets, labelled sidebar on desktop, replaced by BottomNav on phones. */
export function Sidebar() {
  const pathname = usePathname();
  const admin = useCurrentAdmin();
  const logout = useLogout();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-16 flex-col border-r bg-sidebar md:flex lg:w-56">
      <Link
        href="/dashboard"
        aria-label="Doctor Tracker home"
        className="flex h-16 items-center justify-center px-5 lg:justify-start"
      >
        <LogoMark className="lg:hidden" />
        <Logo className="hidden lg:flex" />
      </Link>

      <nav aria-label="Main" className="flex-1 space-y-0.5 px-3 pt-4">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isActivePath(pathname, href);
          return (
            <Tooltip key={href}>
              <TooltipTrigger asChild>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  aria-label={label}
                  className={cn(
                    "relative flex h-9 items-center justify-center gap-3 rounded-md text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground lg:justify-start lg:px-3",
                    active && "bg-sidebar-accent font-medium text-foreground",
                  )}
                >
                  {active && (
                    <span className="absolute inset-y-2 -left-3 w-0.5 rounded-r bg-primary" />
                  )}
                  <Icon className={cn("size-4", active && "text-primary")} strokeWidth={1.75} />
                  <span className="hidden lg:inline">{label}</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" className="lg:hidden">
                {label}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </nav>

      <div className="border-t p-3">
        <div className="flex flex-col items-center gap-2 lg:flex-row">
          <Link
            href="/settings"
            aria-label="Your profile"
            className="flex min-w-0 flex-1 items-center gap-2.5 rounded-md lg:p-1"
          >
            <UserAvatar name={admin.name} />
            <span className="hidden min-w-0 lg:block">
              <span className="block truncate text-[13px] font-medium">{admin.name}</span>
              <span className="block truncate text-xs text-muted-foreground">{admin.email}</span>
            </span>
          </Link>
          <button
            type="button"
            onClick={logout}
            aria-label="Sign out"
            className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <LogOut className="size-4" strokeWidth={1.75} />
          </button>
        </div>
      </div>
    </aside>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t bg-card pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = isActivePath(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative flex h-14 flex-col items-center justify-center gap-1 text-[11px] text-muted-foreground",
              active && "font-medium text-foreground",
            )}
          >
            {active && <span className="absolute inset-x-6 top-0 h-0.5 rounded-b bg-primary" />}
            <Icon className={cn("size-[18px]", active && "text-primary")} strokeWidth={1.75} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
