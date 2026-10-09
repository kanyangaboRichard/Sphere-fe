import { useNavigate, useLocation } from "react-router-dom";
import { LayoutDashboard, FileText, Image, Users, ClipboardList, Settings as SettingsIcon, LogOut,  } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type NavItem = {
  icon: LucideIcon;
  label: string;
  path: string;
  badge?: string;
};

type NavSection = {
  label: string | null;
  items: NavItem[];
};

const nav: NavSection[] = [
  {
    label: null,
    items: [
      { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
      { icon: FileText, label: "Articles", path: "/dashboard/articles", badge: "24" },
      { icon: Image, label: "Gallery", path: "/dashboard/gallery" },
    ],
  },
  {
    label: "Settings",
    items: [
      { icon: Users, label: "Users", path: "/dashboard/users" },
      { icon: ClipboardList, label: "Audit Logs", path: "/dashboard/audit-logs" },
      { icon: SettingsIcon, label: "Settings", path: "/dashboard/settings" },
    ],
  },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("sphere_user") || "{}");

  const handleLogout = () => {
    localStorage.removeItem("sphere_token");
    localStorage.removeItem("sphere_user");
    navigate("/login");
  };

  return (
    <aside
      style={{ background: "#15202e", borderRight: "1px solid rgba(255,255,255,0.06)" }}
      className="fixed left-0 top-0 h-screen w-[220px] flex flex-col z-50 overflow-y-auto"
    >
      {/* Logo */}
      <div
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        className="flex items-center gap-3 px-4 py-[18px] flex-shrink-0"
      >
        <div
          style={{ background: "#0d1a2a", border: "1.5px solid #00C8E0" }}
          className="w-[30px] h-[30px] rounded-full flex items-center justify-center flex-shrink-0"
        >
          <div style={{ background: "#00C8E0" }} className="w-2 h-2 rounded-full" />
        </div>
        <div>
          <div className="font-condensed text-[15px] font-bold text-white tracking-[0.06em] leading-none">
            SPHERE <span style={{ color: "#00C8E0" }}>TECH</span>
          </div>
          <div
            style={{ color: "rgba(200,207,216,0.4)" }}
            className="text-[9px] tracking-[0.14em] uppercase mt-[2px]"
          >
            CMS Admin
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3">
        {nav.map((section, idx) => (
          <div key={section.label ?? `section-${idx}`}>
            {section.label && (
              <div
                style={{ color: "rgba(200,207,216,0.35)" }}
                className="font-condensed text-[9px] font-semibold uppercase tracking-[0.1em] px-2 pt-3 pb-1"
              >
                {section.label}
              </div>
            )}
            {section.items.map((item) => {
              const isActive =
                location.pathname === item.path ||
                location.pathname.startsWith(item.path + "/");
              return (
                <div
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  style={
                    isActive
                      ? { background: "rgba(0,200,224,0.1)", border: "1px solid rgba(0,200,224,0.2)", color: "#fff" }
                      : { color: "rgba(200,207,216,0.6)" }
                  }
                  className="flex items-center gap-2 px-3 py-[7px] rounded-md cursor-pointer text-[12.5px] mb-[1px] transition-all duration-100 hover:bg-white/[0.06] hover:text-white"
                >
                  <item.icon className="w-4 h-4 flex-shrink-0" strokeWidth={1.75} />
                  <span className="flex-1">{item.label}</span>
                  {item.badge && (
                    <span
                      style={
                        item.badge === "New"
                          ? { background: "rgba(34,197,94,0.15)", color: "#4ade80" }
                          : { background: "rgba(0,200,224,0.15)", color: "#00C8E0" }
                      }
                      className="text-[9px] px-[6px] py-[1px] rounded-full font-semibold"
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User */}
      <div
        style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
        className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
      >
        <div
          style={{ background: "rgba(0,200,224,0.15)", color: "#00C8E0" }}
          className="w-[30px] h-[30px] rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
        >
          {user.firstName?.[0]}{user.lastName?.[0]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[12px] font-medium text-white truncate">
            {user.firstName} {user.lastName}
          </div>
          <div
            style={{ color: "rgba(200,207,216,0.4)" }}
            className="text-[10px] uppercase tracking-[0.06em]"
          >
            {user.role?.replace("_", " ")}
          </div>
        </div>
        <button
          onClick={handleLogout}
          title="Sign out"
          style={{ color: "rgba(200,207,216,0.35)" }}
          className="hover:text-red-400 transition-colors p-1 rounded"
        >
          <LogOut className="w-3.5 h-3.5" strokeWidth={1.75} />
        </button>
      </div>
    </aside>
  );
}