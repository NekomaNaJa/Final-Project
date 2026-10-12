import nodemailer from "nodemailer";

/**
 * บริการส่งอีเมลและ SMS สำหรับรหัส OTP (Email via Nodemailer / SMS via Twilio)
 */

export const maskAddress = (value) => {
  const text = String(value || "").trim();
  if (!text) return "";
  if (text.includes("@")) {
    const [local, domain] = text.split("@");
    if (!domain) return "****";
    if (local.length <= 2) return `${local[0] || "*"}***@${domain}`;
    return `${local.slice(0, 2)}***${local.slice(-2)}@${domain}`;
  }
  if (text.length <= 4) return "****";
  return `${text.slice(0, 2)}***${text.slice(-2)}`;
};

export const stripNewlines = (value) => String(value || "").replace(/[\r\n]+/g, " ");

const getEmailTransporter = () => {
  const isTest = process.env.NODE_ENV === "test";
  const timeoutOptions = isTest
    ? {}
    : {
        connectionTimeout: 5000,
        greetingTimeout: 5000,
        socketTimeout: 8000,
      };

  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    const smtpPort = Number(process.env.SMTP_PORT) || 587;
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: smtpPort,
      secure: smtpPort === 465,
      requireTLS: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      ...timeoutOptions,
    });
  }

  if (process.env.GMAIL_USER && process.env.GMAIL_PASS) {
    return nodemailer.createTransport({
      service: "gmail",
      requireTLS: true,
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
      ...timeoutOptions,
    });
  }

  return null;
};

const sendEmailViaHttpsProvider = async ({ safeEmail, subject, html, safeOtp, purpose }) => {
  if (process.env.GOOGLE_SCRIPT_URL) {
    const response = await fetch(process.env.GOOGLE_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: safeEmail, subject, html, otp: safeOtp, purpose }),
    });
    if (!response.ok) {
      throw new Error(`Google Script HTTP ${response.status}`);
    }
    return { success: true, simulated: false };
  }

  if (process.env.BREVO_API_KEY) {
    const senderEmail =
      process.env.SMTP_FROM || process.env.SMTP_USER || process.env.GMAIL_USER || "no-reply@donix.app";
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": process.env.BREVO_API_KEY,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        sender: { name: "DONIX", email: senderEmail.replace(/^.*<([^>]+)>.*$/, "$1") },
        to: [{ email: safeEmail }],
        subject,
        htmlContent: html,
      }),
    });
    if (!response.ok) {
      throw new Error(`Brevo HTTP ${response.status}`);
    }
    return { success: true, simulated: false };
  }

  if (process.env.RESEND_API_KEY) {
    const from = process.env.SMTP_FROM || "DONIX <onboarding@resend.dev>";
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [safeEmail],
        subject,
        html,
      }),
    });
    if (!response.ok) {
      throw new Error(`Resend HTTP ${response.status}`);
    }
    return { success: true, simulated: false };
  }

  return null;
};

export const sendEmailOtp = async (email, otp, purpose) => {
  const safeEmail = String(email).trim().toLowerCase();
  const safeOtp = String(otp).trim();
  const isStrictMode =
    process.env.NODE_ENV === "test" || process.env.STRICT_EMAIL_OTP === "true";

  const purposeLabels = {
    verify_email: "ยืนยันการเชื่อมต่ออีเมลสำหรับบัญชี DONIX",
    forgot_password: "รีเซ็ตรหัสผ่านบัญชี DONIX",
    change_password: "ยืนยันการเปลี่ยนรหัสผ่านบัญชี DONIX",
  };

  const subject = `[DONIX] รหัส OTP ของคุณ: ${safeOtp} (${purposeLabels[purpose] || "ยืนยันตัวตน"})`;

  const html = `
    <div style="font-family: Arial, sans-serif; background-color: #0A0B12; color: #ffffff; padding: 32px; border-radius: 12px; max-width: 500px; margin: 0 auto; border: 1px solid rgba(124, 58, 237, 0.3);">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #a78bfa; margin: 0; font-size: 26px; letter-spacing: 2px;">DONIX</h1>
        <p style="color: #9ca3af; font-size: 13px; margin-top: 4px;">Streamer Donation & Overlay Platform</p>
      </div>
      <div style="background-color: #16122a; padding: 24px; border-radius: 8px; text-align: center; border: 1px solid rgba(255, 255, 255, 0.08);">
        <p style="color: #d1d5db; font-size: 14px; margin-bottom: 12px;">รหัสยืนยัน OTP สำหรับ${purposeLabels[purpose] || "ยืนยันตัวตน"}คือ</p>
        <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #fbbf24; margin: 16px 0; padding: 12px; background: rgba(124, 58, 237, 0.15); border-radius: 8px; border: 1px dashed rgba(251, 191, 36, 0.4);">
          ${safeOtp}
        </div>
        <p style="color: #9ca3af; font-size: 12px; margin-top: 12px;">รหัสนี้มีอายุการใช้งาน 5 นาที หากคุณไม่ได้ทำรายการนี้ โปรดเพิกเฉยต่ออีเมลฉบับนี้</p>
      </div>
      <p style="text-align: center; color: #6b7280; font-size: 11px; margin-top: 24px;">© ${new Date().getFullYear()} DONIX Platform. All rights reserved.</p>
    </div>
  `;

  try {
    const httpsResult = await sendEmailViaHttpsProvider({
      safeEmail,
      subject,
      html,
      safeOtp,
      purpose,
    });
    if (httpsResult) {
      return httpsResult;
    }
  } catch (err) {
    console.error("[Email HTTPS Service Error]:", stripNewlines(err?.message));
    if (isStrictMode) {
      throw new Error("EMAIL_DELIVERY_FAILED");
    }
  }

  const transporter = getEmailTransporter();
  if (transporter) {
    try {
      const from = process.env.SMTP_FROM || process.env.SMTP_USER || process.env.GMAIL_USER || "DONIX <no-reply@donix.app>";
      const info = await transporter.sendMail({
        from,
        to: safeEmail,
        subject,
        html,
      });
      if (Array.isArray(info.rejected) && info.rejected.length > 0) {
        throw new Error("SMTP rejected the recipient");
      }
      return { success: true, simulated: false };
    } catch (err) {
      console.error("[Email Service Error]:", stripNewlines(err?.message));
      if (isStrictMode) {
        throw new Error("EMAIL_DELIVERY_FAILED");
      }
      console.log("[Email OTP Fallback Log]: Simulated OTP email delivery");
      return { success: true, simulated: true, error: err?.message };
    }
  }

  console.error("[Email Service]: SMTP/Gmail credentials are not configured");
  if (isStrictMode) {
    throw new Error("EMAIL_NOT_CONFIGURED");
  }

  console.log("[Email OTP Simulated]: Simulated OTP email delivery");
  return { success: true, simulated: true };
};

export const sendSmsOtp = async (phone, otp, purpose) => {
  const safePhone = String(phone).trim().replace(/\D/g, "");
  const safeOtp = String(otp).trim();

  // Convert Thai phone (e.g. 0812345678) to international E.164 (+66812345678)
  let e164Phone = safePhone;
  if (safePhone.startsWith("0")) {
    e164Phone = `+66${safePhone.substring(1)}`;
  } else if (!safePhone.startsWith("+")) {
    e164Phone = `+${safePhone}`;
  }

  const messageBody = `[DONIX] รหัส OTP ของคุณคือ ${safeOtp} สำหรับ${purpose === "forgot_password" ? "รีเซ็ตรหัสผ่าน" : "ยืนยันเบอร์โทรศัพท์"} (มีอายุ 5 นาที)`;

  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const twilioNumber = process.env.TWILIO_PHONE_NUMBER;

  if (sid && token && twilioNumber) {
    try {
      const auth = Buffer.from(`${sid}:${token}`).toString("base64");
      const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;

      const params = new URLSearchParams();
      params.append("To", e164Phone);
      params.append("From", twilioNumber);
      params.append("Body", messageBody);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("[Twilio SMS Error]:", stripNewlines(errorData?.message));
        console.log(`[Twilio SMS Fallback Log]: Simulated OTP SMS to ${maskAddress(e164Phone)}`);
        return { success: true, simulated: true, error: errorData.message };
      }

      return { success: true, simulated: false };
    } catch (err) {
      console.error("[Twilio Fetch Error]:", stripNewlines(err?.message));
      console.log(`[SMS OTP Fallback Log]: Simulated OTP SMS to ${maskAddress(e164Phone)}`);
      return { success: true, simulated: true, error: err?.message };
    }
  }

  // Dev / Testing mode simulation
  console.log(`[SMS OTP Simulated]: Simulated OTP SMS to ${maskAddress(e164Phone)} (${purpose})`);
  return { success: true, simulated: true };
};
