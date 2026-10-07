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
npm test              # รัน Jest + Supertest (4 Suites, 70 Tests ผ่าน 100%)
npm run test:coverage # รัน Jest พร้อมเก็บรายงาน Code Coverage (> 98%)
```

### 2.2 ฝั่ง Client (Frontend)

```bash
cd client
npm install
npm start                        # รัน React Dev Server บนพอร์ต 3000 (http://localhost:3000)
npm test -- --watchAll=false     # รัน Jest Test Suite ครั้งเดียวแล้วจบ (21 Suites, 155 Tests ผ่าน 100%)
npm run build                    # Build สำหรับ Production (รองรับ CI=true บน GitHub Actions)
```

### 2.3 คำสั่งทดสอบและตรวจสอบ CI สำหรับ Local Environment

```bash
# ทดสอบฝั่ง Server (Integration Tests + Coverage)
cd server
npm run test:coverage

# ทดสอบฝั่ง Client (Unit Tests + Production Build)
cd client
set CI=true&& npm test -- --coverage --watchAll=false
set CI=true&& npm run build
```

---

## 3. สภาพแวดล้อมและการตั้งค่า (Environment Variables)

### 3.1 Server (`server/.env`)

| ตัวแปร        | รายละเอียด                                         | ค่าเริ่มต้น (Default)             |
| :------------ | :------------------------------------------------- | :-------------------------------- |
| `PORT`        | พอร์ตสำหรับเซิร์ฟเวอร์ Express API                 | `5000`                            |
| `MONGODB_URI` | Connection String สำหรับเชื่อมต่อฐานข้อมูล MongoDB | `mongodb://localhost:27017/donix` |
| `CLIENT_URL`  | URL ฝั่ง Client สำหรับกำหนดสิทธิ์ CORS             | `http://localhost:3000`           |
| `JWT_SECRET`  | คีย์ลับสำหรับเซ็นและตรวจสอบ JWT Token              | กำหนดใน `.env` ฝั่ง Server        |

### 3.2 Client

- Base URL ของ API กำหนดไว้ที่ `http://localhost:5000`
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
│   ├── authController.js        → Logic การลงทะเบียนและการเข้าสู่ระบบ (register, login)
│   └── userController.js        → Logic จัดการข้อมูลผู้ใช้ (getMe, updateMe, updatePayment, updateDonationPage)
├── middleware/
│   ├── protect.js               → ตรวจสอบ JWT Bearer Token และใส่ req.user
│   ├── errorHandler.js          → Error Handler กลาง จัดการ error รูปแบบ { message, data } และ Mongoose errors
│   └── rateLimiter.js           → จำกัดอัตราการเรียก API (authLimiter, apiLimiter)
├── Models/
│   └── User.js                  → Central User Schema
├── routes/
│   ├── auth.js                  → เส้นทาง /api/auth (register, login) พร้อม authLimiter
│   └── users.js                 → เส้นทาง /api/users (GET /me, PUT /me, PUT /payment, PUT /donation-page พร้อม protect)
├── tests/
│   ├── auth.test.js             → ชุดทดสอบ Authentication (13 tests)
│   ├── protect.test.js          → ชุดทดสอบ JWT Middleware (5 tests)
│   ├── users.test.js            → ชุดทดสอบ Users Route (47 tests: GET /me, PUT /me, PUT /payment, PUT /donation-page)
│   └── errorHandler.test.js     → ชุดทดสอบ Central Error Handler (5 tests)
├── utils/
│   └── passwordValidation.js    → ฟังก์ชันตรวจสอบความปลอดภัยของรหัสผ่าน (ซิงค์กับ client)
├── app.js                       → Express Application Config (Middlewares, Routes, Error Handler)
├── index.js                     → Entry Point ของเซิร์ฟเวอร์ Express + Socket.IO (Port 5000)
├── jest.config.js               → การตั้งค่า Jest สำหรับ Node.js ESM และ Coverage
└── package.json
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

### 5.2 เส้นทาง URL และหน้าระบบทั้งหมด (12 หน้า + 404)

| เส้นทาง (Route)                      | คอมโพเนนต์หน้า | สิทธิ์เข้าถึง      | คำอธิบาย                                                                    |
| :----------------------------------- | :------------- | :----------------- | :-------------------------------------------------------------------------- |
| `/`                                  | `MainPage`     | สาธารณะ            | หน้าแรก (Landing Page), Hero, ฟีเจอร์, รายชื่อสตรีมเมอร์, Footer            |
| `/discover`                          | `Discover`     | สาธารณะ            | หน้าค้นพบสตรีมเมอร์ จัดกลุ่มตามหมวด (กำลังไลฟ์, หมวดเกม, แนะนำ)             |
| `/how-it-works`                      | `HowToUse`     | สาธารณะ            | หน้าคู่มือและขั้นตอนการเริ่มต้นใช้งานระบบสำหรับสตรีมเมอร์และผู้สนับสนุน     |
| `/login`                             | `Login`        | สาธารณะ            | หน้าเข้าสู่ระบบ (Email/Password, Google Auth) รองรับ JWT Token              |
| `/register`                          | `Register`     | สาธารณะ            | หน้าสมัครสมาชิก พร้อม Password Checklist ตรวจสอบเงื่อนไข 5 ข้อ              |
| `/dashboard`                         | `Dashboard`    | สมาชิก (Protected) | หน้าสรุปภาพรวมบัญชี (สถิติยอดเงิน, จำนวนโดเนท, กราฟสถิติ, กิจกรรมล่าสุด)    |
| `/payment`                           | `PaymentPage`  | สมาชิก (Protected) | หน้าตั้งค่าช่องทางรับเงิน (PromptPay, TrueMoney, Bank, Coming Soon)         |
| `/donate-page`                       | `DonatePage`   | สมาชิก (Protected) | หน้าตกแต่งหน้ารับเงิน, ข้อความต้อนรับ/ขอบคุณ, ตัวกรองคำหยาบ, โซเชียล        |
| `/account`                           | `Account`      | สมาชิก (Protected) | หน้าจัดการโปรไฟล์ ข้อมูลส่วนตัว ความปลอดภัย และเชื่อมต่อโซเชียล 6 แพลตฟอร์ม |
| `/history`                           | `HistoryPage`  | สมาชิก (Protected) | หน้าประวัติการรับเงิน ตารางรายการโดเนท พร้อมตัวกรองสถานะ                    |
| `/widget`                            | `WidgetPage`   | สมาชิก (Protected) | หน้าตั้งค่าวิดเจ็ต OBS (Alert, Goal, Leaderboard, Mission) + Live Preview   |
| `/:username` หรือ `/donor/:username` | `DonorPage`    | สาธารณะ            | หน้ารับเงินจริงสำหรับผู้สนับสนุน (Donor) รองรับ 5 สถานะการทำงาน             |
| `*`                                  | `NotFound`     | สาธารณะ            | หน้าแจ้งเตือน 404 Not Found เมื่อไม่พบเส้นทาง URL                           |

---

### 5.3 รายละเอียดของแต่ละหน้าระบบหลัก

#### 1) หน้าแรก (MainPage) & หน้าสาธารณะ

- **MainPage (`/`)**: Navbar, Hero Section, Features Showcase, Streamer Showcase, CTA Section, Footer
- **Discover (`/discover`)**: จัดหมวดหมู่สตรีมเมอร์ที่กำลังไลฟ์, หมวดเกมยอดนิยม, ค้นหาและแนะนำสตรีมเมอร์
- **HowToUse (`/how-it-works`)**: ขั้นตอนการใช้งาน 4 ขั้นตอน พร้อมจุดเด่นและคำแนะนำสำหรับสตรีมเมอร์มือใหม่

#### 2) หน้าเข้าสู่ระบบและสมัครสมาชิก (Auth)

- **Login (`/login`)**: รองรับการล็อกอินด้วย Email และรหัสผ่าน หรือ Google OAuth พร้อมแจ้งเตือนข้อผิดพลาด
- **Register (`/register`)**: ระบบสมัครสมาชิก พร้อม `PasswordChecklist` ตรวจสอบความปลอดภัยแบบเรียลไทม์ 5 ข้อ (ความยาว, ตัวพิมพ์เล็ก, ตัวพิมพ์ใหญ่, ตัวเลข, อักขระพิเศษ)

#### 3) หน้าแดชบอร์ด (Dashboard) — `/dashboard`

- การ์ดสถิติ (StatCards): ยอดการรับเงินรวม (บาท), จำนวนครั้งที่โดเนท, จำนวนผู้ชม/ผู้สนับสนุน
- กราฟสถิติโดเนท (DonationChart): แสดงสถิติโดเนทแบบแท่ง/เส้นด้วย Recharts รองรับรายสัปดาห์และรายเดือน
- ฟีดกิจกรรมล่าสุด (RealtimeFeed) และภาพรวมช่องทางรับเงิน (PaymentChannels)
- ใช้เลย์เอาต์ร่วม **Sticky Sidebar** ด้านซ้าย และ **Sticky Topbar** ด้านบน

#### 4) หน้าบัญชีรับเงิน (PaymentPage) — `/payment`

- แผงการ์ด 4 ช่องทางการเงิน (2x2 Grid):
  - **PromptPayCard**: เปิด/ปิดการรับเงิน, เมนูจัดการ, สลับเบอร์โทรศัพท์/บัตร ปชช., บันทึกข้อมูล
  - **TrueMoneyCard**: เปิด/ปิดการรับเงิน, ฟอร์มเบอร์โทรศัพท์ TrueMoney Wallet
  - **BankCard**: เปิด/ปิดการรับเงิน, เลือกธนาคาร (SCB, KBank, BBL, KTB ฯลฯ), เลขบัญชี, ชื่อบัญชี
  - **ComingSoonCard**: ช่องทางใหม่ในอนาคต (เช่น บัตรเครดิต/เดบิต, Crypto)

#### 5) หน้าตกแต่งหน้ารับเงิน (DonatePage) — `/donate-page`

- **DonatePageLink**: ลิงก์ส่วนตัว `donix.app/{username}`, ปุ่มคัดลอกลิงก์, ปุ่มแชร์, ปุ่มเปิดหน้า Donor Page
- **DecorateSection**: แก้ไขข้อความต้อนรับ, ข้อความขอบคุณ, กำหนดยอดโดเนทขั้นต่ำ, อัปโหลดรูปภาพหน้าปกและพื้นหลัง
- **MessageFilterSection**: กำหนดความยาวตัวอักษรสูงสุด, สวิตช์เปิด/ปิดตัวกรองคำหยาบ, ระบบแท็กคำที่ต้องการบล็อก
- **SocialMediaSection**: เชื่อมต่อและแสดงผลลิงก์โซเชียลมีเดีย 6 แพลตฟอร์ม

#### 6) หน้ารับเงินจริงสำหรับผู้สนับสนุน (DonorPage) — `/:username` หรือ `/donor/:username`

- รองรับ **5 สถานะการแสดงผล** ตามแบบ Figma:
  1. **Offline**: เมื่อสตรีมเมอร์ปิดระบบ Avatar จะขึ้นป้าย `ออฟไลน์` พร้อมการ์ด "ขณะนี้ปิดรับโดเนทชั่วคราว"
  2. **Online - PromptPay**: Avatar เรืองแสงสีแดงพร้อมป้าย `🔴 LIVE`, ข้อความต้อนรับ, แท็บเลือกช่องทาง, ฟอร์มชื่อและข้อความโดเนท, ระบุจำนวนเงิน, **PromptPay QR Code อัตโนมัติตามยอดเงิน**, อัปโหลดสลิป, ปุ่มยืนยัน
  3. **Online - Bank**: แสดงข้อมูลบัญชีธนาคารพร้อมปุ่มคัดลอกเลขบัญชี, อัปโหลดสลิป, ปุ่มยืนยันชำระเงิน
  4. **Online - TrueMoney**: ช่องกรอกลิงก์ซองของขวัญทรูมันนี่ อั่งเปา, ปุ่มยืนยัน
  5. **Online - Channel Disabled**: แสดงการ์ด "ไม่พร้อมให้บริการ" เมื่อสตรีมเมอร์ปิดช่องทางนั้นๆ
- **Floating Test Controls**: เครื่องมือจำลองสลับสถานะ Online/Offline และเปิด/ปิดช่องทางรับเงินเพื่อทดสอบ UI ทันที

#### 7) หน้าตั้งค่าวิดเจ็ต OBS (WidgetPage) — `/widget`

- รองรับการตั้งค่าวิดเจ็ต 4 รูปแบบใน Layout 2 คอลัมน์ (ฟอร์มตั้งค่า + Real-time Preview เสมือนจริง):
  1. **Donate Alert**:
     - _พื้นฐาน_: ยอดขั้นต่ำที่แจ้งเตือน (บาท), อัปโหลดรูปภาพแสดงผล (JPG/PNG/GIF)
     - _เสียง & TTS_: เสียงแจ้งเตือน Presets (Mythic Horn, Dragon Roar, Ancient Bell, เสียง MP3 ของฉัน, ปิดเสียง), ตัวปรับระดับเสียง, TTS อ่านข้อความโดเนท (ไทย/อังกฤษ, ชาย/หญิง, ความเร็ว 0.5x–2.0x)
     - _ข้อความ_: Message Template `{user} {amount}`, Shine Effect, ฟอนต์ (Kanit, Cinzel, FC Vision ฯลฯ), ขนาดตัวอักษร, Palette สี (ข้อความ, ชื่อ, จำนวนเงิน, สีขอบตัวอักษร), ขนาดขอบตัวอักษร
     - _เอฟเฟกต์ & Tiers_: แอนิเมชั่นเข้า/ออก, เวลาแสดงผล, ฟิลเตอร์ (Glow, Pulse, Shake, Glitch ฯลฯ), ระบบแสดงผลตามช่วงยอดเงิน (Amount Tiers) ปรับเสียงและเอฟเฟกต์แยกตามยอดเงิน
  2. **Donate Goal**: ชื่อเป้าหมาย, ธีมสี (Mana, Crimson, Gold), ยอดเริ่มต้น/ยอดเป้าหมาย, กำหนดช่วงวันที่, หลอดความคืบหน้า Progress Bar เรืองแสง
  3. **Leaderboard**: ชื่อหัวข้อ, สวิตช์แสดงยอดเงิน, กำหนดช่วงเวลา, ปรับจำนวนอันดับ 1–10 (Stepper +/-)
  4. **Mission Donate**: จัดการช่องภารกิจสูงสุด 12 ช่อง (ชื่อภารกิจ + ราคา ฿) สำหรับนำไปแสดงผลบน Donor Page
- **BrowserSourceCard**: แสดงป้ายสถานะ `Live` / `ยังไม่ได้บันทึก`, Browser Source URL สำหรับ OBS, ปุ่มคัดลอก URL, และปุ่มทดสอบ Alert พร้อมจำลอง Web Audio API เสียงจริง

#### 8) หน้าจัดการบัญชี (Account) — `/account`

- `AccountProfileCard`: แสดงรูปโปรไฟล์ Avatar, ชื่อผู้ใช้, อีเมล, สถานะการยืนยันตัวตน
- `AccountTabs`: แท็บสลับ 3 หมวดหมู่:
  - **UserInfoTab**: จัดการข้อมูลส่วนตัว, ชื่อแสดงผล, ข้อมูลติดต่อ
  - **SecurityTab**: จัดการรหัสผ่าน, เปลี่ยนรหัสผ่านใหม่พร้อม Checklist
  - **SocialMediaTab**: เชื่อมต่อลิงก์โซเชียลมีเดียทั้ง 6 แพลตฟอร์ม

#### 9) หน้าประวัติการรับเงิน (HistoryPage) — `/history`

- แสดงสถิติสรุปยอดโดเนททั้งหมด, จำนวนรายการที่สำเร็จ
- ตารางประวัติการรับเงิน `DonationHistoryTable` แสดงวันเวลา, ผู้สนับสนุน, จำนวนเงิน, ช่องทางที่ใช้, และสถานะ

---

## 6. โครงสร้างโฟลเดอร์ Component ฝั่ง Client

```
client/src/
├── assets/                    → โลโก้และรูปภาพประกอบ (PrimaryLogo, HeroLogo, hero, bg-login)
├── components/
│   ├── Account/               → AccountProfileCard, AccountTabs, ManageAccountCard, SecurityTab, SocialMediaTab, UserInfoTab
│   ├── Auth/                  → AuthLayout, InputField, PasswordChecklist, SocialAuthButtons
│   ├── Dashboard/             → CardWrapper, DonationChart, PaymentChannels, ProtectedRoute, RealtimeFeed, StatsCard, TopDonors
│   ├── Discover/              → CategorySection, StreamerCard
│   ├── DonatePage/            → DecorateSection, DonatePageLink, ImageUploadBox, MessageFilterSection, RichTextField, SettingsCard, SocialMediaSection
│   ├── Donor/                 → DonorBankForm, DonorDisabledCard, DonorHeader, DonorOfflineCard, DonorPaymentTabs, DonorPromptPayForm, DonorSlipUpload, DonorStatusCard, DonorTrueMoneyForm
│   ├── Histor/                → DonationHistoryTable (ชื่อโฟลเดอร์ Histor/ ตามโค้ดดั้งเดิม)
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
├── pages/                     → หน้าหลักทั้ง 12 หน้า และ NotFound
├── utils/
│   ├── api.js                 → ฟังก์ชัน fetch กลาง (fetchCurrentUser, updateCurrentUser, updatePaymentSettings, updateDonationPageSettings) + API Endpoint Constants
│   ├── passwordValidation.js  → ฟังก์ชันตรวจสอบความปลอดภัยของรหัสผ่าน
│   ├── passwordValidation.test.js
│   ├── sanitizeStorage.js     → ฟังก์ชันกรองและจัดเก็บข้อมูล localStorage ให้ปลอดภัย
│   └── sanitizeStorage.test.js
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
   - หน้า **Account**, **Payment**, **DonatePage** ย้ายขึ้น MongoDB ผ่าน REST API (`api.js`) แล้วทั้งหมด — ห้ามอ่าน/เขียนข้อมูลหลักลง `localStorage` โดยตรงในหน้าเหล่านี้
   - หน้า **Donor** และ **Widget** ยังอ่านและบันทึกข้อมูลผ่านไฟล์กลาง `widgetStorage.js` และ `sanitizeStorage.js` (เตรียมสำหรับการย้ายขึ้น REST API ใน Phase ถัดไป)
   - ห้ามเรียก `localStorage` ตรงๆ ในทุกกรณี ให้ใช้ผ่าน `safeGetItem`/`safeSetItem` ใน `sanitizeStorage.js` เสมอ
6. **Zero Warning Policy บน CI**: ตัวแปร `CI=true` บน GitHub Actions จะเปลี่ยน warning ทุกตัวเป็น fatal error ดังนั้นห้ามทิ้ง unused variables หรือ unused imports
7. **การป้องกัน NoSQL Injection**: ทุก route ฝั่ง server ที่รับค่าจาก client ต้องทำตามกฎ 3 ขั้นตอนในหัวข้อ 4.4 อย่างเคร่งครัด
8. **ห้ามทำ Code Duplication ซ้ำซ้อน**: ห้ามคัดลอกบล็อกโค้ดที่ซ้ำกันเกิน 10 บรรทัดข้ามไฟล์ ให้แยกเป็น shared component หรือ hook กลาง เพื่อไม่ให้ติด Quality Gate ของ SonarCloud

---

## 8. สถานะของระบบ (Current Project Status)

| ส่วนงาน                      | สถานะ            | รายละเอียด                                                                                                 |
| :--------------------------- | :--------------- | :--------------------------------------------------------------------------------------------------------- |
| **Backend Foundation**       | ✅ สมบูรณ์       | สถาปัตยกรรมแยก `app.js`/`index.js`, Helmet, Rate Limiter, Error Handler กลาง, Response `{ message, data }` |
| **Auth System**              | ✅ สมบูรณ์       | Register, Login, JWT Token, Password Checklist, ป้องกัน NoSQL Injection, Auth Rate Limiting                |
| **Frontend Pages (12 หน้า)** | ✅ สมบูรณ์       | ทุกหน้าเชื่อมต่อใน `App.js` พร้อม Navigation Bar และ Responsive UI                                         |
| **Widget System**            | ✅ สมบูรณ์       | 4 รูปแบบ (Alert, Goal, Leaderboard, Mission) + Live Preview + OBS Browser URL                              |
| **Phase 4 — REST API Migration** | ✅ สมบูรณ์  | Account (`GET/PUT /api/users/me`), Payment (`PUT /api/users/payment`), DonatePage (`PUT /api/users/donation-page`) ย้ายขึ้น MongoDB แล้วทั้งหมด |
| **Test Suites**              | ✅ สมบูรณ์       | Client: 21 Suites (155 Tests ผ่าน 100%), Server: 4 Suites (70 Tests ผ่าน 100%, Coverage > 98%)             |
| **CI / CD Pipeline**         | ✅ สมบูรณ์       | GitHub Actions (`client`, `server`, `sonar`) ผ่านทุก Check พร้อมส่ง Coverage ทั้งสองฝั่ง                   |
| **SonarCloud Quality Gate**  | ✅ ผ่าน          | 0 Security Issues, 0 Vulnerabilities, Duplication ≤ 3%, New Code Coverage > 80%                            |
| **Database Models**          | 🔄 อยู่ระหว่างพัฒนา | ปัจจุบันมี `User` Model แล้ว, เตรียมเพิ่ม `Donation`, `Widget`, `Mission` ใน Phase 6                      |
| **OCR Slip Verification**    | 📋 ตามแผนงาน     | เตรียมพัฒนาใน Phase 8 (ระบบตรวจสอบสลิปอัตโนมัติ)                                                           |

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

> **Phase 1–4 เสร็จสมบูรณ์แล้ว** ✅ — Backend Foundation, Auth, Frontend Pages, Widget System, และการย้าย Account/Payment/DonatePage ขึ้น REST API + MongoDB

- **Phase 5: Deploy (ขนาดเล็กถึงกลาง)**
  - Server ขึ้น **Render**, Client ขึ้น **Vercel**, และใช้ **MongoDB Atlas**
  - ตรวจสอบปัญหา CORS, Linux Case-sensitive Paths (เช่น `Models/`), และ Environment Variables (`MONGODB_URI`, `JWT_SECRET`, `CLIENT_URL`)
  - ปรับ Base URL ของ Client ให้อ่านจาก `process.env.REACT_APP_API_URL` แทน `http://localhost:5000`

- **Phase 6: แกนหลัก Donation REST API & Database Schema (ขนาดใหญ่)**
  - สร้าง `server/Models/Donation.js` (`streamerId`, `donorName`, `amount`, `message`, `paymentMethod`, `status`, `slipImage`, `missionId`) ทำ index ที่ `streamerId + createdAt`
  - Public Endpoint: `GET /api/public/:username` (ข้อมูลสำหรับ Donor Page ปิดบังข้อมูลส่วนตัว)
  - `POST /api/donations` (สร้างรายการโดเนท พร้อมอัปโหลดสลิปผ่าน Cloudinary/Object Storage)
  - `GET /api/donations` (ดึงประวัติและสถิติด้วย Mongo Aggregation สำหรับ Dashboard และ History)
  - `PATCH /api/donations/:id` (อนุมัติ/ปฏิเสธสลิป)

- **Phase 7: Real-time Alert + Widget OBS (ขนาดใหญ่)**
  - สร้าง `server/Models/Widget.js` (บันทึก Config และ Token สำหรับ Browser Source OBS)
  - Socket.IO Real-time: เมื่ออนุมัติโดเนท ให้ emit `donation-alert` เข้าห้องสตรีมเมอร์
  - พัฒนาหน้า Browser Source โหลด Config ด้วย Token แล้วแสดง Alert แบบ Real-time
  - ปรับปรุง Leaderboard, Goal, Mission ให้อ่านจาก Donation Aggregation

- **Phase 8: OCR Slip Verification (ระบบตรวจสอบสลิปอัตโนมัติ — ตัวเลือกเสริม)**
  - เชื่อมต่อ OCR ตรวจสอบยอดเงิน วันที่ และเลขอ้างอิงธุรกรรมจากสลิปโอนเงิน
  - ป้องกันสลิปซ้ำด้วย unique index ของ Transaction Reference

