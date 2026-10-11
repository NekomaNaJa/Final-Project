# DONIX - Streamer Donation Platform (AGENTS.md)

เอกสารรวบรวมรายละเอียดสถาปัตยกรรม โครงสร้างโค้ด หน้าระบบทั้งหมด ข้อตกลงในการพัฒนา แนวทางความปลอดภัย
และกระบวนการ CI/CD ของโปรเจกต์ **DONIX** ทั้งในส่วนของ **Client (Frontend)** และ **Server (Backend)**

---

## 1. ข้อมูลภาพรวมของระบบ (Project Overview)

**DONIX** คือแพลตฟอร์มรับบริจาคและสนับสนุนสตรีมเมอร์ (Streamer Donation & Overlay Platform) ในรูปแบบ Monorepo ประกอบด้วย 2 แพ็กเกจหลักที่ทำงานร่วมกัน:

```
Donix/
├── .github/
│   └── workflows/
│       └── ci.yml             → GitHub Actions CI (Automated Test & Build & SonarCloud)
├── client/                    → Frontend React SPA (React 18.3.1 + Tailwind CSS + Lucide React + Recharts)
├── server/                    → Backend REST API & Realtime Server (Express 5 + Socket.IO + MongoDB)
├── sonar-project.properties   → การตั้งค่า SonarCloud Quality Gate & Coverage Exclusions
└── AGENTS.md                  → คู่มือและข้อตกลงในการพัฒนาฉบับสมบูรณ์
```

---

## 2. การติดตั้งและการรันระบบ (Running the Project)

### 2.1 ฝั่ง Server (Backend)

```bash
cd server
npm install
npm run dev           # รันในโหมด Development (Nodemon, Hot-reload บนพอร์ต 5000)
npm start             # รันในโหมด Production
npm test              # รัน Jest + Supertest (10 Suites, 209 Tests ผ่าน 100%)
npm run test:coverage # รัน Jest พร้อมเก็บรายงาน Code Coverage (> 97%)
```

### 2.2 ฝั่ง Client (Frontend)

```bash
cd client
npm install
npm start                        # รัน React Dev Server บนพอร์ต 3000 (http://localhost:3000)
npm test -- --watchAll=false     # รัน Jest Test Suite ครั้งเดียวแล้วจบ (28 Suites, 314 Tests ผ่าน 100%)
npm run build                    # Build สำหรับ Production (รองรับ CI=true บน GitHub Actions)
```

### 2.3 คำสั่งทดสอบและตรวจสอบ CI สำหรับ Local Environment

```bash
# ทดสอบฝั่ง Server (Integration Tests + Coverage)
cd server
npm run test:coverage

# ทดสอบฝั่ง Client (Unit Tests + Production Build)
cd client
# สำหรับ CMD (Command Prompt)
set CI=true&& npm test -- --coverage --watchAll=false
set CI=true&& npm run build

# สำหรับ PowerShell (Windows)
$env:CI="true"; npm test -- --coverage --watchAll=false
$env:CI="true"; npm run build
```

---

## 3. สภาพแวดล้อมและการตั้งค่า (Environment Variables)

### 3.1 Server (`server/.env` และ Render)

- **Production URL**: `https://final-project-xntd.onrender.com`
- **API Base URL**: `https://final-project-xntd.onrender.com/api`

| ตัวแปร         | รายละเอียด                                         | ค่าเริ่มต้น (Default / Local)      | ค่าบน Production (Render) |
| :------------- | :------------------------------------------------- | :--------------------------------- | :------------------------ |
| `PORT`         | พอร์ตสำหรับเซิร์ฟเวอร์ Express API                 | `5000`                             | Render กำหนดให้อัตโนมัติ  |
| `MONGODB_URI`  | Connection String สำหรับเชื่อมต่อฐานข้อมูล MongoDB | `mongodb://localhost:27017/donix`  | MongoDB Atlas Cluster     |
| `CLIENT_URL`   | URL ฝั่ง Client สำหรับกำหนดสิทธิ์ CORS             | `http://localhost:3000`            | `https://final-project-orpin-five.vercel.app` |
| `JWT_SECRET`   | คีย์ลับสำหรับเซ็นและตรวจสอบ JWT Token              | กำหนดใน `.env` ฝั่ง Server         | สุ่มค่าคีย์ลับความปลอดภัยสูง |
| `NODE_VERSION` | เวอร์ชัน Node.js ที่ใช้งาน                         | -                                  | `22`                      |

### 3.2 Client (Local และ Vercel)

- **Production URL**: `https://final-project-orpin-five.vercel.app`
- **Base URL ของ API**: กำหนดผ่าน `REACT_APP_API_URL` (Default ในเครื่อง: `http://localhost:5000/api`)
- **Vercel Environment Variable**: `REACT_APP_API_URL=https://final-project-xntd.onrender.com/api`
- **Google OAuth Client ID**: กำหนดผ่าน `REACT_APP_GOOGLE_CLIENT_ID` (สำหรับ Google Identity Services / GIS ในหน้า Login & Register พร้อม Demo Mode รองรับ Local Dev)
- การจัดการสิทธิ์และการสื่อสารข้ามโดเมนใช้ CORS จากฝั่ง Server
- การอ่าน JWT Token บน Client มีการจัดการ base64url-safe string decoding ใน `useJwtUser.js`

---

## 4. โครงสร้างและรายละเอียดระบบฝั่ง Server (`server/`)

### 4.1 สถาปัตยกรรมและเทคโนโลยี

- **ES Modules**: กำหนด `"type": "module"` ใน `package.json` ใช้คำสั่ง `import` / `export` ทั้งหมด
- **Express 5**: เวอร์ชัน `^5.2.1` รองรับ Async/Await และ Promise-returning route handlers
- **Security & Protection**: ติดตั้ง `helmet` ป้องกัน Web Security Headers และ `express-rate-limit` ป้องกัน Brute-force บน Auth endpoints
- **Socket.IO**: เชื่อมต่อแบบเรียลไทม์ (Attached กับ `req.io`) สำหรับส่ง Event แจ้งเตือน: `join-stream`, `disconnect`, `donation-alert`
- **Mongoose & MongoDB**: จัดการ Database Schema และเชื่อมต่อ MongoDB
- **Testing**: ทดสอบแบบ Integration ด้วย `Jest` + `Supertest` (ESM mode ผ่าน `--experimental-vm-modules`) รันผ่าน CI พร้อม Coverage Report

### 4.2 โครงสร้างไฟล์ Server

```
server/
├── config/
│   └── db.js                    → การเชื่อมต่อฐานข้อมูล MongoDB (connectDB)
├── controllers/
│   ├── authController.js        → Logic การลงทะเบียน การเข้าสู่ระบบ และ Google OAuth (register, login, googleAuth)
│   ├── donationController.js    → Logic การจัดการรายการบริจาค (createDonation, getDonations, getDonationStats, updateDonationStatus)
│   ├── publicController.js      → Logic ข้อมูลสาธารณะสำหรับหน้า Donor Page และ Overlay Config พร้อม Aggregation (getPublicStreamer, getPublicOverlayConfig)
│   ├── userController.js        → Logic จัดการข้อมูลผู้ใช้ (getMe, updateMe, updatePayment, updateDonationPage, changePassword)
│   └── widgetController.js      → Logic จัดการการตั้งค่าวิดเจ็ต (getMyWidget, updateMyWidget), คำนวณ Goal สะสมอัตโนมัติ และ Socket.IO broadcast (widget-config-update)
├── middleware/
│   ├── protect.js               → ตรวจสอบ JWT Bearer Token และใส่ req.user
│   ├── errorHandler.js          → Error Handler กลาง จัดการ error รูปแบบ { message, data } และ Mongoose errors
│   └── rateLimiter.js           → จำกัดอัตราการเรียก API (authLimiter, apiLimiter)
├── Models/
│   ├── Blacklist.js             → Blacklist Schema สำหรับรายชื่อผู้ใช้ที่ถูกบล็อก
│   ├── Donation.js              → Central Donation Schema & Sparse Unique transRef Index
│   ├── Mission.js               → Mission Schema สำหรับภารกิจโดเนท
│   ├── User.js                  → Central User Schema
│   └── Widget.js                → Central Widget Schema (alert, goal, leaderboard, mission, token)
├── routes/
│   ├── auth.js                  → เส้นทาง /api/auth (register, login, google) พร้อม authLimiter
│   ├── donations.js             → เส้นทาง /api/donations (POST /, GET /, GET /stats, PATCH /:id)
│   ├── public.js                → เส้นทาง /api/public (GET /:username, GET /overlay/:widgetType/:token)
│   ├── users.js                 → เส้นทาง /api/users (GET /me, PUT /me, PUT /payment, PUT /donation-page, PUT /change-password)
│   └── widgets.js               → เส้นทาง /api/widgets (GET /me, PUT /me)
├── services/
│   └── slipVerificationService.js → In-house Zero-Cost Slip QR & OCR Verification Engine (Jimp + jsQR + Tesseract.js Worker Lifecycle)
├── tests/
│   ├── auth.test.js             → ชุดทดสอบ Authentication & Google OAuth (25 tests)
│   ├── donations.test.js        → ชุดทดสอบ Donations Route & OCR / Bank Matching / Idempotency / Mission Verification (39 tests)
│   ├── errorHandler.test.js     → ชุดทดสอบ Central Error Handler (5 tests)
│   ├── protect.test.js          → ชุดทดสอบ JWT Middleware (5 tests)
│   ├── public.test.js           → ชุดทดสอบ Public Route & Overlay Aggregation (5 tests)
│   ├── slipParser.test.js       → ชุดทดสอบ Thai Slip & QR Parser Utility (31 tests)
│   ├── slipVerificationService.test.js → ชุดทดสอบ Zero-Cost QR/OCR Engine (8 tests)
│   ├── users.test.js            → ชุดทดสอบ Users Route (60 tests)
│   ├── widgetHelpers.test.js    → ชุดทดสอบ Goal Calculation Helpers (3 tests)
│   └── widgets.test.js          → ชุดทดสอบ Widgets Route (15 tests)
│   ── รวมฝั่ง Server: 10 Test Suites, 209 Tests ผ่าน 100% (Coverage > 97%)
├── utils/
│   ├── passwordValidation.js    → ฟังก์ชันตรวจสอบความปลอดภัยของรหัสผ่าน (ซิงค์กับ client)
│   ├── slipParser.js            → Helper ถอดรหัส EMVCo TLV, Mini QR ITMX, สกัดจำนวนเงิน, ตรวจชื่อผู้รับเงิน และเลขบัญชี
│   └── widgetHelpers.js         → Helper คำนวณยอดเงินสะสมของ Donate Goal อัตโนมัติจากประวัติการโดเนทจริง
├── app.js                       → Express Application Config (Middlewares, Routes, Error Handler, 10MB payload limit)
├── index.js                     → Entry Point เซิร์ฟเวอร์ Express + Socket.IO (Port 5000, Multi-room Alert Deduplication)
├── jest.config.js               → การตั้งค่า Jest สำหรับ Node.js ESM และ Coverage
└── package.json                 → ESM Scripts พร้อม --runInBand และ --forceExit
```

### 4.3 รายละเอียด User Schema (`server/Models/User.js`)

- **ข้อมูลการยืนยันตัวตน**: `username`, `email`, `password`, `googleId`
- **ข้อมูลโปรไฟล์**: `nickname`, `fullName`, `firstName`, `lastName`, `avatar`, `bio`, `gender`, `birthDate`, `phone`, `isPhoneVerified`, `isEmailVerified`, `isLive` (สถานะเปิดรับเงิน)
- **โซเชียลมีเดีย (`social`)**: `facebook`, `instagram`, `youtube`, `tiktok`, `twitch`, `x`
- **ช่องทางรับเงิน (`payment`)**:
  - `promptpay`: `enabled`, `type` (7 ประเภท: เบอร์โทรศัพท์, เลขบัตรประจำตัวประชาชน, e-Wallet ID, K-Shop, SCB แม่มณี, BBL Merchant Pro, ร้านค้าถุงเงิน), `number`
  - `bank`: `enabled`, `bankName` (7 ธนาคาร), `accountNumber`, `accountName`
  - `truemoney`: `enabled`, `phone`
- **การตั้งค่าหน้ารับเงิน (`donationPage`)**:
  - `welcomeMessage`, `thankYouMessage`, `minAmount`, `charLimit`, `disableFilter`, `filteredWords`, `coverImage`, `backgroundImage`

### 4.4 การป้องกัน NoSQL Injection (บังคับใช้ทุก route)

ทุก route ที่รับค่าจาก `req.body`, `req.query` หรือ `req.params` แล้วนำไปใช้ใน query ของ Mongoose (`findOne`, `find`, `updateOne` ฯลฯ) **ต้องทำตาม 3 ขั้นตอนนี้เสมอ**:

1. **ตรวจชนิดข้อมูลก่อน** ด้วย `typeof` ว่าเป็น `string` (หรือชนิดที่ต้องการ) และปฏิเสธด้วยสถานะ `400` ทันทีหากไม่ตรง
2. **ตัดสาย taint** ด้วยการสร้างตัวแปรใหม่ผ่าน `String(value)` ก่อนนำไปใช้ (ห้ามส่งตัวแปรตรงจาก `req.body`)
3. **ครอบเงื่อนไขด้วย `$eq`** ใน query object เสมอ เช่น `User.findOne({ email: { $eq: safeEmail } })`

ตัวอย่างรูปแบบที่ถูกต้อง (อ้างอิง `server/routes/auth.js`):

```js
const { email } = req.body;

if (typeof email !== "string") {
  return res.status(400).json({ message: "ข้อมูลไม่ถูกต้อง" });
}

const safeEmail = String(email);
const user = await User.findOne({ email: { $eq: safeEmail } });
```

_หมายเหตุ: ไม่ส่งข้อความ Error ภายใน (`err.message`) กลับไปยัง Client ให้บันทึกด้วย `console.error` ฝั่ง Server และส่งข้อความภาษาไทยทั่วไปกลับไปแทน_

### 4.5 รูปแบบมาตรฐานของ API Response (Uniform Response Format)

ทุก endpoint ของเซิร์ฟเวอร์ต้องมีโครงสร้างการตอบกลับที่เป็นมาตรฐานเดียวกัน:

- **กรณีสำเร็จ (Success)**: `{ "message": "...", "data": ... }`
  - หมายเหตุ: สำหรับ Auth endpoints (`register`, `login`) จะแนบ `token` และ `user` ไว้ที่ root ควบคู่กันเพื่อรักษาความเข้ากันได้กับ Client: `{ "message": "...", "token": "...", "user": {...}, "data": { "token": "...", "user": {...} } }`
- **กรณีล้มเหลว (Error)**: `{ "message": "...", "data": null }` พร้อม HTTP Status Code ที่เหมาะสม (400, 401, 404, 500)

### 4.6 การป้องกัน Race Condition และการประมวลผลคำขอซ้ำแบบ Idempotency (API Idempotency Pattern)

เพื่อแก้ไขปัญหาการกดส่งสลิปซ้ำซ้อน (Double Click) หรือเครือข่ายส่งคำขอซ้อนกันในเสี้ยววินาที ซึ่งอาจส่งผลให้ Request แรกบันทึกสำเร็จและยิง Socket Alert ไปแล้ว แต่ Request ที่สองถูกระบบ Duplicate Detection ปฏิเสธด้วย Error 400 จนทำให้หน้าเว็บแสดงข้อความผิดพลาดหลอกผู้ใช้งาน เซิร์ฟเวอร์ใน `donationController.js` ได้นำหลักการ **Idempotency** มาใช้:

1. **การตรวจสอบหน้าต่างเวลาสั้น (15-Second Deduplication Window)**:
   - เมื่อสกัดรหัส `transRef` จากสลิปและค้นพบรายการซ้ำในฐานข้อมูล ระบบจะตรวจสอบว่า:
     - รายการนั้นเป็นของสตรีมเมอร์คนเดียวกันหรือไม่ (`duplicate.streamerId === streamer._id`)
     - รายการนั้นถูกสร้างขึ้นภายใน 15 วินาทีที่ผ่านมาหรือไม่ (`Date.now() - duplicate.createdAt < 15,000ms`)
2. **การตอบกลับอย่างปลอดภัย (Idempotent 200 Success)**:
   - หากตรงตามเงื่อนไขทั้งสองข้อ เซิร์ฟเวอร์จะตอบกลับด้วยสถานะ **`200 OK` พร้อมข้อมูลรายการบริจาคเดิม** ทันที
   - **ไม่สร้างรายการใหม่ในฐานข้อมูล** และ **ไม่ยิง Socket.IO `donation-alert` ซ้ำไปยัง OBS Studio**
   - ช่วยให้หน้าเว็บของผู้สนับสนุนได้รับสถานะสำเร็จและเปิดหน้าต่างขอบคุณอย่างราบรื่น 100%
3. **การรักษาความปลอดภัยต่อการทุจริต**:
   - หากสลิปถูกนำมาใช้ซ้ำเกิน 15 วินาที หรือนำไปใช้กับสตรีมเมอร์คนละคน ระบบจะตอบกลับด้วยรหัสข้อผิดพลาด **`400 Bad Request`** พร้อมข้อความ *"สลิปนี้ถูกใช้งานไปแล้ว ไม่สามารถใช้ซ้ำได้"* ตามมาตรฐานความปลอดภัยอย่างเข้มงวด

### 4.7 การตรวจสอบราคาภารกิจอัตโนมัติสำหรับช่องทางธนาคาร (Bank Mission Price Verification & Auto-strip Tag)

ในหน้าการบริจาคผ่านช่องทาง **ธนาคาร (Bank)** ผู้สนับสนุนไม่ต้องระบุจำนวนเงินล่วงหน้า โดยระบบจะอ่านยอดเงินจริงจากสลิปผ่าน OCR/Mini QR Engine เมื่อผู้สนับสนุนเลือกภารกิจโดเนท (`[ภารกิจ: {name}]`):
1. **การตรวจสอบเงื่อนไขยอดเงินจากสลิปเทียบกับราคาภารกิจ**:
   - เมื่อระบบถอดรหัสจำนวนเงินจากสลิปได้สำเร็จ (`effectiveAmount`) และผ่านเกณฑ์ยอดเงินขั้นต่ำ (`effectiveAmount >= minAmount`)
   - เซิร์ฟเวอร์จะตรวจสอบราคาของภารกิจที่เลือก (`targetMissionPrice`) จากข้อมูลวิดเจ็ต (`Widget`) ของสตรีมเมอร์ในฐานข้อมูล หรือจากพารามิเตอร์ที่ส่งมา
2. **กรณีโอนเงินน้อยกว่าราคาภารกิจ (`effectiveAmount < targetMissionPrice`)**:
   - หากจำนวนเงินที่โอนจริง **น้อยกว่าราคาภารกิจ** แต่ **ยังคงไม่ต่ำกว่ายอดบริจาคขั้นต่ำ** (`effectiveAmount >= minAmount`)
   - ระบบจะ **ตัดแท็กภารกิจออกจากข้อความอัตโนมัติ** (`safeMessage.replace(/^\[ภารกิจ:.*?\]\s*/, "")`)
   - ผลลัพธ์: การบริจาคจะยังคงสำเร็จตามปกติ แต่บน **Alert ใน OBS Studio**, **เสียงอ่าน TTS**, และ **ฐานข้อมูลประวัติการรับเงิน** จะแสดงเฉพาะข้อความให้กำลังใจของผู้สนับสนุนโดยไม่มีชื่อภารกิจ ป้องกันการสวมรอยภารกิจด้วยยอดเงินที่ไม่ครบ
3. **กรณีโอนเงินครบตามราคาภารกิจ (`effectiveAmount >= targetMissionPrice`)**:
   - ระบบจะ **คงแท็กภารกิจไว้ในข้อความตามเดิม 100%**
   - Alert บน OBS Studio และ TTS จะแสดงและอ่านชื่อภารกิจอย่างสมบูรณ์
4. **ขอบเขตการทำงานเฉพาะช่องทาง**:
   - ระบบนี้ทำงานเฉพาะช่องทาง **Bank** เท่านั้น เนื่องจากช่องทาง **PromptPay** มีการล็อคยอดเงินตามราคาภารกิจไว้ตั้งแต่ขั้นตอนการสร้าง QR Code เรียบร้อยแล้ว

---

## 5. โครงสร้างและรายละเอียดระบบฝั่ง Client (`client/`)

### 5.1 สถาปัตยกรรมและเทคโนโลยี

- **React 18.3.1**: Single Page Application (SPA)
- **React Router v7**: กำหนดเส้นทาง URL ทั้งหมดใน `src/App.js` พร้อม `<ProtectedRoute>`
- **Tailwind CSS v3**: ตกแต่ง UI Dark Theme ตามแบรนด์ DONIX:
  - สี: `void` (`#090812`), `abyss` (`#0f0d1b`), `mana` (`#7c3aed`), `gold` (`#fbbf24`), `crimson` (`#ef4444`), `border` (`rgba(255,255,255,0.08)`)
  - ฟอนต์: `Kanit` (Sans-serif ภาษาไทย/สากล) และ `Nanum Myeongjo` (Serif)
- **Lucide React**: ไอคอนมาตรฐานหลักของโปรเจกต์
- **Recharts**: แสดงกราฟสถิติยอดโดเนทในหน้า Dashboard

---

### 5.2 เส้นทาง URL และหน้าระบบทั้งหมด (14 หน้า + 404)

| เส้นทาง (Route)                      | คอมโพเนนต์หน้า | สิทธิ์เข้าถึง      | คำอธิบาย                                                                    |
| :----------------------------------- | :------------- | :----------------- | :-------------------------------------------------------------------------- |
| `/`                                  | `MainPage`     | สาธารณะ            | หน้าแรก (Landing Page), Hero, ฟีเจอร์, รายชื่อสตรีมเมอร์, Footer            |
| `/discover`                          | `Discover`     | สาธารณะ            | หน้าค้นพบสตรีมเมอร์ จัดกลุ่มตามหมวด (กำลังไลฟ์, หมวดเกม, แนะนำ)             |
| `/how-it-works`                      | `HowToUse`     | สาธารณะ            | หน้าคู่มือและขั้นตอนการเริ่มต้นใช้งานระบบสำหรับสตรีมเมอร์และผู้สนับสนุน     |
| `/login`                             | `Login`        | สาธารณะ            | หน้าเข้าสู่ระบบ (Email/Password, Google Auth) รองรับ JWT Token              |
| `/register`                          | `Register`     | สาธารณะ            | หน้าสมัครสมาชิก พร้อม Password Checklist ตรวจสอบเงื่อนไข 5 ข้อ              |
| `/dashboard`                         | `Dashboard`    | สมาชิก (Protected) | หน้าสรุปภาพรวมบัญชี (สถิติยอดเงิน, จำนวนโดเนท, กราฟสถิติ, กิจกรรมล่าสุด)    |
| `/payment`                           | `PaymentPage`  | สมาชิก (Protected) | หน้าตั้งค่าช่องทางรับเงิน (PromptPay, TrueMoney, Bank, Coming Soon)         |
| `/donate-page`                       | `DonatePage`   | สมาชิก (Protected) | หน้าตกแต่งหน้ารับเงิน, ข้อความต้อนรับ/ขอบคุณ, ตัวกรองคำหยาบ (ชื่อและข้อความ), รูปภาพหน้าปกและพื้นหลัง |
| `/account`                           | `Account`      | สมาชิก (Protected) | หน้าจัดการโปรไฟล์ ข้อมูลส่วนตัว ความปลอดภัย และเชื่อมต่อโซเชียล 6 แพลตฟอร์ม |
| `/history`                           | `HistoryPage`  | สมาชิก (Protected) | หน้าประวัติการรับเงิน ตารางรายการโดเนท พร้อมตัวกรองสถานะ                    |
| `/widget`                            | `WidgetPage`   | สมาชิก (Protected) | หน้าตั้งค่าวิดเจ็ต OBS (Alert, Goal, Leaderboard, Mission) + Live Preview   |
| `/overlay/alert/:token`              | `OverlayAlertPage` | สาธารณะ        | หน้า Browser Source สำหรับ OBS Studio (พื้นหลังใส, FIFO Queue, Realtime Alert) |
| `/overlay/goal/:token`               | `OverlayGoalPage`  | สาธารณะ        | หน้า Browser Source สำหรับ OBS Studio (พื้นหลังใส, แถบความคืบหน้า Goal, Realtime Aggregation) |
| `/overlay/leaderboard/:token`        | `OverlayLeaderboardPage` | สาธารณะ  | หน้า Browser Source สำหรับ OBS Studio (พื้นหลังใส, อันดับผู้สนับสนุน Leaderboard, Realtime Aggregation) |
| `/:username` หรือ `/donor/:username` | `DonorPage`    | สาธารณะ            | หน้ารับเงินจริงสำหรับผู้สนับสนุน (Donor) รองรับ 5 สถานะการทำงาน             |
| `*`                                  | `NotFound`     | สาธารณะ            | หน้าแจ้งเตือน 404 Not Found เมื่อไม่พบเส้นทาง URL                           |

---

### 5.3 รายละเอียดของแต่ละหน้าระบบหลัก

#### 1) หน้าแรก (MainPage) & หน้าสาธารณะ

- **MainPage (`/`)**: Navbar, Hero Section, Features Showcase, Streamer Showcase, CTA Section, Footer
- **Discover (`/discover`)**: จัดหมวดหมู่สตรีมเมอร์ที่กำลังไลฟ์, หมวดเกมยอดนิยม, ค้นหาและแนะนำสตรีมเมอร์
- **HowToUse (`/how-it-works`)**: ขั้นตอนการใช้งาน 4 ขั้นตอน พร้อมจุดเด่นและคำแนะนำสำหรับสตรีมเมอร์มือใหม่

#### 2) หน้าเข้าสู่ระบบและสมัครสมาชิก (Auth)

- **Login (`/login`)**: รองรับการเข้าสู่ระบบด้วย Email/Password และ **Google OAuth** (ตัดปุ่ม YouTube และ Twitch ออก) ทำงานร่วมกับ Google Identity Services (GIS) Popup / One Tap และเชื่อมต่อ backend `/api/auth/google` ออก JWT Token จริง
- **Register (`/register`)**: ระบบสมัครสมาชิก พร้อม `PasswordChecklist` ตรวจสอบความปลอดภัย 5 ข้อแบบเรียลไทม์ และรองรับ **Google OAuth** ลงทะเบียนและเข้าสู่ระบบทันที (ตรวจสอบความยินยอมเงื่อนไขการใช้งานก่อนเปิด Popup)

#### 3) หน้าแดชบอร์ด (Dashboard) — `/dashboard`

- การ์ดสถิติ (StatCards): ยอดการรับเงินรวม (บาท), จำนวนครั้งที่โดเนท, จำนวนรายการที่รอดำเนินการ (ดึงจาก `GET /api/donations/stats`)
- กราฟสถิติโดเนท (DonationChart): แสดงสถิติโดเนทแบบแท่ง/เส้นด้วย Recharts รองรับรายสัปดาห์และรายเดือนจาก Aggregated Pipeline จริง
- ฟีดกิจกรรมล่าสุด (RealtimeFeed): แสดงรายการโดเนทล่าสุด 5 รายการจากเซิร์ฟเวอร์
- อันดับผู้สนับสนุนสูงสุด (TopDonors): จัดอันดับผู้สนับสนุนยอดสูงสุดจากฐานข้อมูล MongoDB
- ภาพรวมช่องทางรับเงิน (PaymentChannels)
- ใช้เลย์เอาต์ร่วม **Sticky Sidebar** ด้านซ้าย และ **Sticky Topbar** ด้านบน

#### 4) หน้าบัญชีรับเงิน (PaymentPage) — `/payment`

- แผงการ์ด 4 ช่องทางการเงิน (2x2 Grid):
  - **PromptPayCard**: เปิด/ปิดการรับเงิน (บันทึกอัตโนมัติทันทีเมื่อสลับสวิตช์), เมนูจัดการ, สลับเบอร์โทรศัพท์/บัตร ปชช., บันทึกข้อมูล
  - **TrueMoneyCard**: เปิด/ปิดการรับเงิน (บันทึกอัตโนมัติทันทีเมื่อสลับสวิตช์), ฟอร์มเบอร์โทรศัพท์ TrueMoney Wallet
  - **BankCard**: เปิด/ปิดการรับเงิน (บันทึกอัตโนมัติทันทีเมื่อสลับสวิตช์), เลือกธนาคาร (SCB, KBank, BBL, KTB ฯลฯ), เลขบัญชี, ชื่อบัญชี
  - **ComingSoonCard**: ช่องทางใหม่ในอนาคต (เช่น บัตรเครดิต/เดบิต, Crypto)

#### 5) หน้าตกแต่งหน้ารับเงิน (DonatePage) — `/donate-page`

- **DonatePageLink**: ลิงก์ส่วนตัวแบบ Dynamic Domain ตาม Origin จริง (`window.location.origin/{username}` เช่น `https://final-project-orpin-five.vercel.app/{username}`), ปุ่มคัดลอกลิงก์, ปุ่มเปิดหน้า Donor Page (ตัดปุ่มไอคอน IG และ Twitch ที่ไม่จำเป็นออก)
- **DecorateSection**: แก้ไขข้อความต้อนรับ, ข้อความขอบคุณ, กำหนดยอดโดเนทขั้นต่ำ, สวิตช์ตรวจสอบสลิปอัตโนมัติ (Auto-Approve OCR), อัปโหลดรูปภาพหน้าปกและพื้นหลัง (จัดเก็บ Base64 Data URL พร้อมพรีวิวรูปภาพเดิมและรูปภาพใหม่)
- **MessageFilterSection**: กำหนดความยาวตัวอักษรสูงสุด, สวิตช์เปิด/ปิดตัวกรองคำหยาบ, ระบบแท็กคำที่ต้องการบล็อก (ระบบนำไปกรองทั้งชื่อผู้สนับสนุนและข้อความโดเนทอัตโนมัติ)
- _หมายเหตุ: นำกล่อง Social Media ออกจากหน้ารับเงินแล้ว เนื่องจากมีระบบเชื่อมต่อและจัดการลิงก์โซเชียลมีเดียในหน้า Account (`/account`) อยู่แล้ว_

#### 6) หน้ารับเงินจริงสำหรับผู้สนับสนุน (DonorPage) — `/:username` หรือ `/donor/:username`

- **เปิดให้บริการตลอดเวลา (Always Online)**: ผู้สนับสนุนเข้าถึงหน้าโดเนทได้ตลอด 24 ชม. ไม่ต้องรอสลับสถานะออฟไลน์/ออนไลน์
- **การแสดงผลรูปภาพหน้าปกและพื้นหลัง**: แสดงรูปภาพหน้าปก (`coverImage`) และรูปภาพพื้นหลัง (`backgroundImage`) ที่สตรีมเมอร์ตั้งค่าไว้ พร้อม Dark Overlay เพื่อให้อ่านข้อความและข้อมูลได้ชัดเจน
- **ภารกิจโดเนท (Mission Donate Integration & Locked Tag/Amount)**: แสดงรายการภารกิจที่สตรีมเมอร์ตั้งค่าไว้ในหน้า Widget (`/widget`) เป็นการ์ดภารกิจแบบอินเทอร์แอคทีฟ (DonorMissionList) เมื่อผู้สนับสนุนคลิกเลือกภารกิจ ระบบจะตั้งค่ายอดเงินตามราคาภารกิจ (`mission.price`) พร้อมล็อคแท็กภารกิจ (`[ 🔒 ภารกิจ: {name} ]`) ไว้ในกล่องข้อความไม่ให้ผู้บริจาคลบออกได้ และล็อคช่องกรอกจำนวนเงินทันที (Locked Amount Input: `readOnly`, `cursor-not-allowed`, ป้าย `[ 🔒 ล็อคตามภารกิจ ]`, บล็อคการพิมพ์และปุ่มลูกศร) ป้องกันผู้บริจาคแก้ไขยอดเงินให้ผิดไปจากราคาภารกิจ และการันตีแนบ `[ภารกิจ: {name}]` ส่งไปยัง Alert ใน OBS Studio เสมอเมื่อชำระเงิน พร้อมแสดงป้ายกำกับภารกิจครบทั้ง 3 ช่องทาง (PromptPay, ธนาคาร, TrueMoney) รวมถึงปุ่มยกเลิกการเลือกภารกิจ
- **การป้องกันการกดซ้ำซ้อน (Multi-layer Submission Guard & Double-click Lock)**:
  - ติดตั้ง `useRef` Submission Lock (`isSubmittingRef`) ทั้งในระดับหน้า `DonorPage` และฟอร์มย่อยทุกช่องทาง (`DonorPromptPayForm`, `DonorBankForm`, `DonorTrueMoneyForm`) ป้องกันการกดเบิ้ลหรือยิงคำขอซ้ำในระดับ JavaScript Memory ทันที
  - เพิ่ม CSS `pointer-events-none` และสถานะ `disabled` บนปุ่มยืนยันการชำระเงินทันทีที่เริ่มประมวลผลคำขอแรก ป้องกันไม่ให้เบราว์เซอร์รับ Event การคลิกซ้ำได้
  - แสดง Processing Modal แจ้งสถานะระบบกำลังตรวจสอบและสแกนสลิป ป้องกันผู้ใช้งานปิดหรือเปลี่ยนหน้าต่างระหว่างประมวลผล
- สถานะการเปิด/ปิดช่องทางรับเงินขึ้นอยู่กับการตั้งค่าสวิตช์ในหน้า **Payment (`/payment`)** โดยตรง:
  1. **PromptPay**: แสดง PromptPay QR Code อัตโนมัติตามยอดเงิน, ลากวางอัปโหลดสลิป, ปุ่มยืนยัน
  2. **Bank**: แสดงข้อมูลบัญชีธนาคารพร้อมปุ่มคัดลอกเลขบัญชี แสดงยอดโดเนทขั้นต่ำชัดเจนทั้งภายในการ์ดและป้ายเตือน ไม่ต้องกรอกจำนวนเงินเอง ระบบจะอ่านยอดเงินและตรวจสอบชื่อผู้รับเงินจากสลิปผ่าน OCR/Mini QR อัตโนมัติ
  3. **TrueMoney**: แสดงช่องทางทรูมันนี่สำหรับโอนเงิน/อั่งเปา
  4. **Channel Disabled**: แสดงการ์ด "ไม่พร้อมให้บริการ" เมื่อสตรีมเมอร์ปิดสวิตช์ช่องทางนั้นๆ ในหน้า Payment

#### 7) หน้าตั้งค่าวิดเจ็ต OBS (WidgetPage) — `/widget`

- รองรับการตั้งค่าวิดเจ็ต 4 รูปแบบใน Layout 2 คอลัมน์ (ฟอร์มตั้งค่า + Real-time Preview เสมือนจริง):
  1. **Donate Alert**:
     - _พื้นฐาน_: ยอดขั้นต่ำที่แจ้งเตือน (บาท), อัปโหลดรูปภาพแสดงผล (JPG/PNG/GIF)
     - _เสียง & TTS_: เสียงแจ้งเตือน Presets (Mythic Horn, Dragon Roar, Ancient Bell, เสียง MP3 ของฉัน, ปิดเสียง), ตัวปรับระดับเสียง, TTS อ่านข้อความโดเนท (ไทย/อังกฤษ, ชาย/หญิง, ความเร็ว 0.5x–2.0x)
     - _ข้อความ_: Message Template `{user} {amount}`, Shine Effect, ฟอนต์ (Kanit, FC Vision), ขนาดตัวอักษร, Palette สี (ข้อความ, ชื่อ, จำนวนเงิน, สีขอบตัวอักษร), ขนาดขอบตัวอักษร
     - _เอฟเฟกต์ & Tiers_: แอนิเมชั่นเข้า/ออก, เวลาแสดงผล, ฟิลเตอร์ (Glow, Pulse, Shake, Glitch ฯลฯ), ระบบแสดงผลตามช่วงยอดเงิน (Amount Tiers) ปรับเสียงและเอฟเฟกต์แยกตามยอดเงิน
     - _การทดสอบ Alert_: ปุ่ม "ทดสอบ Alert" อยู่เฉพาะในแท็บนี้ สามารถทดสอบแจ้งเตือนสดไปยัง OBS Studio และ Preview ได้ทันที
  2. **Donate Goal**:
     - ชื่อเป้าหมาย, ธีมสี (Mana, Crimson, Gold), ยอดเริ่มต้น/ยอดเป้าหมาย, กำหนดช่วงวันที่, หลอดความคืบหน้า Progress Bar เรืองแสง
     - **คำนวณยอดสะสมอัตโนมัติ (Auto-calculated Current Amount)**: ระบบคำนวณยอดสะสม (`currentAmount`) จากประวัติการบริจาคที่สำเร็จจริง (`completed`) ในช่วงวันเวลาของเป้าหมายอัตโนมัติ และแสดงผลเป็น Read-only ป้องกันข้อมูลคลาดเคลื่อน
  3. **Leaderboard**:
     - ชื่อหัวข้อ, สวิตช์แสดงยอดเงิน, กำหนดช่วงเวลา, ปรับจำนวนอันดับ 1–10 (Stepper +/-)
     - **ปรับปรุง Typography & ขยาย Layout**: ออกแบบฟอนต์และกรอบแสดงผลให้อ่านง่าย คมชัดสูงสุดเมื่อแสดงผลใน OBS Studio
     - **ป้องกันข้อมูลทดสอบปนเปื้อน**: กรองการแจ้งเตือนทดสอบ (`isTest: true`) ไม่ให้นำมาบวกใน Leaderboard และ Goal จริง
  4. **Mission Donate**: จัดการช่องภารกิจสูงสุด 12 ช่อง (ชื่อภารกิจ + ราคา ฿) สำหรับนำไปแสดงผลบน Donor Page
- **BrowserSourceCard**:
  - แสดงป้ายสถานะ `Live` / `ยังไม่ได้บันทึก`, Browser Source URL สำหรับ OBS, และปุ่มคัดลอก URL
  - **แนะนำขนาดที่เหมาะสมใน OBS**: แสดงขนาดความกว้าง x สูงที่แนะนำใน OBS Properties (Alert: `800x600`, Goal: `600x120`, Leaderboard: `450x650`) เพื่อให้ภาพและตัวอักษรคมชัดสูงสุด ไม่แตกจากการลากยืดกรอบสีแดง
  - **ปุ่มทดสอบเฉพาะแท็บ**: ปุ่ม "ทดสอบ Alert" จะแสดงเฉพาะในแท็บ Donate Alert เท่านั้น สำหรับแท็บ Goal และ Leaderboard ปุ่ม "คัดลอก URL" จะขยายเต็มพื้นที่
- **ระบบซิงค์การตั้งค่าแบบเรียลไทม์ (Live OBS Config Sync)**:
  - สตรีมเมอร์ปรับแต่งค่าในหน้า `WidgetPage` ระบบจะ Debounce และส่งสัญญาณ Socket.IO `widget-config-update` ไปอัปเดตหน้า OBS Browser Source อัตโนมัติทันทีโดยไม่ต้อง Refresh หรือลบใส่ Browser Source ใหม่ใน OBS Studio
  - ระบบ **Persistent Reconnect & Multi-room Rejoining**: บันทึก Stream Room (`streamer_${token}` หรือชื่อสตรีมเมอร์) ไว้ใน Socket client เมื่อการเชื่อมต่อขาดหายหรือ Reconnect จะเข้าห้องเดิมทั้งหมดอัตโนมัติ ทำให้ OBS ทำงานต่อเนื่องไม่หลุด
- **Overlays สำหรับ OBS Studio (Clean Stream Display)**:
  - **OverlayAlertPage (`/overlay/alert/:token`)**: พื้นหลังโปร่งใส 100%, FIFO Alert Queue พร้อมคูลดาวน์ 400ms, กรอง `minAmount`, Tiers, Web Audio API Presets, และ Responsive Thai TTS
  - **OverlayGoalPage (`/overlay/goal/:token`)**: พื้นหลังโปร่งใส 100%, แถบ Progress Bar เรืองแสง, ซิงค์ยอดเงินสะสมจริงและอัปเดตแบบเรียลไทม์
  - **OverlayLeaderboardPage (`/overlay/leaderboard/:token`)**: พื้นหลังโปร่งใส 100%, แสดงอันดับผู้สนับสนุน 1-20 พร้อมมงกุฎและเหรียญรางวัล, ตัวอักษรคมชัด ไม่แตก
  - **ไม่มีปุ่มทดสอบลอยบน Browser Source**: หน้า Overlay ทั้งหมดไม่มีปุ่มหรือแถบควบคุมใดๆ ลอยมารบกวนจอถ่ายทอดสด มอบประสบการณ์ระดับมืออาชีพ 100%

#### 8) หน้าจัดการบัญชี (Account) — `/account`

- `AccountProfileCard`: แสดงรูปโปรไฟล์ Avatar, ชื่อผู้ใช้, อีเมล, สถานะการยืนยันตัวตน พร้อมระบบอัปโหลดเปลี่ยนรูป Avatar (แปลงเป็น Base64) และแก้ไขชื่อเล่น (Nickname) บันทึกผ่าน `PUT /api/users/me`
- `AccountTabs`: แท็บสลับ 3 หมวดหมู่:
  - **UserInfoTab**: จัดการข้อมูลส่วนตัว, ชื่อแสดงผล, ข้อมูลติดต่อ
  - **SecurityTab**: จัดการรหัสผ่าน, เปลี่ยนรหัสผ่านใหม่พร้อม Checklist
  - **SocialMediaTab**: เชื่อมต่อลิงก์โซเชียลมีเดียทั้ง 6 แพลตฟอร์ม

#### 9) หน้าประวัติการรับเงิน (HistoryPage) — `/history`

- แสดงสถิติสรุปยอดโดเนททั้งหมด, จำนวนรายการที่สำเร็จ (ดึงจาก `GET /api/donations`)
- ตารางประวัติการรับเงิน `DonationHistoryTable` แสดงวันเวลา, ผู้สนับสนุน, จำนวนเงิน, ช่องทางที่ใช้, ข้อความ, รูปสลิปโอนเงิน, และสถานะ (`completed`, `pending`, `rejected`)
- รองรับตัวกรองสถานะ (`ทั้งหมด`, `สำเร็จ`, `รอดำเนินการ`, `ปฏิเสธ`), ช่องค้นหาชื่อผู้สนับสนุนหรือ Transaction ID, และระบบแบ่งหน้า (Pagination)
- `SlipModal`: ป๊อปอัปตรวจสอบสลิปโอนเงินขยายใหญ่ พร้อมปุ่มอนุมัติ (`อนุมัติ`) หรือปฏิเสธ (`ปฏิเสธ`) รายการโดเนท บันทึกสถานะไปยัง `PATCH /api/donations/:id` แบบเรียลไทม์

---

### 6. โครงสร้างโฟลเดอร์ Component ฝั่ง Client

```
client/src/
├── __mocks__/
│   └── socket.io-client.js    → Mock Socket.IO Client สำหรับ Jest
├── assets/                    → โลโก้และรูปภาพประกอบ (PrimaryLogo, HeroLogo, hero, bg-login)
├── components/
│   ├── Account/               → AccountProfileCard, AccountTabs, ManageAccountCard, SecurityTab, SocialMediaTab, UserInfoTab
│   ├── Auth/                  → AuthLayout, InputField, PasswordChecklist, SocialAuthButtons
│   ├── Dashboard/             → CardWrapper, DonationChart, PaymentChannels, ProtectedRoute, RealtimeFeed, StatsCard, TopDonors
│   ├── Discover/              → CategorySection, StreamerCard
│   ├── DonatePage/            → DecorateSection, DonatePageLink, ImageUploadBox, MessageFilterSection, RichTextField, SettingsCard, SocialMediaSection, DonatePageComponents.test.js
│   ├── Donor/                 → DonorBankForm, DonorDisabledCard, DonorHeader, DonorOfflineCard, DonorPaymentTabs, DonorPromptPayForm, DonorSlipUpload, DonorStatusCard, DonorTrueMoneyForm, DonorComponents.test.js
│   ├── Histor/                → DonationHistoryTable, SlipModal (ชื่อโฟลเดอร์ Histor/ ตามโค้ดดั้งเดิม)
│   ├── HowToUse/              → BenefitsSection, StepsSection
│   ├── MainPage/              → CTASection, Features, Footer, Hero, Navbar, StreamerList
│   ├── Payment/               → BankCard, ComingSoonCard, PaymentHeader, PromptPayCard, TrueMoneyCard
│   ├── Widget/                → AccordionSection, AudioUploadField, BrowserSourceCard, DonateAlertPanel, DonateGoalPanel, LeaderboardPanel, MissionDonatePanel, WidgetHeader, WidgetPreview, WidgetTypeTabs, widgetStorage.js, WidgetComponents.test.js
│   ├── Navigation.test.js     → การทดสอบ Sidebar และ Topbar ร่วมกัน
│   ├── Sidebar.jsx            → เมนูหลักด้านซ้ายแบบ Sticky
│   └── Topbar.jsx             → เมนูด้านบนแบบ Sticky พร้อม Breadcrumb
├── constants/
│   └── socialPlatforms.js     → รายชื่อและไอคอนของแพลตฟอร์มโซเชียลมีเดีย
├── hooks/
│   └── useJwtUser.js          → Custom hook ดึงข้อมูล user จาก JWT ใน localStorage
├── pages/                     → หน้าหลักทั้ง 12 หน้า, NotFound, OverlayAlertPage, OverlayGoalPage, OverlayLeaderboardPage พร้อมไฟล์ `.test.js` ครบชุด
├── utils/
│   ├── alertAudio.js          → ระบบเสียงแจ้งเตือน Web Audio API Synth, custom MP3, Google TTS HTTPS Direct, Web Speech API fallback
│   ├── alertAudio.test.js     → ชุดทดสอบระบบเสียงและการสังเคราะห์เสียง TTS (23 tests)
│   ├── api.js                 → ฟังก์ชัน fetch กลาง (fetchCurrentUser, updateCurrentUser, updatePaymentSettings, updateDonationPageSettings, changePassword, fetchDonationHistory, fetchDonationStats, updateDonationStatus) + API Endpoint Constants
│   ├── passwordValidation.js  → ฟังก์ชันตรวจสอบความปลอดภัยของรหัสผ่าน
│   ├── passwordValidation.test.js
│   ├── sanitizeStorage.js     → ฟังก์ชันกรองและจัดเก็บข้อมูล localStorage ให้ปลอดภัย
│   ├── sanitizeStorage.test.js
│   ├── socket.js              → Socket.IO Client singleton (getSocket, joinStreamRoom, leaveStreamRoom, onDonationAlert, emitTestAlert, onWidgetConfigUpdate, disconnectSocket, Auto-reconnect Registry)
│   └── socket.test.js         → ชุดทดสอบ Socket.IO integration และ Reconnect Room Recovery (11 tests)
├── App.js                     → การกำหนดเส้นทาง URL Routing ทั้งหมด
├── App.test.js                → การทดสอบ Routing ภาพรวม
├── setupTests.js              → การตั้งค่า Jest polyfill (TextEncoder/TextDecoder)
├── index.css                  → สไตล์หลัก Tailwind CSS & Fonts
└── index.js                   → React Root Mounting Entry Point
```

---

## 7. กฎและข้อตกลงสำคัญในการพัฒนา (Key Conventions)

1. **ภาษาและข้อความบน UI**: ข้อความทั้งหมดที่ผู้ใช้เห็น (Labels, Placeholders, Error Messages, Tooltips, Buttons) ให้ใช้ **ภาษาไทย** เสมอ
2. **การใช้งานไอคอน**: ใช้ named imports จาก `lucide-react` เท่านั้น สำหรับโลโก้แบรนด์/โซเชียลมีเดียให้ใช้ SVG inline
3. **เลย์เอาต์ Sidebar และ Topbar**:
   - แดชบอร์ดและหน้าการจัดการต้องมี **Sidebar** (`sticky top-0 h-screen z-30`) และ **Topbar** (`sticky top-0 z-40 backdrop-blur-xl`)
   - **ห้ามใส่ `overflow-x: hidden`** บน Container ชั้นนอกที่ครอบ Sidebar/Topbar เพราะจะทำให้คุณสมบัติ `position: sticky` ของเบราว์เซอร์ไม่ทำงาน
4. **ความปลอดภัยของรหัสผ่าน**: ฟังก์ชัน `utils/passwordValidation.js` มีการใช้งานเหมือนกันทั้งใน `client/` และ `server/` หากมีการปรับเงื่อนไข ต้องอัปเดตทั้ง 2 ฝั่งให้ตรงกันเสมอ
5. **การจัดการ State และ Storage**:
   - หน้า **Account**, **Payment**, **DonatePage**, **DonorPage**, **Dashboard**, **HistoryPage**, และ **Widget** ย้ายขึ้น MongoDB ผ่าน REST API (`api.js`) แล้วทั้งหมด — สำหรับหน้า Widget มีระบบ fallback ไปยัง `widgetStorage.js` และ `sanitizeStorage.js` กรณีออฟไลน์
   - ห้ามเรียก `localStorage` ตรงๆ ในทุกกรณี ให้ใช้ผ่าน `safeGetItem`/`safeSetItem` ใน `sanitizeStorage.js` เสมอ
6. **Zero Warning Policy บน CI**: ตัวแปร `CI=true` บน GitHub Actions จะเปลี่ยน warning ทุกตัวเป็น fatal error ดังนั้นห้ามทิ้ง unused variables หรือ unused imports
7. **การป้องกัน NoSQL Injection**: ทุก route ฝั่ง server ที่รับค่าจาก client ต้องทำตามกฎ 3 ขั้นตอนในหัวข้อ 4.4 อย่างเคร่งครัด
8. **ห้ามทำ Code Duplication ซ้ำซ้อน**: ห้ามคัดลอกบล็อกโค้ดที่ซ้ำกันเกิน 10 บรรทัดข้ามไฟล์ ให้แยกเป็น shared component หรือ hook กลาง เพื่อไม่ให้ติด Quality Gate ของ SonarCloud

---

## 8. สถานะของระบบ (Current Project Status)

| ส่วนงาน                      | สถานะ            | รายละเอียด                                                                                                 |
| :--------------------------- | :--------------- | :--------------------------------------------------------------------------------------------------------- |
| **Backend Foundation**       | ✅ สมบูรณ์       | สถาปัตยกรรมแยก `app.js`/`index.js`, Helmet, Rate Limiter, Error Handler กลาง, Response `{ message, data }` |
| **Auth System**              | ✅ สมบูรณ์       | Register, Login, Google OAuth จริงผ่าน Google Identity Services (GIS TokenClient Popup & One-Tap), ตัดปุ่ม YouTube/Twitch ที่ไม่จำเป็นออก, JWT Token, Password Checklist, ป้องกัน NoSQL Injection, Auth Rate Limiting |
| **Frontend Pages (12 หน้า)** | ✅ สมบูรณ์       | ทุกหน้าเชื่อมต่อใน `App.js` พร้อม Navigation Bar และ Responsive UI                                         |
| **Widget System**            | ✅ สมบูรณ์       | 4 รูปแบบ (Alert, Goal, Leaderboard, Mission) + Live Preview + OBS Browser URL                              |
| **Phase 4 — REST API Migration** | ✅ สมบูรณ์  | Account (`GET/PUT /api/users/me`), Payment (`PUT /api/users/payment`), DonatePage (`PUT /api/users/donation-page`) ย้ายขึ้น MongoDB แล้วทั้งหมด |
| **Phase 5 — Cloud Deployment**   | ✅ สมบูรณ์  | Server บน Render (`final-project-xntd.onrender.com`), Client บน Vercel (`final-project-orpin-five.vercel.app`), Database บน MongoDB Atlas |
| **Phase 6 — Donation Pipeline & Backoffice** | ✅ สมบูรณ์ | Public API, Donation Submission, Slip Upload, Dashboard Analytics (`/stats`), History Table (`/`), Status Update (`PATCH /:id`) |
| **Phase 7 — Real-time Alert & OBS Widget System** | ✅ สมบูรณ์ (PR #57–#66) | OBS Browser Sources ครบ 3 วิดเจ็ต (Alert, Goal, Leaderboard), FIFO Alert Queue, Web Audio API Presets, Google TTS Direct, Socket.IO Real-time (`donation-alert`, `widget-config-update`), คำนวณยอด Goal สะสมอัตโนมัติ, Persistent Reconnect, Typography & Clean Stream Display, Widget REST API & Models (`Widget`, `Mission`, `Blacklist`) |
| **Test Suites**              | ✅ สมบูรณ์       | Client: 28 Suites (314 Tests ผ่าน 100%), Server: 10 Suites (209 Tests ผ่าน 100%, Coverage > 97%), รวม **38 Suites, 523 Tests ผ่าน 100%** |
| **CI / CD Pipeline**         | ✅ สมบูรณ์       | GitHub Actions (`client`, `server`, `sonar`) ผ่านทุก Check พร้อมส่ง Coverage ทั้งสองฝั่ง รองรับ `--forceExit` ป้องกัน Process ค้าง |
| **SonarCloud Quality Gate**  | ✅ ผ่าน          | Security: A, Reliability: A, Duplication ≤ 3%, Coverage on New Code ≥ 80.0%, 0 Bugs, 0 Vulnerabilities, เพิ่ม Node Memory 4GB และ Exclude Binary Assets แก้ปัญหาสแกนค้างที่ 57% |
| **Database Models**          | ✅ สมบูรณ์       | มีครบ 5 Models: `User`, `Donation`, `Widget`, `Mission`, `Blacklist` บน MongoDB Atlas                     |
| **OCR Slip Verification & Bank Matching** | ✅ สมบูรณ์ | Phase 8 & Extension — In-House QR & OCR Verification Engine (Zero-Cost ด้วย jsQR + Jimp + Tesseract.js), ตรวจจับสลิป PromptPay / Bank Mini QR (ITMX), อ่านจำนวนเงินจากสลิปอัตโนมัติ (Zero-Touch), ตรวจสอบชื่อผู้รับเงินตรงกับบัญชีสตรีมเมอร์ (`isRecipientNameMatched`) พร้อมตัดคำนำหน้าชื่อไทย, ตรวจสอบเลขบัญชี 4 หลักสุดท้าย, ป้องกันสลิปซ้ำด้วย Sparse Unique Index บน `transRef`, และระบบ Auto-Approve แจ้งเตือน OBS ทันที |
| **Phase 9 — Google OAuth & Performance** | ✅ สมบูรณ์ | ระบบ Google Identity Services (GIS) ทำงานได้จริงทั้ง Login & Register, Endpoint `POST /api/auth/google` สำหรับ Auto-Registration และ Link Account, ลบปุ่ม YouTube/Twitch ที่ไม่จำเป็น, Dynamic Domain ลิงก์โดเนท, ปรับแต่ง SonarCloud Heap Memory 4096MB แก้ปัญหาสแกนล่าช้า |
| **Phase 10 — Mission Donate, Bank Verification & Idempotency** | ✅ สมบูรณ์ | เชื่อมต่อระบบภารกิจโดเนท Mission Cards สู่หน้าบริจาค (`/:username`) พร้อมป้ายล็อคแท็ก `[ 🔒 ภารกิจ: {name} ]` และล็อคช่องกรอกจำนวนเงิน (Locked Amount Input: readOnly, select-none, ไอคอนกุญแจ) ป้องกันการแก้ราคาภารกิจ, ระบบตรวจสอบราคาภารกิจโอนผ่านธนาคาร (Bank Mission Price Verification) ตัดแท็กภารกิจออกจาก Alert อัตโนมัติหากยอดเงินไม่ถึงราคาภารกิจแต่ ≥ ขั้นต่ำ, ป้องกันการกดส่งสลิปซ้ำสองชั้น (Multi-layer Submission Guard + useRef lock), ระบบ 15-second Backend Idempotency Window ป้องกัน Race condition ตอบกลับ 200 OK โดยไม่ยิง Socket ซ้ำ, รองรับภาพหน้าปก/พื้นหลัง และตัวกรองคำหยาบทั้งชื่อและข้อความ |

---

## 9. กระบวนการ CI (GitHub Actions) และ SonarCloud

ไฟล์ CI: `.github/workflows/ci.yml` รันอัตโนมัติเมื่อ push เข้า `main` หรือเปิด Pull Request เข้า `main`:

| Job      | สภาพแวดล้อม                          | ขั้นตอนการทำงาน                                                                                                       |
| :------- | :----------------------------------- | :-------------------------------------------------------------------------------------------------------------------- |
| `client` | Ubuntu, Node 22, npm 11              | `npm ci` → `npm test -- --coverage --watchAll=false` → `npm run build` → Upload coverage artifact (`client-coverage`) |
| `server` | Ubuntu, Node 22, npm 11              | `npm ci` → `npm run test:coverage` → Upload coverage artifact (`server-coverage`)                                     |
| `sonar`  | Ubuntu (หลัง client และ server ผ่าน) | Download `client-coverage` และ `server-coverage` → SonarQube Scan Action                                              |

### Branch Protection บน `main`

- ล็อกห้าม Push ตรงเข้า `main` ทุกกรณี ต้องเปิด Pull Request เท่านั้น
- ทุก Checks (`CI / client`, `CI / server`, `CI / sonar`, `SonarCloud Code Analysis`) ต้องผ่าน (เครื่องหมายถูกสีเขียว) ก่อน Merge

### ข้อกำหนด SonarCloud Quality Gate

- **Coverage on New Code**: ต้องไม่ต่ำกว่า **80%** (ปัจจุบันทำได้ > 88%)
- **Duplication on New Code**: ต้องไม่เกิน **3%**
- **Security Hotspots & Bugs**: ต้องเป็น **0**
- **การเพิ่มประสิทธิภาพการสแกน (Performance & Memory)**:
  - กำหนด `sonar.javascript.node.maxspace=4096` ใน `sonar-project.properties` เพื่อขยายหน่วยความจำ Node.js Engine บน GitHub Actions ป้องกันปัญหากระบวนการสแกนหยุดชะงักที่ 57%
  - ตัดการสแกนไฟล์ขนาดใหญ่ที่ไม่จำเป็น: `**/*.traineddata` (โมเดล OCR ภาษาไทย/อังกฤษขนาด 6+ MB), `**/package-lock.json`, และรูปภาพ Static Assets `client/src/assets/**`

---

## 10. Git Workflow และข้อตกลงในการทำงานร่วมกัน

1. **ห้าม push โค้ดตรงเข้า branch `main`**: ให้แตก branch ย่อยเสมอ เช่น `widget`, `payment`, `history`
2. **การตั้งชื่อ Branch**: ใช้ภาษาอังกฤษตัวพิมพ์เล็กและคั่นด้วยขีดกลาง เช่น `feature-name` (Windows มองชื่อตัวพิมพ์ใหญ่เล็กไม่ต่างกัน ป้องกันปัญหาชื่อซ้ำ)
3. **ก่อนเปิด Pull Request**:
   - รัน `npm test -- --watchAll=false` ใน `client/` เพื่อยืนยันว่าการทดสอบผ่านครบ 100%
   - รัน `set CI=true&& npm run build` เพื่อให้แน่ใจว่าไม่มี Warning ตกค้าง
   - ตรวจสอบ `git status` ไม่ให้ไฟล์ขยะหรือ `.env` หลุดขึ้น Git
4. **การลบ Branch**: เมื่อ Merge เข้า `main` เรียบร้อยแล้ว สามารถลบ Local Branch ได้ด้วย `git branch -d <branch_name>`
5. **การจัดการ Conflict**: ตรวจสอบและแก้ไขให้เรียบร้อย ห้ามทิ้งเครื่องหมาย `<<<<<<<`, `=======`, `>>>>>>>` ไว้ในโค้ดหรือเอกสารอย่างเด็ดขาด

---

## 11. แผนงานระยะถัดไป (Upcoming Phases)

> **Phase 1–7 เสร็จสมบูรณ์แล้ว** ✅ — Backend Foundation, Auth, Frontend Pages, Widget System, REST API Migration (Account/Payment/DonatePage), Cloud Deployment (Render + Vercel + MongoDB Atlas), Donation Pipeline, Dashboard Analytics & History Backoffice, และ Real-time Alert & OBS Widget System ครบวงจร (PR #57–#66)

- **Phase 5: Deploy (เสร็จสมบูรณ์ ✅)**
  - Server ขึ้น **Render** (`https://final-project-xntd.onrender.com`) พร้อม Reverse Proxy (`trust proxy`), Dynamic Port และ CORS
  - Client ขึ้น **Vercel** (`https://final-project-orpin-five.vercel.app`) ด้วย Create React App preset, Root Directory `client`, และต่อยอด API ผ่าน `REACT_APP_API_URL`
  - Database เชื่อมต่อ **MongoDB Atlas**
  - ผลการทดสอบ: เชื่อมต่อ REST API (`/api/users/me`) ตอบสนอง 401 Unauthorized ตามข้อกำหนด

- **Phase 6: แกนหลัก Donation REST API, Dashboard Analytics & History Backoffice (เสร็จสมบูรณ์ ✅)**
  - **ส่วนที่ 1: Donation Model, Public API & Donor Pipeline (PR #50)**
    - สร้าง `server/Models/Donation.js` (`streamerId`, `donorName`, `amount`, `message`, `paymentMethod`, `status`, `slipImage`, `missionId`) ทำ Compound Index `{ streamerId: 1, createdAt: -1 }`
    - Public Endpoint: `GET /api/public/:username` (ข้อมูลสำหรับ Donor Page ปิดบังข้อมูลส่วนตัว พร้อม NoSQL guard)
    - `POST /api/donations` (สร้างรายการโดเนท พร้อมอัปโหลดสลิป Base64, ตรวจสอบยอดขั้นต่ำ, กรองคำหยาบ และ Socket Alert)
    - ปรับปรุง `DonorPage.jsx` เชื่อมต่อ REST API เซิร์ฟเวอร์จริงแทน `localStorage`
  - **ส่วนที่ 2: Dashboard Analytics, History Backoffice & Slip Management (PR #51)**
    - `GET /api/donations` (ดึงประวัติการโดเนท พร้อม Pagination, ค้นหาชื่อผู้บริจาค/รหัสธุรกรรม, และตัวกรองสถานะสำหรับ `HistoryPage`)
    - `GET /api/donations/stats` (ดึงสถิติรวม ยอดเงิน กราฟตามช่วงเวลา และ Top Donors ด้วย Mongo Aggregation สำหรับ `Dashboard`)
    - `PATCH /api/donations/:id` (อนุมัติ/ปฏิเสธสลิปโอนเงิน อัปเดตสถานะในระบบ พร้อมบันทึกหมายเหตุ)
    - `PUT /api/users/me` รองรับการอัปโหลด Avatar ใหม่ (Base64) และอัปเดต Nickname ในหน้า `Account`
    - เพิ่มคอมโพเนนต์ `SlipModal` ให้สตรีมเมอร์กดดูสลิปขยายใหญ่และกดอนุมัติ/ปฏิเสธได้ทันที
    - ครอบคลุมชุดทดสอบ Jest ทั้งหมด (Server 107 Tests, Client 185 Tests ผ่าน 100%) และผ่าน SonarCloud Quality Gate

- **Phase 7: Real-time Alert & OBS Widget System (เสร็จสมบูรณ์ ✅ - PR #57, #58, #59)**
  - **ส่วนที่ 1: Real-time Alert, FIFO Queue & OBS Alert Overlay (PR #57, #58)**
    - **Overlay Alert Page (`/overlay/alert/:token`)**: พื้นหลังโปร่งใสสำหรับ OBS Studio, รองรับพารามิเตอร์ `demo=1` สำหรับทดสอบ
    - **FIFO Alert Queue**: ระบบคิวแจ้งเตือนแบบ FIFO พร้อมคูลดาวน์ 400ms ป้องกันแอนิเมชั่นและเสียงซ้อนทับ พร้อมปุ่มข้ามและล้างคิว
    - **Audio & TTS Engine**: รองรับ Web Audio API Synth Presets (Mythic Horn, Dragon Roar, Ancient Bell), Custom MP3 Base64, Google TTS HTTPS Direct แบบ `no-referrer`, และ Web Speech API fallback
    - **Socket.IO Real-time Alert**: เชื่อมต่อห้องสตรีมเมอร์ (`join-stream`), รับอีเวนต์ `donation-alert` และปุ่มยิง `test-alert` จากหน้า `WidgetPage` ไปยัง OBS Studio แบบเรียลไทม์
    - **Security Hardening**: กำจัดความเสี่ยง SSRF, แทนที่ `Math.random()` ด้วย CSPRNG (`crypto.getRandomValues`), ป้องกัน Floating Promises ด้วย `void`, และลด Cognitive Complexity
  - **ส่วนที่ 2: Widget Config REST API, Goal/Leaderboard Overlays & MongoDB Models (PR #59)**
    - **Database Schemas**: สร้าง `Widget`, `Mission`, `Blacklist` Models ใน MongoDB Atlas
    - **REST API Endpoints**:
      - `GET /api/widgets/me` (ดึงการตั้งค่าของผู้ใช้ปัจจุบัน)
      - `PUT /api/widgets/me` (บันทึก/อัปเดตการตั้งค่า และ regenerate token)
      - `GET /api/public/overlay/:widgetType/:token` (ดึงการตั้งค่าสาธารณะ พร้อม Donation Aggregation สำหรับ Goal และ Leaderboard)
    - **Overlay Goal Page (`/overlay/goal/:token`)**: แถบความคืบหน้าเรืองแสงสำหรับ OBS, คำนวณยอดเงินสะสมจาก DB อัตโนมัติ พร้อมอัปเดตยอดเพิ่มแบบเรียลไทม์ผ่าน Socket.IO
    - **Overlay Leaderboard Page (`/overlay/leaderboard/:token`)**: อันดับผู้สนับสนุน 1-20 พร้อมมงกุฎ/เหรียญรางวัล, คำนวณ Top Donors จาก DB อัตโนมัติ พร้อม Re-ranking เรียลไทม์ผ่าน Socket.IO
    - **WidgetPage Integration**: เชื่อมต่อ `fetchWidgetConfig` และ `saveWidgetSettings` บันทึกขึ้น MongoDB พร้อม fallback ไปที่ localStorage
  - **ส่วนที่ 3: Live Config Sync, Auto Goal Calculation, Typography & Clean Stream Display (PR #60–#66)**
    - **Auto Goal Calculation (`widgetHelpers.js`) (PR #60, #61)**: ระบบคำนวณยอดสะสมของ Donate Goal อัตโนมัติจากรายการโดเนทจริงที่สำเร็จ (`status === "completed"`) ในช่วงวันเวลาของเป้าหมาย พร้อมตั้งค่าฟิลด์ยอดเงินปัจจุบันเป็น Read-only ในหน้า UI เพื่อความแม่นยำ 100%
    - **Real-time Live OBS Config Sync (PR #62, #63)**: เมื่อสตรีมเมอร์แก้ไขการตั้งค่าวิดเจ็ตใน `WidgetPage` (เช่น สี, ฟอนต์, เป้าหมาย, เสียง ฯลฯ) ระบบจะ Debounce และส่งสัญญาณ `widget-config-update` ผ่าน Socket.IO อัปเดตไปยัง OBS Browser Source แบบเรียลไทม์ทันทีโดยไม่ต้อง Refresh หรือเพิ่ม Browser Source ใหม่ใน OBS Studio
    - **Persistent Reconnect & Multi-room Recovery (PR #64)**: พัฒนาระบบ Room Registry ใน Socket.IO Client singleton ให้จดจำห้องที่เข้าร่วม (`streamer_${token}` หรือชื่อสตรีมเมอร์) เมื่อเน็ตหลุดหรือ Reconnect Socket.IO จะเข้าห้องเดิมทั้งหมดอัตโนมัติ ทำให้ OBS รับข้อมูลต่อเนื่องไม่หลุด
    - **Leaderboard Typography & Clean Stream Display (PR #65, #66)**: ปรับขนาดตัวอักษรและ Layout ของ Leaderboard ให้อ่านง่าย คมชัด ไม่แตกใน OBS Studio, แนะนำขนาด Properties ที่เหมาะสมสำหรับ OBS ใน BrowserSourceCard, แยกปุ่มทดสอบ Alert ให้อยู่เฉพาะแท็บ Alert เท่านั้น, กรองรายการทดสอบ (`isTest: true`) ไม่ให้นำมาบวกใน Leaderboard และ Goal จริง, และลบปุ่มทดสอบที่ลอยอยู่ด้านล่าง Browser Source ออกทั้งหมดเพื่อหน้าจอถ่ายทอดสดที่สะอาดตา 100%
  - ครอบคลุมชุดทดสอบ Jest ทั้งหมด (Server 8 Suites 130 Tests, Client 26 Suites 270 Tests รวม **34 Suites, 400 Tests ผ่าน 100%**) และ Build สำหรับ Production ผ่านฉลุย (0 Warnings, 0 Errors)

- **Phase 8: In-House OCR & Slip Verification Engine (เสร็จสมบูรณ์ ✅)**
  - **Zero-Cost & Offline-First Slip Engine (`slipParser.js`, `slipVerificationService.js`)**:
    - พัฒนาระบบตรวจสอบสลิปภายในระบบด้วย pure JavaScript (`jsqr` + `jimp` + `tesseract.js`) โดยไม่มีค่าบริการ API ภายนอก (Zero-Cost) รันบน CI/CD ได้ 100%
    - **PromptPay / EMVCo Slip QR Parser**: ถอดรหัสโครงสร้าง TLV (Tag-Length-Value) มาตรฐานสลิปธนาคารไทย ดึงรหัสอ้างอิงธุรกรรม (`transRef`), จำนวนเงิน (`amount` จาก Tag 54), และรหัสธนาคารต้นทาง/ปลายทาง (`bankCode`) พร้อมจับคู่รายชื่อ 12 ธนาคารไทยหลัก
    - **Thai Bank Mini QR Support (National ITMX Standard)**: รองรับสลิป QR ขนาดเล็กของแอปธนาคารไทย (เช่น Krungthai NEXT, SCB Easy) ที่ไม่มี Tag 54 โดยระบบจะสกัดรหัสอ้างอิงและส่งต่อให้ OCR อ่านยอดเงินได้อย่างแม่นยำ
    - **Multi-pass Image Preprocessing**: สแกนภาพสลิปแบบหลายรอบ (Original image, Auto-resizing สำหรับภาพขนาดใหญ่ > 800px, Greyscale & Contrast enhancement) เพื่อเพิ่มโอกาสการถอดรหัสแม้ภาพมืดหรือแสงน้อย
  - **Phase 8.1 Extension: Zero-Touch Bank Donation & Recipient Verification**:
    - **ฟอร์มโอนธนาคารแบบคลีน (Zero-Touch UX)**: ผู้สนับสนุนไม่ต้องกรอกยอดเงินเองใน `DonorBankForm` ระบบจะอ่านยอดเงินจากสลิปอัตโนมัติ
    - **การแสดงยอดขั้นต่ำที่เด่นชัด**: แสดงยอดโดเนทขั้นต่ำ (`minAmount`) ทั้งภายในการ์ดบัญชีธนาคารและแถบเตือนสีม่วงด้านล่าง
    - **OCR Multi-strategy Regex Amount Parser (`parseSlipText`)**: สกัดยอดเงินจากข้อความสลิปทั้งแบบมีป้ายกำกับ (`จำนวนเงิน: 50.00 บาท`), แบบหลายบรรทัด (`จำนวนเงิน \n 50.00`), และแบบยอดเงินพร้อมสกุลเงิน (`50.00 THB / บาท`)
    - **การตรวจสอบชื่อผู้รับเงินตรงกับบัญชีสตรีมเมอร์ (`isRecipientNameMatched`)**:
      - ทำการ Normalize ข้อความและตัดคำนำหน้าชื่อไทย (`นาย`, `นาง`, `นางสาว`, `ด.ช.`, `บจก.`, `หจก.` ฯลฯ)
      - รองรับการย่อนามสกุลของแอปธนาคาร (เช่น `สมชาย จ.` เทียบกับ `สมชาย ใจดี`)
      - ปฏิเสธรายการทันทีด้วย HTTP 400 หากชื่อผู้รับเงินไม่ตรงกับบัญชีของสตรีมเมอร์ (`streamer.payment.bank.accountName`)
    - **การตรวจสอบเลขบัญชี (`isAccountNumberMatched`)**: ตรวจสอบความถูกต้องของเลขที่บัญชี 4 หลักสุดท้าย
    - **การตรวจสอบยอดเงินขั้นต่ำ**: ตรวจสอบว่ายอดเงินที่อ่านได้จากสลิปไม่ต่ำกว่ายอดขั้นต่ำ (`minAmount`) ที่สตรีมเมอร์กำหนด
  - **Duplicate Slip Prevention (ป้องกันการใช้สลิปซ้ำ 100%)**:
    - กำหนด Sparse Unique Index บนฟิลด์ `transRef` ในโมเดล `Donation`:
      `{ transRef: 1 }, { unique: true, sparse: true, partialFilterExpression: { transRef: { $type: "string" } } }`
    - ตรวจสอบซ้ำใน `createDonation` หากพบว่า `transRef` เคยถูกบันทึกสำเร็จในระบบแล้ว จะปฏิเสธคำขอทันทีด้วย HTTP 400 (`"สลิปนี้ถูกใช้งานไปแล้ว..."`)
    - ตรวจสอบความถูกต้องของยอดเงิน (Amount Mismatch): หากยอดเงินในสลิปน้อยกว่ายอดเงินบริจาคที่แจ้ง ระบบจะปฏิเสธด้วย HTTP 400
  - **Real-time Auto-Approve & OBS Broadcast**:
    - เมื่อสลิปถูกต้องตามเงื่อนไข (ยอดเงินตรงและสลิปไม่ซ้ำ) ระบบจะปรับสถานะเป็น `approved` ทันที และส่ง Event `donation-alert` ผ่าน Socket.IO ตรงไปยัง OBS Studio Overlay
    - สตรีมเมอร์สามารถเปิด/ปิดการอนุมัติอัตโนมัติได้ผ่านสวิตช์ `autoApproveSlip` ในหน้าตั้งค่า `DonatePage` หากปิด ระบบจะเก็บเป็น `pending` พร้อมผลตรวจ OCR เพื่อให้สตรีมเมอร์ตรวจสอบด้วยตนเอง
    - กรณีรูปสลิปไม่สามารถอ่าน QR Code หรือข้อความได้ ระบบจะแจ้งเตือนให้ใช้สลิปที่คมชัด หรือบันทึกเป็น `pending` กรณีมีจำนวนเงิน
  - **CI/CD Lifecycle & Worker Management**:
    - จัดการ Worker Lifecycle ด้วย `terminateOcrWorker()` ใน `afterAll` ของ Test Suites ทั้งหมด
    - เพิ่มแฟล็ก `--forceExit` ในสคริปต์ `test` และ `test:coverage` ใน `server/package.json` ป้องกันปัญหากระบวนการค้างบน GitHub Actions
    - เพิ่ม `*.traineddata` ลงใน `.gitignore` ป้องกันการบันทึกไฟล์ Binary ของภาษาเข้าสู่ Git
  - ครอบคลุมชุดทดสอบ Jest ทั้งหมด (Server 10 Suites 191 Tests Coverage > 97%, Client 26 Suites 279 Tests รวม **36 Suites, 470 Tests ผ่าน 100%**) และ Build สำหรับ Production ผ่านฉลุย (0 Warnings, 0 Errors)

- **Phase 9: Real Google OAuth Integration, Social Auth Clean-up & CI Performance (เสร็จสมบูรณ์ ✅)**
  - **Google Identity Services (GIS) & Backend Integration**:
    - Backend Endpoint `POST /api/auth/google`: ตรวจสอบความถูกต้องของ Google Token กับ Google API (`id_token` ผ่าน Google Tokeninfo API หรือ `access_token` ผ่าน Google Userinfo API)
    - Auto-Registration & Account Linking: ตรวจสอบผู้ใช้จาก `googleId` หรือ `email` หากเป็นผู้ใช้ใหม่จะทำการลงทะเบียนและออกบัญชีให้อัตโนมัติด้วย Random Password และ Email Verified พร้อมออก DONIX JWT ทันที
    - Client GIS SDK: เชื่อมต่อด้วย `window.google.accounts.oauth2.initTokenClient` (Popup Flow) พร้อมรองรับ fallback สู่ One Tap (`id.initialize`) และโหมด Demo สำหรับ Local Development เมื่อยังไม่ได้กำหนด `REACT_APP_GOOGLE_CLIENT_ID`
    - Security & Consent: ในหน้า `Register` มีการตรวจสอบเงื่อนไขข้อตกลงการใช้งาน (`termsAccepted`) ก่อนเรียกหน้าต่าง Google Popup
  - **Social Auth & Donate Page Link Clean-up**:
    - ลบปุ่มล็อกอิน YouTube และ Twitch ที่ไม่ได้ใช้งานออกจากหน้า Login และ Register เพื่อความกระชับและตรงตามระบบจริง
    - ปรับปรุง `DonatePageLink` ให้ใช้โดเมนปัจจุบันแบบไดนามิก (`window.location.origin/{username}`) แทนการ Hardcode `donix.app` พร้อมลบปุ่มไอคอนแชร์โซเชียลมีเดียที่ไม่จำเป็นออก
  - **SonarCloud & CI Performance Optimization**:
    - กำหนด `sonar.javascript.node.maxspace=4096` แก้ไขปัญหา SonarCloud Scanner หยุดชะงักที่ 57%
    - ละเว้นการวิเคราะห์ไฟล์ Binary OCR `*.traineddata`, `package-lock.json`, และรูปภาพ Static Assets
  - ครอบคลุมชุดทดสอบ Jest ทั้งหมด (Server 10 Suites 205 Tests Coverage > 97%, Client 28 Suites 292 Tests รวม **38 Suites, 497 Tests ผ่าน 100%**) และผ่าน SonarCloud Quality Gate Coverage on New Code ≥ 80%

- **Phase 10: Mission Donate Integration, Locked Tag System, Multi-layer Submission Guard & Idempotency Engine (เสร็จสมบูรณ์ ✅)**
  - **Mission Donate Integration & Interactive Selection**:
    - ดึงการตั้งค่าภารกิจจาก `/widget` มาแสดงผลเป็นการ์ดภารกิจแบบ Interactive (`DonorMissionList`) บนหน้า `DonorPage` (`/:username`)
    - เมื่อผู้สนับสนุนคลิกเลือกภารกิจ ระบบจะตั้งค่ายอดเงินตามราคาภารกิจ (`mission.price`) โดยอัตโนมัติ
  - **Locked Mission Tag & Amount Guard**:
    - ล็อคแท็กภารกิจเป็นป้ายกำกับถาวร `[ 🔒 ภารกิจ: {name} ]` เหนือกล่องข้อความ โดยผู้สนับสนุนไม่สามารถแก้ไขหรือลบออกได้
    - ล็อคช่องกรอกจำนวนเงินใน PromptPay ทันที (Locked Amount Input: `readOnly`, `cursor-not-allowed`, ป้าย `[ 🔒 ล็อคตามภารกิจ ]`, ไอคอนแม่กุญแจ) บล็อคการพิมพ์และการกดปุ่มลูกศร ป้องกันการแก้ไขยอดเงินผิดไปจากราคาภารกิจ
    - แสดงป้ายกำกับภารกิจครบทั้ง 3 ช่องทาง (PromptPay, ธนาคาร, TrueMoney) พร้อมปุ่มยกเลิกการเลือกภารกิจ
    - การันตีแนบ `[ภารกิจ: {name}]` ส่งต่อไปยัง OBS Alert เมื่อชำระเงิน
  - **Multi-layer Submission Guard & Double-click Lock**:
    - ติดตั้ง `useRef` Submission Lock (`isSubmittingRef`) ทั้งในระดับหน้า `DonorPage` และฟอร์มย่อยทุกช่องทาง (`DonorPromptPayForm`, `DonorBankForm`, `DonorTrueMoneyForm`) ป้องกันการกดเบิ้ลในระดับ Memory ทันที
    - เพิ่ม CSS `pointer-events-none` และสถานะ `disabled` บนปุ่มยืนยันการชำระเงินทันทีที่เริ่มประมวลผล
  - **15-Second Backend Idempotency Window**:
    - ใน `donationController.js` เพิ่มการตรวจสอบหากพบ `transRef` ซ้ำที่สร้างขึ้นภายใน 15 วินาทีสำหรับสตรีมเมอร์คนเดิม จะตอบกลับด้วยสถานะ 200 OK พร้อมข้อมูลเดิมทันที โดยไม่บันทึกซ้ำและไม่ยิง Socket.IO Alert ซ้ำ
  - **Donor Page Decoration & Profanity Filtering**:
    - รองรับการแสดงผลภาพหน้าปก (`coverImage`) และภาพพื้นหลัง (`backgroundImage`) พร้อม Dark Overlay
    - ขยายระบบตัวกรองคำหยาบ (Profanity Filter) ให้ครอบคลุมทั้งชื่อผู้สนับสนุน (`donorName`) และข้อความ (`message`)
  - ครอบคลุมชุดทดสอบ Jest ทั้งหมด (Server 10 Suites 209 Tests Coverage > 97%, Client 28 Suites 314 Tests รวม **38 Suites, 523 Tests ผ่าน 100%**) และผ่าน SonarCloud Quality Gate Coverage on New Code ≥ 80% (Clean Code, 0 Code Smells)

---

## 12. ข้อมูลอ้างอิงสำหรับจัดทำเล่มรายงานโครงงานโปรเจกต์จบ (Final Project Report Guide)

หมวดนี้จัดทำขึ้นเป็นพิเศษเพื่อเป็นคลังข้อมูลทางเทคนิคสำหรับนำไปเขียนและอ้างอิงใน **เล่มรายงานโครงงานโปรเจกต์จบ (Senior Project Report)** ครอบคลุมตั้งแต่บทที่ 1 ถึงบทที่ 5 โดยจำแนกขอบเขตงานเฉพาะของนิสิต (โครงงานเดี่ยว: นายมนต์ธร กอเจริญทรัพย์ 66160259) ไว้อย่างชัดเจนเพื่อป้องกันการนำขอบเขตงานของเพื่อนร่วมโครงงานเดิมมาปะปน

```
โครงสร้างเล่มรายงานโครงงาน:
├── บทที่ 1: บทนำและขอบเขตโครงงาน (Introduction & Individual Scope)
├── บทที่ 2: ทฤษฎีและเทคโนโลยีที่เกี่ยวข้อง (Literature Review & Underlying Technologies)
├── บทที่ 3: การวิเคราะห์และออกแบบระบบ (System Analysis & System Design)
├── บทที่ 4: การพัฒนาระบบและการทดสอบ (Implementation & Testing)
└── บทที่ 5: สรุปผลการดำเนินงาน ปัญหา อุปสรรค และข้อเสนอแนะ (Conclusion & Future Work)
```

---

### 12.1 สรุปเนื้อหาสำหรับ บทที่ 1: บทนำและขอบเขตโครงงาน (Introduction & Individual Scope)

เนื้อหาในส่วนนี้จัดทำขึ้นโดยอ้างอิงจากแบบขออนุมัติโครงงานเดี่ยว (`66160259-แบบรับรองความก้าวหน้าโครงงาน.pdf`) และเอกสารโครงงานบทที่ 1 (`66160259-บทที่1.docx`) เพื่อให้นิสิตนำไปเปรียบเทียบ ตรวจสอบ และอ้างอิงได้อย่างถูกต้องตรงตามเนื้องานจริง:

#### 1) ความเป็นมาและความสำคัญของโครงงาน (Background & Rationale)
- **สภาพการณ์ปัจจุบัน**: การถ่ายทอดสด (Live Streaming) ผ่านแพลตฟอร์มออนไลน์ เช่น YouTube, Twitch, Facebook Gaming, และ TikTok ได้รับความนิยมอย่างแพร่หลาย การสนับสนุนทางการเงิน (Donation) จากผู้ชมจึงเป็นหัวใจหลักในการสร้างรายได้และเสริมสร้างปฏิสัมพันธ์ระหว่างสตรีมเมอร์กับผู้ชม
- **ปัญหาและข้อจำกัดของระบบเดิม**:
  1. **ข้อจำกัดด้านช่องทางการเงินในไทย**: แพลตฟอร์มต่างประเทศมักรองรับเฉพาะบัตรเครดิตหรือ PayPal ซึ่งมีค่าธรรมเนียมสูง (3% - 10%) และไม่สอดคล้องกับพฤติกรรมคนไทยที่นิยมใช้ Mobile Banking และ PromptPay
  2. **ปัญหาการฉ้อโกงและสลิปซ้ำ (Slip Fraud)**: การให้ผู้ชมแนบสลิปโอนเงินมักพบปัญหานำสลิปเก่ามาใช้ซ้ำ (Reuse Slip) หรือแก้ไขรูปภาพสลิป ซึ่งสตรีมเมอร์กำลังถ่ายทอดสดอยู่ไม่สามารถสลับหน้าจอไปตรวจยอดเงินในแอปธนาคารได้ทันท่วงที
  3. **การขาดความยืดหยุ่นในการปรับแต่งวิดเจ็ต (Overlay Widget)**: ขาดระบบการตั้งค่าเสียงสังเคราะห์ (TTS), กรองคำหยาบเฉพาะกลุ่ม, หรือการตั้งเป้าหมาย (Goal) ที่คำนวณยอดเงินจริงอัตโนมัติ ทำให้จอแสดงผลในโปรแกรมถ่ายทอดสด (OBS Studio) ขาดความน่าเชื่อถือ
- **แนวคิดการแก้ปัญหา (DONIX Platform)**: พัฒนาระบบเว็บแอปพลิเคชันรับบริจาคที่รวมศูนย์การทำงาน รองรับช่องทางชำระเงินไทย (PromptPay QR, Bank Transfer, TrueMoney), บูรณาการเครื่องมือตรวจสอบสลิปอัตโนมัติภายในระบบ (Zero-Cost In-House QR & OCR Verification Engine) ป้องกันสลิปซ้ำ 100%, แสดงผลวิดเจ็ตแจ้งเตือนแบบเรียลไทม์ (Real-time Overlays) ผ่าน OBS Browser Source ด้วย WebSocket, และมีแดชบอร์ดสรุปสถิติหลังบ้านที่ปลอดภัย

#### 2) วัตถุประสงค์ของโครงงาน (Project Objectives)
1. เพื่อพัฒนาระบบรับบริจาคผ่านเว็บแอปพลิเคชันสำหรับสตรีมเมอร์ที่รองรับช่องทางชำระเงินในประเทศไทย ได้แก่ PromptPay QR Code, บัญชีธนาคาร (Bank Transfer) และ TrueMoney Wallet
2. เพื่อพัฒนาระบบตรวจสอบสลิปการโอนเงินอัตโนมัติภายในระบบ (In-House Engine) ด้วยเทคโนโลยี QR Parser และ OCR เพื่อลดภาระการตรวจสอบของสตรีมเมอร์และป้องกันการใช้สลิปซ้ำโดยไม่มีค่าใช้จ่าย API รายครั้ง
3. เพื่อพัฒนาระบบวิดเจ็ต (Real-time Widgets) สำหรับแสดงผลการบริจาคแบบเรียลไทม์ผ่าน Browser Source บนโปรแกรม OBS Studio และซอฟต์แวร์สตรีมมิ่ง
4. เพื่อเพิ่มปฏิสัมพันธ์แบบโต้ตอบระหว่างสตรีมเมอร์และผู้บริจาคผ่านฟังก์ชัน Mission Donate, Donate Goal (คำนวณยอดสะสมจริงอัตโนมัติ), และ Leaderboard
5. เพื่อพัฒนาระบบบริหารจัดการหลังบ้าน (Backoffice Dashboard) สำหรับสรุปประวัติและวิเคราะห์ข้อมูลยอดบริจาคด้วย MongoDB Aggregation

#### 3) ขอบเขตของโครงงานเฉพาะของนิสิต (Individual Scope of Project)
*(ระบุเฉพาะงานที่นิสิต 66160259 เป็นผู้รับผิดชอบและพัฒนาจริง 100%)*

##### 3.1 ขอบเขตด้านผู้ใช้งาน (User Roles)
1. **สตรีมเมอร์ (Streamer)**:
   - สมัครสมาชิกและเข้าสู่ระบบด้วย Email/Password หรือ Google OAuth 2.0 (Google Identity Services: GIS)
   - จัดการข้อมูลโปรไฟล์ บัญชีผู้ใช้ และตั้งค่าช่องทางรับเงิน (PromptPay, Bank, TrueMoney)
   - ตกแต่งหน้ารับเงินส่วนบุคคล (`window.location.origin/{username}`), ข้อความต้อนรับ/ขอบคุณ, ตัวกรองคำหยาบ, และลิงก์โซเชียลมีเดีย
   - ปรับแต่งและคัดลอก URL วิดเจ็ต (Donate Alert, Donate Goal, Leaderboard, Mission Donate) ไปใช้งานบน OBS Browser Source พร้อมระบบ Live Config Sync
   - ดูรายงานและกราฟสถิติยอดบริจาคในหน้า Dashboard
   - ตรวจสอบประวัติการรับเงิน ดูรูปสลิปขยายใหญ่ (Slip Modal) และกดอนุมัติ/ปฏิเสธรายการด้วยตนเอง (Manual Approval)
2. **ผู้บริจาค (Donor)**:
   - เข้าถึงหน้ารับเงินของสตรีมเมอร์ได้ตลอดเวลาโดยไม่ต้องสมัครสมาชิก
   - กรอกชื่อผู้สนับสนุน, จำนวนเงิน, และข้อความส่งถึงสตรีมเมอร์
   - เลือกทำภารกิจโดเนท (Mission Donate) โดยใช้ราคาภารกิจที่กำหนด
   - ชำระเงินผ่าน PromptPay QR Code (คำนวณยอดเงินไดนามิก), โอนผ่านเลขบัญชีธนาคาร (Zero-Touch), หรือ TrueMoney Wallet
   - แนบสลิปโอนเงินเข้าสู่ระบบเพื่อทำการตรวจสอบความถูกต้องอัตโนมัติ
3. **ผู้ดูแลระบบ (Administrator)**:
   - ดูแลความปลอดภัยของระบบ API ด้วย JWT Session และ Rate Limiting
   - ควบคุมการทำงานของระบบประมวลผลและการสื่อสารแบบเรียลไทม์ผ่าน Socket.IO

##### 3.2 ขอบเขตด้านฟังก์ชันการทำงานของระบบ (Functional Modules)
1. **ระบบยืนยันตัวตนและความปลอดภัย (Authentication & Security)**:
   - การลงทะเบียนและเข้าสู่ระบบด้วย Email/Password พร้อมตรวจสอบความปลอดภัยรหัสผ่าน 5 ข้อ (Password Checklist)
   - การเชื่อมต่อ Google OAuth 2.0 จริง (GIS Popup Flow) พร้อมระบบ Auto-Registration สำหรับผู้ใช้ใหม่ และ Account Linking สำหรับผู้ใช้เดิม
   - การจัดการ Session ผ่าน JSON Web Token (JWT) พร้อม NoSQL Injection Protection ในทุก API Endpoint
   - การป้องกัน Brute-force และ DDoS ด้วย `express-rate-limit`
2. **ระบบรับเงินและการชำระเงิน (Donation & Thai Payment Gateway)**:
   - ระบบคำนวณและสร้าง PromptPay QR Code ตามมาตรฐาน EMVCo อัตโนมัติตามยอดเงิน
   - ระบบรับเงินผ่านบัญชีธนาคารแบบ Clean UX แสดงเลขบัญชีและยอดขั้นต่ำชัดเจน
   - รองรับ TrueMoney Wallet (Gift Link / ซองของขวัญ)
   - รองรับการตั้งค่ายอดบริจาคขั้นต่ำ (`minAmount`) และการจำกัดความยาวข้อความ
3. **ระบบตรวจสอบสลิปภายในระบบอัตโนมัติ (Zero-Cost QR & OCR Slip Engine)**:
   - สแกนและถอดรหัส PromptPay QR Code และ Bank Mini QR (ITMX) เพื่อดึงรหัสอ้างอิงธุรกรรม (`transRef`) และจำนวนเงิน (`amount`)
   - สกัดตัวเลขจำนวนเงินจากรูปภาพสลิปด้วย OCR (Tesseract.js) ในกรณีที่สลิปไม่มี Tag 54
   - ตรวจสอบชื่อผู้รับเงินในสลิปตรงกับชื่อบัญชีของสตรีมเมอร์ (`isRecipientNameMatched`) พร้อมตัดคำนำหน้าชื่อไทยและรองรับการย่อนามสกุล
   - ตรวจสอบเลขบัญชี 4 หลักสุดท้าย (`isAccountNumberMatched`)
   - ระบบป้องกันสลิปซ้ำ 100% ด้วย Sparse Unique Index บนฟิลด์ `transRef` ในฐานข้อมูล MongoDB
   - ระบบ Auto-Approve อนุมัติและยิงแจ้งเตือนทันทีเมื่อสลิปผ่านเกณฑ์ พร้อมระบบสำรอง Manual Approval กรณีภาพไม่ชัดเจน
4. **ระบบวิดเจ็ตแสดงผลเรียลไทม์สำหรับโปรแกรมสตรีมมิ่ง (OBS Real-time Widgets)**:
   - ระบบสร้าง Browser Source URL พร้อม Token เฉพาะบุคคลเพื่อความปลอดภัย
   - **Donate Alert (`/overlay/alert/:token`)**: แสดงการแจ้งเตือนสด (ชื่อ, ยอดเงิน, ข้อความ, ภาพ/GIF, เสียงสังเคราะห์ Web Audio API Synth, เสียงอ่านข้อความภาษาไทย Thai TTS, และระบบจัดคิว FIFO Cooldown 400ms)
   - **Donate Goal (`/overlay/goal/:token`)**: แถบความคืบหน้าเรืองแสง คำนวณยอดเงินสะสมจริงอัตโนมัติจากฐานข้อมูล (Auto-calculated Goal)
   - **Leaderboard (`/overlay/leaderboard/:token`)**: อันดับผู้สนับสนุนสูงสุด 1–20 อันดับ พร้อมจัดอันดับใหม่แบบเรียลไทม์
   - **Mission Donate**: จัดการรายการภารกิจโดเนทสูงสุด 12 ภารกิจสำหรับแสดงบนหน้าบริจาค
   - ระบบ **Live Config Sync**: ปรับแต่งวิดเจ็ตในหน้าเว็บแล้วส่งสัญญาณ Socket.IO อัปเดตไปยังหน้าจอ OBS Studio ทันทีโดยไม่ต้องโหลดใหม่
   - ระบบ **Auto-reconnection**: กู้คืนการเชื่อมต่อห้องสตรีมเมอร์อัตโนมัติเมื่อเครือข่ายหลุด
5. **ระบบกระดานสรุปผลและประวัติการเงิน (Dashboard Analytics & History Backoffice)**:
   - แสดงสถิติยอดเงินรวม, จำนวนครั้งที่โดเนท, รายการรอดำเนินการ
   - กราฟสถิติยอดบริจาครายสัปดาห์และรายเดือนด้วย Recharts จาก MongoDB Aggregation Pipeline
   - ตารางประวัติการรับเงิน (`DonationHistoryTable`) พร้อมฟิลเตอร์สถานะ (`completed`, `pending`, `rejected`), ระบบค้นหา, ระบบแบ่งหน้า (Pagination), และ Slip Modal ตรวจสอบสลิปขยายใหญ่

##### 3.3 ขอบเขตด้านการจัดการข้อผิดพลาด (Error Handling)
- ระบบ Central Error Handler ปิดบัง Error ฐานข้อมูลภายใน และส่งข้อความภาษาไทยที่เข้าใจง่ายกลับไปยังผู้ใช้
- หาก PromptPay QR Code สร้างไม่สำเร็จ ระบบจะแจ้งเตือนและแนะนำให้เปลี่ยนไปใช้การโอนผ่านบัญชีธนาคาร
- หากรูปสลิปไม่คมชัดหรือไม่สามารถอ่านยอดเงินได้ ระบบจะบันทึกเป็น `pending` และแจ้งเตือนให้สตรีมเมอร์ตรวจสอบผ่านระบบ Manual Approval
- หาก WebSocket หลุด ระบบ Client จะพยายามเชื่อมต่อใหม่และดึงห้องสตรีมเมอร์กลับคืนอัตโนมัติ (Multi-room Rejoining)

---

#### 4) ตารางจำแนกขอบเขตงานเฉพาะของนิสิต เทียบกับ ส่วนงานอื่นที่ตัดออก (Scope Boundaries & Exclusions)
*(หัวข้อสำคัญสำหรับตรวจทาน: เพื่อป้องกันการนำขอบเขตงานของเพื่อนร่วมโครงงานเดิมมาเขียนในรายงาน)*

| รายการฟังก์ชัน / งาน | ขอบเขตของผู้พัฒนา (66160259 - มนต์ธร) | สถานะในโครงงานเดี่ยว | หมายเหตุ / ขอบเขตเดิมที่ไม่นำมารวม |
| :--- | :---: | :---: | :--- |
| **ระบบรับบริจาคและการเงินไทย** | ✅ อยู่ในขอบเขต (100%) | พัฒนาสมบูรณ์ | PromptPay Dynamic QR, Bank Transfer, TrueMoney |
| **ระบบตรวจสอบสลิป Zero-Cost (QR + OCR)** | ✅ อยู่ในขอบเขต (100%) | พัฒนาสมบูรณ์ | jsQR + Jimp + Tesseract.js, Name/Account Match, Duplicate Guard |
| **ระบบ OBS Overlays & WebSocket** | ✅ อยู่ในขอบเขต (100%) | พัฒนาสมบูรณ์ | Alert (TTS/Synth), Goal (Auto Sum), Leaderboard, Live Sync |
| **ระบบ Dashboard & History Backoffice** | ✅ อยู่ในขอบเขต (100%) | พัฒนาสมบูรณ์ | Recharts, Aggregation Stats, Slip Modal Manual Approval |
| **ระบบ Auth & Google OAuth 2.0 (GIS)** | ✅ อยู่ในขอบเขต (100%) | พัฒนาสมบูรณ์ | Email/Pass + Google GIS Popup, Auto-Register, Link Account |
| **ระบบ AI Trend Analytics / Machine Learning** | ❌ **ไม่อยู่ในขอบเขต (ตัดออก)** | ไม่รวมในเล่มนี้ | *(เป็นส่วนแนวคิด AI พยากรณ์แนวโน้มเปอร์เซ็นต์ของเพื่อนร่วมกลุ่มเดิม ไม่นำมาเขียน)* |
| **ระบบ Anti-Spam Blacklist Bot ข้ามแพลตฟอร์ม** | ❌ **ไม่อยู่ในขอบเขต (ตัดออก)** | ไม่รวมในเล่มนี้ | *(ระบบเดิมใช้ Smart Filter คำหยาบและ Manual Blacklist ภายในระบบ ไม่ได้ใช้ Bot ตรวจจับสแปม 3 ครั้งอัตโนมัติของเพื่อน)* |
| **ระบบเชื่อมต่อ API ตรงของ Twitch/YouTube Chat Bot** | ❌ **ไม่อยู่ในขอบเขต (ตัดออก)** | ไม่รวมในเล่มนี้ | *(ระบบมุ่งเน้นการเชื่อมต่อผ่าน OBS Browser Source มาตรฐาน ซึ่งครอบคลุมทุกแพลตฟอร์มสตรีมมิ่ง)* |

---

#### 5) เครื่องมือและเทคโนโลยีที่ใช้ในการพัฒนา (Development Environment & Tools)
- **เครื่องมือด้านฮาร์ดแวร์ (Hardware)**:
  - คอมพิวเตอร์สำหรับการพัฒนา: หน่วยประมวลผล Intel Core i5 (11th Gen / Multi-core), หน่วยความจำ RAM 16 GB, พื้นที่จัดเก็บข้อมูลแบบ SSD
- **เครื่องมือด้านซอฟต์แวร์และการพัฒนา (Development Tools)**:
  - โปรแกรมแก้ไขโค้ด: Visual Studio Code
  - ระบบควบคุมเวอร์ชัน: Git & GitHub Monorepo
  - ระบบทดสอบ API: Postman
  - โปรแกรมตรวจสอบและดีบัก UI: Google Chrome DevTools
  - โปรแกรมกระจายภาพและทดสอบวิดเจ็ต: OBS Studio (Browser Source)
- **เครื่องมือด้านการออกแบบ (Design Tools)**:
  - ออกแบบ UI/UX และ Wireframe: Figma
  - วาดผังระบบ (Use Case Diagram, Sequence Diagram, Workflow): draw.io
  - ออกแบบแบบจำลองฐานข้อมูล (ER Diagram): dbdiagram.io
- **เทคโนโลยีและไลบรารีที่ใช้งาน (Technology Stack)**:
  - **ส่วนหน้าบ้าน (Frontend)**: React 18.3.1, Tailwind CSS v3, React Router v7, Lucide React, Recharts, Socket.IO Client, Web Audio API
  - **ส่วนหลังบ้าน (Backend)**: Node.js 22, Express 5, Socket.IO 4, Mongoose ODM, JSON Web Token (JWT), Bcrypt.js, Helmet, Express Rate Limit
  - **เครื่องมือถอดรหัสสลิป (Engine)**: Jimp (Image Preprocessing), jsQR (Pure JS QR Decoder), Tesseract.js (Worker OCR)
  - **ฐานข้อมูลและคลาวด์ (Database & Cloud Deployment)**: MongoDB Atlas, Vercel (Frontend SPA), Render (Backend Express API)
  - **การทดสอบและ CI/CD (Testing & Quality)**: Jest, Supertest, GitHub Actions, SonarCloud

---

#### 6) ขั้นตอนและแผนการดำเนินงาน (Methodology & Project Timeline)
การดำเนินโครงงานแบ่งออกเป็น 7 ขั้นตอนหลัก:
1. **การวางแผนและศึกษาความเป็นไปได้ (Planning & Feasibility Study)**: สำรวจปัญหาของสตรีมเมอร์ ศึกษากลไก QR Code ธนาคารไทย และเทคโนโลยี WebSockets
2. **การวิเคราะห์ระบบ (System Analysis)**: วิเคราะห์ความต้องการของผู้ใช้ (Streamer, Donor) กำหนด Use Cases และออกแบบสถาปัตยกรรม Monorepo
3. **การออกแบบระบบ (System & Database Design)**: ออกแบบ UI/UX บน Figma, กำหนด Mongoose Schema (5 Models: User, Donation, Widget, Mission, Blacklist) และออกแบบ REST API Endpoints
4. **การพัฒนาระบบ (System Implementation)**: พัฒนาระบบ Client, Server, Socket.IO Events, In-House Slip Verification Engine, และ Google OAuth 2.0 GIS
5. **การทดสอบและปรับปรุงระบบ (Testing & Quality Assurance)**: เขียน Unit/Integration Tests ครอบคลุม 38 Test Suites, 523 Tests ผ่าน 100% (Server 209 Tests, Client 314 Tests), ทดสอบความปลอดภัย NoSQL Guard, ป้องกัน Race Condition ด้วย Idempotency, และปรับแต่ง SonarCloud Quality Gate
6. **การจัดทำเอกสารโครงงาน (Documentation)**: บันทึกเอกสารคู่มือระบบ (`AGENTS.md`) และจัดทำรูปเล่มรายงานโครงงานบทที่ 1 ถึงบทที่ 5
7. **การนำเสนอโครงงาน (Project Defense)**: จัดเตรียมสไลด์และระบบต้นแบบเพื่อนำเสนอต่อคณะกรรมการ

##### ตารางแผนการดำเนินงาน (Gantt Chart - ภาคการศึกษา 2569)
| ขั้นตอนการดำเนินงาน | มี.ค. | เม.ย. | พ.ค. | มิ.ย. | ก.ค. | ส.ค. |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| 1. วางแผนการดำเนินงานและศึกษาความเป็นไปได้ | █ | | | | | |
| 2. ศึกษาภาษา เครื่องมือ และสถาปัตยกรรมระบบ | █ | █ | | | | |
| 3. วิเคราะห์ความต้องการและออกแบบระบบ (Use Case, ER) | | █ | █ | | | |
| 4. ออกแบบส่วนติดต่อผู้ใช้งาน (UI/UX) และ Workflow | | █ | █ | | | |
| 5. พัฒนาระบบหน้าบ้านและหลังบ้าน (Full-Stack Coding) | | | █ | █ | █ | |
| 6. พัฒนาระบบตรวจสลิป QR/OCR และ Real-time Widgets | | | | █ | █ | |
| 7. ทดสอบระบบ ปรับแก้ข้อผิดพลาด และทดสอบ CI/CD | | | | | █ | █ |
| 8. จัดทำเอกสารและรายงานโครงงานฉบับสมบูรณ์ | | | █ | █ | █ | █ |
| 9. นำเสนอโครงงานและประเมินผล | | | | | | █ |

---

#### 7) ประโยชน์ที่คาดว่าจะได้รับ (Expected Benefits)
1. **ประโยชน์ต่อผู้ใช้งานและสตรีมเมอร์**:
   - ได้ระบบรับบริจาคที่ตอบโจทย์พฤติกรรมการใช้งานในประเทศไทยอย่างแท้จริง ผ่าน PromptPay QR Code, บัญชีธนาคาร และ TrueMoney
   - ป้องกันการฉ้อโกงและลดภาระการตรวจสอบสลิปด้วยตนเองได้ 100% ด้วยระบบ In-House Slip QR & OCR Verification Engine
   - เพิ่มความน่าสนใจในการถ่ายทอดสดด้วยระบบวิดเจ็ตโต้ตอบแบบทันที (Real-time Overlays) บน OBS Studio ที่คำนวณสถิติสะสมได้แม่นยำ
2. **ประโยชน์ต่อผู้พัฒนา (Student Competency)**:
   - ได้รับความรู้และทักษะการพัฒนาเว็บแอปพลิเคชันแบบเต็มรูปแบบ (Full-Stack Monorepo: React + Node.js + Express + MongoDB)
   - ได้รับประสบการณ์การประยุกต์ใช้เทคโนโลยีการสื่อสารสองทางแบบทันที (Real-time WebSockets ด้วย Socket.IO)
   - ได้รับความรู้เชิงลึกด้านการประมวลผลรูปภาพ (Image Processing) และการวิเคราะห์อักขระ (OCR) แบบ In-House
   - ได้รับทักษะการทดสอบระบบอัตโนมัติ (Automated Testing with Jest/Supertest) และการวางท่อส่งซอฟต์แวร์ CI/CD บน GitHub Actions และ SonarCloud
   - ได้รับทักษะการติดตั้งและเผยแพร่ระบบบนสภาพแวดล้อมคลาวด์จริง (Cloud Deployment บน Render และ Vercel)

---

### 12.2 สรุปเนื้อหาสำหรับ บทที่ 2: ทฤษฎีและเทคโนโลยีที่เกี่ยวข้อง

สามารถนำหัวข้อและรายละเอียดต่อไปนี้ไปเรียบเรียงใน **บทที่ 2** ของเล่มรายงาน:

#### 1) สถาปัตยกรรมซอฟต์แวร์ Monorepo และการแยกส่วน Client-Server
- **Monorepo Architecture**: การรวมโค้ด Frontend และ Backend ไว้ใน Repository เดียวกัน ช่วยให้การควบคุม Version, การจัดการ Script ทดสอบ, และกระบวนการ CI/CD มีความสอดคล้องกัน
- **Single Page Application (SPA)**: การทำงานของ React ที่โหลดหน้าเว็บครั้งเดียว แล้วใช้ Client-side Routing สลับหน้าจออย่างรวดเร็วโดยไม่ต้อง Refresh เบราว์เซอร์

#### 2) เทคโนโลยีฝั่งผู้ใช้งาน (Frontend Technologies)
- **React 18.3.1**: การจัดการ State, Hooks (`useState`, `useEffect`, `useCallback`, `useRef`), Virtual DOM และการประมวลผล Component แบบเชิงฟังก์ชัน (Functional Components)
- **React Router v7**: การจัดการเส้นทาง URL (Routing) ทั้งแบบ Public Route และ Protected Route ที่ตรวจสิทธิ์ผ่าน JWT Token
- **Tailwind CSS v3**: Utility-First CSS Framework สำหรับตกแต่ง UI ในธีม Dark Mode ตามโทนสีของแบรนด์ DONIX (`#090812`, `#7c3aed`, `#fbbf24`)
- **Lucide React**: Vector Icon Library แบบ Lightweight สำหรับแสดงสัญลักษณ์ในหน้าจอ
- **Recharts**: Data Visualization Library บนฐานของ SVG สำหรับแสดงผลกราฟแท่งและกราฟเส้นสถิติยอดโดเนทใน Dashboard
- **Web Audio API**: การสังเคราะห์เสียงแจ้งเตือนแบบ Procedural Audio Presets (ไม่ต้องพึ่งพาไฟล์เสียงขนาดใหญ่) ควบคู่กับ Text-to-Speech (TTS) สังเคราะห์เสียงพูดภาษาไทย

#### 3) เทคโนโลยีฝั่งเซิร์ฟเวอร์ (Backend Technologies)
- **Node.js 22**: JavaScript Runtime สภาพแวดล้อมฝั่งเซิร์ฟเวอร์แบบ Non-blocking I/O และ Event-driven
- **Express 5**: เว็บเฟรมเวิร์กเวอร์ชันล่าสุดที่รองรับ Native Promise-returning handlers ช่วยให้การจัดการ Async Middleware และ Error Handling มีประสิทธิภาพสูง
- **Socket.IO 4**: ไลบรารีการสื่อสารแบบ Real-time Bidirectional ผ่าน WebSocket Protocol รองรับระบบ Rooms สำหรับแยกห้องสตรีมเมอร์แต่ละคน และระบบ Auto-reconnection

#### 4) ระบบฐานข้อมูล (Database System)
- **MongoDB Atlas**: ฐานข้อมูลแบบ NoSQL Document-oriented Database บนระบบ Cloud รองรับการจัดเก็บข้อมูลที่มีโครงสร้างยืดหยุ่นในรูปแบบ JSON/BSON
- **Mongoose ODM**: Object Data Modeling Library สำหรับ Node.js ช่วยกำหนด Schema, Data Validation, Middleware Hooks, และ Compound/Sparse Unique Indexing
- **MongoDB Aggregation Pipeline**: การคำนวณและประมวลผลข้อมูลสถิติที่ซับซ้อน เช่น การหายอดรวมเงินบริจาค, การจัดอันดับ Top Donors, และการสรุปยอดสะสมตามช่วงวัน/เดือน

#### 5) เทคโนโลยีการประมวลผลรูปภาพและการรู้จำอักขระ (Image Processing & OCR)
- **jsQR**: Pure JavaScript Library สำหรับถอดรหัส QR Code จากพิกเซลภาพ รองรับมาตรฐาน ISO/IEC 18004
- **Jimp**: Pure JavaScript Image Processing Library สำหรับอ่านไฟล์รูปภาพ, การแปลงขนาด (Resize), การปรับระดับสีเทา (Greyscale), และการเพิ่มความเปรียบต่าง (Contrast) ก่อนนำไปสแกน QR/OCR
- **Tesseract.js**: พอร์ตของ Tesseract OCR Engine บน WebAssembly ช่วยให้รันการรู้จำข้อความภาษาไทยและอังกฤษ (`tha+eng`) ได้โดยตรงบน Node.js โดยไม่ต้องติดตั้ง Binary ภายนอกระบบ
- **มาตรฐานสลิปธนาคารไทย (EMVCo & National ITMX Standard)**: รูปแบบ Tag-Length-Value (TLV) เช่น Tag 00 (Format), Tag 30/01 (Bank Code & TransRef), Tag 54 (Amount)

#### 6) ความมั่นคงปลอดภัยของระบบเว็บ (Web Application Security)
- **JSON Web Token (JWT)**: การยืนยันตัวตนแบบ Stateless โดยส่ง Signed Token ผ่าน HTTP Header `Authorization: Bearer <token>`
- **NoSQL Injection Prevention**: การป้องกันการแทรกคำสั่งแปลกปลอมใน Mongoose ผ่านการตรวจสอบชนิดข้อมูล (`typeof`), การตัดสาย Taint ด้วย `String()`, และการครอบเงื่อนไขด้วย `$eq` Operator
- **Helmet**: Middleware กำหนดค่า HTTP Security Headers (Content-Security-Policy, X-Frame-Options, X-Content-Type-Options)
- **Rate Limiting (`express-rate-limit`)**: การจำกัดจำนวนคำขอต่อ IP Address เพื่อป้องกันการโจมตีแบบ Brute-force บน Login/Register

#### 7) การทดสอบซอฟต์แวร์และการบูรณาการอย่างต่อเนื่อง (Software Testing & CI/CD)
- **Jest**: JavaScript Testing Framework สำหรับทำ Unit Test และ Integration Test
- **Supertest**: ไลบรารีสำหรับทดสอบ HTTP Endpoints ของ Express Application โดยไม่ต้องเปิดพอร์ตจริง
- **GitHub Actions**: แพลตฟอร์ม CI/CD แบบ Automated Pipeline ตรวจสอบโค้ด, รันชุดทดสอบทั้ง Client และ Server, และตรวจสอบ Production Build
- **SonarCloud**: เครื่องมือวิเคราะห์คุณภาพโค้ดแบบ Static Code Analysis ตรวจสอบ Security Hotspots, Bugs, Code Smells, Code Duplication, และ Code Coverage

#### 8) การจัดการคำขอซ้ำและความสอดคล้องของข้อมูล (Idempotency & Concurrency Control)
- **API Idempotency Pattern**: การออกแบบให้คำขอที่ส่งซ้ำจากฝั่งผู้ใช้ (เช่น การกดปุ่มซ้ำ Double-click หรือเครือข่ายส่งแพ็กเกจซ้ำ) ได้รับผลลัพธ์ที่ถูกต้องโดยไม่เกิดการประมวลผลธุรกรรมซ้ำซ้อน ผ่านระบบหน้าต่างเวลาตรวจสอบ (15-Second Deduplication Window)
- **Client-Side Concurrency Guard**: การใช้ Mutable Reference (`useRef`) ใน React เพื่อล็อคสถานะการประมวลผลทันทีในระดับ Memory ควบคู่กับ CSS Pointer Events Suppression เพื่อป้องกัน Race Condition ก่อนที่ React State จะ Re-render

---

### 12.3 สรุปเนื้อหาสำหรับ บทที่ 3: การวิเคราะห์และออกแบบระบบ

สามารถนำแบบจำลองและข้อกำหนดต่อไปนี้ไปใช้ใน **บทที่ 3** ของเล่มรายงาน:

#### 1) ความต้องการของระบบ (System Requirements)

##### ความต้องการเชิงหน้าที่ (Functional Requirements: FR)
- **FR-01 (Authentication)**: ผู้ใช้สามารถลงทะเบียน, เข้าสู่ระบบด้วย Email/Password พร้อมตรวจสอบความปลอดภัยรหัสผ่าน 5 ข้อ หรือเข้าสู่ระบบด้วย Google Account
- **FR-02 (Profile Management)**: สตรีมเมอร์สามารถจัดการข้อมูลส่วนตัว, รูปภาพโปรไฟล์ (Avatar), ข้อมูลติดต่อ และเชื่อมต่อโซเชียลมีเดีย 6 แพลตฟอร์ม
- **FR-03 (Payment Setup)**: สตรีมเมอร์สามารถเปิด/ปิด และตั้งค่าช่องทางรับเงิน 3 รูปแบบ (PromptPay 7 ประเภท, บัญชีธนาคาร 7 แห่ง, TrueMoney)
- **FR-04 (Donation Page Decoration)**: สตรีมเมอร์สามารถตกแต่งหน้าโดเนท, กำหนดยอดบริจาคขั้นต่ำ, ข้อความต้อนรับ/ขอบคุณ, ตัวกรองคำหยาบ, รูปภาพหน้าปก และรูปภาพพื้นหลัง
- **FR-05 (Public Donor Page)**: ผู้สนับสนุนสามารถเข้าหน้ารับเงินของสตรีมเมอร์ (`/:username`) ได้ตลอด 24 ชั่วโมง โดยไม่ต้องรอสตรีมเมอร์เปิดไลฟ์
- **FR-06 (Zero-Touch Bank Transfer & Slip Upload)**: ผู้สนับสนุนสามารถโอนเงินและแนบสลิป โดยระบบจะอ่านยอดเงินและตรวจสอบชื่อผู้รับเงินอัตโนมัติ
- **FR-07 (In-house Slip Verification Engine)**: ระบบตรวจสอบความถูกต้องของสลิป ป้องกันสลิปซ้ำผ่านรหัสอ้างอิงธุรกรรม (`transRef`), ตรวจสอบยอดเงิน และอนุมัติอัตโนมัติ
- **FR-08 (Real-time OBS Overlays)**: แสดงผลวิดเจ็ต 3 รูปแบบบน OBS Studio (Alert, Goal, Leaderboard) ด้วยพื้นหลังโปร่งใสและอัปเดตข้อมูลแบบเรียลไทม์
- **FR-09 (Live Widget Config Sync)**: เมื่อสตรีมเมอร์แก้ไขการตั้งค่าวิดเจ็ตบนเว็บ ระบบจะส่งสัญญาณอัปเดต OBS Browser Source อัตโนมัติทันที
- **FR-10 (Dashboard & History Analytics)**: สตรีมเมอร์สามารถดูสถิติภาพรวม, กราฟแนวโน้มยอดเงิน, ตรวจสอบประวัติสลิป และอนุมัติ/ปฏิเสธรายการได้
- **FR-11 (Double-Click & Idempotency Guard)**: ป้องกันการส่งคำขอซ้ำซ้อนในระดับ Client ผ่าน `useRef` Submission Locks และระดับ Backend API ผ่าน 15-second Idempotency Deduplication Window ตอบกลับสถานะ 200 OK โดยไม่สร้างรายการซ้ำและไม่ยิง Socket.IO ซ้ำ
- **FR-12 (Mission Donate Integration & Locked Tag/Amount)**: ระบบแสดงการ์ดภารกิจในหน้า Donor Page (`/:username`) เมื่อเลือกภารกิจจะตั้งยอดเงินอัตโนมัติ ล็อคแท็กภารกิจ `[ 🔒 ภารกิจ: {name} ]` ในกล่องข้อความ และล็อคช่องกรอกจำนวนเงิน (readOnly พร้อมไอคอนกุญแจ) ไม่ให้ผู้บริจาคลบหรือแก้ไขยอดเงินได้ และการันตีส่งแท็กภารกิจไปยัง Alert บน OBS Studio
- **FR-13 (Donor Page Media Customization)**: สตรีมเมอร์สามารถตกแต่งหน้าโดเนทด้วยรูปภาพหน้าปก (`coverImage`) และรูปภาพพื้นหลัง (`backgroundImage`) พร้อมระบบ Dark Overlay เพื่อให้อ่านข้อความได้อย่างชัดเจน
- **FR-14 (Comprehensive Profanity Filtering)**: ระบบกรองคำหยาบแบบครอบคลุมทั้งชื่อผู้สนับสนุน (`donorName`) และข้อความ (`message`) เพื่อความปลอดภัยของคอนเทนต์ในการถ่ายทอดสด
- **FR-15 (Bank Mission Price Verification & Auto-strip Tag)**: ระบบตรวจสอบราคาภารกิจโอนผ่านธนาคารอัตโนมัติ หากยอดเงินจริงในสลิปน้อยกว่าราคาภารกิจแต่ ≥ ยอดบริจาคขั้นต่ำ ระบบจะตัดแท็กภารกิจออกจากข้อความบน Alert, TTS, และฐานข้อมูลอัตโนมัติเพื่อความโปร่งใส

##### ความต้องการที่ไม่ใช่เชิงหน้าที่ (Non-Functional Requirements: NFR)
- **NFR-01 (Security)**: ระบบต้องป้องกัน NoSQL Injection, XSS, CSRF, Brute-force และเข้ารหัสรหัสผ่านด้วย `bcryptjs`
- **NFR-02 (Performance & Latency)**: การส่งการแจ้งเตือน Real-time ผ่าน Socket.IO ไปยัง OBS Studio ต้องมีความล่าช้า (Latency) ต่ำกว่า 500 มิลลิวินาที
- **NFR-03 (Zero-Cost Operation)**: ระบบตรวจสอบสลิปต้องทำงานได้ด้วย Open-source libraries ภายในเครื่อง โดยไม่มีค่าใช้จ่ายต่อครั้งของ API ภายนอก
- **NFR-04 (High Reliability & Test Coverage)**: ชุดทดสอบของระบบต้องผ่าน 100% ครบทั้ง 38 Test Suites, 523 Tests พร้อม Code Coverage รวมสูงกว่า 97% และมีระบบ Auto-reconnect Socket
- **NFR-05 (Clean Stream UX)**: หน้า OBS Browser Source ต้องไม่มีปุ่มหรือสิ่งกีดขวางใดๆ ปรากฏบนจอถ่ายทอดสด

#### 2) แผนภาพสถาปัตยกรรมระบบ (System Architecture)

```mermaid
flowchart TD
    subgraph ClientLayer["Frontend Layer (React 18 SPA - Vercel)"]
        UI_User["Donor / Public View<br>(/:username)"]
        UI_Streamer["Streamer Dashboard<br>(/dashboard, /widget, /payment)"]
        UI_OBS["OBS Browser Source Overlays<br>(/overlay/alert, goal, leaderboard)"]
    end

    subgraph ServerLayer["Backend Layer (Node.js & Express 5 - Render)"]
        API_Gateway["API Gateway & Middlewares<br>(Helmet, RateLimiter, Protect JWT, ErrorHandler)"]
        Ctrl_Auth["Auth Controller"]
        Ctrl_Donation["Donation Controller"]
        Ctrl_User["User Controller"]
        Ctrl_Widget["Widget Controller"]
        Ctrl_Public["Public Controller"]
        SocketServer["Socket.IO Real-time Server<br>(Rooms: streamer_id, streamer_username)"]
        
        subgraph OCREngine["Zero-Cost Verification Engine"]
            JimpProc["Jimp Preprocessing<br>(Resize, Greyscale, Contrast)"]
            JsQRScan["jsQR EMVCo / Mini QR Parser"]
            TesseractOCR["Tesseract.js OCR Engine<br>(tha+eng)"]
            SlipParser["Slip Parser Logic<br>(Amount, Recipient, Account Match)"]
        end
    end

    subgraph DataLayer["Database Layer (MongoDB Atlas)"]
        DB_User[("Users Collection")]
        DB_Donation[("Donations Collection<br>Index: transRef (Sparse Unique)")]
        DB_Widget[("Widgets Collection")]
    end

    UI_User -->|HTTP POST /api/donations| API_Gateway
    UI_Streamer -->|REST API with JWT| API_Gateway
    UI_OBS -->|HTTP GET /api/public/overlay| API_Gateway
    
    API_Gateway --> Ctrl_Auth & Ctrl_Donation & Ctrl_User & Ctrl_Widget & Ctrl_Public
    Ctrl_Donation --> OCREngine
    OCREngine --> JimpProc --> JsQRScan --> TesseractOCR --> SlipParser
    
    Ctrl_Auth & Ctrl_User --> DB_User
    Ctrl_Donation --> DB_Donation
    Ctrl_Widget --> DB_Widget
    Ctrl_Public --> DB_User & DB_Donation & DB_Widget
    
    Ctrl_Donation -.->|Emit donation-alert| SocketServer
    Ctrl_Widget -.->|Emit widget-config-update| SocketServer
    SocketServer ==>|Real-time WebSocket Stream| UI_OBS
```

#### 3) วงจรการทำงานของรายการบริจาค (Donation Lifecycle State Machine)

```mermaid
stateDiagram-v2
    [*] --> FormSubmitted: ผู้สนับสนุนส่งข้อมูลโดเนท (PromptPay / Bank / TrueMoney)
    
    state FormSubmitted {
        [*] --> InputValidation
        InputValidation --> CheckSlip: แนบรูปภาพสลิปโอนเงิน
        InputValidation --> ErrorInput: ข้อมูลไม่ถูกต้อง / ยอดต่ำกว่าขั้นต่ำ
    }
    
    ErrorInput --> [*]: ส่งข้อผิดพลาด 400 ให้ผู้ใช้
    
    state CheckSlip {
        [*] --> DecodeQR: สแกนด้วย jsQR (EMVCo / Mini QR)
        DecodeQR --> ExtractAmount: พบ QR Code
        DecodeQR --> RunOCR: ไม่พบ QR / ไม่มี Tag 54
        RunOCR --> ExtractAmount: สกัดรหัสและยอดเงินด้วย RegEx
        ExtractAmount --> VerifyRecipient: โอนผ่านธนาคาร (Bank)
        VerifyRecipient --> CheckDuplicate: ชื่อผู้รับเงินตรงกับบัญชีสตรีมเมอร์
        VerifyRecipient --> ErrorRecipientMismatch: ชื่อผู้รับเงินไม่ตรง
    }
    
    ErrorRecipientMismatch --> [*]: ส่งข้อผิดพลาด 400 (ชื่อผู้รับไม่ถูกต้อง)
    
    state CheckDuplicate {
        [*] --> QueryTransRef: ค้นหา transRef ใน MongoDB
        QueryTransRef --> DuplicateFound: พบ transRef ซ้ำในฐานข้อมูล
        QueryTransRef --> SlipValid: สลิปไม่ซ้ำและยอดเงินถูกต้อง
        
        DuplicateFound --> CheckIdempotencyWindow: ตรวจสอบหน้าต่างเวลาและสตรีมเมอร์
        CheckIdempotencyWindow --> IdempotentSuccess: สร้างไม่เกิน 15 วิ & สตรีมเมอร์คนเดิม
        CheckIdempotencyWindow --> ErrorDuplicate: เกิน 15 วิ หรือสตรีมเมอร์คนละคน
    }
    
    IdempotentSuccess --> [*]: ตอบกลับ 200 OK เดิม (ไม่ยิง Alert ซ้ำ)
    ErrorDuplicate --> [*]: ส่งข้อผิดพลาด 400 (สลิปนี้ถูกใช้งานไปแล้ว)
    
    state SlipValid {
        [*] --> CheckStreamerSetting
        CheckStreamerSetting --> AutoApproved: สตรีมเมอร์เปิด autoApproveSlip (True)
        CheckStreamerSetting --> ManualReviewPending: สตรีมเมอร์ปิด autoApproveSlip (False)
    }
    
    AutoApproved --> SaveDB_Approved: บันทึกสถานะ approved ลง DB
    ManualReviewPending --> SaveDB_Pending: บันทึกสถานะ pending ลง DB
    
    SaveDB_Approved --> BroadcastOBS: ยิง Socket.IO donation-alert เข้า OBS
    BroadcastOBS --> [*]: แสดงผลบนหน้าจอ OBS แบบเรียลไทม์
    SaveDB_Pending --> WaitStreamerAction: รอสตรีมเมอร์กดอนุมัติในหน้า History
    WaitStreamerAction --> SaveDB_Approved: สตรีมเมอร์กดอนุมัติ
    WaitStreamerAction --> [*]: สตรีมเมอร์กดปฏิเสธ (rejected)
```

#### 4) โครงสร้างฐานข้อมูล (Database Schema Specifications)

##### 1. User Schema (`server/Models/User.js`)
| ฟิลด์ (Field) | ชนิดข้อมูล (Type) | ดัชนี (Index) | คำอธิบาย |
| :--- | :--- | :--- | :--- |
| `username` | String | Unique, Required | ชื่อผู้ใช้สำหรับ URL หน้ารับเงิน (เช่น `/Test3`) |
| `email` | String | Unique, Required | อีเมลสำหรับเข้าสู่ระบบ |
| `password` | String | - | แฮชรหัสผ่าน (เข้ารหัสด้วย bcryptjs 10 rounds) |
| `nickname` | String | - | ชื่อเล่นสำหรับแสดงผล |
| `avatar` | String | - | รูปโปรไฟล์ (Base64 data URI หรือ URL) |
| `isLive` | Boolean | - | สถานะของสตรีมเมอร์ (Default: true) |
| `payment.promptpay` | Object | - | `{ enabled: Boolean, type: String (7 รูปแบบ), number: String }` |
| `payment.bank` | Object | - | `{ enabled: Boolean, bankName: String (7 ธนาคาร), accountNumber: String, accountName: String }` |
| `payment.truemoney`| Object | - | `{ enabled: Boolean, phone: String }` |
| `donationPage` | Object | - | `{ minAmount: Number, autoApproveSlip: Boolean, welcomeMessage: String, thankYouMessage: String, filteredWords: Array, coverImage: String, backgroundImage: String }` |

##### 2. Donation Schema (`server/Models/Donation.js`)
| ฟิลด์ (Field) | ชนิดข้อมูล (Type) | ดัชนี (Index) | คำอธิบาย |
| :--- | :--- | :--- | :--- |
| `streamerId` | ObjectId (Ref: User) | Compound `{ streamerId: 1, createdAt: -1 }` | ไอดีของสตรีมเมอร์ผู้รับเงิน |
| `donorName` | String | - | ชื่อผู้สนับสนุน (Default: 'Anonymous', ผ่านตัวกรองคำหยาบ) |
| `amount` | Number | Required | จำนวนเงินบริจาค (บาท) |
| `message` | String | - | ข้อความถึงสตรีมเมอร์ (รวมแท็ก `[ภารกิจ: {name}]` และผ่านตัวกรองคำหยาบ) |
| `paymentMethod`| String | Enum: `promptpay`, `bank`, `truemoney` | ช่องทางที่ใช้ในการชำระเงิน |
| `status` | String | Enum: `pending`, `approved`, `rejected` | สถานะของรายการบริจาค |
| `slipImage` | String | - | รูปภาพสลิปการโอนเงิน (Base64 data URI) |
| `transRef` | String | **Sparse Unique Index** | รหัสอ้างอิงธุรกรรมจากสลิป (ป้องกันการใช้สลิปซ้ำ) |
| `ocrResult` | Object | - | ผลการตรวจสอบ `{ verified, method, bankName, message }` |
| `createdAt` | Date | Default: `Date.now` | วันเวลาที่สร้างรายการ |

##### 3. Widget Schema (`server/Models/Widget.js`)
| ฟิลด์ (Field) | ชนิดข้อมูล (Type) | ดัชนี (Index) | คำอธิบาย |
| :--- | :--- | :--- | :--- |
| `userId` | ObjectId (Ref: User) | Unique, Required | ไอดีของสตรีมเมอร์เจ้าของการตั้งค่า |
| `token` | String | Unique, Indexed | UUID Token ประจำตัวสำหรับ OBS Browser Source |
| `alert` | Object | - | การตั้งค่าการแจ้งเตือน (เสียง, TTS, ฟอนต์, สี, แอนิเมชั่น, Tiers) |
| `goal` | Object | - | การตั้งค่าเป้าหมาย (ชื่อเป้าหมาย, ยอดเป้าหมาย, ธีมสี, วันที่เริ่ม/สิ้นสุด) |
| `leaderboard` | Object | - | การตั้งค่าบอร์ดผู้นำ (จำนวนอันดับ, การแสดงยอดเงิน, ช่วงเวลา) |
| `mission` | Object | - | การตั้งค่าภารกิจโดเนท `{ enabled: Boolean, title: String, missions: [{ id, name, price, completed }] }` |

#### 5) ตารางข้อกำหนดส่วนต่อประสาน (RESTful API Specification)

| เส้นทาง (Endpoint) | เมธอด | สิทธิ์ (Auth) | หน้าที่การทำงาน |
| :--- | :---: | :---: | :--- |
| `/api/auth/register` | POST | สาธารณะ | สมัครสมาชิกใหม่ ตรวจสอบความปลอดภัยรหัสผ่าน 5 ข้อ |
| `/api/auth/login` | POST | สาธารณะ | เข้าสู่ระบบและส่งกลับ JWT Token และข้อมูลโปรไฟล์ |
| `/api/auth/google` | POST | สาธารณะ | เข้าสู่ระบบ/ลงทะเบียนอัตโนมัติด้วย Google OAuth (GIS) |
| `/api/users/me` | GET / PUT | Bearer JWT | ดึงและอัปเดตข้อมูลส่วนตัว / Nickname / รูปภาพ Avatar |
| `/api/users/payment` | PUT | Bearer JWT | บันทึกการตั้งค่าช่องทางรับเงิน (PromptPay, Bank, TrueMoney) |
| `/api/users/donation-page` | PUT | Bearer JWT | บันทึกการตั้งค่าหน้าโดเนท (ยอดขั้นต่ำ, Auto-Approve OCR, ข้อความ, หน้าปก, พื้นหลัง) |
| `/api/donations` | POST | สาธารณะ | ส่งรายการบริจาค พร้อมถอดรหัสสลิป ตรวจสอบยอด/ชื่อ และ 15s Idempotency ป้องกันส่งซ้ำ |
| `/api/donations` | GET | Bearer JWT | ดึงประวัติรายการบริจาค พร้อมแบ่งหน้าและตัวกรองสถานะ |
| `/api/donations/stats` | GET | Bearer JWT | ดึงข้อมูลสถิติภาพรวม ยอดรวม กราฟ 7D/30D และ Top Donors |
| `/api/donations/:id` | PATCH | Bearer JWT | อนุมัติ (`approved`) หรือปฏิเสธ (`rejected`) รายการโดเนท |
| `/api/widgets/me` | GET / PUT | Bearer JWT | ดึงและบันทึกการตั้งค่าวิดเจ็ต พร้อมยิง Socket ซิงค์ OBS |
| `/api/public/:username` | GET | สาธารณะ | ดึงข้อมูลสำหรับเรนเดอร์หน้า Donor Page ของสตรีมเมอร์ |
| `/api/public/overlay/:type/:token` | GET | สาธารณะ | ดึงการตั้งค่าและยอดสะสมปัจจุบันสำหรับเรนเดอร์ใน OBS Studio |

---

### 12.4 สรุปเนื้อหาสำหรับ บทที่ 4: การพัฒนาระบบและการทดสอบ

สามารถนำผลการพัฒนาและสถิติการทดสอบไปใช้ใน **บทที่ 4** ของเล่มรายงาน:

#### 1) การพัฒนากลไกตรวจสอบสลิปอัตโนมัติ (Zero-Cost Slip Engine)
1. **การถอดรหัส Mini QR & EMVCo**: 
   - ใช้ `jimp` อ่าน Buffer รูปภาพและส่งให้ `jsqr` ค้นหา QR Code
   - หากภาพมีขนาดใหญ่เกิน 800px ระบบจะทำการย่อส่วนลงเหลือ 600px เพื่อเพิ่มความคมชัด
   - รองรับการปรับ Greyscale และ Contrast (+0.2) เพื่อให้สแกนสลิปที่แสงน้อยได้สำเร็จ
2. **การสกัดยอดเงินด้วย OCR Regex (`parseSlipText`)**:
   - หากสลิปไม่มี Tag 54 ใน QR Code (เช่น Mini QR) ระบบจะเรียก `tesseract.js` อ่านข้อความ
   - ใช้ Multi-pattern Regular Expression ในการสกัดตัวเลขทศนิยมสองตำแหน่ง
3. **การตรวจสอบชื่อผู้รับเงินภาษาไทย (`isRecipientNameMatched`)**:
   - ทำความสะอาดข้อความด้วยการลบคำนำหน้าชื่อ: `นาย`, `นางสาว`, `นาง`, `ด.ช.`, `ด.ญ.`, `บจก.`, `หจก.`
   - ตัดวรรคตอนและเครื่องหมายพิเศษออกเพื่อเปรียบเทียบแบบ Substring
   - รองรับกรณีสลิปธนาคารย่อนามสกุลเหลือเพียงอักษรย่อตัวแรก

#### 2) การพัฒนากลไกป้องกัน Race Condition และคำขอซ้ำซ้อน (Multi-layer Submission Guard & Idempotency Engine)
1. **Client-Side Concurrency Lock**:
   - ติดตั้ง `useRef` submission locks (`isSubmittingRef`) ทั้งในระดับหน้า `DonorPage` และฟอร์มย่อย (`DonorPromptPayForm`, `DonorBankForm`, `DonorTrueMoneyForm`) เพื่อล็อคการส่งคำขอทันทีในระดับ Memory Execution ก่อนที่ React State จะ Re-render
   - เพิ่ม CSS `pointer-events-none` และสถานะ `disabled` บนปุ่มยืนยันการชำระเงินทันทีที่เริ่มประมวลผลคำขอแรก ป้องกันไม่ให้เบราว์เซอร์รับ Event การคลิกซ้ำได้
2. **Backend 15-Second Idempotency Window**:
   - ใน `server/controllers/donationController.js` เพิ่มกลไกตรวจสอบหากพบรหัสอ้างอิง `transRef` ซ้ำในฐานข้อมูล ระบบจะตรวจสอบว่ารายการนั้นเป็นของสตรีมเมอร์คนเดียวกันและถูกสร้างขึ้นภายใน 15 วินาทีหรือไม่
   - หากตรงตามเงื่อนไข จะตอบกลับด้วยสถานะ `200 OK` พร้อมข้อมูลรายการบริจาคเดิมทันที โดยไม่บันทึกซ้ำและไม่ยิง Socket.IO `donation-alert` ซ้ำไปยัง OBS Studio ช่วยให้หน้าต่างขอบคุณผู้บริจาคเปิดขึ้นอย่างราบรื่น 100%

#### 3) การพัฒนาระบบภารกิจโดเนทและการล็อคแท็กภารกิจ (Mission Donate Integration & Locked Tag Guard)
1. **Interactive Mission Selection**:
   - เชื่อมโยงข้อมูลภารกิจจากวิดเจ็ตสตรีมเมอร์มาแสดงผลเป็นการ์ดภารกิจแบบโต้ตอบ (`DonorMissionList`) บนหน้าบริจาค (`/:username`)
   - เมื่อผู้สนับสนุนคลิกเลือกภารกิจ ระบบจะตั้งค่ายอดเงินตามราคาภารกิจ (`mission.price`) โดยอัตโนมัติ
2. **Locked Mission Tag Guard**:
   - แสดงป้ายกำกับภารกิจที่ถูกล็อค `[ 🔒 ภารกิจ: {name} ]` เหนือกล่องข้อความ โดยผู้สนับสนุนไม่สามารถลบหรือแก้ไขชื่อภารกิจออกได้
   - การันตีแนบ `[ภารกิจ: {name}]` เข้ากับข้อความบริจาคเสมอ เพื่อให้ Alert บน OBS Studio แสดงชื่อภารกิจอย่างแม่นยำ พร้อมปุ่มยกเลิกการเลือกภารกิจ
3. **Locked Amount Input Guard**:
   - เมื่อเลือกภารกิจ ช่องกรอกจำนวนเงินใน PromptPay จะถูกล็อคทันที (`readOnly`, `cursor-not-allowed`, ป้าย `[ 🔒 ล็อคตามภารกิจ ]`, ไอคอนแม่กุญแจ) บล็อคการพิมพ์และการกดปุ่มลูกศร ป้องกันผู้บริจาคแก้ไขยอดเงินผิดไปจากราคาภารกิจ
   - แสดงป้ายกำกับภารกิจครบทั้ง 3 ช่องทาง (PromptPay, ธนาคาร, TrueMoney) เพื่อความชัดเจน
4. **Bank Mission Price Verification & Auto-strip Tag**:
   - สำหรับช่องทางโอนผ่านธนาคาร (Bank) ระบบจะอ่านยอดเงินจริงจากสลิป หากพบว่าผู้สนับสนุนเลือกภารกิจ แต่ยอดเงินในสลิปน้อยกว่าราคาภารกิจ (แต่ยังคง ≥ ยอดขั้นต่ำที่กำหนด) ระบบจะตัดแท็กภารกิจออกจากข้อความบน Alert, TTS, และประวัติการรับเงินโดยอัตโนมัติ เพื่อป้องกันการอ้างภารกิจด้วยยอดเงินที่ไม่ครบ

#### 4) ผลการทดสอบระบบ (Test Results & Metrics)

##### ตารางสรุปชุดทดสอบ (Test Suites Summary)
| ส่วนงาน (Component) | จำนวน Test Suites | จำนวนการทดสอบ (Tests) | สถานะ | อัตราความสำเร็จ |
| :--- | :---: | :---: | :---: | :---: |
| **Server (Backend API & Services)** | **10 Suites** | **209 Tests** | ✅ ผ่านทั้งหมด | **100%** |
| **Client (Frontend React SPA)** | **28 Suites** | **314 Tests** | ✅ ผ่านทั้งหมด | **100%** |
| **รวมทั้งโปรเจกต์ (Monorepo)** | **38 Suites** | **523 Tests** | ✅ ผ่านทั้งหมด | **100%** |

##### ตารางรายงาน Code Coverage ฝั่ง Server (`npm run test:coverage`)
| หมวดหมู่โค้ด (Directory) | Statements (%) | Branch (%) | Functions (%) | Lines (%) | สถานะ Quality Gate |
| :--- | :---: | :---: | :---: | :---: | :---: |
| `controllers/` | 97.29% | 88.18% | 96.00% | 97.43% | ✅ เกินเกณฑ์มาตรฐาน |
| `middleware/` | 100.00% | 91.66% | 100.00% | 100.00% | ✅ ผ่าน 100% |
| `routes/` | 100.00% | 100.00% | 100.00% | 100.00% | ✅ ผ่าน 100% |
| `services/` | 91.04% | 92.13% | 100.00% | 92.42% | ✅ เกินเกณฑ์มาตรฐาน |
| `utils/` | 97.48% | 80.27% | 100.00% | 97.42% | ✅ เกินเกณฑ์มาตรฐาน |
| **ภาพรวมไฟล์ทั้งหมด (All Files)** | **97.01%** | **86.77%** | **98.14%** | **97.19%** | **✅ ยอดเยี่ยม (> 97%)** |

##### ผลการตรวจสอบคุณภาพและความปลอดภัยด้วย SonarCloud
- **Quality Gate Status**: Failed ในการวิเคราะห์ Pull Request ล่าสุดที่ผู้ใช้แจ้ง (ต้องตรวจสอบใหม่หลัง push การแก้ไข)
- **Security Rating on New Code**: B (เกณฑ์ต้อง A; ยังไม่ได้ยืนยันผลหลังแก้ไข)
- **Reliability Rating**: A (0 Bugs)
- **Maintainability Rating**: มีข้อเสนอแนะด้าน Cognitive Complexity, nested ternary, optional chaining และ regex syntax ที่ต้องตรวจสอบผลสแกนล่าสุด
- **Duplication on New Code**: ≤ 3.0% (ปฏิบัติตามกฎห้ามโค้ดซ้ำซ้อนอย่างเคร่งครัด)
- **Coverage on New Code**: ≥ 80.0% (ทำได้จริง > 88% - 97%)

---

### 12.5 สรุปเนื้อหาสำหรับ บทที่ 5: สรุปผลการดำเนินงาน ปัญหา อุปสรรค และข้อเสนอแนะ

สามารถนำเนื้อหาด้านล่างไปสรุปใน **บทที่ 5** ของเล่มรายงาน:

#### 1) สรุปผลสำเร็จของโครงงาน (Conclusion)
โครงงานระบบรับบริจาคและสนับสนุนสตรีมเมอร์ (DONIX) บรรลุตามวัตถุประสงค์ที่กำหนดไว้ทุกประการ:
1. พัฒนาเว็บแอปพลิเคชันสำหรับสตรีมเมอร์และผู้สนับสนุนได้ครบ 14 หน้า พร้อมหน้า Browser Source Overlays 3 รูปแบบบน OBS Studio
2. พัฒนาระบบตรวจสอบสลิปการโอนเงินอัตโนมัติภายในระบบ (Zero-Cost In-House QR & OCR Engine) สำเร็จโดยไม่มีค่าใช้จ่าย API ต่อรายการ
3. ป้องกันการทุจริตและการใช้สลิปซ้ำได้ 100% ด้วยระบบ Sparse Unique Database Indexing ควบคู่กับ 15-second Idempotency Engine
4. ตรวจสอบชื่อผู้รับเงินในสลิปกับชื่อบัญชีสตรีมเมอร์ได้อย่างถูกต้อง รองรับการตัดคำนำหน้าชื่อไทยและการย่อนามสกุล
5. ซิงค์การแสดงผลบน OBS Studio ได้แบบเรียลไทม์ และมีระบบคำนวณยอดเงินสะสมจริงที่แม่นยำ
6. มีชุดทดสอบระบบอัตโนมัติครอบคลุม 38 Test Suites รวม 523 Tests ผ่าน 100% โดยผล SonarCloud ล่าสุดที่รายงานยังไม่ผ่าน Quality Gate และต้องสแกนยืนยันหลังแก้ไข

#### 2) ตารางเปรียบเทียบคุณสมบัติ (Competitive Advantage Analysis)

| คุณสมบัติ | แพลตฟอร์มรับโดเนททั่วไป | แพลตฟอร์ม DONIX |
| :--- | :--- | :--- |
| **ค่าธรรมเนียมต่อรายการ (Transaction Fee)** | มีการหักเปอร์เซ็นต์ (เช่น 5% - 15%) | **0% (ฟรี ไม่มีหักค่าธรรมเนียม)** |
| **ค่าบริการตรวจสอบสลิป (Slip API Cost)** | มีค่าใช้จ่ายต่อสลิป (เช่น 0.20 - 0.50 บาท/ครั้ง) | **0 บาท (ประมวลผลด้วย In-House OCR ภายในระบบ)** |
| **การตรวจสอบชื่อผู้รับเงิน** | มักให้สตรีมเมอร์ตรวจสอบเองด้วยตาเปล่า | **ตรวจสอบอัตโนมัติด้วย OCR Matching** |
| **การป้องกันการกดส่งสลิปซ้ำ (Double Submit)** | มักขึ้น Error สลิปถูกใช้แล้วสร้างความสับสน | **Idempotent 200 OK + Multi-layer Lock ปลอดภัย 100%** |
| **การอัปเดตการตั้งค่าวิดเจ็ตใน OBS** | สตรีมเมอร์ต้องกด Refresh Browser Source ใน OBS | **Live Sync ทันทีผ่าน Socket.IO โดยไม่ต้องแตะ OBS** |
| **ความถูกต้องของยอด Goal และ Leaderboard** | บางครั้งนับยอดแจ้งเตือนทดสอบรวมเข้าไปด้วย | **คำนวณจากประวัติการบริจาคที่สำเร็จจริงในฐานข้อมูล** |
| **การทดสอบความน่าเชื่อถือ (Code Coverage)** | ไม่เปิดเผยหรือไม่ครอบคลุม | **ทดสอบแบบ Automated ครบ 523 Tests (Coverage > 97%)** |

#### 3) ปัญหาและอุปสรรคที่พบ พร้อมแนวทางแก้ไข (Problems & Solutions)
1. **ปัญหา**: สลิปธนาคารของบางแอปพลิเคชัน (เช่น Krungthai NEXT) เป็น Mini QR ที่ไม่มี Tag 54 ระบุจำนวนเงิน
   - **แนวทางแก้ไข**: ผสานการทำงานร่วมกับ Tesseract OCR ภาษาไทยเพื่อสกัดยอดเงินจากข้อความบนภาพสลิปแทน
2. **ปัญหา**: ชื่อผู้รับเงินบนสลิปไม่ตรงกับชื่อบัญชีเนื่องจากมีคำนำหน้าชื่อ (`นาย/นางสาว`) หรือสลิปย่อนามสกุล
   - **แนวทางแก้ไข**: สร้างฟังก์ชัน `isRecipientNameMatched` ที่ตัดคำนำหน้าชื่อและตรวจสอบคำแรกของชื่อ-นามสกุลแบบ Dynamic
3. **ปัญหา**: การรันชุดทดสอบบน CI ค้างเนื่องจาก Background Worker ของ OCR
   - **แนวทางแก้ไข**: เพิ่ม Lifecycle Hook `terminateOcrWorker()` ใน `afterAll` และใส่แฟล็ก `--forceExit` ใน Jest configuration
4. **ปัญหา**: การกดส่งสลิปซ้ำซ้อน (Double Submit / Race Condition) เมื่อผู้ใช้คลิกปุ่มส่งสลิปรัวๆ หรือเบราว์เซอร์ส่งคำขอซ้อนกันในเสี้ยววินาที Request แรกบันทึกสำเร็จและยิงแจ้งเตือน OBS ไปแล้ว แต่ Request ที่สองพบ `transRef` ซ้ำและส่ง Error 400 (`"สลิปนี้ถูกใช้งานไปแล้ว"`) กลับมา ทำให้ Modal แสดงสถานะผิดพลาดหลอกผู้ใช้ ทั้งที่รายการแรกสำเร็จแล้ว
   - **แนวทางแก้ไข**: ใช้สถาปัตยกรรมแบบสองชั้น (Multi-layer Guard) โดยฝั่ง Client ใช้ `useRef` submission locks ควบคู่กับ CSS `pointer-events-none` และฝั่ง Server ปรับใช้ **15-Second Backend Idempotency Window** ใน `donationController.js` หากพบคำขอซ้ำของสลิปเดิมสำหรับสตรีมเมอร์คนเดิมในเวลาไม่เกิน 15 วินาที จะตอบกลับ 200 OK ด้วยข้อมูลเดิมทันที โดยไม่สร้างรายการใหม่และไม่ยิง Socket.IO ซ้ำ
5. **ปัญหา**: ผู้บริจาคลบข้อความแท็กภารกิจโดเนทในกล่องข้อความ ทำให้ชื่อภารกิจไม่ปรากฏในแจ้งเตือน OBS Studio
   - **แนวทางแก้ไข**: ออกแบบกลไก Locked Mission Tag ในฝั่ง Client โดยแยกชื่อภารกิจออกมาแสดงเป็น Badge ถาวร `[ 🔒 ภารกิจ: {name} ]` ที่ผู้บริจาคไม่สามารถแก้ไขหรือลบได้ และระบบจะแนบแท็ก `[ภารกิจ: {name}]` เข้ากับข้อความก่อนส่งไปยัง Backend โดยอัตโนมัติ

#### 4) ข้อเสนอแนะในการพัฒนาต่อยอด (Future Recommendations)
1. **การเชื่อมต่อกับ Payment Gateway เต็มรูปแบบ**: พัฒนาระบบรองรับบัตรเครดิต/เดบิต และ PromptPay QR แบบ Dynamic Bot API ในอนาคต
2. **ระบบการแจ้งเตือนข้ามแพลตฟอร์ม**: พัฒนา Webhook แจ้งเตือนยอดโดเนทเข้าสู่ห้องแชท Discord หรือ LINE Notify ของสตรีมเมอร์
3. **การรองรับ Mobile Application**: พัฒนาแอปพลิเคชันสำหรับสตรีมเมอร์เพื่อดูสถิติและกดยืนยันสลิปผ่านสมาร์ทโฟนได้อย่างสะดวกรวดเร็ว




---

## 13. SonarQube remediation guide (อัปเดต 12 ตุลาคม 2026)

> **สถานะ:** GitHub PR แสดง `Quality Gate failed` เพราะ `Security Rating on New Code = B` ขณะที่ต้องได้ `A` การมีแพตช์ใน ZIP **ไม่เท่ากับ** การผ่าน SonarCloud; ต้องทดสอบและสแกนใหม่

### 13.1 Security findings (แก้ก่อน)

1. `server/controllers/userController.js`: regular expression ที่เสี่ยง super-linear backtracking (ReDoS) — ตรวจสอบ regex และ input bounds, ใช้การตรวจสอบที่มี runtime เป็นเชิงเส้น และเพิ่ม test สำหรับ input ยาว/ผิดรูปแบบ
2. `server/services/notificationService.js`: log injection จาก user-controlled input — normalize/escape CR, LF และ control characters ก่อนส่งไป logger; อย่า log token, secrets หรือข้อมูลส่วนตัวที่ไม่จำเป็น

### 13.2 Maintainability findings

- `client/src/components/Account/ManageAccountCard.jsx`: Cognitive Complexity 20 (เกณฑ์ 15), nested ternary สองจุด, optional chaining และ `[^0-9]` → `\D`
- `server/controllers/userController.js`: Cognitive Complexity 17 (เกณฑ์ 15), `crypto` → `node:crypto`, `[0-9]` → `\d`, `[^0-9]` → `\D`
- `server/controllers/authController.js`: `crypto` → `node:crypto`, `[^0-9]` → `\D`
- `server/utils/jwtSecret.js`: `crypto` → `node:crypto`
- `client/src/pages/ForgotPassword.jsx`: optional chaining, `[^0-9]` → `\D`
- `server/services/notificationService.js`: `[^0-9]` → `\D`

### 13.3 Development rules for future agents

- รักษา API contracts, validation semantics, React behavior และ test coverage เดิม; อย่าปรับ regex โดยไม่ทดสอบ edge cases
- อย่าปิดกฎ security หรือผ่อน Quality Gate เพื่อให้ CI ผ่าน
- เพิ่ม regression tests สำหรับช่องโหว่ที่แก้และแยก refactor ด้าน readability ออกจาก behavior changes เมื่อทำได้
- หลีกเลี่ยง nested ternary; แยก branch เป็นตัวแปร/helper ที่มีชื่อชัดเจน และพยายามรักษา Cognitive Complexity ≤ 15
- ใช้ `node:` prefix สำหรับ Node built-ins; ใช้ optional chaining เฉพาะกรณีที่ไม่เปลี่ยน semantics
- ห้าม commit `.env`, secrets, tokens หรือ credentials; หากเคยเผยแพร่ให้ rotate

### 13.4 Verification checklist

```bash
cd server
npm ci
npm run test:coverage
cd ../client
npm ci
CI=true npm test -- --coverage --watchAll=false
CI=true npm run build
```

หลัง push ให้ตรวจ SonarCloud PR analysis ว่า **Security Rating on New Code = A**, Quality Gate = Passed และไม่มี issue ใหม่ที่เกี่ยวข้อง ตรวจสอบ test counts/coverage ใหม่ทุกครั้งก่อนอ้างผลในรายงาน (ค่าที่ระบุในหัวข้อก่อนหน้าเป็น snapshot เดิม ไม่ใช่ผลยืนยันหลังแพตช์)
