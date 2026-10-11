import nodemailer from "nodemailer";

/**
 * บริการส่งอีเมลและ SMS สำหรับรหัส OTP (Email via Nodemailer / SMS via Twilio)
 */

const getEmailTransporter = () => {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  if (process.env.GMAIL_USER && process.env.GMAIL_PASS) {
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });
  }

  return null;
};

export const sendEmailOtp = async (email, otp, purpose) => {
  const safeEmail = String(email).trim().toLowerCase();
  const safeOtp = String(otp).trim();

  const purposeLabels = {
    verify_email: "ยืนยันการเชื่อมต่ออีเมลสำหรับบัญชี DONIX",
    forgot_password: "รีเซ็ตรหัสผ่านบัญชี DONIX",
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

  const transporter = getEmailTransporter();
  if (transporter) {
    try {
      const from = process.env.SMTP_FROM || process.env.SMTP_USER || process.env.GMAIL_USER || "DONIX <no-reply@donix.app>";
      await transporter.sendMail({
        from,
        to: safeEmail,
        subject,
        html,
      });
      return { success: true, simulated: false };
    } catch (err) {
      console.error("[Email Service Error]:", err?.message || err);
      // Fallback: log for debugging
      console.log(`[Email OTP Log fallback]: OTP for ${safeEmail} is ${safeOtp}`);
      return { success: true, simulated: true, error: err?.message };
    }
  }

  // Dev / Testing mode simulation
  console.log(`[Email OTP Simulated]: Send OTP ${safeOtp} to ${safeEmail} (${purpose})`);
  return { success: true, simulated: true };
};

export const sendSmsOtp = async (phone, otp, purpose) => {
  const safePhone = String(phone).trim().replace(/[^0-9]/g, "");
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
        console.error("[Twilio SMS Error]:", errorData);
        console.log(`[Twilio SMS Fallback Log]: OTP for ${e164Phone} is ${safeOtp}`);
        return { success: true, simulated: true, error: errorData.message };
      }

      return { success: true, simulated: false };
    } catch (err) {
      console.error("[Twilio Fetch Error]:", err?.message || err);
      console.log(`[SMS OTP Fallback Log]: OTP for ${e164Phone} is ${safeOtp}`);
      return { success: true, simulated: true, error: err?.message };
    }
  }

  // Dev / Testing mode simulation
  console.log(`[SMS OTP Simulated]: Send OTP ${safeOtp} to ${e164Phone} (${purpose})`);
  return { success: true, simulated: true };
};
