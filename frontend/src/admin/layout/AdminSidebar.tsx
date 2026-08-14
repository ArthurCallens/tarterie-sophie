import { NavLink } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { ADMIN_NAV_GROUPS } from "./nav-config";

const linkClasses = ({ isActive }: { isActive: boolean }) =>
  `rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
    isActive ? "bg-cherry text-cream" : "text-cacao-soft hover:bg-cream hover:text-cacao"
  }`;

type AdminSidebarProps = {
  /** Whether the off-canvas drawer is open — only relevant below the md breakpoint. */
  open: boolean;
  onClose: () => void;
};

export function AdminSidebar({ open, onClose }: AdminSidebarProps) {
  const { signOut } = useAuth();

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 bg-cacao/40 md:hidden" onClick={onClose} aria-hidden="true" />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col justify-between overflow-y-auto border-r border-cacao/10 bg-cream-dark px-5 py-6 transition-transform duration-200 md:static md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div>
          <div className="flex items-start justify-between">
            <div>
              <p className="font-stamp text-xs uppercase tracking-[0.2em] text-cherry">Tarterie Sophie</p>
              <p className="mt-1 font-display text-lg font-semibold text-cacao">Dashboard</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Sluit menu"
              className="rounded-full p-1.5 text-cacao-soft hover:bg-cream md:hidden"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </div>

          <nav className="mt-8 flex flex-col gap-5">
            {ADMIN_NAV_GROUPS.map((group) => (
              <div key={group.heading} className="flex flex-col gap-1">
                <p className="px-4 font-stamp text-[11px] uppercase tracking-widest text-cacao-soft/60">
                  {group.heading}
                </p>
                {group.items.map((item) => (
                  <NavLink key={item.to} to={item.to} className={linkClasses} onClick={onClose}>
                    {item.label}
                  </NavLink>
                ))}
              </div>
            ))}
          </nav>
        </div>

        <div className="flex flex-col gap-1">
          <NavLink to="/admin/account" className={linkClasses} onClick={onClose}>
            Account
          </NavLink>
          <button
            type="button"
            onClick={() => void signOut()}
            className="rounded-xl px-4 py-2.5 text-left text-sm font-medium text-cacao-soft hover:bg-cream hover:text-cacao"
          >
            Uitloggen
          </button>
        </div>
      </aside>
    </>
  );
}
