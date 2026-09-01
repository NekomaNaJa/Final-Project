import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { CheckCircle2, Sliders, X } from "lucide-react";
import DonorHeader from "../components/Donor/DonorHeader";
import DonorPaymentTabs from "../components/Donor/DonorPaymentTabs";
import DonorOfflineCard from "../components/Donor/DonorOfflineCard";
import DonorDisabledCard from "../components/Donor/DonorDisabledCard";
import DonorPromptPayForm from "../components/Donor/DonorPromptPayForm";
import DonorBankForm from "../components/Donor/DonorBankForm";
import DonorTrueMoneyForm from "../components/Donor/DonorTrueMoneyForm";

const DonorPage = () => {
  const { username: paramUsername } = useParams();
  const username = paramUsername || "Test";

  // Streamer configurations (loaded from localStorage or defaults)
  const [streamerConfig, setStreamerConfig] = useState({
    welcomeMessage: "ยินดีต้อนรับสู่หน้ารับเงินของข้าพเจ้า ขอขอบคุณทุกการสนับสนุนครับ!",
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
        enabled: false, // Default disabled as in Figma example 5
        phone: "0812345678",
      },
    },
  });

  // Widget online state (true = Online, false = Offline)
  const [isWidgetOnline, setIsWidgetOnline] = useState(true);

  // Active payment channel tab
  const [activeTab, setActiveTab] = useState("promptpay");

  // Donor input fields
  const [donorName, setDonorName] = useState("Anonymous");
  const [message, setMessage] = useState("สวัสดีครับ");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedDonation, setSubmittedDonation] = useState(null);

  // Interactive Test Controls Drawer
  const [showTestControls, setShowTestControls] = useState(false);

  // Load saved configurations from localStorage if available
  useEffect(() => {
    try {
      const savedDonateConfig = localStorage.getItem(`donix_donate_config_${username}`) ||
        localStorage.getItem("donix_donate_config");
      const savedPaymentConfig = localStorage.getItem(`donix_payment_config_${username}`) ||
        localStorage.getItem("donix_payment_config");

      if (savedDonateConfig) {
        const parsed = JSON.parse(savedDonateConfig);
        setStreamerConfig((prev) => ({
          ...prev,
          welcomeMessage: parsed.welcomeMessage || prev.welcomeMessage,
          thankYouMessage: parsed.thankYouMessage || prev.thankYouMessage,
          minAmount: parsed.minAmount !== undefined ? parsed.minAmount : prev.minAmount,
          charLimit: parsed.charLimit ? Number(parsed.charLimit) || 200 : prev.charLimit,
          filteredWords: parsed.filteredWords || prev.filteredWords,
          coverImage: parsed.coverImage || prev.coverImage,
        }));
      }

      if (savedPaymentConfig) {
        const parsed = JSON.parse(savedPaymentConfig);
        setStreamerConfig((prev) => ({
          ...prev,
          payment: {
            promptpay: { ...prev.payment.promptpay, ...parsed.promptpay },
            bank: { ...prev.payment.bank, ...parsed.bank },
            truemoney: { ...prev.payment.truemoney, ...parsed.truemoney },
          },
        }));
      }
    } catch (err) {
      console.error("Error reading saved config:", err);
    }
  }, [username]);

  // Check if active channel is enabled
  const isChannelEnabled = streamerConfig.payment[activeTab]?.enabled;

  const handleDonationSubmit = (donationData) => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmittedDonation({
        donorName,
        message,
        ...donationData,
      });
    }, 1000);
  };

  const handleCloseModal = () => {
    setSubmittedDonation(null);
    setMessage("");
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

      {/* Floating Demo / Test Switcher Button */}
      <div className="fixed top-4 right-4 z-50">
        <button
          type="button"
          onClick={() => setShowTestControls(!showTestControls)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-purple-500/40 bg-[#1e1738]/90 backdrop-blur-md text-xs font-semibold text-purple-200 hover:bg-purple-600 hover:text-white shadow-lg transition-all"
        >
          <Sliders size={13} />
          <span>จำลองสถานะ ({isWidgetOnline ? "ออนไลน์" : "ออฟไลน์"})</span>
        </button>

        {/* Test Controls Modal / Dropdown */}
        {showTestControls && (
          <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-[#3b2d5f] bg-[#16112d] p-4 shadow-2xl space-y-3.5 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-[#2e2648]">
              <span className="font-bold text-white">ทดสอบสถานะหน้า Donor</span>
              <button
                type="button"
                onClick={() => setShowTestControls(false)}
                className="text-gray-400 hover:text-white"
              >
                <X size={14} />
              </button>
            </div>

            {/* Widget Status Toggle */}
            <div className="flex items-center justify-between">
              <span className="text-gray-300">สถานะ Widget:</span>
              <button
                type="button"
                onClick={() => setIsWidgetOnline(!isWidgetOnline)}
                className={`px-3 py-1 rounded-full font-bold text-[11px] transition-all ${
                  isWidgetOnline
                    ? "bg-red-600 text-white shadow-sm"
                    : "bg-gray-700 text-gray-300"
                }`}
              >
                {isWidgetOnline ? "🔴 LIVE (Online)" : "⚪ ออฟไลน์"}
              </button>
            </div>

            {/* Payment Methods Enabled Toggles */}
            <div className="space-y-1.5 pt-1 border-t border-[#2e2648]">
              <p className="text-[10px] text-gray-400 font-semibold">เปิด/ปิดช่องทางรับเงิน:</p>
              {["promptpay", "bank", "truemoney"].map((channel) => (
                <div key={channel} className="flex items-center justify-between">
                  <span className="capitalize text-gray-300">
                    {channel === "promptpay" ? "พร้อมเพย์" : channel === "bank" ? "ธนาคาร" : "ทรูมันนี่"}:
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setStreamerConfig((prev) => ({
                        ...prev,
                        payment: {
                          ...prev.payment,
                          [channel]: {
                            ...prev.payment[channel],
                            enabled: !prev.payment[channel]?.enabled,
                          },
                        },
                      }))
                    }
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      streamerConfig.payment[channel]?.enabled
                        ? "bg-emerald-600/80 text-white"
                        : "bg-red-900/50 text-red-300 border border-red-500/30"
                    }`}
                  >
                    {streamerConfig.payment[channel]?.enabled ? "เปิดอยู่" : "ปิดอยู่ (ไม่พร้อมใช้)"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Donor Card Container */}
      <div className="relative z-10 w-full max-w-[720px] space-y-5">
        {/* Streamer Header */}
        <DonorHeader
          username={username}
          isOnline={isWidgetOnline}
          welcomeMessage={streamerConfig.welcomeMessage}
          coverImage={streamerConfig.coverImage}
        />

        {/* Dynamic Body: Offline vs Online */}
        {!isWidgetOnline ? (
          /* State 1: Offline Card */
          <DonorOfflineCard />
        ) : (
          /* Online States */
          <div className="w-full rounded-2xl border border-[#2b2542] bg-[#16122a]/90 backdrop-blur-md p-6 sm:p-8 shadow-2xl space-y-6">
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
                  <label className="text-sm font-semibold text-[#d4cfdf]">
                    ชื่อของคุณ
                  </label>
                  <span className="text-xs text-gray-500 font-medium">
                    {donorName.length}/24
                  </span>
                </div>
                <input
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
                  <label className="text-sm font-semibold text-[#d4cfdf]">
                    ข้อความ
                  </label>
                  <span className="text-xs text-gray-500 font-medium">
                    {message.length}/{streamerConfig.charLimit || 200}
                  </span>
                </div>
                <textarea
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
                minAmount={streamerConfig.minAmount}
                promptpayNumber={streamerConfig.payment.promptpay.number}
                onSubmit={handleDonationSubmit}
                isSubmitting={isSubmitting}
              />
            ) : activeTab === "bank" ? (
              /* State 3: Bank Form */
              <DonorBankForm
                bankName={streamerConfig.payment.bank.bankName}
                accountNumber={streamerConfig.payment.bank.accountNumber}
                accountName={streamerConfig.payment.bank.accountName}
                onSubmit={handleDonationSubmit}
                isSubmitting={isSubmitting}
              />
            ) : (
              /* State 4: TrueMoney Form */
              <DonorTrueMoneyForm
                onSubmit={handleDonationSubmit}
                isSubmitting={isSubmitting}
              />
            )}
          </div>
        )}
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
