"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  CheckSquare,
  GitBranch,
  Play,
  History,
  Settings,
  LogOut,
  Cpu,
} from "lucide-react";
import { useLogout } from "@/hooks/useLogout";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/dashboard/planner", label: "Planner", icon: GitBranch },
  { href: "/dashboard/execution", label: "Execution", icon: Play },
  { href: "/dashboard/history", label: "History", icon: History },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const handleLogout = useLogout();

  return (
    <aside className="w-64 glass border-r border-white/5 min-h-screen flex flex-col justify-between p-4 z-40">
      {/* Brand Logo */}
      <div className="flex flex-col gap-8">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 px-3 py-2"
          aria-label="NOVA Homepage"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <Cpu className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            NOVA
          </span>
        </Link>

        {/* Navigation List */}
        <nav className="flex flex-col gap-1" aria-label="Main Navigation">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`relative flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "text-white"
                    : "text-slate-400 hover:text-white hover:bg-white/3"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-nav-bg"
                    className="absolute inset-0 bg-gradient-to-r from-violet-600/15 to-indigo-600/15 rounded-lg border border-violet-500/20"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <item.icon
                  className={`w-4.5 h-4.5 z-10 ${
                    isActive ? "text-violet-400" : "text-slate-400"
                  }`}
                />
                <span className="z-10">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Logout Action Button */}
      <button
        onClick={handleLogout}
        aria-label="Sign Out"
        className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/5 transition-all text-left"
      >
        <LogOut className="w-4.5 h-4.5 text-rose-400/80" />
        <span>Sign Out</span>
      </button>
    </aside>
  );
}
