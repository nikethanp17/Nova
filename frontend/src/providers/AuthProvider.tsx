"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import { useProfile } from "@/hooks/useProfile";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const accessToken = useAuthStore((state) => state.accessToken);
  const isAuthenticated = !!accessToken;

  // Sync profile details with backend dynamically
  useProfile();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const isAuthRoute = pathname?.startsWith("/dashboard");
    const isGuestRoute = pathname === "/login" || pathname === "/register";

    if (isAuthRoute && !isAuthenticated) {
      router.push("/login");
    } else if (isGuestRoute && isAuthenticated) {
      router.push("/dashboard");
    }
  }, [mounted, pathname, isAuthenticated, router]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#06070a] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
