const TOKEN_KEY = "token";

export const getToken = () => localStorage.getItem(TOKEN_KEY);

export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);

export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

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
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(base64));

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
