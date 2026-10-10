import {
  parseEmvTlv,
  getBankNameByCode,
  parseThaiSlipQr,
  parseSlipText,
  extractRecipientSection,
  isRecipientNameMatched,
  isAccountNumberMatched,
  buildMockEmvQrPayload,
  THAI_BANKS,
} from "../utils/slipParser.js";

describe("Thai Bank Slip & QR Parser Utility (Phase 8 OCR)", () => {
  describe("parseEmvTlv", () => {
    it("should return empty object for invalid inputs", () => {
      expect(parseEmvTlv(null)).toEqual({});
      expect(parseEmvTlv("")).toEqual({});
      expect(parseEmvTlv(123)).toEqual({});
      expect(parseEmvTlv("00")).toEqual({});
    });

    it("should parse valid EMVCo tags correctly", () => {
      const emv = "0002015802TH6304ABCD";
      const tags = parseEmvTlv(emv);
      expect(tags["00"]).toBe("01");
      expect(tags["58"]).toBe("TH");
      expect(tags["63"]).toBe("ABCD");
    });

    it("should stop parsing safely on malformed length or truncated string", () => {
      const malformed = "009901";
      const tags = parseEmvTlv(malformed);
      expect(tags).toEqual({});
    });
  });

  describe("getBankNameByCode", () => {
    it("should return formatted bank name for recognized bank codes", () => {
      expect(getBankNameByCode("004")).toBe("ธนาคารกสิกรไทย (KBANK)");
      expect(getBankNameByCode("014")).toBe("ธนาคารไทยพาณิชย์ (SCB)");
      expect(getBankNameByCode("002")).toBe("ธนาคารกรุงเทพ (BBL)");
      expect(getBankNameByCode("006")).toBe("ธนาคารกรุงไทย (KTB)");
    });

    it("should return null for unrecognized or empty codes", () => {
      expect(getBankNameByCode("999")).toBeNull();
      expect(getBankNameByCode("")).toBeNull();
      expect(getBankNameByCode(null)).toBeNull();
    });
  });

  describe("parseThaiSlipQr", () => {
    it("should return error for empty or non-string inputs", () => {
      expect(parseThaiSlipQr("")).toEqual({
        success: false,
        message: "ไม่พบข้อมูลใน QR Code",
      });
      expect(parseThaiSlipQr(null)).toEqual({
        success: false,
        message: "ไม่พบข้อมูลใน QR Code",
      });
    });

    it("should parse standard Thai EMVCo QR slip correctly", () => {
      const payload = buildMockEmvQrPayload({
        transRef: "2024101099887766",
        amount: 500,
        bankCode: "004",
      });

      const res = parseThaiSlipQr(payload);
      expect(res.success).toBe(true);
      expect(res.format).toBe("emvco");
      expect(res.transRef).toBe("2024101099887766");
      expect(res.amount).toBe(500);
      expect(res.bankCode).toBe("004");
      expect(res.bankName).toContain("KBANK");
      expect(res.rawPayload).toBe(payload);
    });

    it("should parse Thai Bank Mini QR (National ITMX standard, e.g. Krungthai Next)", () => {
      const ktbPayload = "0038000600000101030060217Aef2fa337bfc849f35102TH9104F4C9";
      const res = parseThaiSlipQr(ktbPayload);

      expect(res.success).toBe(true);
      expect(res.format).toBe("emvco");
      expect(res.transRef).toBe("Aef2fa337bfc849f3");
      expect(res.bankCode).toBe("006");
      expect(res.bankName).toBe("ธนาคารกรุงไทย (KTB)");
      expect(res.amount).toBeNull();
    });

    it("should parse Thai Bank Mini QR when sub02 is bank code and sub01 is transRef", () => {
      // Tag 00 length 26: 0113MY_REF_NUMBER 0203014 (SCB)
      const payload = "00260113MY_REF_NUMBER02030145102TH91041234";
      const res = parseThaiSlipQr(payload);

      expect(res.success).toBe(true);
      expect(res.transRef).toBe("MY_REF_NUMBER");
      expect(res.bankCode).toBe("014");
      expect(res.bankName).toContain("SCB");
    });

    it("should parse Thai Bank Mini QR with embedded amount in Tag 54", () => {
      const payload = "0038000600000101030060217Aef2fa337bfc849f3540530.005102TH9104F4C9";
      const res = parseThaiSlipQr(payload);

      expect(res.success).toBe(true);
      expect(res.transRef).toBe("Aef2fa337bfc849f3");
      expect(res.bankCode).toBe("006");
      expect(res.amount).toBe(30);
    });

    it("should return failure when QR payload has no valid reference or recognized format", () => {
      const payload = "INVALID SHORT PAYLOAD WITH SPACES!";
      const res = parseThaiSlipQr(payload);

      expect(res.success).toBe(false);
      expect(res.message).toBe("ไม่สามารถระบุรหัสอ้างอิงธุรกรรมจาก QR Code ได้");
    });

    it("should parse EMVCo QR when sub01 prefix is not a bank code and sub02 is bank code", () => {
      const payload = "00020130200109REF1234560203004540510.006304ABCD";
      const res = parseThaiSlipQr(payload);

      expect(res.success).toBe(true);
      expect(res.transRef).toBe("REF123456");
      expect(res.bankCode).toBe("004");
      expect(res.bankName).toContain("KBANK");
      expect(res.amount).toBe(10);
    });

    it("should parse EMVCo QR when sub01 is shorter than 6 characters", () => {
      const payload = "00020130070103ABC540510.006304ABCD";
      const res = parseThaiSlipQr(payload);

      expect(res.success).toBe(true);
      expect(res.transRef).toBe("ABC");
      expect(res.amount).toBe(10);
    });

    it("should parse JSON payload correctly", () => {
      const jsonPayload = JSON.stringify({
        transRef: "TXN1234567890",
        amount: 250.75,
        bankCode: "014",
        date: "2026-10-10 14:30:00",
      });

      const res = parseThaiSlipQr(jsonPayload);
      expect(res.success).toBe(true);
      expect(res.format).toBe("json");
      expect(res.transRef).toBe("TXN1234567890");
      expect(res.amount).toBe(250.75);
      expect(res.bankCode).toBe("014");
      expect(res.bankName).toContain("SCB");
    });

    it("should parse verification URL with query parameters", () => {
      const url = "https://slip.example.com/verify?ref=KBANK99881122&amount=300&bank=004";
      const res = parseThaiSlipQr(url);

      expect(res.success).toBe(true);
      expect(res.format).toBe("url");
      expect(res.transRef).toBe("KBANK99881122");
      expect(res.amount).toBe(300);
      expect(res.bankCode).toBe("004");
      expect(res.bankName).toContain("KBANK");
    });

    it("should parse verification URL pathname fallback", () => {
      const url = "https://promptpay.io/slip/TXN8877665544";
      const res = parseThaiSlipQr(url);

      expect(res.success).toBe(true);
      expect(res.format).toBe("url");
      expect(res.transRef).toBe("TXN8877665544");
    });

    it("should parse Key-Value query string", () => {
      const kv = "transRef=KVREF1234567&amount=150&bank=006";
      const res = parseThaiSlipQr(kv);

      expect(res.success).toBe(true);
      expect(res.format).toBe("key_value");
      expect(res.transRef).toBe("KVREF1234567");
      expect(res.amount).toBe(150);
      expect(res.bankCode).toBe("006");
      expect(res.bankName).toContain("KTB");
    });

    it("should parse raw reference string fallback", () => {
      const raw = "202610101234567890ABC";
      const res = parseThaiSlipQr(raw);

      expect(res.success).toBe(true);
      expect(res.format).toBe("raw_ref");
      expect(res.transRef).toBe("202610101234567890ABC");
    });

    it("should return failure for unsupported string format", () => {
      const invalid = "???!!!";
      const res = parseThaiSlipQr(invalid);

      expect(res.success).toBe(false);
      expect(res.message).toBe("ไม่สามารถระบุรหัสอ้างอิงธุรกรรมจาก QR Code ได้");
    });
  });

  describe("parseSlipText", () => {
    it("should return null fields for empty text", () => {
      expect(parseSlipText("")).toEqual({
        transRef: null,
        amount: null,
        bankName: null,
      });
      expect(parseSlipText(null)).toEqual({
        transRef: null,
        amount: null,
        bankName: null,
      });
    });

    it("should extract transaction ref, amount, and bank from Thai slip text", () => {
      const sampleText = `
        โอนเงินสำเร็จ
        ธนาคารกสิกรไทย
        รหัสอ้างอิง: 2024101099887766
        จำนวนเงิน: 1,500.00 บาท
        วันที่ 10 ต.ค. 2567
      `;

      const res = parseSlipText(sampleText);
      expect(res.transRef).toBe("2024101099887766");
      expect(res.amount).toBe(1500);
      expect(res.bankName).toContain("กสิกรไทย");
    });

    it("should extract transaction ref and amount with English labels", () => {
      const sampleText = `
        Transaction Successful
        SCB
        Txn ID: REF_ABC_12345
        Amount: 250.50 THB
      `;

      const res = parseSlipText(sampleText);
      expect(res.transRef).toBe("REF_ABC_12345");
      expect(res.amount).toBe(250.50);
      expect(res.bankName).toContain("SCB");
    });

    it("should extract multiline amount from slip text", () => {
      const sampleText = `
        โอนเงินสำเร็จ
        จำนวนเงิน
        75.00
        บาท
      `;
      const res = parseSlipText(sampleText);
      expect(res.amount).toBe(75);
    });

    it("should extract standalone amount with currency suffix", () => {
      const sampleText = `
        ทำรายการสำเร็จ
        500.00 บาท
      `;
      const res = parseSlipText(sampleText);
      expect(res.amount).toBe(500);
    });
  });

  describe("isRecipientNameMatched", () => {
    it("should return false for invalid or empty inputs", () => {
      expect(isRecipientNameMatched(null, "นายสมชาย")).toBe(false);
      expect(isRecipientNameMatched("นายสมชาย", null)).toBe(false);
      expect(isRecipientNameMatched(123, "นายสมชาย")).toBe(false);
    });

    it("should match when recipient name is present regardless of Thai title prefix", () => {
      const slip = "ไปยัง นาย มนต์ธร กฤตยาพงศ์ ธนาคารไทยพาณิชย์";
      expect(isRecipientNameMatched(slip, "มนต์ธร กฤตยาพงศ์")).toBe(true);
      expect(isRecipientNameMatched(slip, "นาย มนต์ธร กฤตยาพงศ์")).toBe(true);
    });

    it("should match when recipient surname is abbreviated in slip", () => {
      const slip = "ไปยัง มนต์ธร ก. SCB Easy";
      expect(isRecipientNameMatched(slip, "มนต์ธร กฤตยาพงศ์")).toBe(true);
    });

    it("should return false when recipient name does not match at all", () => {
      const slip = "ไปยัง นาย สมชาย สบายดี กสิกรไทย";
      expect(isRecipientNameMatched(slip, "มนต์ธร กฤตยาพงศ์")).toBe(false);
    });

    it("should return false when streamer name is only in the sender field (จาก) and recipient is someone else", () => {
      const senderSlip = `
        SCB โอนเงินสำเร็จ
        จาก นาย มนต์ธร กอเจริญทรัพย์
        xxx-xxx672-2
        ไปยัง นาย ตั้งใจ ตั้งมั่น
        xxx-xxx999-9
        จำนวนเงิน 100.00 บาท
      `;
      expect(isRecipientNameMatched(senderSlip, "มนต์ธร กอเจริญทรัพย์")).toBe(false);
    });

    it("should return false when slip is e-wallet top-up and recipient is not streamer", () => {
      const topUpSlip = `
        SCB เติมเงินสำเร็จ
        จาก นาย มนต์ธร กอเจริญทรัพย์
        xxx-xxx672-2
        ไปยัง เติมเงินพร้อมเพย์
        006990407877235
        จำนวนเงิน 200.00 บาท
      `;
      expect(isRecipientNameMatched(topUpSlip, "มนต์ธร กอเจริญทรัพย์")).toBe(false);
    });

    it("should return false when slip has from label but no to label and streamer is sender", () => {
      const fromOnlySlip = "จาก นาย มนต์ธร กอเจริญทรัพย์ โอนสำเร็จ ยอดเงิน 50 บาท";
      expect(isRecipientNameMatched(fromOnlySlip, "มนต์ธร กอเจริญทรัพย์")).toBe(false);
    });

    it("should match when slip has no from or to keywords but contains expected name", () => {
      const plainSlip = "โอนสำเร็จ มนต์ธร กฤตยาพงศ์ 100 บาท";
      expect(isRecipientNameMatched(plainSlip, "มนต์ธร กฤตยาพงศ์")).toBe(true);

      const plainPartialSlip = "โอนสำเร็จ มนต์ธร ก. 100 บาท";
      expect(isRecipientNameMatched(plainPartialSlip, "มนต์ธร กฤตยาพงศ์")).toBe(true);

      const plainMismatchSlip = "โอนสำเร็จ สมชาย สบายดี 100 บาท";
      expect(isRecipientNameMatched(plainMismatchSlip, "มนต์ธร กฤตยาพงศ์")).toBe(false);
    });

    it("should return true when expectedAccountName has fewer than 2 characters after cleaning", () => {
      expect(isRecipientNameMatched("ข้อความใดๆ", " ")).toBe(true);
    });

    it("should match Thai names resiliently even when OCR drops thanthakhat or floating vowels", () => {
      const ocrSlip = "โอนสำเร็จ ไปยัง นาย มนตธร กอเจรญทรพย จำนวนเงิน 12 บาท";
      expect(isRecipientNameMatched(ocrSlip, "มนต์ธร กอเจริญทรัพย์")).toBe(true);
    });

    it("should extract recipient section after arrow in Krungsri/KMA style slips", () => {
      const arrowSlip = "ผู้โอน MONTHORN\n↓\nนาย มนต์ธร กอเจริญทรัพย์\nจำนวนเงิน 12.00 THB";
      expect(extractRecipientSection(arrowSlip)).toContain("นาย มนต์ธร กอเจริญทรัพย์");
      expect(isRecipientNameMatched(arrowSlip, "มนต์ธร กอเจริญทรัพย์")).toBe(true);
    });
  });

  describe("extractRecipientSection", () => {
    it("should return empty string for non-string input", () => {
      expect(extractRecipientSection(null)).toBe("");
    });
  });

  describe("isAccountNumberMatched", () => {
    it("should return false for invalid inputs", () => {
      expect(isAccountNumberMatched(null, "1234567890")).toBe(false);
      expect(isAccountNumberMatched("xxx-1234", null)).toBe(false);
    });

    it("should return true when last 4 digits match", () => {
      const slip = "โอนไปยังบัญชี xxx-x-xx789-0";
      expect(isAccountNumberMatched(slip, "1234567890")).toBe(true);
    });

    it("should return false when last 4 digits do not match", () => {
      const slip = "โอนไปยังบัญชี xxx-x-xx111-1";
      expect(isAccountNumberMatched(slip, "1234567890")).toBe(false);
    });

    it("should return true if expected account has fewer than 4 digits", () => {
      expect(isAccountNumberMatched("โอนเงิน", "123")).toBe(true);
    });

    it("should return true when recipient section has ending digits matching last 4", () => {
      const slip = "ไปยัง นายทดสอบ บัญชีลงท้าย 7890 วันที่";
      expect(isAccountNumberMatched(slip, "1234567890")).toBe(true);
    });
  });

  describe("buildMockEmvQrPayload", () => {
    it("should generate a valid EMVCo string containing the specified parameters", () => {
      const payload = buildMockEmvQrPayload({
        transRef: "TESTREF112233",
        amount: 88.5,
        bankCode: "014",
      });

      expect(payload.startsWith("000201")).toBe(true);
      expect(payload).toContain("TESTREF112233");
      expect(payload).toContain("88.50");
      expect(payload).toContain("014");
    });
  });
});
