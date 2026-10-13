import React, { useEffect } from "react";
import { CheckCircle2 } from "lucide-react";

const OAuthCallback = () => {
  useEffect(() => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const code = searchParams.get("code");
      const state = searchParams.get("state");
      const error = searchParams.get("error");

      if (window.opener) {
        window.opener.postMessage(
          {
            type: "OAUTH_CALLBACK",
            code,
            state,
            error,
          },
          window.location.origin
        );
        setTimeout(() => {
          window.close();
        }, 600);
      }
    } catch {
      // Ignored in non-browser or sandbox environments
    }
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#090812] text-white p-4">
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-[#2e2648] bg-[#16122a] p-8 text-center shadow-xl max-w-sm w-full">
        <CheckCircle2 size={36} className="text-emerald-400 animate-pulse" />
        <h2 className="text-base font-bold text-white">ยืนยันตัวตนสำเร็จ</h2>
        <p className="text-xs text-[#9891ab]">
          กำลังเชื่อมต่อบัญชีกับระบบ DONIX และปิดหน้าต่างนี้โดยอัตโนมัติ...
        </p>
      </div>
    </div>
  );
};

export default OAuthCallback;
