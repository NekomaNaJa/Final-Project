import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { CheckCircle2, AlertCircle, Loader2, Lock } from "lucide-react";
import DonorHeader from "../components/Donor/DonorHeader";
import DonorMissionList from "../components/Donor/DonorMissionList";
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
    filteredWords: [],
    coverImage: null,
    backgroundImage: null,
    avatar: null,
    mission: {
      title: "ภารกิจสตรีมเมอร์วันนี้",
      missions: [],
    },
    payment: {
      promptpay: {
        enabled: true,
        type: "เบอร์โทรศัพท์",
        number: "",
      },
      bank: {
        enabled: true,
        bankName: "",
        accountNumber: "",
        accountName: "",
      },
      truemoney: {
        enabled: false,
        phone: "",
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
        backgroundImage: parsed.backgroundImage || config.backgroundImage,
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

    const savedWidgetConfig =
      localStorage.getItem(`donix_widget_config_${username}`) ||
      localStorage.getItem("donix_widget_config");
    if (savedWidgetConfig) {
      const parsedWidget = JSON.parse(savedWidgetConfig);
      if (parsedWidget.mission) {
        config.mission = {
          title: parsedWidget.mission.title || config.mission.title,
          missions: Array.isArray(parsedWidget.mission.missions)
            ? parsedWidget.mission.missions
            : [],
        };
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
  const [selectedMission, setSelectedMission] = useState(null);
  const [presetAmount, setPresetAmount] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedDonation, setSubmittedDonation] = useState(null);
  const [errorFeedback, setErrorFeedback] = useState(null);
  const [streamerNotFound, setStreamerNotFound] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  // Handle selecting or toggling a mission
  const handleSelectMission = (mission) => {
    if (!mission || selectedMission?.id === mission.id) {
      setSelectedMission(null);
      setPresetAmount(null);
    } else {
      setSelectedMission(mission);
      setPresetAmount(Number(mission.price));
    }
    // Clean any mission tag prefix from message so raw text stays user-only
    setMessage((prev) => (prev ? prev.replace(/^\[ภารกิจ:.*?\]\s*/, "") : ""));
  };

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
            backgroundImage:
              publicData.donationPage?.backgroundImage || prev.backgroundImage,
            avatar:
              publicData.avatar || prev.avatar,
            mission: publicData.mission || prev.mission,
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

          // สลับไปยังแท็บแรกที่เปิดใช้งานจริงจาก Database
          if (publicData.payment?.promptpay?.enabled) {
            setActiveTab("promptpay");
          } else if (publicData.payment?.bank?.enabled) {
            setActiveTab("bank");
          } else if (publicData.payment?.truemoney?.enabled) {
            setActiveTab("truemoney");
          }
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
    const isBank = (donationData?.method || activeTab) === "bank";
    const numericAmount =
      donationData?.amount !== undefined && donationData?.amount !== null
        ? Number(donationData.amount)
        : null;

    if (!isBank && (numericAmount === null || Number.isNaN(numericAmount) || numericAmount < min)) {
      setErrorFeedback(`จำนวนเงินต้องไม่ต่ำกว่า ${min} บาท`);
      setIsSubmitting(false);
      return;
    }

    try {
      const slipBase64 = await fileToBase64(donationData.slipFile);
      const cleanCustomMessage = (message || "").replace(/^\[ภารกิจ:.*?\]\s*/, "").trim();
      let finalMessage = cleanCustomMessage || message || "";
      if (selectedMission) {
        finalMessage = cleanCustomMessage
          ? `[ภารกิจ: ${selectedMission.name}] ${cleanCustomMessage}`
          : `[ภารกิจ: ${selectedMission.name}]`;
      }

      const res = await createDonation({
        username,
        donorName: donorName || "Anonymous",
        amount: numericAmount,
        message: finalMessage,
        paymentMethod: donationData.method || activeTab,
        slipImage: slipBase64,
      });

      setSubmittedDonation({
        donorName: res?.data?.donorName || res?.donorName || donorName || "Anonymous",
        message: res?.data?.message || res?.message || finalMessage,
        ...donationData,
        amount: res?.data?.amount || res?.amount || donationData?.amount || min,
        donationId: res?.id || res?._id || res?.data?._id,
        status: res?.data?.status || res?.status || "pending",
        transRef: res?.data?.transRef || res?.transRef,
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
    setSelectedMission(null);
    setPresetAmount(null);
    setResetKey((prev) => prev + 1);

    if (typeof window !== "undefined") {
      try {
        if (typeof window.location?.reload === "function") {
          window.location.reload();
        }
      } catch {
        // Fallback for testing environments where navigation is not supported
      }
    }
  };

  const missionTag = selectedMission ? `[ภารกิจ: ${selectedMission.name}] ` : "";
  const charLimit = Number(streamerConfig.charLimit) || 200;
  const maxCustomLength = Math.max(0, charLimit - missionTag.length);
  const totalMessageLength = missionTag.length + (message ? message.length : 0);

  return (
    <div className="relative min-h-screen bg-[#090812] font-sans text-white flex flex-col items-center justify-center py-8 px-4 sm:px-6 overflow-x-hidden">
      {/* Custom Streamer Background Image (if configured) */}
      {streamerConfig.backgroundImage && (
        <div
          data-testid="donor-custom-background"
          className="pointer-events-none fixed inset-0 z-0 bg-cover bg-center bg-no-repeat transition-opacity duration-500"
          style={{
            backgroundImage: `url(${streamerConfig.backgroundImage})`,
          }}
        >
          {/* Dark overlay backdrop to maintain high contrast and readability */}
          <div className="absolute inset-0 bg-[#090812]/85 backdrop-blur-[2px]" />
        </div>
      )}

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
          avatar={streamerConfig.avatar}
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

            {/* Mission Donate List (Shown when streamer has active missions) */}
            {Array.isArray(streamerConfig.mission?.missions) &&
              streamerConfig.mission.missions.length > 0 && (
                <DonorMissionList
                  missionConfig={streamerConfig.mission}
                  selectedMission={selectedMission}
                  onSelectMission={handleSelectMission}
                  disabled={isSubmitting}
                />
              )}

            {/* Payment Channel Selector Tabs */}
            <DonorPaymentTabs
              activeTab={activeTab}
              onTabChange={isSubmitting ? () => {} : setActiveTab}
              disabled={isSubmitting}
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

              {/* Message Textarea Container with Locked Mission Tag */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="donor-message-input" className="text-sm font-semibold text-[#d4cfdf]">
                    ข้อความ
                  </label>
                  <span className="text-xs text-gray-500 font-medium">
                    {totalMessageLength}/{charLimit}
                  </span>
                </div>
                <div className="w-full rounded-2xl border border-[#2e2648] bg-[#110d22] px-6 py-4 focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-500/30 transition-all shadow-inner flex flex-col gap-2.5">
                  {/* Locked Mission Badge - Cannot be deleted by donor */}
                  {selectedMission && (
                    <div
                      data-testid="locked-mission-badge"
                      className="inline-flex items-center gap-1.5 self-start rounded-xl border border-purple-500/40 bg-purple-950/70 px-3 py-1.5 text-xs text-purple-200 select-none shadow-sm"
                    >
                      <span className="flex items-center gap-1 font-bold text-amber-400">
                        <Lock size={13} className="text-amber-400 shrink-0" />
                        <span>ภารกิจ:</span>
                      </span>
                      <span className="font-semibold text-white">
                        {selectedMission.name}
                      </span>
                      <span className="text-[10px] text-purple-300/80 font-normal">
                        (ล็อคไว้ - แจ้งเตือนใน Alert อัตโนมัติ)
                      </span>
                    </div>
                  )}

                  <textarea
                    id="donor-message-input"
                    rows={selectedMission ? 2 : 3}
                    maxLength={maxCustomLength}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={
                      selectedMission
                        ? "พิมพ์ข้อความเพิ่มเติมถึงสตรีมเมอร์ (ไม่บังคับ)..."
                        : "พิมพ์ข้อความที่ต้องการส่งถึงสตรีมเมอร์..."
                    }
                    className="w-full border-none bg-transparent p-0 text-sm sm:text-base font-medium text-white placeholder-[#6e6682] focus:outline-none resize-none leading-relaxed"
                  />
                </div>
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
                presetAmount={presetAmount}
                selectedMission={selectedMission}
                onSubmit={handleDonationSubmit}
                isSubmitting={isSubmitting}
              />
            ) : activeTab === "bank" ? (
              /* State 3: Bank Form */
              <DonorBankForm
                key={`bank-${resetKey}`}
                bankName={streamerConfig.payment.bank.bankName}
                accountNumber={streamerConfig.payment.bank.accountNumber}
                accountName={streamerConfig.payment.bank.accountName}
                minAmount={streamerConfig.minAmount}
                selectedMission={selectedMission}
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

      {/* Processing / Verifying Donation Loading Modal */}
      {isSubmitting && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="กำลังดำเนินการ"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
        >
          <div className="w-full max-w-sm rounded-2xl border border-purple-500/40 bg-[#16122a] p-6 text-center space-y-4 shadow-2xl">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-600/20 border border-purple-500/40 text-purple-400 mx-auto shadow-lg">
              <Loader2 size={36} className="animate-spin text-purple-400" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-white tracking-wide">
                กำลังดำเนินการ
              </h3>
              <p className="text-xs text-gray-300 leading-relaxed">
                ระบบกำลังตรวจสอบข้อมูลและสลิปการโอนเงิน กรุณารอสักครู่...
              </p>
            </div>

            <div className="rounded-xl border border-purple-500/20 bg-[#1e1738]/80 p-3 text-xs text-purple-300 flex items-center justify-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-purple-400 animate-pulse" />
              <span>กรุณาอย่าปิดหรือเปลี่ยนหน้าต่างในระหว่างนี้</span>
            </div>
          </div>
        </div>
      )}

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
