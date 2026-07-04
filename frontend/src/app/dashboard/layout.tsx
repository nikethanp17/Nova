"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import AuthProvider from "@/providers/AuthProvider";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <DashboardLayout>{children}</DashboardLayout>
    </AuthProvider>
  );
}
