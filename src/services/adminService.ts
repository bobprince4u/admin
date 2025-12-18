import axios from "axios";

const API_BASE =
  import.meta.env.VITE_API_URL || "http://localhost:2025/api/admin";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface UserPayload {
  id: string;
  email: string;
  fullName: string;
  role: string;
}

export const adminLogin = async (payload: LoginPayload) => {
  const response = await axios.post(`${API_BASE}/login`, payload);
  return response.data; // { success, message, data }
};

// Optional: Logout (could notify backend if needed)
export const adminLogout = () => {
  localStorage.removeItem("adminToken");
  localStorage.removeItem("adminUser");
};
