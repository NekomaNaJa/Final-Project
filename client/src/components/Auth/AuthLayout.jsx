import { Link } from "react-router-dom";
import DonixLogo from "../../assets/PrimaryLogo.png";
import DonixBG from "../../assets/bg-login.png";

const AuthLayout = ({ children }) => {
  return (
    <div className="flex min-h-screen w-full bg-[#07060F] font-sans">
      <div className="hidden md:block w-1/2 relative">
        <img
          src={DonixBG}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute bottom-10 left-10 z-10 max-w-sm">
          <p className="text-[#7449CA] text-sm font-bold tracking-widest mb-3">
            DONIX
          </p>
          <p className="text-white text-xl font-bold leading-snug">
            เข้าร่วมกับพวกเราเพื่อ
          </p>
          <p className="text-3xl font-extrabold leading-tight mt-1 donix-gradient-text">
            การโดเนทยุคใหม่
          </p>
          <p className="text-white text-sm mt-3">ระบบการโดเนทสำหรับ Streamer</p>
        </div>
      </div>

      <div className="w-full md:w-1/2 bg-[#07060F] flex flex-col px-8 md:px-14 py-8 md:py-10">
        <div className="flex justify-between items-center mb-12">
          <img src={DonixLogo} alt="Donix" className="h-7 w-auto" />
          <Link
            to="/"
            className="text-white text-sm hover:text-[#c4b5fd] transition-colors"
          >
            ← กลับหน้าหลัก
          </Link>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-md">{children}</div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
