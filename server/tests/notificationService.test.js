import { jest } from "@jest/globals";

const mockSendMail = jest.fn();
const mockCreateTransport = jest.fn(() => ({
  sendMail: mockSendMail,
}));

jest.unstable_mockModule("nodemailer", () => ({
  default: {
    createTransport: mockCreateTransport,
  },
}));

const { sendEmailOtp, sendSmsOtp } = await import(
  "../services/notificationService.js"
);

const ORIGINAL_ENV = { ...process.env };

const withEnv = (vars) => {
  process.env = { ...ORIGINAL_ENV, ...vars };
};

describe("Notification Service", () => {
  let consoleLogSpy;
  let consoleErrorSpy;

  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    mockCreateTransport.mockClear();
    mockSendMail.mockReset();
    mockSendMail.mockResolvedValue({ messageId: "test-message-id" });
    global.fetch = jest.fn();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    process.env = { ...ORIGINAL_ENV };
    delete global.fetch;
  });

  describe("sendEmailOtp", () => {
    it("simulates sending when no SMTP/GMail credentials are configured", async () => {
      delete process.env.SMTP_HOST;
      delete process.env.SMTP_USER;
      delete process.env.SMTP_PASS;
      delete process.env.GMAIL_USER;
      delete process.env.GMAIL_PASS;

      const result = await sendEmailOtp("test@example.com", "123456", "forgot_password");

      expect(result).toEqual({ success: true, simulated: true });
      expect(mockCreateTransport).not.toHaveBeenCalled();
    });

    it("sends via SMTP transporter successfully when SMTP env vars are set", async () => {
      withEnv({
        SMTP_HOST: "smtp.example.com",
        SMTP_USER: "noreply@example.com",
        SMTP_PASS: "smtp-pass",
      });

      const result = await sendEmailOtp("Test@Example.com", "654321", "forgot_password");

      expect(result).toEqual({ success: true, simulated: false });
      expect(mockCreateTransport).toHaveBeenCalledWith({
        host: "smtp.example.com",
        port: 587,
        secure: false,
        auth: { user: "noreply@example.com", pass: "smtp-pass" },
      });
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "test@example.com",
          subject: expect.stringContaining("654321"),
          html: expect.stringContaining("654321"),
        })
      );
    });

    it("uses secure port 465 when configured and falls back to mail-merge vars", async () => {
      withEnv({
        SMTP_HOST: "smtp.example.com",
        SMTP_USER: "noreply@example.com",
        SMTP_PASS: "smtp-pass",
        SMTP_PORT: "465",
        SMTP_FROM: "DONIX <no-reply@example.com>",
      });

      const result = await sendEmailOtp("test@example.com", "111222", "verify_email");

      expect(result).toEqual({ success: true, simulated: false });
      expect(mockCreateTransport).toHaveBeenCalledWith(
        expect.objectContaining({
          port: 465,
          secure: true,
        })
      );
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: "DONIX <no-reply@example.com>",
          subject: expect.stringContaining("ยืนยันการเชื่อมต่ออีเมล"),
        })
      );
    });

    it("falls back to a simulated success log when SMTP send fails", async () => {
      withEnv({
        SMTP_HOST: "smtp.example.com",
        SMTP_USER: "noreply@example.com",
        SMTP_PASS: "smtp-pass",
      });
      mockSendMail.mockRejectedValueOnce(new Error("connection refused"));

      const result = await sendEmailOtp("test@example.com", "999888", "forgot_password");

      expect(result.success).toBe(true);
      expect(result.simulated).toBe(true);
      expect(result.error).toBe("connection refused");
    });

    it("configures a Gmail transporter when GMAIL env vars are set", async () => {
      withEnv({
        GMAIL_USER: "bot@gmail.com",
        GMAIL_PASS: "gmail-app-pass",
      });

      const result = await sendEmailOtp("test@example.com", "444555", "forgot_password");

      expect(result).toEqual({ success: true, simulated: false });
      expect(mockCreateTransport).toHaveBeenCalledWith({
        service: "gmail",
        auth: { user: "bot@gmail.com", pass: "gmail-app-pass" },
      });
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: "bot@gmail.com",
        })
      );
    });
  });

  describe("sendSmsOtp", () => {
    it("simulates sending when no Twilio credentials are configured", async () => {
      delete process.env.TWILIO_ACCOUNT_SID;
      delete process.env.TWILIO_AUTH_TOKEN;
      delete process.env.TWILIO_PHONE_NUMBER;

      const result = await sendSmsOtp("0812345678", "555666", "forgot_password");

      expect(result).toEqual({ success: true, simulated: true });
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("converts Thai mobile numbers to E.164 and sends via Twilio API", async () => {
      withEnv({
        TWILIO_ACCOUNT_SID: "AC123",
        TWILIO_AUTH_TOKEN: "token123",
        TWILIO_PHONE_NUMBER: "+15005550099",
      });
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      const result = await sendSmsOtp("0812345678", "777888", "forgot_password");

      expect(result).toEqual({ success: true, simulated: false });
      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.twilio.com/2010-04-01/Accounts/AC123/Messages.json",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: expect.stringContaining("Basic "),
          }),
          body: expect.stringContaining("To=%2B66812345678"),
        })
      );
    });

    it("keeps non-Thai numbers without replacing the leading plus", async () => {
      withEnv({
        TWILIO_ACCOUNT_SID: "AC123",
        TWILIO_AUTH_TOKEN: "token123",
        TWILIO_PHONE_NUMBER: "+15005550099",
      });
      global.fetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });

      const result = await sendSmsOtp("+65912345678", "111222", "verify_phone");

      expect(result).toEqual({ success: true, simulated: false });
      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.twilio.com/2010-04-01/Accounts/AC123/Messages.json",
        expect.objectContaining({
          body: expect.stringContaining("To=%2B65912345678"),
        })
      );
    });

    it("falls back when Twilio responds with an error payload", async () => {
      withEnv({
        TWILIO_ACCOUNT_SID: "AC123",
        TWILIO_AUTH_TOKEN: "token123",
        TWILIO_PHONE_NUMBER: "+15005550099",
      });
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: "Invalid credentials" }),
      });

      const result = await sendSmsOtp("0812345678", "333444", "forgot_password");

      expect(result.success).toBe(true);
      expect(result.simulated).toBe(true);
      expect(result.error).toBe("Invalid credentials");
    });

    it("falls back when the Twilio request throws", async () => {
      withEnv({
        TWILIO_ACCOUNT_SID: "AC123",
        TWILIO_AUTH_TOKEN: "token123",
        TWILIO_PHONE_NUMBER: "+15005550099",
      });
      global.fetch.mockRejectedValueOnce(new Error("network down"));

      const result = await sendSmsOtp("0812345678", "333444", "forgot_password");

      expect(result.success).toBe(true);
      expect(result.simulated).toBe(true);
      expect(result.error).toBe("network down");
    });
  });
});