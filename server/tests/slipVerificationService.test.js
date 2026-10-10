import QRCode from "qrcode";
import { Jimp } from "jimp";
import { verifySlipImage } from "../services/slipVerificationService.js";
import { buildMockEmvQrPayload } from "../utils/slipParser.js";

describe("Slip Verification Service (Phase 8 OCR)", () => {
  it("should return error when slipImage is null, empty, or invalid type", async () => {
    const res1 = await verifySlipImage(null);
    expect(res1.success).toBe(false);
    expect(res1.message).toContain("ไม่ถูกต้อง");

    const res2 = await verifySlipImage("");
    expect(res2.success).toBe(false);

    const res3 = await verifySlipImage(12345);
    expect(res3.success).toBe(false);
  });

  it("should return error when image data cannot be parsed (corrupt buffer)", async () => {
    const corruptBase64 = "data:image/png;base64,bm90YW5pbWFnZWNvbnRlbnRhdGFsbA==";
    const res = await verifySlipImage(corruptBase64);
    expect(res.success).toBe(false);
    expect(res.message).toBe("ไม่สามารถประมวลผลไฟล์รูปภาพได้");
  });

  it("should return not found when image has no QR code", async () => {
    // สร้างภาพสีขาวล้วน 100x100
    const blankImg = new Jimp({ width: 100, height: 100, color: 0xffffffff });
    const buf = await blankImg.getBuffer("image/png");
    const base64 = `data:image/png;base64,${buf.toString("base64")}`;

    const res = await verifySlipImage(base64, 100);
    expect(res.success).toBe(false);
    expect(res.message).toBe("ไม่พบ QR Code บนสลิป หรือสลิปไม่ตรงตามมาตรฐาน");
  });

  it("should successfully decode and verify a valid PromptPay EMVCo QR slip image", async () => {
    const emvPayload = buildMockEmvQrPayload({
      transRef: "PROMPTPAY20241010",
      amount: 120,
      bankCode: "004",
    });

    const qrDataUri = await QRCode.toDataURL(emvPayload, {
      width: 400,
      margin: 2,
    });

    const res = await verifySlipImage(qrDataUri, 100);

    expect(res.success).toBe(true);
    expect(res.method).toBe("qr");
    expect(res.transRef).toBe("PROMPTPAY20241010");
    expect(res.amount).toBe(120);
    expect(res.bankCode).toBe("004");
    expect(res.bankName).toContain("กสิกรไทย");
    expect(res.isAmountMatched).toBe(true); // 120 >= 100
    expect(res.rawPayload).toBe(emvPayload);
  });

  it("should correctly detect when amount in slip is less than expected donation amount", async () => {
    const emvPayload = buildMockEmvQrPayload({
      transRef: "MISMATCHREF001",
      amount: 50,
      bankCode: "014",
    });

    const qrDataUri = await QRCode.toDataURL(emvPayload, {
      width: 400,
      margin: 2,
    });

    const res = await verifySlipImage(qrDataUri, 100); // expects 100, slip has 50

    expect(res.success).toBe(true);
    expect(res.amount).toBe(50);
    expect(res.isAmountMatched).toBe(false); // 50 < 100
  });

  it("should handle large images by resizing and scanning successfully", async () => {
    const emvPayload = buildMockEmvQrPayload({
      transRef: "LARGEREF9999",
      amount: 300,
      bankCode: "002",
    });

    // สร้าง QR Code ขนาด > 800px
    const qrDataUri = await QRCode.toDataURL(emvPayload, {
      width: 850,
      margin: 4,
    });

    const res = await verifySlipImage(qrDataUri, 300);

    expect(res.success).toBe(true);
    expect(res.transRef).toBe("LARGEREF9999");
    expect(res.amount).toBe(300);
  }, 15000);
});
