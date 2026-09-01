import { Link } from "react-router-dom";
import DonixLogo from "../../assets/PrimaryLogo.png";

const navLinks = [
  { label: "หน้าหลัก", to: "/" },
  { label: "ค้นพบ", to: "/discover" },
  { label: "วิธีใช้งาน", to: "/how-it-works" },
];

const Navbar = () => {
  // เช็ค token
  const token = localStorage.getItem("token");
  let user = null;
  if (token) {
    try {
      user = JSON.parse(
        atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))
      );
    } catch {
      localStorage.removeItem("token");
    }
  }

  return (
    <nav className="w-full bg-[#050505]/80 backdrop-blur border-b border-[#1f2937] sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 md:px-10 h-16 flex items-center justify-between">
        <Link to="/">
          <img src={DonixLogo} alt="Donix" className="h-6 w-auto" />
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              to={link.to}
              className="text-sm text-[#d1d5db] hover:text-[#8447FF] transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            // ── ล็อกอินอยู่ ──
            <>
              <Link
                to="/dashboard"
                className="flex items-center gap-2 rounded-full border border-purple-500/40 bg-purple-600/10 px-3 py-1.5 hover:bg-purple-600/20 transition-colors"
              >
                <div className="w-6 h-6 grid place-items-center rounded-full bg-linear-to-br from-purple-500 to-purple-700 text-xs font-bold text-white">
                  {user.username?.[0]?.toUpperCase()}
                </div>
                <span className="text-sm font-medium text-white">
                  {user.username}
                </span>
              </Link>
            </>
          ) : (
            // ── ยังไม่ล็อกอิน ──
            <>
              <Link
                to="/login"
                className="text-sm text-[#d1d5db] hover:text-[#6642AD] transition-colors"
              >
                LOGIN
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 rounded-lg text-sm font-semibold text-[#6642AD] bg-[#110A1C] border border-[#432B71] hover:bg-[#8447FF] hover:text-white transition-colors"
              >
                SIGN UP
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
