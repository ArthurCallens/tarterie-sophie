import { useState, type ReactNode } from "react";
import { AdminSidebar } from "./AdminSidebar";

export function AdminLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-cream text-cacao">
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-cacao/10 bg-cream-dark px-4 py-3 md:hidden">
          <p className="font-display text-lg font-semibold text-cacao">Dashboard</p>
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
            className="flex h-10 w-10 flex-col items-center justify-center gap-1.5"
          >
            <span className="block h-0.5 w-6 rounded-full bg-cacao" />
            <span className="block h-0.5 w-6 rounded-full bg-cacao" />
            <span className="block h-0.5 w-6 rounded-full bg-cacao" />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-8">{children}</main>
      </div>
    </div>
  );
}
