import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { GlobalSearch } from "@/components/layout/global-search";
import { LogoMark } from "@/components/layout/logo";
import { Notifications } from "@/components/layout/notifications";
import { UserMenu } from "@/components/layout/user-menu";

export function Topbar() {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur-sm md:h-16 md:px-8">
      <Link href="/dashboard" aria-label="Doctor Tracker home" className="md:hidden">
        <LogoMark />
      </Link>
      <div className="min-w-0 flex-1">
        <Breadcrumbs />
      </div>
      <GlobalSearch />
      <Notifications />
      <UserMenu />
    </header>
  );
}
