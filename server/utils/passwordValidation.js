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

export const isPasswordValid = (password) =>
  typeof password === "string" &&
  passwordRules.every((rule) => rule.test(password));

export const getPasswordError = (password) => {
  if (typeof password !== "string" || password.length === 0) {
    return "กรุณากรอกรหัสผ่าน";
  }
  const failed = passwordRules.find((rule) => !rule.test(password));
  return failed ? `รหัสผ่านต้อง${failed.label}` : "";
};
