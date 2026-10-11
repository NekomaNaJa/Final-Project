import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { loginWithGoogle } from "../../utils/api";

const GOOGLE_ICON = (
  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

const SocialAuthButtons = ({ onSuccess, onError, onBeforeAuth }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID || "";

  useEffect(() => {
    if (typeof window === "undefined" || window.google?.accounts) return;
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
  }, []);

  const handleAuthSuccess = (data) => {
    localStorage.setItem("token", data.token);
    if (onSuccess) {
      onSuccess(data);
    } else {
      navigate("/dashboard");
    }
  };

  const handleGoogleClick = () => {
    if (onBeforeAuth && !onBeforeAuth()) {
      return;
    }

    if (!clientId) {
      setShowDemoModal(true);
      return;
    }

    setLoading(true);

    try {
      if (window.google?.accounts?.oauth2) {
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: "email profile openid",
          callback: async (tokenResponse) => {
            if (tokenResponse?.access_token) {
              try {
                const res = await loginWithGoogle({ accessToken: tokenResponse.access_token });
                handleAuthSuccess(res);
              } catch (err) {
                onError?.(err.message || "เกิดข้อผิดพลาดในการเข้าสู่ระบบด้วย Google");
              } finally {
                setLoading(false);
              }
            } else {
              setLoading(false);
            }
          },
          error_callback: () => {
            onError?.("การเข้าสู่ระบบด้วย Google ถูกยกเลิกหรือล้มเหลว");
            setLoading(false);
          },
        });
        tokenClient.requestAccessToken();
      } else if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response) => {
            try {
              const res = await loginWithGoogle(response.credential);
              handleAuthSuccess(res);
            } catch (err) {
              onError?.(err.message || "เกิดข้อผิดพลาดในการเข้าสู่ระบบด้วย Google");
            } finally {
              setLoading(false);
            }
          },
        });
        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            setLoading(false);
          }
        });
      } else {
        setLoading(false);
        onError?.("กำลังโหลดระบบ Google Sign-In กรุณาลองใหม่อีกครั้ง");
      }
    } catch (err) {
      setLoading(false);
      onError?.(err.message || "ไม่สามารถเปิดระบบ Google Sign-In ได้");
    }
  };

  const handleDemoLogin = async () => {
    setShowDemoModal(false);
    setLoading(true);
    try {
      const demoEmail = `streamer_${Date.now().toString().slice(-4)}@gmail.com`;
      const res = await loginWithGoogle({
        mockUser: {
          sub: `google_demo_${Date.now()}`,
          email: demoEmail,
          name: "Google Streamer Demo",
          picture: "https://lh3.googleusercontent.com/a/default-user",
        },
      });
      handleAuthSuccess(res);
    } catch (err) {
      onError?.(err.message || "เกิดข้อผิดพลาดในการเข้าสู่ระบบด้วย Google");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={handleGoogleClick}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-xl
                   text-white text-sm font-medium bg-[#1f2937] border border-[#374151]
                   hover:border-[#7c3aed]/50 hover:bg-[#252f3f]
                   transform transition-all duration-200
                   hover:scale-[0.98] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {GOOGLE_ICON}
        {loading ? "กำลังเชื่อมต่อกับ Google..." : "ดำเนินการต่อด้วย Google"}
      </button>

      {/* Demo / Config Notice Modal when Client ID is missing */}
      {showDemoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#16122d] border border-[#2b2542] p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-purple-600/20 text-purple-400">
                {GOOGLE_ICON}
              </div>
              <h3 className="text-lg font-bold text-white">Google OAuth Service</h3>
            </div>
            <p className="text-sm text-gray-300 leading-relaxed">
              ระบบหลังบ้านและหน้าบ้านเชื่อมต่อ Google OAuth เรียบร้อยแล้ว หากต้องการเชื่อมต่อกับบัญชี Google จริง ให้เพิ่มตัวแปรในไฟล์ <code className="bg-black/40 px-1.5 py-0.5 rounded text-purple-300 text-xs">client/.env</code>:
            </p>
            <div className="mt-3 p-3 rounded-xl bg-[#0e0b1d] border border-[#262040] text-xs font-mono text-purple-300 select-all">
              REACT_APP_GOOGLE_CLIENT_ID=&lt;your_client_id&gt;
            </div>
            <p className="mt-3 text-xs text-gray-400">
              หรือกดปุ่มด้านล่างเพื่อทดสอบการล็อกอิน/สมัครสมาชิกด้วย Google Demo Account ได้ทันที
            </p>

            <div className="mt-6 flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                onClick={handleDemoLogin}
                className="flex-1 py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-colors"
              >
                เข้าสู่ระบบด้วย Google (Demo Mode)
              </button>
              <button
                type="button"
                onClick={() => setShowDemoModal(false)}
                className="py-2.5 px-4 rounded-xl bg-[#261f3d] hover:bg-[#342b52] text-gray-300 text-xs font-medium transition-colors"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SocialAuthButtons;
