import api from "./client";

export const getWardenOverview = () =>
  api.get("/api/admin/warden/overview").then((r) => r.data);

export const getWardenActivity = (params = {}) =>
  api.get("/api/admin/warden/activity", { params }).then((r) => r.data);

export const getWardenNutrition = (params = {}) =>
  api.get("/api/admin/warden/nutrition", { params }).then((r) => r.data);

export const getWardenMood = (params = {}) =>
  api.get("/api/admin/warden/mood", { params }).then((r) => r.data);

export const getWardenAlerts = () =>
  api.get("/api/admin/warden/alerts").then((r) => r.data);

export const acknowledgeAlert = (alertId, note = "") =>
  api.post(`/api/admin/warden/alerts/${alertId}/acknowledge`, { note }).then((r) => r.data);

export const getWardenInitiatives = () =>
  api.get("/api/admin/warden/initiatives").then((r) => r.data);

export const createInitiative = (body) =>
  api.post("/api/admin/warden/initiatives", body).then((r) => r.data);

export const getWardenExportUrl = (params = {}) => {
  const q = new URLSearchParams(params).toString();
  return `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/admin/warden/export?${q}`;
};
