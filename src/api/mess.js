import api from "./client";

export const getMessOverview = () =>
  api.get("/api/admin/mess/overview").then((r) => r.data);

export const getMessRatings = (params = {}) =>
  api.get("/api/admin/mess/ratings", { params }).then((r) => r.data);

export const getMessNutrients = (params = {}) =>
  api.get("/api/admin/mess/nutrients", { params }).then((r) => r.data);

export const getMessMenu = (weekNumber) =>
  api.get("/api/admin/mess/menu", { params: { week_number: weekNumber } }).then((r) => r.data);

export const createMenuSlot = (body) =>
  api.post("/api/admin/mess/menu", body).then((r) => r.data);

export const updateMenuSlot = (menuId, body) =>
  api.put(`/api/admin/mess/menu/${menuId}`, body).then((r) => r.data);

export const publishMenu = (weekNumber) =>
  api.post("/api/admin/mess/menu/publish", { week_number: weekNumber }).then((r) => r.data);

export const getMessFeedback = (params = {}) =>
  api.get("/api/admin/mess/feedback", { params }).then((r) => r.data);
