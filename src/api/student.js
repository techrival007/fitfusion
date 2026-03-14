import axios from "axios";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";
const STORAGE_KEY = "student_token";

export const studentApi = axios.create({ baseURL: BASE });

studentApi.interceptors.request.use((cfg) => {
  const token = localStorage.getItem(STORAGE_KEY);
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

studentApi.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem(STORAGE_KEY);
      window.location.href = "/student/login";
    }
    return Promise.reject(err);
  }
);

export const studentLogin = (roll_number, password) =>
  studentApi.post("/api/student/auth/login", { roll_number, password }).then((r) => r.data);

export const getStudentDashboard = () =>
  studentApi.get("/api/student/dashboard").then((r) => r.data);

export const getWellnessHistory = (days = 30) =>
  studentApi.get(`/api/student/wellness/history?days=${days}`).then((r) => r.data);

export const getTodayMenu = () =>
  studentApi.get("/api/student/mess/menu/today").then((r) => r.data);

export const getStudentEnvironment = () =>
  studentApi.get("/api/environment/current").then((r) => r.data);

export const getLeaderboard = () =>
  studentApi.get("/api/student/leaderboard").then((r) => r.data);

export const logActivity = (payload) =>
  studentApi.post("/api/student/log/activity", payload).then((r) => r.data);

export const logNutrition = (payload) =>
  studentApi.post("/api/student/log/nutrition", payload).then((r) => r.data);

export const logMoodSleep = (payload) =>
  studentApi.post("/api/student/log/mood-sleep", payload).then((r) => r.data);

export const saveJournalEntry = (entry_text) =>
  studentApi.post("/api/student/journal", { entry_text }).then((r) => r.data);

export const updateJournalEntry = (id, entry_text) =>
  studentApi.put(`/api/student/journal/${id}`, { entry_text }).then((r) => r.data);

export const listJournalEntries = () =>
  studentApi.get("/api/student/journal").then((r) => r.data);

export const getJournalEntry = (id) =>
  studentApi.get(`/api/student/journal/${id}`).then((r) => r.data);

export const deleteJournalEntry = (id) =>
  studentApi.delete(`/api/student/journal/${id}`).then((r) => r.data);
