"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Briefcase,
  PlusCircle,
  KanbanSquare,
  Zap,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/jobs", label: "Job Board", icon: Briefcase },
  { href: "/jobs/import", label: "Thêm Job", icon: PlusCircle },
  { href: "/cv", label: "CV & Skills", icon: FileText },
  { href: "/tracker", label: "Tracker", icon: KanbanSquare },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="flex flex-col w-64 border-r"
      style={{
        background: "rgba(12, 12, 20, 0.95)",
        borderColor: "rgba(255,255,255,0.07)",
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6 border-b" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
        <div
          className="flex items-center justify-center w-9 h-9 rounded-xl"
          style={{ background: "linear-gradient(135deg, #6366f1, #818cf8)" }}
        >
          <Zap size={18} className="text-white" />
        </div>
        <div>
          <p className="font-bold text-sm text-white leading-none">JobMatcher</p>
          <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
            AI-powered
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/"
              ? pathname === "/"
              : href === "/jobs"
                ? pathname === "/jobs" || (pathname.startsWith("/jobs/") && !pathname.startsWith("/jobs/import"))
                : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
              style={{
                background: isActive
                  ? "rgba(99, 102, 241, 0.15)"
                  : "transparent",
                color: isActive ? "#818cf8" : "rgba(255,255,255,0.5)",
                border: isActive
                  ? "1px solid rgba(99,102,241,0.25)"
                  : "1px solid transparent",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                  e.currentTarget.style.color = "rgba(255,255,255,0.8)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "rgba(255,255,255,0.5)";
                }
              }}
            >
              <Icon size={17} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
        <p className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
          Powered by Gemini AI
        </p>
      </div>
    </aside>
  );
}
