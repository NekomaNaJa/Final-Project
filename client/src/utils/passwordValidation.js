// กฎการตรวจสอบรหัสผ่าน ใช้ร่วมกันได้ทั้ง frontend และ backend (logic เดียวกัน)

export const passwordRules = [
  {
    id: "length",
    label: "อย่างน้อย 8 ตัวอักษร",
    test: (password) => password.length >= 8,
  },
  {
    id: "lowercase",
    label: "มีตัวพิมพ์เล็ก (a-z)",
    test: (password) => /[a-z]/.test(password),
  },
  {
    id: "uppercase",
    label: "มีตัวพิมพ์ใหญ่ (A-Z)",
    test: (password) => /[A-Z]/.test(password),
  },
  {
    id: "number",
    label: "มีตัวเลข (0-9)",
    test: (password) => /[0-9]/.test(password),
  },
  {
    id: "special",
    label: "มีอักขระพิเศษ (!@#$%^&* เป็นต้น)",
    test: (password) => /[!@#$%^&*(),.?":{}|<>_\-+=[\]/~`;']/.test(password),
  },
];

// คืนค่า true ถ้าผ่านทุกเงื่อนไข
export const isPasswordValid = (password) =>
  passwordRules.every((rule) => rule.test(password));

// คืนข้อความ error แรกที่ไม่ผ่าน (ใช้แสดง error message สั้นๆ)
export const getPasswordError = (password) => {
  const failed = passwordRules.find((rule) => !rule.test(password));
  return failed ? `รหัสผ่านต้อง${failed.label}` : "";
};
