import React from "react";
import { Link } from "react-router-dom";
import DonixLogo from "../../assets/PrimaryLogo.png";

const getLoggedUsername = () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) return null;
    const payload = JSON.parse(
      atob(token.split(".")[1].replaceAll("-", "+").replaceAll("_", "/"))
    );
    return payload?.username || null;
  } catch {
    return null;
  }
};

const socialLinks = ["Facebook", "Instagram", "Line", "X", "Donix@gmail.com"];

const Footer = ({ username }) => {
  const activeUsername = getLoggedUsername() || username;
  const personalDonatePath = activeUsername
    ? `/${encodeURIComponent(activeUsername)}`
    : "/donate-page";

  const columns = [
    {
      title: "หน้าทั้งหมด",
      links: [
        { label: "หน้าหลัก", to: "/" },
        { label: "ค้นพบ", to: "/discover" },
        { label: "วิธีใช้งาน", to: "/how-it-works" },
        { label: "เข้าสู่ระบบ", to: "/login" },
        { label: "สมัครสมาชิก", to: "/register" },
      ],
    },
    {
      title: "บัญชีผู้ใช้",
      links: [
        { label: "เข้าสู่ระบบ", to: "/login" },
        { label: "สมัครสมาชิก", to: "/register" },
        { label: "การจัดการบัญชี", to: "/account" },
        { label: "หน้ารับเงินส่วนตัว", to: personalDonatePath },
      ],
    },
  ];

  return (
    <footer className="bg-[#13101c] border-t border-border">
      <div className="max-w-6xl mx-auto px-6 md:px-10 py-14 grid sm:grid-cols-3 gap-10">
        {columns.map((col) => (
          <div key={col.title}>
            <p className="text-white font-bold text-sm mb-4">{col.title}</p>
            <ul className="space-y-2">
              {col.links.map((link) => (
                <li key={`${col.title}-${link.label}`}>
                  <Link
                    to={link.to}
                    className="text-[#9ca3af] text-xs hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div>
          <p className="text-white font-bold text-sm mb-4">ติดต่อเรา</p>
          <ul className="space-y-2">
            {socialLinks.map((s) => (
              <li key={s} className="text-[#9ca3af] text-xs">
                {s}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-border py-6 flex justify-center">
        <img src={DonixLogo} alt="Donix" className="h-6 w-auto opacity-80" />
      </div>
    </footer>
  );
};

export default Footer;
