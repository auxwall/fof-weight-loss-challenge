"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import {
  LayoutDashboard,
  Settings,
  Users,
  UserCheck,
  Trophy,
  LogOut,
  ChevronRight,
} from "lucide-react";

export default function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Settings", href: "/admin/settings", icon: Settings },
    { label: "Staff & Branches", href: "/admin/staff", icon: UserCheck },
    { label: "Participants", href: "/admin/users", icon: Users },
    { label: "Winners & Reveal", href: "/admin/winners", icon: Trophy, highlight: true },
  ];

  const handleLogout = async () => {
    await fetch("/api/staff/logout", { method: "POST" });
    router.push("/staff/login");
    router.refresh();
  };

  return (
    <header className="border-b border-surface-border bg-surface/90 backdrop-blur sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 min-h-[4.5rem] py-2 flex items-center justify-between">
        <div className="flex items-center gap-4 sm:gap-6">
          <Logo size="md" href="/admin/dashboard" />
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  isActive
                    ? item.highlight
                      ? "bg-gymRed text-white shadow-sm"
                      : "bg-surface-card text-white border border-surface-border"
                    : item.highlight
                    ? "text-gymRed hover:bg-gymRed/10"
                    : "text-zinc-400 hover:text-white hover:bg-surface-card"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right Action */}
        <div className="flex items-center gap-2">
          <Link
            href="/staff/dashboard"
            className="hidden sm:inline-flex text-xs text-zinc-400 hover:text-white px-2.5 py-1.5 rounded-lg border border-surface-border hover:bg-surface-hover"
          >
            Floor View
          </Link>
          <button
            onClick={handleLogout}
            title="Sign Out"
            className="p-2 rounded-lg bg-surface-card border border-surface-border hover:bg-surface-hover text-zinc-400 hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div className="md:hidden flex items-center overflow-x-auto px-4 py-2 gap-1 border-t border-surface-border bg-surface-card/60 scrollbar-none">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 shrink-0 transition-colors ${
                isActive
                  ? item.highlight
                    ? "bg-gymRed text-white"
                    : "bg-zinc-800 text-white"
                  : item.highlight
                  ? "text-gymRed"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Icon className="w-3 h-3" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </header>
  );
}
