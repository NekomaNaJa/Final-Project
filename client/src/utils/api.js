export const API_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";

export const API = {
  login: `${API_URL}/auth/login`,
  register: `${API_URL}/auth/register`,
  usersMe: `${API_URL}/users/me`,
  usersPayment: `${API_URL}/users/payment`,
  usersDonationPage: `${API_URL}/users/donation-page`,
  publicStreamer: (username) => `${API_URL}/public/${encodeURIComponent(username)}`,
  donations: `${API_URL}/donations`,
};

export const getAuthToken = () => {
  return localStorage.getItem("token") || "";
};

export const getAuthHeaders = () => {
  const token = getAuthToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

/**
 * ดึงข้อมูลโปรไฟล์ผู้ใช้ปัจจุบัน (GET /api/users/me)
 */
export const fetchCurrentUser = async () => {
  const res = await fetch(API.usersMe, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "ไม่สามารถดึงข้อมูลผู้ใช้ได้");
  }
  return json.data;
};

/**
 * อัปเดตข้อมูลโปรไฟล์ผู้ใช้ปัจจุบัน (PUT /api/users/me)
 */
export const updateCurrentUser = async (payload) => {
  const res = await fetch(API.usersMe, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "ไม่สามารถอัปเดตข้อมูลผู้ใช้ได้");
  }
  return json.data;
};

/**
 * อัปเดตข้อมูลช่องทางรับเงิน (PUT /api/users/payment)
 */
export const updatePaymentSettings = async (payload) => {
  const res = await fetch(API.usersPayment, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "ไม่สามารถอัปเดตช่องทางรับเงินได้");
  }
  return json.data;
};

/**
 * อัปเดตข้อมูลการตั้งค่าหน้ารับเงิน (PUT /api/users/donation-page)
 */
export const updateDonationPageSettings = async (payload) => {
  const res = await fetch(API.usersDonationPage, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "ไม่สามารถอัปเดตการตั้งค่าหน้ารับเงินได้");
  }
  return json.data;
};

/**
 * ดึงข้อมูลสาธารณะของสตรีมเมอร์สำหรับหน้า Donor Page (GET /api/public/:username)
 */
export const fetchPublicStreamer = async (username) => {
  const res = await fetch(API.publicStreamer(username), {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "ไม่สามารถดึงข้อมูลสตรีมเมอร์ได้");
  }
  return json.data;
};

/**
 * สร้างรายการบริจาคใหม่สำหรับหน้า Donor (POST /api/donations)
 */
export const createDonation = async (payload) => {
  const res = await fetch(API.donations, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "ไม่สามารถสร้างรายการบริจาคได้");
  }
  return json.data;
};

