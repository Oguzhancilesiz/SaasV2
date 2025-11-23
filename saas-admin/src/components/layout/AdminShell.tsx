"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { bg } from "@/lib/theme";
import { cn } from "@/lib/utils";

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className={cn("min-h-screen", bg.base, "text-neutral-100")}>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:pl-64">
        <Topbar onMenuClick={() => setSidebarOpen((s) => !s)} />
        <main className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          <div className="space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
