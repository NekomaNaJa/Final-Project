export const API_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";

export const API = {
  login: `${API_URL}/auth/login`,
  register: `${API_URL}/auth/register`,
};
