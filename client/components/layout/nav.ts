import { LayoutDashboard, Settings, Stethoscope, Users } from "lucide-react";

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/doctors", label: "Doctors", icon: Stethoscope },
  { href: "/patients", label: "Patients", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export const isActivePath = (pathname: string, href: string) =>
  pathname === href || pathname.startsWith(`${href}/`);
