import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useStudentAuth } from "../context/StudentAuthContext";
import AIChatbot from "../components/AIChatbot";
import {
  Activity,
  Home,
  Utensils,
  Moon,
  BookOpen,
  Award,
  Phone,
  LogOut,
  Zap,
  Menu,
  X,
} from "lucide-react";

const NAV = [
  { to: "/student", label: "Home", icon: Home, end: true },
  { to: "/student/log/nutrition", label: "Nutrition", icon: Utensils },
  { to: "/student/log/activity", label: "Activity", icon: Activity },
  { to: "/student/log/mood", label: "Mood & Sleep", icon: Moon },
  { to: "/student/journal", label: "Journal", icon: BookOpen },
  { to: "/student/score", label: "My Wellness", icon: Zap },
  { to: "/student/achievements", label: "Achievements", icon: Award },
  { to: "/student/sos", label: "SOS Hub", icon: Phone },
];

export default function StudentLayout() {
  const { user, logout } = useStudentAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/student/login");
  };

  const closeSidebar = () => setSidebarOpen(false);

  const SidebarContent = () => (
    <>
      <div className="p-5 border-b border-[#E5E7EB]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#111827] rounded-lg flex items-center justify-center">
              <Activity size={14} className="text-white" />
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF]">
                Student
              </p>
              <p className="text-[12px] font-bold text-[#111827]">UniVitals</p>
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

      <div className="px-4 py-3 border-b border-[#E5E7EB]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-[#111827] rounded-full flex items-center justify-center shrink-0">
            <span className="text-[9px] font-bold text-white">
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
            <p className="text-[9px] text-[#9CA3AF]">
              {user?.hostel} · {user?.branch} Y{user?.year}
            </p>
          </div>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <span className="text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF]">
            Streak
          </span>
          <span className="text-[10px] font-bold text-[#111827]">
            🔥 {user?.streakDays} days
          </span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-3">
        <p className="text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF] px-2 mb-2">
          Menu
        </p>
        {NAV.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={closeSidebar}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 text-[11px] font-medium transition-all duration-150 rounded-lg mb-0.5 ${
                  isActive
                    ? "bg-white border border-[#E5E7EB] text-[#111827] shadow-sm font-bold"
                    : "text-[#6B7280] hover:text-[#111827] hover:bg-[#F9FAFB]"
                }`
              }
            >
              <Icon size={13} />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-[#E5E7EB]">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 text-[11px] font-bold uppercase tracking-widest text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6] border border-[#E5E7EB] transition-all"
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
      <aside className="hidden lg:flex w-56 shrink-0 bg-white border-r border-[#E5E7EB] flex-col h-full">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-56 bg-white border-r border-[#E5E7EB] flex flex-col transition-transform duration-200 lg:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SidebarContent />
      </aside>

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
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] text-[#9CA3AF]">
              🔥 {user?.streakDays}d
            </span>
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
        </div>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      <AIChatbot mode="student" />
    </div>
  );
}
