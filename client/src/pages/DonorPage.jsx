import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { CheckCircle2, AlertCircle } from "lucide-react";
import DonorHeader from "../components/Donor/DonorHeader";
import DonorPaymentTabs from "../components/Donor/DonorPaymentTabs";
import DonorDisabledCard from "../components/Donor/DonorDisabledCard";
import DonorPromptPayForm from "../components/Donor/DonorPromptPayForm";
import DonorBankForm from "../components/Donor/DonorBankForm";
import DonorTrueMoneyForm from "../components/Donor/DonorTrueMoneyForm";
import { fetchPublicStreamer, createDonation } from "../utils/api";

const fileToBase64 = (file) => {
  return new Promise((resolve) => {
    if (!file) {
      resolve(null);
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
};

const getInitialStreamerConfig = (username) => {
  const defaultConfig = {
    welcomeMessage:
      "ยินดีต้อนรับสู่หน้ารับเงินของข้าพเจ้า ขอขอบคุณทุกการสนับสนุนครับ!",
    thankYouMessage: "ขอบคุณสำหรับการสนับสนุนมากๆ ครับ!",
    minAmount: 10,
    charLimit: 200,
    filteredWords: ["คำหยาบ", "สแปม"],
    coverImage: null,
    payment: {
      promptpay: {
        enabled: true,
        type: "เบอร์โทรศัพท์",
        number: "0812345678",
      },
      bank: {
        enabled: true,
        bankName: "ธนาคารไทยพาณิชย์ (SCB)",
        accountNumber: "4170606722",
        accountName: "มนต์ธร กอเจริญทรัพย์",
      },
      truemoney: {
        enabled: false,
        phone: "0812345678",
      },
    },
  };

  try {
    const savedDonateConfig =
      localStorage.getItem(`donix_donate_config_${username}`) ||
      localStorage.getItem("donix_donate_config");
    const savedPaymentConfig =
      localStorage.getItem(`donix_payment_config_${username}`) ||
      localStorage.getItem("donix_payment_config");

    let config = { ...defaultConfig };
    if (savedDonateConfig) {
      const parsed = JSON.parse(savedDonateConfig);
      config = {
        ...config,
        welcomeMessage: parsed.welcomeMessage || config.welcomeMessage,
        thankYouMessage: parsed.thankYouMessage || config.thankYouMessage,
        minAmount:
          parsed.minAmount !== undefined ? parsed.minAmount : config.minAmount,
        charLimit: parsed.charLimit
          ? Number(parsed.charLimit) || 200
          : config.charLimit,
        filteredWords: parsed.filteredWords || config.filteredWords,
        coverImage: parsed.coverImage || config.coverImage,
      };
    }

    if (savedPaymentConfig) {
      const parsed = JSON.parse(savedPaymentConfig);
      config.payment = {
        promptpay: { ...config.payment.promptpay, ...parsed.promptpay },
        bank: { ...config.payment.bank, ...parsed.bank },
        truemoney: { ...config.payment.truemoney, ...parsed.truemoney },
      };
    }

    const savedWidgetConfig = localStorage.getItem("donix_widget_config");
    if (savedWidgetConfig) {
      const parsedWidget = JSON.parse(savedWidgetConfig);
      if (parsedWidget?.alert?.minAmount !== undefined) {
        const wMin = Number(parsedWidget.alert.minAmount);
        if (wMin > 0) {
          config.minAmount = wMin;
        }
      }
    }

    return config;
  } catch {
    return defaultConfig;
  }
};

const DonorPage = () => {
  const { username: paramUsername } = useParams();
  const username = paramUsername || "Test";

  // Streamer configurations (loaded synchronously from storage/defaults, refreshed by API)
  const [streamerConfig, setStreamerConfig] = useState(() =>
    getInitialStreamerConfig(username)
  );

  // Active payment channel tab
  const [activeTab, setActiveTab] = useState("promptpay");

  // Donor input fields
  const [donorName, setDonorName] = useState("Anonymous");
  const [message, setMessage] = useState("สวัสดีครับ");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedDonation, setSubmittedDonation] = useState(null);
  const [errorFeedback, setErrorFeedback] = useState(null);
  const [streamerNotFound, setStreamerNotFound] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  // Fetch updated public data from API when available
  useEffect(() => {
    let isMounted = true;

    const loadPublicStreamer = async () => {
      try {
        setStreamerNotFound(false);
        const publicData = await fetchPublicStreamer(username);
        if (publicData && isMounted) {
          setStreamerConfig((prev) => ({
            ...prev,
            welcomeMessage:
              publicData.donationPage?.welcomeMessage || prev.welcomeMessage,
            thankYouMessage:
              publicData.donationPage?.thankYouMessage || prev.thankYouMessage,
            minAmount:
              publicData.donationPage?.minAmount !== undefined
                ? publicData.donationPage.minAmount
                : prev.minAmount,
            charLimit:
              publicData.donationPage?.charLimit || prev.charLimit,
            filteredWords:
              publicData.donationPage?.filteredWords || prev.filteredWords,
            coverImage:
              publicData.donationPage?.coverImage || prev.coverImage,
            payment: {
              promptpay: {
                ...prev.payment.promptpay,
                ...publicData.payment?.promptpay,
              },
              bank: {
                ...prev.payment.bank,
                ...publicData.payment?.bank,
              },
              truemoney: {
                ...prev.payment.truemoney,
                ...publicData.payment?.truemoney,
              },
            },
          }));
        }
      } catch (err) {
        if (isMounted && err?.message?.includes("ไม่พบสตรีมเมอร์นี้")) {
          setStreamerNotFound(true);
        }
        // Keep storage/defaults if API unreachable
      }
    };

    void loadPublicStreamer();

    return () => {
      isMounted = false;
    };
  }, [username]);

  // Check if active channel is enabled
  const isChannelEnabled = streamerConfig.payment[activeTab]?.enabled;

  const handleDonationSubmit = async (donationData) => {
    setIsSubmitting(true);
    setErrorFeedback(null);

    const min = Number(streamerConfig.minAmount) || 1;
    const numericAmount = Number(donationData?.amount);
    if (Number.isNaN(numericAmount) || numericAmount < min) {
      setErrorFeedback(`จำนวนเงินต้องไม่ต่ำกว่า ${min} บาท`);
      setIsSubmitting(false);
      return;
    }

    try {
      const slipBase64 = await fileToBase64(donationData.slipFile);
      const res = await createDonation({
        username,
        donorName: donorName || "Anonymous",
        amount: numericAmount,
        message,
        paymentMethod: donationData.method || activeTab,
        slipImage: slipBase64,
      });

      setSubmittedDonation({
        donorName,
        message,
        ...donationData,
        donationId: res?.id || res?._id,
        status: res?.status || "pending",
        transRef: res?.transRef,
      });
    } catch (err) {
      setErrorFeedback(err?.message || "เกิดข้อผิดพลาดในการส่งข้อมูลการโดเนท");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setSubmittedDonation(null);
    setMessage("");
    setDonorName("Anonymous");
    setErrorFeedback(null);
    setResetKey((prev) => prev + 1);

    if (typeof window !== "undefined" && typeof window.location?.reload === "function") {
      try {
        window.location.reload();
      } catch {
        // Fallback for testing environments where navigation is not supported
      }
    }
  };

  return (
    <div className="relative min-h-screen bg-[#090812] font-sans text-white flex flex-col items-center justify-center py-8 px-4 sm:px-6 overflow-x-hidden">
      {/* Ambient Gradient Background */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div
          className="absolute -top-32 left-1/2 h-[650px] w-[950px] -translate-x-1/2 rounded-full blur-[110px] opacity-75"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(124, 58, 237, 0.28) 0%, rgba(88, 28, 135, 0.15) 45%, rgba(9, 8, 18, 0) 75%)",
          }}
        />
        <div
          className="absolute top-1/3 -left-24 h-[500px] w-[500px] rounded-full blur-[120px] opacity-40"
          style={{
            background:
              "radial-gradient(circle, rgba(109, 40, 217, 0.2) 0%, rgba(9, 8, 18, 0) 70%)",
          }}
        />
        <div
          className="absolute top-2/3 -right-24 h-[550px] w-[550px] rounded-full blur-[130px] opacity-35"
          style={{
            background:
              "radial-gradient(circle, rgba(147, 51, 234, 0.18) 0%, rgba(9, 8, 18, 0) 70%)",
          }}
        />
      </div>

      {/* Main Donor Card Container */}
      <div className="relative z-10 w-full max-w-[720px] space-y-5">
        {/* Streamer Not Found Alert */}
        {streamerNotFound && (
          <div
            role="status"
            className="flex items-center gap-2.5 rounded-xl border border-amber-500/30 bg-amber-950/40 p-3.5 text-xs font-medium text-amber-300 shadow-md"
          >
            <AlertCircle size={16} className="shrink-0 text-amber-400" />
            <span>ไม่พบบัญชีสตรีมเมอร์ "{username}" ในระบบ กำลังแสดงหน้าจำลอง</span>
          </div>
        )}

        {/* Streamer Header */}
        <DonorHeader
          username={username}
          isOnline={true}
          welcomeMessage={streamerConfig.welcomeMessage}
          coverImage={streamerConfig.coverImage}
        />

        {/* Donation Main Card */}
        <div
          key={`donor-card-${resetKey}`}
          className="w-full rounded-2xl border border-[#2b2542] bg-[#16122a]/90 backdrop-blur-md p-6 sm:p-8 shadow-2xl space-y-6"
        >
            {/* Error Feedback Banner */}
            {errorFeedback && (
              <div
                role="alert"
                className="flex items-center gap-2.5 rounded-xl border border-red-500/40 bg-red-950/60 p-4 text-xs font-semibold text-red-200 shadow-lg animate-in fade-in"
              >
                <AlertCircle size={18} className="shrink-0 text-red-400" />
                <span>{errorFeedback}</span>
              </div>
            )}

            {/* Payment Channel Selector Tabs */}
            <DonorPaymentTabs
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />

            {/* Donor Name & Message Form Inputs */}
            <div className="space-y-4 pt-2 border-t border-[#2b2542]/60">
              {/* Donor Name Input */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="donor-name-input" className="text-sm font-semibold text-[#d4cfdf]">
                    ชื่อของคุณ
                  </label>
                  <span className="text-xs text-gray-500 font-medium">
                    {donorName.length}/24
                  </span>
                </div>
                <input
                  id="donor-name-input"
                  type="text"
                  maxLength={24}
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                  placeholder="Anonymous"
                  className="w-full rounded-2xl border border-[#2e2648] bg-[#110d22] px-6 py-4 text-sm sm:text-base font-semibold text-white placeholder-[#6e6682] focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all shadow-inner"
                />
              </div>

              {/* Message Textarea */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="donor-message-input" className="text-sm font-semibold text-[#d4cfdf]">
                    ข้อความ
                  </label>
                  <span className="text-xs text-gray-500 font-medium">
                    {message.length}/{streamerConfig.charLimit || 200}
                  </span>
                </div>
                <textarea
                  id="donor-message-input"
                  rows={3}
                  maxLength={streamerConfig.charLimit || 200}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="พิมพ์ข้อความที่ต้องการส่งถึงสตรีมเมอร์..."
                  className="w-full rounded-2xl border border-[#2e2648] bg-[#110d22] px-6 py-4 text-sm sm:text-base font-medium text-white placeholder-[#6e6682] focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all resize-none leading-relaxed shadow-inner"
                />
              </div>
            </div>

            {/* Dynamic Payment Method Section vs Disabled State */}
            {!isChannelEnabled ? (
              /* State 5: Disabled Channel Card */
              <DonorDisabledCard />
            ) : activeTab === "promptpay" ? (
              /* State 2: PromptPay Form with dynamic QR */
              <DonorPromptPayForm
                key={`promptpay-${resetKey}`}
                minAmount={streamerConfig.minAmount}
                promptpayNumber={streamerConfig.payment.promptpay.number}
                onSubmit={handleDonationSubmit}
                isSubmitting={isSubmitting}
              />
            ) : activeTab === "bank" ? (
              /* State 3: Bank Form */
              <DonorBankForm
                key={`bank-${resetKey}`}
                minAmount={streamerConfig.minAmount}
                bankName={streamerConfig.payment.bank.bankName}
                accountNumber={streamerConfig.payment.bank.accountNumber}
                accountName={streamerConfig.payment.bank.accountName}
                onSubmit={handleDonationSubmit}
                isSubmitting={isSubmitting}
              />
            ) : (
              /* State 4: TrueMoney Form */
              <DonorTrueMoneyForm
                key={`truemoney-${resetKey}`}
                onSubmit={handleDonationSubmit}
                isSubmitting={isSubmitting}
              />
            )}
          </div>
      </div>

      {/* Donation Success Modal */}
      {submittedDonation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl border border-purple-500/40 bg-[#16122a] p-6 text-center space-y-4 shadow-2xl">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 mx-auto shadow-lg">
              <CheckCircle2 size={32} />
            </div>

            <div>
              <h3 className="text-lg font-bold text-white">
                ส่งการโดเนทสำเร็จแล้ว!
              </h3>
              <p className="text-xs text-gray-300 mt-1">
                ขอบคุณสำหรับการสนับสนุน {username}
              </p>
            </div>

            {/* Donation Summary Details */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-3.5 text-xs text-left space-y-1.5 text-gray-300">
              <div className="flex justify-between">
                <span className="text-gray-400">ผู้สนับสนุน:</span>
                <span className="font-semibold text-white">
                  {submittedDonation.donorName || "Anonymous"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">จำนวนเงิน:</span>
                <span className="font-bold text-purple-400">
                  {submittedDonation.amount} บาท
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">สถานะ:</span>
                <span
                  className={`font-semibold ${
                    submittedDonation.status === "approved"
                      ? "text-emerald-400"
                      : "text-amber-400"
                  }`}
                >
                  {submittedDonation.status === "approved"
                    ? "✓ ตรวจสอบสลิปและอนุมัติสำเร็จ (Approved)"
                    : "รอสตรีมเมอร์ตรวจสอบสลิป (Pending)"}
                </span>
              </div>
              {submittedDonation.transRef && (
                <div className="flex justify-between">
                  <span className="text-gray-400">รหัสอ้างอิง:</span>
                  <span className="font-mono text-purple-300">
                    {submittedDonation.transRef}
                  </span>
                </div>
              )}
            </div>

            {streamerConfig.thankYouMessage && (
              <div className="rounded-xl border border-purple-500/20 bg-[#1e1738]/80 p-3.5 text-xs text-purple-200">
                "{streamerConfig.thankYouMessage}"
              </div>
            )}

            <button
              type="button"
              onClick={handleCloseModal}
              className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 transition-all shadow-md cursor-pointer"
            >
              ปิดหน้านี้
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DonorPage;
