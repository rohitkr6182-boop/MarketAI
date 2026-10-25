import { NavLink } from "react-router-dom";
import {
  Activity, BarChart3, BriefcaseBusiness, Globe2, LayoutDashboard,
  Newspaper, Sparkles, Star, TrendingUp,
} from "lucide-react";

const links = [
  { to: "/", label: "Overview", icon: LayoutDashboard },
  { to: "/markets", label: "Markets", icon: TrendingUp },
  { to: "/screener", label: "Screener", icon: BarChart3 },
  { to: "/global", label: "Global", icon: Globe2 },
  { to: "/portfolio", label: "Portfolio", icon: BriefcaseBusiness },
  { to: "/watchlist", label: "Watchlist", icon: Star },
  { to: "/news", label: "News", icon: Newspaper },
  { to: "/ai", label: "AI Lab", icon: Sparkles },
];

export default function Navbar() {
  return (
    <header className="market-nav sticky top-0 z-30">
      <div className="mx-auto flex min-h-[68px] max-w-[1600px] flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-2 sm:px-6 lg:px-8">
        <NavLink to="/" className="flex shrink-0 items-center gap-3 rounded-xl py-1" aria-label="MarketAI home">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-amber/25 bg-amber/10 text-amber">
            <Activity size={19} strokeWidth={2.2} />
          </span>
          <span>
            <span className="block text-sm font-bold tracking-wide text-text">Market<span className="text-amber">AI</span></span>
            <span className="mt-0.5 block text-[9px] font-semibold uppercase tracking-[.19em] text-text2">Market intelligence</span>
          </span>
        </NavLink>
        <nav aria-label="Main navigation" className="-mx-1 flex max-w-full flex-1 items-center gap-1 overflow-x-auto px-1 text-[12px] sm:justify-end sm:gap-1.5 sm:text-[13px]">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `market-nav-link inline-flex items-center gap-2 rounded-lg px-3 py-2.5 font-medium ${isActive ? "text-amber" : "text-text2"}`
              }
            >
              <Icon size={15} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}