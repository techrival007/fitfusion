import api from "./client";

export const getCampusOverview = () =>
  api.get("/api/admin/dean/campus-overview").then((r) => r.data);

export const getHostelComparison = (params = {}) =>
  api.get("/api/admin/dean/hostel-comparison", { params }).then((r) => r.data);

export const getAcademicCorrelation = (params = {}) =>
  api.get("/api/admin/dean/academic-correlation", { params }).then((r) => r.data);

export const saveAcademicCalendar = (events) =>
  api.post("/api/admin/dean/academic-calendar", { events }).then((r) => r.data);

export const getEnvironmentalImpact = (params = {}) =>
  api.get("/api/admin/dean/environmental-impact", { params }).then((r) => r.data);

export const getWellnessTrends = (params = {}) =>
  api.get("/api/admin/dean/wellness-trends", { params }).then((r) => r.data);

export const generateReport = (body) =>
  api.post("/api/admin/dean/generate-report", body, { responseType: "blob" }).then((r) => r.data);

export const listReports = () =>
  api.get("/api/admin/dean/reports").then((r) => r.data);
