import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext";
import PrivacyBanner from "../components/PrivacyBanner";
import AIChatbot from "../components/AIChatbot";
import { LogOut, Activity, Clock, Menu, X } from "lucide-react";

const WARDEN_NAV = [
  { to: "/admin/warden", label: "Overview", end: true },
  { to: "/admin/warden/activity", label: "Activity Report" },
  { to: "/admin/warden/nutrition", label: "Nutrition Report" },
  { to: "/admin/warden/mood", label: "Mood & Stress" },
  { to: "/admin/warden/alerts", label: "Wellness Alerts" },
  { to: "/admin/warden/initiatives", label: "Initiatives" },
  { to: "/admin/warden/export", label: "Export" },
];

const MESS_NAV = [
  { to: "/admin/mess", label: "Overview", end: true },
  { to: "/admin/mess/ratings", label: "Meal Ratings" },
  { to: "/admin/mess/nutrients", label: "Nutrient Analysis" },
  { to: "/admin/mess/menu", label: "Menu Planner" },
  { to: "/admin/mess/feedback", label: "Feedback Log" },
];

const DEAN_NAV = [
  { to: "/admin/dean", label: "Campus Overview", end: true },
  { to: "/admin/dean/comparison", label: "Hostel Comparison" },
  { to: "/admin/dean/academic", label: "Academic Correlation" },
  { to: "/admin/dean/environmental", label: "Environmental Impact" },
  { to: "/admin/dean/trends", label: "Wellness Trends" },
  { to: "/admin/dean/reports", label: "Generate Report" },
];

const ROLE_CONFIG = {
  warden: {
    nav: WARDEN_NAV,
    color: "#3b82f6",
    label: "WARDEN",
    section: "Hostel Dashboard",
  },
  mess_manager: {
    nav: MESS_NAV,
    color: "#f59e0b",
    label: "MESS MGR",
    section: "Mess Analytics",
  },
  dean: {
    nav: DEAN_NAV,
    color: "#8b5cf6",
    label: "DEAN",
    section: "Campus Intelligence",
  },
};

export default function AdminLayout() {
  const { user, logout } = useAdminAuth();
  const navigate = useNavigate();
  const cfg = ROLE_CONFIG[user?.role] || ROLE_CONFIG.warden;
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  const closeSidebar = () => setSidebarOpen(false);

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="p-5 border-b border-[#E5E7EB]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#111827] flex items-center justify-center border border-[#111827] shadow-sm rounded-lg">
              <Activity size={16} className="text-white" />
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF]">
                Admin Panel
              </p>
              <p className="text-[13px] font-bold text-[#111827] leading-tight">
                UniVitals
              </p>
            </div>
          </div>
          <button
            onClick={closeSidebar}
            className="lg:hidden p-1 text-[#9CA3AF] hover:text-[#111827]"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Role badge */}
      <div className="px-5 py-3 border-b border-[#E5E7EB]">
        <p className="text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF] mb-1">
          {cfg.section}
        </p>
        <div className="flex items-center gap-2">
          <span
            className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 border"
            style={{
              color: cfg.color,
              borderColor: cfg.color + "33",
              backgroundColor: cfg.color + "11",
            }}
          >
            {cfg.label}
          </span>
          {user?.hostelId && (
            <span className="text-[10px] font-bold text-[#111827]">
              {user.hostelId}
            </span>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-3">
        <p className="text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF] px-2 mb-2 mt-1">
          Navigation
        </p>
        {cfg.nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={closeSidebar}
            className={({ isActive }) =>
              `block px-3 py-2 text-[12px] font-medium transition-all duration-150 rounded-lg mb-0.5 ${
                isActive
                  ? "bg-white border border-[#E5E7EB] text-[#111827] shadow-sm font-bold"
                  : "text-[#6B7280] hover:text-[#111827] hover:bg-[#F9FAFB]"
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-[#E5E7EB]">
        <div className="flex items-center gap-1.5 text-[#9CA3AF] mb-3">
          <Clock size={10} />
          <span className="text-[9px]">Data refreshed: 4 min ago</span>
        </div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 bg-[#111827] rounded-full flex items-center justify-center shrink-0">
            <span className="text-[10px] font-bold text-white">
              {user?.name
                ?.split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-[#111827] truncate">
              {user?.name}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 text-[11px] font-bold uppercase tracking-widest text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6] border border-[#E5E7EB] transition-all duration-150"
        >
          <LogOut size={12} />
          Logout
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-[#F3F4F6] overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 bg-white border-r border-[#E5E7EB] flex-col h-full">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Mobile sidebar (slide-in) */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-[#E5E7EB] flex flex-col transition-transform duration-200 lg:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SidebarContent />
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-[#E5E7EB] shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 border border-[#E5E7EB] text-[#6B7280] hover:text-[#111827] hover:border-[#111827] transition-all"
          >
            <Menu size={16} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#111827] rounded flex items-center justify-center">
              <Activity size={12} className="text-white" />
            </div>
            <span className="text-[12px] font-bold text-[#111827]">
              UniVitals
            </span>
          </div>
          <div className="w-7 h-7 bg-[#111827] rounded-full flex items-center justify-center">
            <span className="text-[9px] font-bold text-white">
              {user?.name
                ?.split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)}
            </span>
          </div>
        </div>

        <PrivacyBanner />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      <AIChatbot mode="admin" />
    </div>
  );
}
