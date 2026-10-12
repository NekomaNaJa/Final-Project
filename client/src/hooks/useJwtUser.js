import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const parseToken = () => {
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const base64 = parts[1].replaceAll("-", "+").replaceAll("_", "/");
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
};

/**
 * อ่านข้อมูลผู้ใช้จาก JWT ที่เก็บไว้ใน localStorage
 * ถ้าไม่มี token หรือ token แตก ให้ redirect ไปหน้า /login
 * ใช้ร่วมกันโดยหน้าที่ต้องรู้ username เช่น Dashboard และ HistoryPage
 */
export const useJwtUser = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(parseToken);

  useEffect(() => {
    const payload = parseToken();
    if (!payload) {
      localStorage.removeItem("token");
      navigate("/login");
    } else {
      setUser((prev) => {
        if (!prev || prev.username !== payload.username || prev.userId !== payload.userId) {
          return payload;
        }
        return prev;
      });
    }
  }, [navigate]);

  return user;
};

export default useJwtUser;