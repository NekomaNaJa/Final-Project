import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#090812] px-5 font-sans text-white">
      <div
        className="pointer-events-none fixed -top-40 left-1/2 h-[650px] w-[950px] -translate-x-1/2 rounded-full opacity-60 blur-[110px]"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(124, 58, 237, 0.28) 0%, rgba(88, 28, 135, 0.15) 45%, rgba(9, 8, 18, 0) 75%)",
        }}
      />
      <div className="relative z-10 text-center">
        <p className="font-serif text-8xl font-bold text-[#aa8df1]">404</p>
        <h1 className="mt-4 text-2xl font-bold text-[#e8e4ee]">
          ไม่พบหน้าที่คุณกำลังมองหา
        </h1>
        <p className="mt-2 text-sm text-[#716b7a]">
          ลิงก์นี้อาจใช้งานไม่ได้ หรือหน้านี้ยังไม่พร้อมใช้งาน
        </p>
        <Link
          to="/"
          className="mt-8 inline-block rounded-lg bg-[#8b5cf6] px-6 py-3 text-sm font-semibold text-white shadow-[0_0_20px_rgba(139,92,246,0.35)] transition-all hover:bg-[#7c3aed]"
        >
          กลับหน้าแรก
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
