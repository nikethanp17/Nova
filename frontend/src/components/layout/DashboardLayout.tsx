"use client";

import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background text-foreground overflow-hidden">
      {/* Sidebar navigation panel */}
      <Sidebar />

      {/* Main content grid */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Topbar header bar */}
        <Topbar />

        {/* Dynamic page container viewport */}
        <main className="flex-1 overflow-y-auto p-6 relative">
          <div className="max-w-7xl mx-auto space-y-6 relative z-10">
            {children}
          </div>
          {/* Subtle background overlay blobs */}
          <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-radial-glow opacity-30 pointer-events-none z-0" />
        </main>
      </div>
    </div>
  );
}
