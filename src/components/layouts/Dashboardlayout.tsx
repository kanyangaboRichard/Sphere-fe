import { useCallback, useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

const STORAGE_KEY = "sphere_sidebar_collapsed";

function readInitial(): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) return stored === "1";
  } catch {
    /* storage unavailable: fall through to the default */
  }
  // First visit: start collapsed on narrow screens, expanded otherwise.
  return typeof window !== "undefined" && window.innerWidth < 1024;
}

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState<boolean>(readInitial);

  const toggle = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  // Ctrl/Cmd + B toggles the sidebar
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle]);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar collapsed={collapsed} onToggle={toggle} />
      <div
        className={`flex-1 min-w-0 flex flex-col min-h-screen transition-[margin] duration-200 motion-reduce:transition-none ${
          collapsed ? "ml-[68px]" : "ml-[220px]"
        }`}
      >
        <Outlet />
      </div>
    </div>
  );
}