import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import AuthLayout from "../components/Auth/AuthLayout";
import InputField from "../components/Auth/InputField";
import SocialAuthButtons from "../components/Auth/SocialAuthButtons";
import PasswordChecklist from "../components/Auth/PasswordChecklist";
import { isPasswordValid, getPasswordError } from "../utils/passwordValidation";
import { API } from "../utils/api";

const Register = () => {
  const navigate = useNavigate();

  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
  });

  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!agreed) return setError("กรุณายอมรับข้อตกลงก่อน");

    if (!isPasswordValid(form.password)) {
      return setError(getPasswordError(form.password));
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(API.register, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message);

      localStorage.setItem("token", data.token);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <h2 className="text-white text-3xl font-bold mb-8">สมัครสมาชิก</h2>

      <form onSubmit={handleSubmit}>
        <InputField
          name="username"
          label="ชื่อผู้ใช้"
          placeholder="Streamer"
          value={form.username}
          onChange={handleChange}
        />

        <InputField
          name="email"
          label="อีเมล"
          placeholder="Streamer@Donix.com"
          value={form.email}
          onChange={handleChange}
        />

        <InputField
          name="password"
          label="รหัสผ่าน"
          type="password"
          placeholder="อย่างน้อย 8 ตัวอักษร"
          value={form.password}
          onChange={handleChange}
        />

        <PasswordChecklist password={form.password} />

        <label className="flex items-start gap-2 mb-4 cursor-pointer">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 accent-purple-500"
          />

          <span className="text-gray-400 text-xs">
            ฉันได้อ่านและยอมรับ{" "}
            <button
              type="button"
              className="text-purple-400 hover:underline"
              onClick={() => setShowPrivacy(true)}
            >
              นโยบายความเป็นส่วนตัว
            </button>{" "}
            และ{" "}
            <button
              type="button"
              className="text-purple-400 hover:underline"
              onClick={() => setShowTerms(true)}
            >
              เงื่อนไขการให้บริการ
            </button>
          </span>
        </label>

        {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-xl font-semibold text-white text-sm
                     bg-[#7c3aed] hover:bg-[#6d28d9] transition-colors
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "กำลังสมัคร..." : "สมัครสมาชิก"}
        </button>
      </form>

      <p className="text-[#9ca3af] text-sm text-center mt-5">
        มีบัญชีอยู่แล้ว?{" "}
        <Link
          to="/login"
          className="text-[#a78bfa] hover:text-[#c4b5fd] transition-colors"
        >
          เข้าสู่ระบบ
        </Link>
      </p>

      <div className="flex items-center gap-4 my-6">
        <div className="flex-1 h-px bg-[#374151]" />
        <span className="text-[#6b7280] text-xs font-medium">OR</span>
        <div className="flex-1 h-px bg-[#374151]" />
      </div>

      <SocialAuthButtons />

      {/* Privacy Policy Modal */}
      {showPrivacy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-xl bg-[#151728] p-6">
            <h2 className="mb-4 text-xl font-semibold text-white">
              นโยบายความเป็นส่วนตัว
            </h2>

            <p className="text-sm text-gray-400">
              เนื้อหานโยบายความเป็นส่วนตัวของ DONIX
            </p>

            <button
              type="button"
              onClick={() => setShowPrivacy(false)}
              className="mt-6 rounded-lg bg-purple-600 px-4 py-2 text-white"
            >
              ปิด
            </button>
          </div>
        </div>
      )}

      {/* Terms of Service Modal */}
      {showTerms && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-xl bg-[#151728] p-6">
            <h2 className="mb-4 text-xl font-semibold text-white">
              เงื่อนไขการให้บริการ
            </h2>

            <p className="text-sm text-gray-400">
              เนื้อหาเงื่อนไขการให้บริการของ DONIX
            </p>

            <button
              type="button"
              onClick={() => setShowTerms(false)}
              className="mt-6 rounded-lg bg-purple-600 px-4 py-2 text-white"
            >
              ปิด
            </button>
          </div>
        </div>
      )}
    </AuthLayout>
  );
};

export default Register;
