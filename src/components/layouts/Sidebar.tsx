import { useNavigate, useLocation } from "react-router-dom";
import {LayoutDashboard,FileText,Image,Users,ClipboardList,Settings as SettingsIcon,LogOut,ShoppingBag,Tag,ChevronsLeft,ChevronsRight,
} from "lucide-react";
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
    label: "Shop",
    items: [
      { icon: Tag, label: "Shop Categories", path: "/dashboard/shop-categories" },
      { icon: ShoppingBag, label: "Shop Products", path: "/dashboard/shop-products" },
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

type Props = {
  collapsed: boolean;
  onToggle: () => void;
};

export default function Sidebar({ collapsed, onToggle }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("sphere_user") || "{}");

  const handleLogout = () => {
    localStorage.removeItem("sphere_token");
    localStorage.removeItem("sphere_user");
    navigate("/login");
  };

  const isActivePath = (path: string) =>
    path === "/dashboard"
      ? location.pathname === path
      : location.pathname === path || location.pathname.startsWith(path + "/");

  const focus =
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00C8E0] focus-visible:ring-inset";

  return (
    <aside
      style={{ background: "#15202e", borderRight: "1px solid rgba(255,255,255,0.06)" }}
      className={`fixed left-0 top-0 h-screen flex flex-col z-50 overflow-y-auto overflow-x-hidden transition-[width] duration-200 motion-reduce:transition-none ${
        collapsed ? "w-[68px]" : "w-[220px]"
      }`}
    >
      {/* Logo */}
      <div
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        className={`flex items-center flex-shrink-0 py-[18px] ${
          collapsed ? "justify-center px-0" : "gap-3 px-4"
        }`}
      >
        <div
          style={{ background: "#0d1a2a", border: "1.5px solid #00C8E0" }}
          className="w-[30px] h-[30px] rounded-full flex items-center justify-center flex-shrink-0"
        >
          <div style={{ background: "#00C8E0" }} className="w-2 h-2 rounded-full" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <div className="font-condensed text-[15px] font-bold text-white tracking-[0.06em] leading-none whitespace-nowrap">
              SPHERE <span style={{ color: "#00C8E0" }}>TECH</span>
            </div>
            <div
              style={{ color: "rgba(200,207,216,0.4)" }}
              className="text-[9px] tracking-[0.14em] uppercase mt-[2px]"
            >
              CMS Admin
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3" aria-label="Main">
        {nav.map((section, idx) => (
          <div key={section.label ?? `section-${idx}`}>
            {section.label &&
              (collapsed ? (
                <div
                  aria-hidden
                  style={{ background: "rgba(255,255,255,0.08)" }}
                  className="h-px mx-3 my-3"
                />
              ) : (
                <div
                  style={{ color: "rgba(200,207,216,0.35)" }}
                  className="font-condensed text-[9px] font-semibold uppercase tracking-[0.1em] px-2 pt-3 pb-1"
                >
                  {section.label}
                </div>
              ))}

            {section.items.map((item) => {
              const isActive = isActivePath(item.path);
              return (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => navigate(item.path)}
                  title={collapsed ? item.label : undefined}
                  aria-label={collapsed ? item.label : undefined}
                  aria-current={isActive ? "page" : undefined}
                  style={
                    isActive
                      ? { background: "rgba(0,200,224,0.1)", border: "1px solid rgba(0,200,224,0.2)", color: "#fff" }
                      : { color: "rgba(200,207,216,0.6)", border: "1px solid transparent" }
                  }
                  className={`relative w-full flex items-center rounded-md cursor-pointer text-[12.5px] mb-[2px] transition-colors duration-100 hover:bg-white/[0.06] hover:text-white ${focus} ${
                    collapsed ? "justify-center py-[9px]" : "gap-2 px-3 py-[7px] text-left"
                  }`}
                >
                  <item.icon className="w-4 h-4 flex-shrink-0" strokeWidth={1.75} />
                  {!collapsed && <span className="flex-1 whitespace-nowrap">{item.label}</span>}
                  {item.badge && !collapsed && (
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
                  {item.badge && collapsed && (
                    <span
                      aria-hidden
                      style={{ background: "#00C8E0" }}
                      className="absolute top-[6px] right-[10px] w-[6px] h-[6px] rounded-full"
                    />
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Collapse toggle */}
      <div className="px-2 pb-2 flex-shrink-0">
        <button
          type="button"
          onClick={onToggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!collapsed}
          title={collapsed ? "Expand sidebar (Ctrl+B)" : "Collapse sidebar (Ctrl+B)"}
          style={{ color: "rgba(200,207,216,0.5)" }}
          className={`w-full flex items-center rounded-md text-[12px] transition-colors hover:bg-white/[0.06] hover:text-white ${focus} ${
            collapsed ? "justify-center py-[9px]" : "gap-2 px-3 py-[7px]"
          }`}
        >
          {collapsed ? (
            <ChevronsRight className="w-4 h-4" strokeWidth={1.75} />
          ) : (
            <>
              <ChevronsLeft className="w-4 h-4" strokeWidth={1.75} />
              <span className="flex-1 text-left">Collapse</span>
              <span style={{ color: "rgba(200,207,216,0.3)" }} className="text-[10px]">
                Ctrl B
              </span>
            </>
          )}
        </button>
      </div>

      {/* User */}
      <div
        style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
        className={`flex flex-shrink-0 py-3 ${
          collapsed ? "flex-col items-center gap-2 px-2" : "items-center gap-3 px-4"
        }`}
      >
        <div
          style={{ background: "rgba(0,200,224,0.15)", color: "#00C8E0" }}
          title={collapsed ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() : undefined}
          className="w-[30px] h-[30px] rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
        >
          {user.firstName?.[0]}
          {user.lastName?.[0]}
        </div>
        {!collapsed && (
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
        )}
        <button
          type="button"
          onClick={handleLogout}
          title="Sign out"
          aria-label="Sign out"
          style={{ color: "rgba(200,207,216,0.35)" }}
          className={`hover:text-red-400 transition-colors p-1 rounded ${focus}`}
        >
          <LogOut className="w-3.5 h-3.5" strokeWidth={1.75} />
        </button>
      </div>
    </aside>
  );
}