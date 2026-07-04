"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import { LogOut, Settings, ChevronDown } from "lucide-react";
import { useLogout } from "@/hooks/useLogout";
import { motion, AnimatePresence } from "framer-motion";

export default function UserMenu() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);

  const user = useAuthStore((state) => state.user);
  const handleLogout = useLogout();

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  if (!user) return null;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="User menu"
        className="flex items-center gap-2 p-1.5 rounded-lg border border-white/5 bg-white/3 hover:bg-white/6 hover:border-white/10 transition-all text-left"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-md">
          {user.full_name?.charAt(0).toUpperCase() ||
            user.username?.charAt(0).toUpperCase() ||
            "U"}
        </div>
        <div className="hidden sm:flex flex-col text-xs pr-1">
          <span className="font-semibold text-slate-200">
            {user.full_name || user.username}
          </span>
          <span className="text-[10px] text-slate-500 font-mono capitalize">
            {user.role}
          </span>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 4 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            role="menu"
            aria-label="User dropdown menu"
            className="absolute right-0 mt-2 w-48 rounded-xl glass border border-white/10 p-1.5 shadow-xl shadow-black/40 z-50"
          >
            <div className="px-3 py-2 border-b border-white/5 mb-1.5 flex flex-col gap-0.5">
              <span className="text-xs font-semibold text-white">
                {user.full_name || user.username}
              </span>
              <span className="text-[10px] text-slate-400 truncate">
                {user.email}
              </span>
            </div>
            <button
              onClick={() => {
                setOpen(false);
                router.push("/dashboard/settings");
              }}
              role="menuitem"
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
            >
              <Settings className="w-4 h-4 text-slate-400" />
              Profile Settings
            </button>
            <button
              onClick={() => {
                setOpen(false);
                handleLogout();
              }}
              role="menuitem"
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/5 transition-colors"
            >
              <LogOut className="w-4 h-4 text-rose-400/80" />
              Sign Out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
