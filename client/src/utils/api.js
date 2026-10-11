export const API_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";

export const API = {
  login: `${API_URL}/auth/login`,
  register: `${API_URL}/auth/register`,
  googleAuth: `${API_URL}/auth/google`,
  usersMe: `${API_URL}/users/me`,
  usersPayment: `${API_URL}/users/payment`,
  usersDonationPage: `${API_URL}/users/donation-page`,
  changePassword: `${API_URL}/users/change-password`,
  publicStreamer: (username) => `${API_URL}/public/${encodeURIComponent(username)}`,
  publicOverlay: (type, token) => `${API_URL}/public/overlay/${encodeURIComponent(type)}/${encodeURIComponent(token)}`,
  donations: `${API_URL}/donations`,
  donationsStats: `${API_URL}/donations/stats`,
  donationDetail: (id) => `${API_URL}/donations/${encodeURIComponent(id)}`,
  widgetsMe: `${API_URL}/widgets/me`,
  forgotPasswordSendOtp: `${API_URL}/auth/forgot-password/send-otp`,
  forgotPasswordVerifyOtp: `${API_URL}/auth/forgot-password/verify-otp`,
  forgotPasswordReset: `${API_URL}/auth/forgot-password/reset`,
  linkOtpSend: `${API_URL}/users/link-otp/send`,
  linkOtpVerify: `${API_URL}/users/link-otp/verify`,
};

/**
 * เข้าสู่ระบบหรือสมัครสมาชิกด้วย Google OAuth (POST /api/auth/google)
 */
export const loginWithGoogle = async (payload) => {
  const body = typeof payload === "string" ? { credential: payload } : payload;
  const res = await fetch(API.googleAuth, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "การเข้าสู่ระบบด้วย Google ล้มเหลว");
  }
  return json;
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
 * เปลี่ยนรหัสผ่านสำหรับหน้า Account (PUT /api/users/change-password)
 */
export const changePassword = async (payload) => {
  const res = await fetch(API.changePassword, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "ไม่สามารถเปลี่ยนรหัสผ่านได้");
  }
  return json.data;
};

/**
 * ดึงรายการประวัติการรับเงินของสตรีมเมอร์ (GET /api/donations)
 */
export const fetchDonationHistory = async ({
  page = 1,
  limit = 10,
  status = "all",
  search = "",
} = {}) => {
  const params = new URLSearchParams();
  if (page) params.append("page", String(page));
  if (limit) params.append("limit", String(limit));
  if (status && status !== "all") params.append("status", String(status));
  if (search && search.trim() !== "") params.append("search", String(search).trim());

  const queryString = params.toString();
  const url = queryString ? `${API.donations}?${queryString}` : API.donations;

  const res = await fetch(url, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "ไม่สามารถดึงประวัติการรับเงินได้");
  }
  return json.data;
};

/**
 * ดึงข้อมูลสถิติสำหรับหน้า Dashboard (GET /api/donations/stats)
 */
export const fetchDonationStats = async () => {
  const res = await fetch(API.donationsStats, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "ไม่สามารถดึงข้อมูลสถิติได้");
  }
  return json.data;
};

/**
 * อนุมัติหรือปฏิเสธรายการบริจาค (PATCH /api/donations/:id)
 */
export const updateDonationStatus = async (id, status) => {
  const res = await fetch(API.donationDetail(id), {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify({ status }),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "ไม่สามารถเปลี่ยนสถานะรายการบริจาคได้");
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

export const fetchPublicStreamerData = fetchPublicStreamer;

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

export const submitDonation = createDonation;

/**
 * ดึงข้อมูลการตั้งค่าวิดเจ็ตของผู้ใช้ปัจจุบัน (GET /api/widgets/me)
 */
export const fetchWidgetConfig = async () => {
  const res = await fetch(API.widgetsMe, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "ไม่สามารถดึงข้อมูลวิดเจ็ตได้");
  }
  return json.data;
};

/**
 * บันทึกการตั้งค่าวิดเจ็ตไปยังฐานข้อมูลจริง (PUT /api/widgets/me)
 */
export const saveWidgetSettings = async (payload) => {
  const res = await fetch(API.widgetsMe, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "ไม่สามารถบันทึกการตั้งค่าวิดเจ็ตได้");
  }
  return json.data;
};

/**
 * ดึงข้อมูลการแสดงผลวิดเจ็ตสำหรับ Browser Source (GET /api/public/overlay/:type/:token)
 */
export const fetchPublicOverlayConfig = async (type, token) => {
  const res = await fetch(API.publicOverlay(type, token), {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "ไม่สามารถดึงข้อมูลการแสดงผลวิดเจ็ตได้");
  }
  return json.data;
};

/**
 * ขอรหัส OTP สำหรับรีเซ็ตรหัสผ่าน (POST /api/auth/forgot-password/send-otp)
 */
export const sendForgotPasswordOtp = async (payload) => {
  const res = await fetch(API.forgotPasswordSendOtp, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "ไม่สามารถส่งรหัส OTP ได้");
  }
  return json.data;
};

/**
 * ยืนยันรหัส OTP สำหรับรีเซ็ตรหัสผ่าน (POST /api/auth/forgot-password/verify-otp)
 */
export const verifyForgotPasswordOtp = async (payload) => {
  const res = await fetch(API.forgotPasswordVerifyOtp, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "รหัส OTP ไม่ถูกต้อง");
  }
  return json.data;
};

/**
 * ตั้งรหัสผ่านใหม่หลังจากยืนยัน OTP สำเร็จ (POST /api/auth/forgot-password/reset)
 */
export const resetForgotPassword = async (payload) => {
  const res = await fetch(API.forgotPasswordReset, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "ไม่สามารถรีเซ็ตรหัสผ่านได้");
  }
  return json;
};

/**
 * ส่งรหัส OTP เพื่อเชื่อมต่อและยืนยันอีเมลหรือเบอร์โทรศัพท์ในหน้า Account (POST /api/users/link-otp/send)
 */
export const sendLinkOtp = async (payload) => {
  const res = await fetch(API.linkOtpSend, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "ไม่สามารถส่งรหัส OTP ได้");
  }
  return json.data;
};

/**
 * ยืนยันรหัส OTP เพื่อเชื่อมต่ออีเมลหรือเบอร์โทรศัพท์ในหน้า Account (POST /api/users/link-otp/verify)
 */
export const verifyLinkOtp = async (payload) => {
  const res = await fetch(API.linkOtpVerify, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "ยืนยันรหัส OTP ไม่สำเร็จ");
  }
  return json.data;
};

