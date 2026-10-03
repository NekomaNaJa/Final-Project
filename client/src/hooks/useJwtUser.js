import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

/**
 * อ่านข้อมูลผู้ใช้จาก JWT ที่เก็บไว้ใน localStorage
 * ถ้าไม่มี token หรือ token แตก ให้ redirect ไปหน้า /login
 * ใช้ร่วมกันโดยหน้าที่ต้องรู้ username เช่น Dashboard และ HistoryPage
 */
export const useJwtUser = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setTimeout(() => setUser(payload), 0);
    } catch {
      navigate("/login");
    }
  }, [navigate]);

  return user;
};

export default useJwtUser;