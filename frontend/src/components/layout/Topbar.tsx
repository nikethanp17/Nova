"use client";

import { usePathname } from "next/navigation";
import { Bell, Moon, Sun } from "lucide-react";
import UserMenu from "./UserMenu";
import { useTheme } from "@/providers/ThemeProvider";

export default function Topbar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  const getBreadcrumbs = () => {
    if (!pathname) return ["Dashboard"];
    const segments = pathname.split("/").filter(Boolean);
    return segments.map(
      (seg) => seg.charAt(0).toUpperCase() + seg.slice(1)
    );
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <header className="h-16 glass border-b border-white/5 px-6 flex items-center justify-between z-30">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
        {breadcrumbs.map((crumb, idx) => (
          <span key={idx} className="flex items-center gap-1.5">
            {idx > 0 && <span className="text-slate-600">/</span>}
            <span
              className={
                idx === breadcrumbs.length - 1 ? "text-white font-semibold" : ""
              }
            >
              {crumb}
            </span>
          </span>
        ))}
      </div>

      {/* Control items */}
      <div className="flex items-center gap-4">
        {/* Notification Bell */}
        <button
          aria-label="View notifications"
          className="p-2 rounded-lg border border-white/5 bg-white/3 hover:bg-white/6 hover:border-white/10 transition-all text-slate-400 hover:text-white relative"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-violet-500 shadow-[0_0_8px_#8b5cf6]" />
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="p-2 rounded-lg border border-white/5 bg-white/3 hover:bg-white/6 hover:border-white/10 transition-all text-slate-400 hover:text-white"
        >
          {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <hr className="h-6 border-l border-white/5" />

        {/* User Account */}
        <UserMenu />
      </div>
    </header>
  );
}
