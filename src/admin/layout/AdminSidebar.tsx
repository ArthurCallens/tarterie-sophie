import { NavLink } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { ADMIN_NAV } from "./nav-config";

const linkClasses = ({ isActive }: { isActive: boolean }) =>
  `rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
    isActive ? "bg-cherry text-cream" : "text-cacao-soft hover:bg-cream hover:text-cacao"
  }`;

export function AdminSidebar() {
  const { signOut } = useAuth();

  return (
    <aside className="flex w-64 shrink-0 flex-col justify-between border-r border-cacao/10 bg-cream-dark px-5 py-6">
      <div>
        <p className="font-stamp text-xs uppercase tracking-[0.2em] text-cherry">Tarterie Sophie</p>
        <p className="mt-1 font-display text-lg font-semibold text-cacao">Dashboard</p>

        <nav className="mt-8 flex flex-col gap-1">
          {ADMIN_NAV.map((item) => (
            <NavLink key={item.to} to={item.to} className={linkClasses}>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="flex flex-col gap-1">
        <NavLink to="/admin/account" className={linkClasses}>
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
  );
}
