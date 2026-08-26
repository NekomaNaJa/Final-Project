import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import AuthLayout from "../components/Login/AuthLayout";
import InputField from "../components/Login/InputField";
import SocialAuthButtons from "../components/Login/SocialAuthButtons";

const Login = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
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
      <h1 className="text-white text-3xl font-bold mb-8">เข้าสู่ระบบ</h1>

      <form onSubmit={handleSubmit}>
        <InputField
          name="email"
          label="อีเมล หรือ ชื่อผู้ใช้"
          placeholder="Streamer@Donix.com"
          value={form.email}
          onChange={handleChange}
        />
        <InputField
          name="password"
          label="รหัสผ่าน"
          type="password"
          placeholder="*************"
          value={form.password}
          onChange={handleChange}
        />

        <div className="text-right -mt-1 mb-6">
          <Link
            to="/forgot-password"
            className="text-[#a78bfa] text-sm hover:text-[#c4b5fd] transition-colors"
          >
            ลืมรหัสผ่าน?
          </Link>
        </div>

        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-xl font-semibold text-white text-sm
                     bg-[#7c3aed] hover:bg-[#6d28d9] transition-colors
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
        </button>
      </form>

      <p className="text-[#9ca3af] text-sm text-center mt-5">
        ยังไม่มีบัญชี?{" "}
        <Link
          to="/register"
          className="text-[#a78bfa] hover:text-[#c4b5fd] transition-colors"
        >
          สมัครสมาชิก
        </Link>
      </p>

      <div className="flex items-center gap-4 my-6">
        <div className="flex-1 h-px bg-[#374151]" />
        <span className="text-[#6b7280] text-xs font-medium">OR</span>
        <div className="flex-1 h-px bg-[#374151]" />
      </div>

      <SocialAuthButtons />
    </AuthLayout>
  );
};

export default Login;
