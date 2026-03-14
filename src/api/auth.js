import api from "./client";

export async function loginAdmin(email, password) {
  const res = await api.post("/api/admin/auth/login", { email, password });
  return res.data;
}
