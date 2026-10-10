/**
 * DONIX - Thai Bank Slip & QR Parser Utility (Phase 8 OCR)
 * ระบบถอดรหัสและวิเคราะห์ข้อมูลสลิปโอนเงินมาตรฐานธนาคารไทย (PromptPay / EMVCo / Text)
 */

export const THAI_BANKS = {
  "002": { name: "ธนาคารกรุงเทพ", shortName: "BBL", code: "002" },
  "004": { name: "ธนาคารกสิกรไทย", shortName: "KBANK", code: "004" },
  "006": { name: "ธนาคารกรุงไทย", shortName: "KTB", code: "006" },
  "011": { name: "ธนาคารทหารไทยธนชาต", shortName: "TTB", code: "011" },
  "014": { name: "ธนาคารไทยพาณิชย์", shortName: "SCB", code: "014" },
  "025": { name: "ธนาคารกรุงศรีอยุธยา", shortName: "BAY", code: "025" },
  "030": { name: "ธนาคารออมสิน", shortName: "GSB", code: "030" },
  "034": { name: "ธนาคารเพื่อการเกษตรและสหกรณ์การเกษตร", shortName: "BAAC", code: "034" },
  "069": { name: "ธนาคารเกียรตินาคินภัทร", shortName: "KKP", code: "069" },
  "022": { name: "ธนาคารซีไอเอ็มบีไทย", shortName: "CIMB", code: "022" },
  "067": { name: "ธนาคารทิสโก้", shortName: "TISCO", code: "067" },
  "073": { name: "ธนาคารแลนด์ แอนด์ เฮ้าส์", shortName: "LH", code: "073" },
};

/**
 * ถอดรหัสโครงสร้าง Tag-Length-Value (TLV) ของมาตรฐาน EMVCo QR Code
 * @param {string} str - ข้อความ EMVCo raw string
 * @returns {Record<string, string>} Tag และค่า Value
 */
export const parseEmvTlv = (str) => {
  if (typeof str !== "string") return {};
  const tags = {};
  let i = 0;
  while (i < str.length - 4) {
    const id = str.substring(i, i + 2);
    const len = Number.parseInt(str.substring(i + 2, i + 4), 10);
    if (Number.isNaN(len) || len < 0 || i + 4 + len > str.length) {
      break;
    }
    const val = str.substring(i + 4, i + 4 + len);
    tags[id] = val;
    i += 4 + len;
  }
  return tags;
};

/**
 * แยกแยะและค้นหาชื่อธนาคารจากรหัสธนาคาร 3 หลัก
 * @param {string} code - รหัสธนาคาร (เช่น "004", "014")
 * @returns {string|null}
 */
export const getBankNameByCode = (code) => {
  if (!code || typeof code !== "string") return null;
  const bank = THAI_BANKS[code.trim()];
  return bank ? `${bank.name} (${bank.shortName})` : null;
};

/**
 * วิเคราะห์และดึงข้อมูลจาก QR Code Payload ของสลิปโอนเงิน
 * รองรับทั้ง:
 * 1. EMVCo PromptPay Slip QR (สลิปธนาคารไทยแท้)
 * 2. URL Slip Verification
 * 3. JSON Payload (Sandbox / External APIs)
 * 4. Key-Value String
 *
 * @param {string} rawPayload
 * @returns {object} ผลการวิเคราะห์
 */
export const parseThaiSlipQr = (rawPayload) => {
  if (typeof rawPayload !== "string" || !rawPayload.trim()) {
    return {
      success: false,
      message: "ไม่พบข้อมูลใน QR Code",
    };
  }

  const payload = rawPayload.trim();

  // 1. ตรวจสอบมาตรฐาน EMVCo / PromptPay Mini QR (ขึ้นต้นด้วย Tag 00 เช่น 000201 หรือ 0038...)
  if (/^00\d{2}/.test(payload)) {
    const rootTags = parseEmvTlv(payload);

    let transRef = null;
    let bankCode = null;

    // 1.1 รูปแบบ Thai Bank Mini QR (Tag 00 เป็น Nested TLV บรรจุ Version, Bank Code, TransRef)
    if (rootTags["00"] && rootTags["00"] !== "01") {
      const sub = parseEmvTlv(rootTags["00"]);
      if (sub["01"] && THAI_BANKS[sub["01"]]) {
        bankCode = sub["01"];
        transRef = sub["02"] || null;
      } else if (sub["02"] && THAI_BANKS[sub["02"]]) {
        bankCode = sub["02"];
        transRef = sub["01"] || null;
      }
    }

    // 1.2 รูปแบบ Full EMVCo (Application Template Tag 29, 30 หรือ 31)
    if (!transRef) {
      const slipTemplateStr = rootTags["30"] || rootTags["29"] || rootTags["31"];
      if (slipTemplateStr) {
        const subTags = parseEmvTlv(slipTemplateStr);
        // Sub-tag 01 มักบรรจุ Sending Bank (3 หลัก) + Transaction Reference
        const sub01 = subTags["01"] || "";
        if (sub01.length >= 6) {
          const potentialBank = sub01.substring(0, 3);
          if (THAI_BANKS[potentialBank]) {
            bankCode = potentialBank;
            transRef = sub01.substring(3);
          } else {
            transRef = sub01;
          }
        } else if (sub01) {
          transRef = sub01;
        }

        if (!bankCode && subTags["02"] && THAI_BANKS[subTags["02"]]) {
          bankCode = subTags["02"];
        }
      }
    }

    // จำนวนเงินอยู่ที่ Tag 54 (ถ้ามี)
    let amount = null;
    if (rootTags["54"]) {
      const parsedAmt = Number.parseFloat(rootTags["54"]);
      if (!Number.isNaN(parsedAmt) && parsedAmt > 0) {
        amount = parsedAmt;
      }
    }

    if (transRef) {
      return {
        success: true,
        format: "emvco",
        transRef,
        amount,
        bankCode: bankCode || null,
        bankName: getBankNameByCode(bankCode),
        rawPayload: payload,
      };
    }
  }

  // 2. ตรวจสอบ JSON Payload
  if (payload.startsWith("{") && payload.endsWith("}")) {
    try {
      const json = JSON.parse(payload);
      const transRef = json.transRef || json.ref || json.transactionId || json.id;
      if (transRef) {
        const parsedAmt = typeof json.amount === "number" ? json.amount : Number.parseFloat(json.amount);
        const amount = !Number.isNaN(parsedAmt) && parsedAmt > 0 ? parsedAmt : null;
        const bankCode = json.bankCode || json.bank || null;
        return {
          success: true,
          format: "json",
          transRef: String(transRef).trim(),
          amount,
          bankCode,
          bankName: getBankNameByCode(bankCode) || json.bankName || null,
          date: json.date || json.dateTime || null,
          rawPayload: payload,
        };
      }
    } catch {
      // ไม่ใช่ JSON ที่ถูกต้อง ให้ประมวลผลขั้นตอนถัดไป
    }
  }

  // 3. ตรวจสอบ URL Verification
  if (/^https?:\/\//i.test(payload)) {
    try {
      const url = new URL(payload);
      const ref =
        url.searchParams.get("ref") ||
        url.searchParams.get("transRef") ||
        url.searchParams.get("txnId") ||
        url.searchParams.get("id");

      const amtParam = url.searchParams.get("amount") || url.searchParams.get("amt");
      const parsedAmt = amtParam ? Number.parseFloat(amtParam) : null;
      const amount = parsedAmt && !Number.isNaN(parsedAmt) && parsedAmt > 0 ? parsedAmt : null;
      const bankCode = url.searchParams.get("bank") || null;

      let transRef = ref;
      if (!transRef) {
        // ดึงจาก pathname เช่น /slip/2024101012345678
        const segments = url.pathname.split("/").filter(Boolean);
        const lastSegment = segments[segments.length - 1];
        if (lastSegment && /^[A-Za-z0-9_-]{8,40}$/.test(lastSegment)) {
          transRef = lastSegment;
        }
      }

      if (transRef) {
        return {
          success: true,
          format: "url",
          transRef: String(transRef).trim(),
          amount,
          bankCode,
          bankName: getBankNameByCode(bankCode),
          rawPayload: payload,
        };
      }
    } catch {
      // URL parsing ล้มเหลว
    }
  }

  // 4. ตรวจสอบ Query/Key-Value String (เช่น transRef=12345&amount=100)
  if (payload.includes("transRef=") || payload.includes("ref=")) {
    try {
      const params = new URLSearchParams(payload);
      const transRef = params.get("transRef") || params.get("ref");
      const amtParam = params.get("amount");
      const parsedAmt = amtParam ? Number.parseFloat(amtParam) : null;
      const amount = parsedAmt && !Number.isNaN(parsedAmt) && parsedAmt > 0 ? parsedAmt : null;
      const bankCode = params.get("bank") || null;

      if (transRef) {
        return {
          success: true,
          format: "key_value",
          transRef: String(transRef).trim(),
          amount,
          bankCode,
          bankName: getBankNameByCode(bankCode),
          rawPayload: payload,
        };
      }
    } catch {
      // Ignored
    }
  }

  // 5. Fallback Regex: ตรวจสอบ alphanumeric รหัสอ้างอิงธุรกรรม (8-40 ตัวอักษร)
  const regexMatch = payload.match(/^[A-Za-z0-9_-]{8,40}$/);
  if (regexMatch) {
    return {
      success: true,
      format: "raw_ref",
      transRef: regexMatch[0],
      amount: null,
      bankCode: null,
      bankName: null,
      rawPayload: payload,
    };
  }

  return {
    success: false,
    message: "ไม่สามารถระบุรหัสอ้างอิงธุรกรรมจาก QR Code ได้",
  };
};

/**
 * วิเคราะห์ข้อความ OCR ที่สกัดได้จากสลิป (กรณี OCR Text Extraction)
 * @param {string} text - ข้อความที่อ่านได้จากภาพสลิป
 * @returns {object} ผลการสกัดข้อมูล
 */
export const parseSlipText = (text) => {
  if (typeof text !== "string" || !text.trim()) {
    return {
      transRef: null,
      amount: null,
      bankName: null,
    };
  }

  let transRef = null;
  let amount = null;
  let bankName = null;

  // ค้นหารหัสอ้างอิงธุรกรรม
  const refMatch = text.match(
    /(?:รหัสอ้างอิง|เลขที่รายการ|Transaction Ref|Ref\.?|Txn ID)[:\s]*([A-Za-z0-9_-]{8,40})/i
  );
  if (refMatch && refMatch[1]) {
    transRef = refMatch[1].trim();
  }

  // 1. ค้นหายอดเงินรูปแบบมีป้ายกำกับ (เช่น "จำนวนเงิน: 100.00 บาท", "Amount: 50.00 THB")
  const m1 = text.match(
    /(?:จำนวนเงิน|ยอดเงิน|โอนเงินจำนวน|Amount)[:\s]*([0-9,]+\.?[0-9]*)\s*(?:บาท|THB)?/i
  );
  if (m1 && m1[1]) {
    const cleanNum = m1[1].replaceAll(",", "");
    const parsed = Number.parseFloat(cleanNum);
    if (!Number.isNaN(parsed) && parsed > 0) {
      amount = parsed;
    }
  }

  // 2. ค้นหายอดเงินแบบหลายบรรทัด (เช่น "จำนวนเงิน \n 50.00 บาท")
  if (!amount) {
    const m2 = text.match(
      /(?:จำนวนเงิน|ยอดเงิน|Amount)[\s\S]{1,30}?([0-9,]+\.[0-9]{2})/i
    );
    if (m2 && m2[1]) {
      const cleanNum = m2[1].replaceAll(",", "");
      const parsed = Number.parseFloat(cleanNum);
      if (!Number.isNaN(parsed) && parsed > 0) {
        amount = parsed;
      }
    }
  }

  // 3. ค้นหายอดเงินเดี่ยวพร้อมสกุลเงิน (เช่น "50.00 บาท")
  if (!amount) {
    const m3 = text.match(/(?:^|\s)([0-9,]+\.[0-9]{2})\s*(?:บาท|THB|baht)/i);
    if (m3 && m3[1]) {
      const cleanNum = m3[1].replaceAll(",", "");
      const parsed = Number.parseFloat(cleanNum);
      if (!Number.isNaN(parsed) && parsed > 0) {
        amount = parsed;
      }
    }
  }

  // ค้นหาธนาคารที่เกี่ยวข้อง
  for (const info of Object.values(THAI_BANKS)) {
    if (text.includes(info.name) || text.includes(info.shortName)) {
      bankName = `${info.name} (${info.shortName})`;
      break;
    }
  }

  return {
    transRef,
    amount,
    bankName,
  };
};

/**
 * สกัดส่วนข้อความที่เป็นข้อมูลผู้รับเงิน (Recipient Section) จากสลิป
 * @param {string} slipText
 * @returns {string}
 */
export const extractRecipientSection = (slipText) => {
  if (typeof slipText !== "string") return "";

  // ค้นหาส่วนของข้อความหลังคำว่า "ไปยัง", "ถึง", "ผู้รับเงิน", "To" จนถึงหัวข้อถัดไป
  const m = slipText.match(
    /(?:ไปยัง|ถึง|ผู้รับเงิน|ผู้รับโอน|โอนไปยัง|โอนไปที่|to\s*:?)([\s\S]{1,250}?)(?:จำนวนเงิน|ยอดเงิน|วันที่|รหัสอ้างอิง|ค่าธรรมเนียม|amount|date|ref|$)/i
  );
  if (m && m[1]) {
    return m[1];
  }
  return slipText;
};

/**
 * ตรวจสอบว่าชื่อผู้รับเงินในสลิปตรงกับชื่อบัญชีของสตรีมเมอร์หรือไม่
 * @param {string} slipText - ข้อความที่อ่านได้จากภาพสลิป
 * @param {string} expectedAccountName - ชื่อบัญชีของสตรีมเมอร์
 * @returns {boolean}
 */
export const isRecipientNameMatched = (slipText, expectedAccountName) => {
  if (typeof slipText !== "string" || typeof expectedAccountName !== "string") {
    return false;
  }

  // ลบคำนำหน้าชื่อไทยและอักขระพิเศษเพื่อการเปรียบเทียบที่แม่นยำ
  const clean = (str) =>
    str
      .replace(/นาย|นางสาว|นาง|ด\.ช\.|ด\.ญ\.|บจก\.|บมจ\.|หจก\.|mr\.|mrs\.|ms\./gi, "")
      .replace(/[\s\-_.,/]/g, "")
      .toLowerCase();

  const cleanExpected = clean(expectedAccountName);
  if (!cleanExpected || cleanExpected.length < 2) return true;

  const parts = expectedAccountName
    .trim()
    .split(/\s+/)
    .map(clean)
    .filter((p) => p.length >= 2);

  // 1. ลองตัดหาเฉพาะส่วนของผู้รับเงิน (Recipient Section)
  const recipientSection = extractRecipientSection(slipText);
  const cleanRecipient = clean(recipientSection);

  // ถ้าตัดส่วนผู้รับเงินออกมาได้ ให้ตรวจในส่วนผู้รับเงินเป็นหลัก
  if (recipientSection !== slipText) {
    if (cleanRecipient.includes(cleanExpected)) return true;
    if (parts.length > 0 && cleanRecipient.includes(parts[0])) return true;
    return false;
  }

  // 2. หากไม่พบคำว่า "ไปยัง" ให้ระวังกรณีชื่อสตรีมเมอร์อยู่ในส่วน "จาก" (ผู้โอน)
  const fromMatch = slipText.match(
    /(?:จาก|ผู้โอน|from\s*:?)([\s\S]{1,120}?)(?:ไปยัง|ถึง|to\b|$)/i
  );
  if (fromMatch && fromMatch[1]) {
    const cleanFrom = clean(fromMatch[1]);
    const afterFrom = slipText.slice(slipText.indexOf(fromMatch[0]) + fromMatch[0].length);
    const cleanAfterFrom = clean(afterFrom);

    // ถ้าชื่อสตรีมเมอร์อยู่ในส่วน "จาก" แต่ไม่อยู่ในส่วนหลัง "จาก" แสดงว่าเป็นผู้โอน ไม่ใช่ผู้รับ!
    if (
      (cleanFrom.includes(cleanExpected) || (parts.length > 0 && cleanFrom.includes(parts[0]))) &&
      !(cleanAfterFrom.includes(cleanExpected) || (parts.length > 0 && cleanAfterFrom.includes(parts[0])))
    ) {
      return false;
    }
  }

  // 3. ตรวจสอบในข้อความทั้งหมด
  const cleanSlip = clean(slipText);
  if (cleanSlip.includes(cleanExpected)) {
    return true;
  }

  if (parts.length > 0 && cleanSlip.includes(parts[0])) {
    return true;
  }

  return false;
};

/**
 * ตรวจสอบเลขบัญชีในสลิป (ตรวจสอบ 4 หลักสุดท้าย)
 * @param {string} slipText - ข้อความที่อ่านได้จากภาพสลิป
 * @param {string} expectedAccountNumber - เลขบัญชีของสตรีมเมอร์
 * @returns {boolean}
 */
export const isAccountNumberMatched = (slipText, expectedAccountNumber) => {
  if (typeof slipText !== "string" || typeof expectedAccountNumber !== "string") {
    return false;
  }

  const digits = expectedAccountNumber.replace(/[^0-9]/g, "");
  if (digits.length < 4) return true;
  const last4 = digits.slice(-4);

  // ค้นหาส่วนผู้รับเงินก่อน เพื่อไม่ให้ชนกับเลขบัญชีผู้โอนหรือเลขอ้างอิง
  const recipientSection = extractRecipientSection(slipText);

  // ค้นหารูปแบบเลขบัญชีหรือเบอร์โทร เช่น xxx-xxx672-2, 081-xxx-5678, 123-456789-0
  const accountPattern = /(?:[0-9xX*#\-]{8,20})/g;
  const matches = recipientSection.match(accountPattern) || [];

  for (const match of matches) {
    const cleanMatch = match.replace(/[^0-9]/g, "");
    if (cleanMatch.endsWith(last4) || cleanMatch.slice(-4) === last4) {
      return true;
    }
  }

  // หากไม่มี match เป็นก้อนบัญชี แต่ส่วนผู้รับเงินมีเลข 4 ตัวท้ายอยู่เดี่ยวๆ หรือมีเลขท้ายตรงกัน
  const recDigits = recipientSection.replace(/[^0-9]/g, "");
  if (recDigits.length >= 4 && recDigits.endsWith(last4)) {
    return true;
  }

  return false;
};

/**
 * สร้าง Mock EMVCo Payload สำหรับใช้ในการทดสอบ
 * @param {object} param0
 * @returns {string}
 */
export const buildMockEmvQrPayload = ({
  transRef = "2024101012345678",
  amount = 100,
  bankCode = "004",
} = {}) => {
  const sub00 = "0016A000000677010112";
  const sub01Val = `${bankCode}${transRef}`;
  const sub01 = `01${String(sub01Val.length).padStart(2, "0")}${sub01Val}`;
  const sub02 = `0203${bankCode}`;
  const tag30Val = `${sub00}${sub01}${sub02}`;
  const tag30 = `30${String(tag30Val.length).padStart(2, "0")}${tag30Val}`;

  const amtStr = Number(amount).toFixed(2);
  const tag54 = `54${String(amtStr.length).padStart(2, "0")}${amtStr}`;
  const tag53 = "5303764";
  const tag58 = "5802TH";
  const tag63 = "6304ABCD";

  return `000201010212${tag30}${tag54}${tag53}${tag58}${tag63}`;
};
