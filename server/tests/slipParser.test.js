import {
  parseEmvTlv,
  getBankNameByCode,
  parseThaiSlipQr,
  parseSlipText,
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
