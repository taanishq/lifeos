import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Target, Apple, Dumbbell,
  Briefcase, CreditCard, BookOpen, Music, Menu, X, LogOut
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { supabase } from "../supabase";

const links = [
  { to: "/",          icon: LayoutDashboard, label: "Dashboard" },
  { to: "/goals",     icon: Target,          label: "Goals" },
  { to: "/nutrition", icon: Apple,           label: "Nutrition" },
  { to: "/fitness",   icon: Dumbbell,        label: "Fitness" },
  { to: "/career",    icon: Briefcase,       label: "Career" },
  { to: "/finance",   icon: CreditCard,      label: "Finance" },
  { to: "/guitar",    icon: Music,           label: "Guitar" },
  { to: "/journal",   icon: BookOpen,        label: "Journal" },
];

export default function Sidebar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navRef = useRef(null);
  const [indicator, setIndicator] = useState({ top: 0, height: 0, visible: false });

  // Position the sliding indicator under the active link
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const active = nav.querySelector(".sidebar-link.active");
    if (active) {
      setIndicator({
        top: active.offsetTop,
        height: active.offsetHeight,
        visible: true,
      });
    } else {
      setIndicator(i => ({ ...i, visible: false }));
    }
  }, [location.pathname, open]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="fixed top-4 left-4 z-50 md:hidden bg-[#0e1018]/90 backdrop-blur border border-white/10 p-2 rounded-xl text-white"
        onClick={() => setOpen(!open)}
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden" onClick={() => setOpen(false)} />
      )}

      <aside className={`
        fixed top-0 left-0 h-full w-64 z-40 flex flex-col
        bg-[#0a0c12]/85 backdrop-blur-xl border-r border-white/5
        transition-transform duration-300
        ${open ? "translate-x-0" : "-translate-x-full"}
        md:translate-x-0 md:static md:flex
      `}>
        {/* Brand */}
        <div className="px-6 py-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center font-bold text-white text-sm shadow-[0_0_24px_-4px_rgba(99,102,241,0.6)]">
              OS
            </div>
            <div>
              <div className="font-bold text-white text-sm tracking-tight">LifeOS</div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="status-dot live" />
                <span className="telemetry-label" style={{ fontSize: "0.55rem" }}>Systems online</span>
              </div>
            </div>
          </div>
        </div>

        {/* Nav with sliding indicator */}
        <nav ref={navRef} className="relative flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {indicator.visible && (
            <div
              className="sidebar-indicator"
              style={{ top: indicator.top, height: indicator.height, marginTop: 0 }}
            />
          )}
          {links.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
              onClick={() => setOpen(false)}
            >
              <Icon size={18} />
              <span className="text-sm font-medium">{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-white/5 space-y-2">
          <div className="px-4 telemetry-label">
            {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
          </div>
          <button
            onClick={handleLogout}
            className="sidebar-link w-full text-red-400/80 hover:text-red-300 hover:bg-red-500/10"
          >
            <LogOut size={18} />
            <span className="text-sm font-medium">Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}