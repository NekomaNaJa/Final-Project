/**
 * DONIX - Slip Verification Service (Phase 8 OCR)
 * ระบบถอดรหัสและตรวจสอบสลิปโอนเงินอัตโนมัติ (Zero-Cost In-House QR/OCR Engine)
 */

import jsqr from "jsqr";
import { Jimp } from "jimp";
import { parseThaiSlipQr } from "../utils/slipParser.js";

/**
 * แปลง Base64 หรือ Data URL ให้เป็น Buffer
 * @param {string} base64String
 * @returns {Buffer|null}
 */
const extractBufferFromBase64 = (base64String) => {
  if (typeof base64String !== "string" || !base64String.trim()) {
    return null;
  }

  try {
    const matches = base64String.match(/^data:image\/[a-zA-Z+]+;base64,(.+)$/);
    const cleanBase64 = matches ? matches[1] : base64String.trim();
    const buffer = Buffer.from(cleanBase64, "base64");
    return buffer.length >= 16 ? buffer : null;
  } catch {
    return null;
  }
};

/**
 * สแกนหา QR Code จาก Jimp Image Bitmap
 * @param {object} image - Jimp Image
 * @returns {object|null}
 */
const scanQrFromJimp = (image) => {
  if (!image || !image.bitmap || !image.bitmap.data) return null;
  const { data, width, height } = image.bitmap;
  return jsqr(new Uint8ClampedArray(data), width, height);
};

/**
 * ตรวจสอบความถูกต้องของสลิปโอนเงินจากรูปภาพ Base64
 * 1. โหลดและแปลงรูปภาพด้วย Jimp
 * 2. ค้นหาและถอดรหัส Mini QR Code ด้วย jsQR
 * 3. วิเคราะห์โครงสร้างข้อมูลสลิปมาตรฐานธนาคารไทย (EMVCo/PromptPay)
 * 4. สกัดรหัสอ้างอิงธุรกรรม (transRef), จำนวนเงิน (amount), และชื่อธนาคาร
 *
 * @param {string} slipImage - รูปภาพสลิปในรูปแบบ Base64
 * @param {number} [expectedAmount] - ยอดเงินบริจาคที่คาดหวัง
 * @returns {Promise<object>} ผลการตรวจสอบ
 */
export const verifySlipImage = async (slipImage, expectedAmount) => {
  const buffer = extractBufferFromBase64(slipImage);
  if (!buffer) {
    return {
      success: false,
      method: "none",
      message: "ไฟล์รูปภาพไม่ถูกต้องหรือข้อมูลรูปภาพเสียหาย",
    };
  }

  let image;
  try {
    image = await Jimp.read(buffer);
  } catch {
    return {
      success: false,
      method: "none",
      message: "ไม่สามารถประมวลผลไฟล์รูปภาพได้",
    };
  }

  // รอบที่ 1: สแกนจากภาพขนาดจริง
  let qrCode = scanQrFromJimp(image);

  // รอบที่ 2: หากไม่พบและภาพมีขนาดใหญ่เกิน 800px ให้ย่อขนาดเพื่อเพิ่มความคมชัดของ QR
  if (!qrCode && (image.bitmap.width > 800 || image.bitmap.height > 800)) {
    try {
      const resized = image.clone().resize({ w: 600 });
      qrCode = scanQrFromJimp(resized);
    } catch {
      // Ignored
    }
  }

  // รอบที่ 3: ปรับเกรย์สเกลและความเปรียบต่าง (Greyscale & Contrast) เพื่อให้อ่านสลิปได้แม้แสงน้อย
  if (!qrCode) {
    try {
      const enhanced = image.clone().greyscale().contrast(0.2);
      qrCode = scanQrFromJimp(enhanced);
    } catch {
      // Ignored
    }
  }

  // หากพบ QR Code ให้วิเคราะห์ Payload
  if (qrCode && qrCode.data) {
    const parsed = parseThaiSlipQr(qrCode.data);
    if (parsed.success && parsed.transRef) {
      const isAmountMatched =
        typeof expectedAmount === "number" && typeof parsed.amount === "number"
          ? parsed.amount >= expectedAmount
          : null;

      return {
        success: true,
        method: "qr",
        transRef: parsed.transRef,
        amount: parsed.amount,
        bankCode: parsed.bankCode,
        bankName: parsed.bankName,
        date: parsed.date || null,
        isAmountMatched,
        rawPayload: parsed.rawPayload,
        message: "ถอดรหัส QR Code บนสลิปสำเร็จ",
      };
    }
  }

  return {
    success: false,
    method: "none",
    message: "ไม่พบ QR Code บนสลิป หรือสลิปไม่ตรงตามมาตรฐาน",
  };
};

export default {
  verifySlipImage,
};
