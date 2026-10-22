import { NavLink } from "react-router-dom";

const links = [
  { to: "/", label: "Dashboard" },
  { to: "/markets", label: "Markets" },
  { to: "/screener", label: "Screener" },
  { to: "/global", label: "Global Markets" },
  { to: "/portfolio", label: "Portfolio" },
  { to: "/watchlist", label: "Watchlist" },
  { to: "/news", label: "News" },
  { to: "/ai", label: "AI Assistant" },
];

export default function Navbar() {
  return (
    <header className="border-b border-border bg-bgElev sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-6">
        <div className="flex items-center gap-2 font-semibold">
          <span className="w-2 h-2 rounded-full bg-amber inline-block" />
          MarketAI
        </div>
        <nav className="flex gap-1 text-sm">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-md ${isActive ? "bg-amber/10 text-amber" : "text-text2 hover:text-text hover:bg-white/5"}`
              }
              end={l.to === "/"}
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
