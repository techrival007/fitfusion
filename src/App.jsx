import { Routes, Route, Navigate } from "react-router-dom";
import { AdminAuthProvider, useAdminAuth } from "./context/AdminAuthContext";
import {
  StudentAuthProvider,
  useStudentAuth,
} from "./context/StudentAuthContext";
import ThemeToggle from "./components/ThemeToggle";

import AdminLogin from "./admin/Login";
import AdminLayout from "./admin/AdminLayout";

import WardenOverview from "./admin/warden/WardenOverview";
import ActivityReport from "./admin/warden/ActivityReport";
import NutritionReport from "./admin/warden/NutritionReport";
import MoodStress from "./admin/warden/MoodStress";
import WellnessAlerts from "./admin/warden/WellnessAlerts";
import Initiatives from "./admin/warden/Initiatives";
import WardenExport from "./admin/warden/WardenExport";

import MessOverview from "./admin/mess/MessOverview";
import MealRatings from "./admin/mess/MealRatings";
import NutrientAnalysis from "./admin/mess/NutrientAnalysis";
import MenuPlanner from "./admin/mess/MenuPlanner";
import FeedbackLog from "./admin/mess/FeedbackLog";

import CampusOverview from "./admin/dean/CampusOverview";
import HostelComparison from "./admin/dean/HostelComparison";
import AcademicCorrelation from "./admin/dean/AcademicCorrelation";
import EnvironmentalImpact from "./admin/dean/EnvironmentalImpact";
import WellnessTrends from "./admin/dean/WellnessTrends";
import GenerateReport from "./admin/dean/GenerateReport";

import StudentLogin from "./student/StudentLogin";
import StudentLayout from "./student/StudentLayout";
import StudentHome from "./student/StudentHome";
import NutritionLog from "./student/NutritionLog";
import ActivityLog from "./student/ActivityLog";
import MoodLog from "./student/MoodLog";
import Journal from "./student/Journal";
import WellnessScore from "./student/WellnessScore";
import Achievements from "./student/Achievements";
import SOSHub from "./student/SOSHub";

function AdminGuard({ children, role }) {
  const { user } = useAdminAuth();
  if (!user) return <Navigate to="/admin/login" replace />;
  if (role && !role.includes(user.role))
    return <Navigate to="/unauthorized" replace />;
  return children;
}

function StudentGuard({ children }) {
  const { user } = useStudentAuth();
  if (!user) return <Navigate to="/student/login" replace />;
  return children;
}

function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center">
      <div className="max-w-xl text-center">
        <div className="mb-8 relative">
          <div className="w-20 h-20 bg-[#111827] mx-auto flex items-center justify-center rounded-2xl mb-6">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
            >
              <polyline points="22,12 18,12 15,21 9,3 6,12 2,12" />
            </svg>
          </div>
          <p className="text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF] mb-2">
            FitFusion 2026 · IIT Roorkee
          </p>
          <h1 className="text-[32px] font-bold text-[#111827] leading-tight mb-2">
            UniVitals
          </h1>
          <p className="text-[14px] text-[#6B7280]">
            Context-Aware Campus Wellness Intelligence Platform
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <a
            href="/student/login"
            className="bg-white border border-[#E5E7EB] p-6 hover:border-[#111827] transition-all group text-left"
          >
            <p className="text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF] mb-2">
              For Students
            </p>
            <p className="text-[16px] font-bold text-[#111827] mb-1">
              Student Portal
            </p>
            <p className="text-[11px] text-[#6B7280]">
              Log nutrition, activity, mood & sleep. Track your wellness score.
            </p>
            <p className="text-[10px] font-bold text-[#111827] mt-3 group-hover:underline">
              Enter Portal →
            </p>
          </a>
          <a
            href="/admin/login"
            className="bg-[#111827] border border-[#111827] p-6 hover:bg-[#1f2937] transition-all text-left relative overflow-hidden"
          >
            <div className="absolute inset-0 opacity-[0.06]">
              <svg width="100%" height="100%">
                <defs>
                  <pattern
                    id="land-grid"
                    width="10"
                    height="10"
                    patternUnits="userSpaceOnUse"
                  >
                    <path
                      d="M 10 0 L 0 0 0 10"
                      fill="none"
                      stroke="white"
                      strokeWidth="0.5"
                    />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#land-grid)" />
              </svg>
            </div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF] mb-2 relative">
              For Administrators
            </p>
            <p className="text-[16px] font-bold text-white mb-1 relative">
              Admin Dashboard
            </p>
            <p className="text-[11px] text-[#9CA3AF] relative">
              Warden · Mess Manager · Dean of Students analytics.
            </p>
            <p className="text-[10px] font-bold text-white mt-3 hover:underline relative">
              Enter Dashboard →
            </p>
          </a>
        </div>

        <p className="text-[9px] text-[#9CA3AF] mt-8">
          Team Hercules · UniVitals v1.0 · All data anonymized & aggregated
        </p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AdminAuthProvider>
      <StudentAuthProvider>
        <ThemeToggle />
        <Routes>
          <Route path="/" element={<LandingPage />} />

          {/* Admin routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin"
            element={
              <AdminGuard>
                <AdminLayout />
              </AdminGuard>
            }
          >
            {/* Warden */}
            <Route
              path="warden"
              element={
                <AdminGuard role={["warden", "dean"]}>
                  <WardenOverview />
                </AdminGuard>
              }
            />
            <Route
              path="warden/activity"
              element={
                <AdminGuard role={["warden", "dean"]}>
                  <ActivityReport />
                </AdminGuard>
              }
            />
            <Route
              path="warden/nutrition"
              element={
                <AdminGuard role={["warden", "dean"]}>
                  <NutritionReport />
                </AdminGuard>
              }
            />
            <Route
              path="warden/mood"
              element={
                <AdminGuard role={["warden", "dean"]}>
                  <MoodStress />
                </AdminGuard>
              }
            />
            <Route
              path="warden/alerts"
              element={
                <AdminGuard role={["warden", "dean"]}>
                  <WellnessAlerts />
                </AdminGuard>
              }
            />
            <Route
              path="warden/initiatives"
              element={
                <AdminGuard role={["warden", "dean"]}>
                  <Initiatives />
                </AdminGuard>
              }
            />
            <Route
              path="warden/export"
              element={
                <AdminGuard role={["warden", "dean"]}>
                  <WardenExport />
                </AdminGuard>
              }
            />
            {/* Mess */}
            <Route
              path="mess"
              element={
                <AdminGuard role={["mess_manager", "dean"]}>
                  <MessOverview />
                </AdminGuard>
              }
            />
            <Route
              path="mess/ratings"
              element={
                <AdminGuard role={["mess_manager", "dean"]}>
                  <MealRatings />
                </AdminGuard>
              }
            />
            <Route
              path="mess/nutrients"
              element={
                <AdminGuard role={["mess_manager", "dean"]}>
                  <NutrientAnalysis />
                </AdminGuard>
              }
            />
            <Route
              path="mess/menu"
              element={
                <AdminGuard role={["mess_manager", "dean"]}>
                  <MenuPlanner />
                </AdminGuard>
              }
            />
            <Route
              path="mess/feedback"
              element={
                <AdminGuard role={["mess_manager", "dean"]}>
                  <FeedbackLog />
                </AdminGuard>
              }
            />
            {/* Dean */}
            <Route
              path="dean"
              element={
                <AdminGuard role={["dean"]}>
                  <CampusOverview />
                </AdminGuard>
              }
            />
            <Route
              path="dean/comparison"
              element={
                <AdminGuard role={["dean"]}>
                  <HostelComparison />
                </AdminGuard>
              }
            />
            <Route
              path="dean/academic"
              element={
                <AdminGuard role={["dean"]}>
                  <AcademicCorrelation />
                </AdminGuard>
              }
            />
            <Route
              path="dean/environmental"
              element={
                <AdminGuard role={["dean"]}>
                  <EnvironmentalImpact />
                </AdminGuard>
              }
            />
            <Route
              path="dean/trends"
              element={
                <AdminGuard role={["dean"]}>
                  <WellnessTrends />
                </AdminGuard>
              }
            />
            <Route
              path="dean/reports"
              element={
                <AdminGuard role={["dean"]}>
                  <GenerateReport />
                </AdminGuard>
              }
            />
          </Route>

          {/* Student routes */}
          <Route path="/student/login" element={<StudentLogin />} />
          <Route
            path="/student"
            element={
              <StudentGuard>
                <StudentLayout />
              </StudentGuard>
            }
          >
            <Route index element={<StudentHome />} />
            <Route path="log/nutrition" element={<NutritionLog />} />
            <Route path="log/activity" element={<ActivityLog />} />
            <Route path="log/mood" element={<MoodLog />} />
            <Route path="journal" element={<Journal />} />
            <Route path="score" element={<WellnessScore />} />
            <Route path="achievements" element={<Achievements />} />
            <Route path="sos" element={<SOSHub />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </StudentAuthProvider>
    </AdminAuthProvider>
  );
}
