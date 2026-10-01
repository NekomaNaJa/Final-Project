const TOKEN_KEY = "token";

export const getToken = () => localStorage.getItem(TOKEN_KEY);

export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);

export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

/**
 * atob คืนค่าเป็น binary string (1 ตัวอักษร = 1 byte) จึงต้อง decode กลับเป็น UTF-8
 * ไม่งั้นชื่อผู้ใช้ภาษาไทยใน token จะกลายเป็นตัวอักษรยึกยือ
 */
const decodeBase64Url = (value) => {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const bytes = Uint8Array.from(atob(base64), (char) => char.codePointAt(0));
  return new TextDecoder().decode(bytes);
};

/**
 * ถอด payload จาก JWT แล้วตรวจว่ายังไม่หมดอายุ
 * คืน null ถ้าไม่มี token, token เสีย, หรือหมดอายุแล้ว
 *
 * ต้องแปลง base64url -> base64 ก่อน atob เสมอ
 * มิฉะนั้น payload ที่มีอักขระ - หรือ _ จะทำให้ atob โยน InvalidCharacterError
 */
export const getTokenPayload = () => {
  const token = getToken();
  if (!token) return null;

  try {
    const payload = JSON.parse(decodeBase64Url(token.split(".")[1]));

    if (payload?.exp && payload.exp * 1000 <= Date.now()) {
      clearToken();
      return null;
    }

    return payload;
  } catch {
    clearToken();
    return null;
  }
};
