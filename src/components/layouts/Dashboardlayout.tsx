import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

export default function DashboardLayout() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="ml-[220px] flex-1 flex flex-col min-h-screen">
        <Outlet />
      </div>
    </div>
  );
}