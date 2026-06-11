import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, Target, Apple, Dumbbell,
  Briefcase, CreditCard, BookOpen, Menu, X, LogOut
} from "lucide-react";
import { useState } from "react";
import { supabase } from "../supabase";
import { Music } from "lucide-react";

const links = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/goals", icon: Target, label: "Goals" },
  { to: "/nutrition", icon: Apple, label: "Nutrition" },
  { to: "/fitness", icon: Dumbbell, label: "Fitness" },
  { to: "/career", icon: Briefcase, label: "Career" },
  { to: "/finance", icon: CreditCard, label: "Finance" },
  { to: "/journal", icon: BookOpen, label: "Journal" },
  { to: "/guitar", icon: Music, label: "Guitar" },
];

export default function Sidebar() {
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <>
      <button
        className="fixed top-4 left-4 z-50 md:hidden bg-[#1a1d27] border border-white/10 p-2 rounded-xl text-white"
        onClick={() => setOpen(!open)}
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setOpen(false)} />
      )}

      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-[#13151f] border-r border-white/5 z-40 flex flex-col
        transition-transform duration-300
        ${open ? "translate-x-0" : "-translate-x-full"}
        md:translate-x-0 md:static md:flex
      `}>
        <div className="px-6 py-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white text-sm">
              OS
            </div>
            <div>
              <div className="font-bold text-white text-sm">LifeOS</div>
              <div className="text-xs text-slate-500">Personal Dashboard</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
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

        <div className="px-3 py-4 border-t border-white/5 space-y-2">
          <div className="px-4 text-xs text-slate-600">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </div>
          <button
            onClick={handleLogout}
            className="sidebar-link w-full text-red-400 hover:text-red-300 hover:bg-red-500/10"
          >
            <LogOut size={18} />
            <span className="text-sm font-medium">Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}