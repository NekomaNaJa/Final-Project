/**
 * DONIX - Slip Verification Service (Phase 8 OCR)
 * ระบบถอดรหัสและตรวจสอบสลิปโอนเงินอัตโนมัติ (Zero-Cost In-House QR/OCR Engine)
 */

import jsqr from "jsqr";
import { Jimp } from "jimp";
import { createWorker } from "tesseract.js";
import {
  parseThaiSlipQr,
  parseSlipText,
  isRecipientNameMatched,
  isAccountNumberMatched,
} from "../utils/slipParser.js";

let tesseractWorker = null;

/**
 * ดึง Singleton Tesseract OCR Worker
 */
export const getTesseractWorker = async () => {
  if (!tesseractWorker) {
    tesseractWorker = await createWorker("tha+eng");
  }
  return tesseractWorker;
};

/**
 * ปิดการทำงานของ OCR Worker สำหรับ Jest teardown
 */
export const terminateOcrWorker = async () => {
  if (tesseractWorker) {
    try {
      await tesseractWorker.terminate();
    } catch {
      // Ignored
    }
    tesseractWorker = null;
  }
};

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
 * 3. รัน Tesseract OCR อ่านข้อความ สกัดจำนวนเงิน และตรวจชื่อผู้รับเงิน
 * 4. วิเคราะห์และรวมผลการตรวจสอบ
 *
 * @param {string} slipImage - รูปภาพสลิปในรูปแบบ Base64
 * @param {number} [expectedAmount] - ยอดเงินบริจาคที่คาดหวัง
 * @param {object} [options] - ตัวเลือกเพิ่มเติม เช่น expectedAccountName, expectedAccountNumber
 * @returns {Promise<object>} ผลการตรวจสอบ
 */
export const verifySlipImage = async (slipImage, expectedAmount, options = {}) => {
  const {
    expectedAccountName = null,
    expectedAccountNumber = null,
    mockOcrText = null,
    skipOcr = false,
  } = options;

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

  let parsedQr = null;
  if (qrCode && qrCode.data) {
    parsedQr = parseThaiSlipQr(qrCode.data);
  }

  // รัน OCR เพื่ออ่านข้อความในสลิป (เฉพาะเมื่อจำเป็น หรือมียอดเงินที่ต้องสกัดเพิ่มเติม/ต้องตรวจชื่อผู้รับ)
  let rawText = typeof mockOcrText === "string" ? mockOcrText : "";
  const shouldRunOcr =
    !skipOcr &&
    !rawText &&
    (!parsedQr?.amount || expectedAccountName || expectedAccountNumber || !parsedQr?.success);

  if (shouldRunOcr) {
    try {
      const worker = await getTesseractWorker();
      const ocrResult = await worker.recognize(buffer);
      rawText = ocrResult?.data?.text || "";
    } catch (err) {
      console.warn("Tesseract OCR recognition warning:", err.message);
    }
  }

  const parsedText = rawText ? parseSlipText(rawText) : null;

  // รวมผลลัพธ์จาก QR Code และ OCR
  const transRef = parsedQr?.transRef || parsedText?.transRef || null;
  const amount = parsedQr?.amount || parsedText?.amount || null;
  const bankCode = parsedQr?.bankCode || null;
  const bankName = parsedQr?.bankName || parsedText?.bankName || null;

  // ตรวจสอบชื่อผู้รับเงิน (ถ้ามีระบุ expectedAccountName)
  let recipientMatched = null;
  if (expectedAccountName && typeof expectedAccountName === "string" && expectedAccountName.trim()) {
    recipientMatched = rawText ? isRecipientNameMatched(rawText, expectedAccountName) : null;
  }

  // ตรวจสอบเลขที่บัญชี (ถ้ามีระบุ expectedAccountNumber)
  let accountNumberMatched = null;
  if (expectedAccountNumber && typeof expectedAccountNumber === "string" && expectedAccountNumber.trim()) {
    accountNumberMatched = rawText ? isAccountNumberMatched(rawText, expectedAccountNumber) : null;
  }

  const isAmountMatched =
    typeof expectedAmount === "number" && typeof amount === "number"
      ? amount >= expectedAmount
      : null;

  if (transRef || amount) {
    return {
      success: true,
      method: parsedQr?.success ? "qr" : "ocr",
      transRef,
      amount,
      bankCode,
      bankName,
      date: parsedQr?.date || null,
      isAmountMatched,
      rawPayload: qrCode ? qrCode.data : null,
      rawText: rawText || null,
      recipientMatched,
      accountNumberMatched,
      message: "ตรวจสอบสลิปสำเร็จ",
    };
  }

  return {
    success: false,
    method: "none",
    message: "ไม่พบ QR Code บนสลิป หรือสลิปไม่ตรงตามมาตรฐาน",
  };
};

export default {
  verifySlipImage,
  getTesseractWorker,
  terminateOcrWorker,
};
