export const API_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";

export const API = {
  login: `${API_URL}/auth/login`,
  register: `${API_URL}/auth/register`,
  me: `${API_URL}/auth/me`,
};

/**
 * อ่าน response จาก server แล้วโยน Error พร้อมข้อความภาษาไทยเสมอ
 * ป้องกันกรณี server ตอบกลับมาไม่ใช่ JSON (เช่น หน้า HTML จาก proxy หรือ error handler)
 * ซึ่งเดิมทำให้ res.json() พังแล้วโชว์ error อังกฤษยาว ๆ แก่ผู้ใช้
 */
export const parseResponse = async (res) => {
  let data = {};
  try {
    data = await res.json();
  } catch {
    data = {};
  }

  if (!res.ok) {
    throw new Error(
      data?.message || "เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง",
    );
  }

  return data;
};
