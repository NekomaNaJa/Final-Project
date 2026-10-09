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
npm test              # รัน Jest + Supertest (6 Suites, 107 Tests ผ่าน 100%)
npm run test:coverage # รัน Jest พร้อมเก็บรายงาน Code Coverage (> 97%)
```

### 2.2 ฝั่ง Client (Frontend)

```bash
cd client
npm install
npm start                        # รัน React Dev Server บนพอร์ต 3000 (http://localhost:3000)
npm test -- --watchAll=false     # รัน Jest Test Suite ครั้งเดียวแล้วจบ (24 Suites, 242 Tests ผ่าน 100%)
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
│   ├── donationController.js    → Logic การจัดการรายการบริจาค (createDonation, getDonations, getDonationStats, updateDonationStatus)
│   ├── publicController.js      → Logic ข้อมูลสาธารณะสำหรับหน้า Donor Page (getPublicStreamer)
│   └── userController.js        → Logic จัดการข้อมูลผู้ใช้ (getMe, updateMe, updatePayment, updateDonationPage, changePassword)
├── middleware/
│   ├── protect.js               → ตรวจสอบ JWT Bearer Token และใส่ req.user
│   ├── errorHandler.js          → Error Handler กลาง จัดการ error รูปแบบ { message, data } และ Mongoose errors
│   └── rateLimiter.js           → จำกัดอัตราการเรียก API (authLimiter, apiLimiter)
├── Models/
│   ├── Donation.js              → Central Donation Schema & Indexes
│   └── User.js                  → Central User Schema
├── routes/
│   ├── auth.js                  → เส้นทาง /api/auth (register, login) พร้อม authLimiter
│   ├── donations.js             → เส้นทาง /api/donations (POST /, GET /, GET /stats, PATCH /:id)
│   ├── public.js                → เส้นทาง /api/public (GET /:username)
│   └── users.js                 → เส้นทาง /api/users (GET /me, PUT /me, PUT /payment, PUT /donation-page, PUT /change-password)
├── tests/
│   ├── auth.test.js             → ชุดทดสอบ Authentication (13 tests)
│   ├── donations.test.js        → ชุดทดสอบ Donations Route (24 tests: POST /, GET /, GET /stats, PATCH /:id, Socket.IO)
│   ├── errorHandler.test.js     → ชุดทดสอบ Central Error Handler (5 tests)
│   ├── protect.test.js          → ชุดทดสอบ JWT Middleware (5 tests)
│   ├── public.test.js           → ชุดทดสอบ Public Route (5 tests)
│   └── users.test.js            → ชุดทดสอบ Users Route (60 tests: GET/PUT /me, PUT /payment, PUT /donation-page, PUT /change-password)
├── utils/
│   └── passwordValidation.js    → ฟังก์ชันตรวจสอบความปลอดภัยของรหัสผ่าน (ซิงค์กับ client)
├── app.js                       → Express Application Config (Middlewares, Routes, Error Handler, 10MB payload limit)
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
| `/donate-page`                       | `DonatePage`   | สมาชิก (Protected) | หน้าตกแต่งหน้ารับเงิน, ข้อความต้อนรับ/ขอบคุณ, ตัวกรองคำหยาบ, โซเชียล        |
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

- **Login (`/login`)**: รองรับการล็อกอินด้วย Email และรหัสผ่าน หรือ Google OAuth พร้อมแจ้งเตือนข้อผิดพลาด
- **Register (`/register`)**: ระบบสมัครสมาชิก พร้อม `PasswordChecklist` ตรวจสอบความปลอดภัยแบบเรียลไทม์ 5 ข้อ (ความยาว, ตัวพิมพ์เล็ก, ตัวพิมพ์ใหญ่, ตัวเลข, อักขระพิเศษ)

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

- **DonatePageLink**: ลิงก์ส่วนตัว `donix.app/{username}`, ปุ่มคัดลอกลิงก์, ปุ่มแชร์, ปุ่มเปิดหน้า Donor Page
- **DecorateSection**: แก้ไขข้อความต้อนรับ, ข้อความขอบคุณ, กำหนดยอดโดเนทขั้นต่ำ, อัปโหลดรูปภาพหน้าปกและพื้นหลัง
- **MessageFilterSection**: กำหนดความยาวตัวอักษรสูงสุด, สวิตช์เปิด/ปิดตัวกรองคำหยาบ, ระบบแท็กคำที่ต้องการบล็อก
- **SocialMediaSection**: เชื่อมต่อและแสดงผลลิงก์โซเชียลมีเดีย 6 แพลตฟอร์ม

#### 6) หน้ารับเงินจริงสำหรับผู้สนับสนุน (DonorPage) — `/:username` หรือ `/donor/:username`

- **เปิดให้บริการตลอดเวลา (Always Online)**: ผู้สนับสนุนเข้าถึงหน้าโดเนทได้ตลอด 24 ชม. ไม่ต้องรอสลับสถานะออฟไลน์/ออนไลน์
- สถานะการเปิด/ปิดช่องทางรับเงินขึ้นอยู่กับการตั้งค่าสวิตช์ในหน้า **Payment (`/payment`)** โดยตรง:
  1. **PromptPay**: แสดง PromptPay QR Code อัตโนมัติตามยอดเงิน, ลากวางอัปโหลดสลิป, ปุ่มยืนยัน
  2. **Bank**: แสดงข้อมูลบัญชีธนาคารพร้อมปุ่มคัดลอกเลขบัญชี, ลากวางอัปโหลดสลิป, ปุ่มยืนยันชำระเงิน
  3. **TrueMoney**: แสดงช่องทางทรูมันนี่สำหรับโอนเงิน/อั่งเปา
  4. **Channel Disabled**: แสดงการ์ด "ไม่พร้อมให้บริการ" เมื่อสตรีมเมอร์ปิดสวิตช์ช่องทางนั้นๆ ในหน้า Payment

#### 7) หน้าตั้งค่าวิดเจ็ต OBS (WidgetPage) — `/widget`

- รองรับการตั้งค่าวิดเจ็ต 4 รูปแบบใน Layout 2 คอลัมน์ (ฟอร์มตั้งค่า + Real-time Preview เสมือนจริง):
  1. **Donate Alert**:
     - _พื้นฐาน_: ยอดขั้นต่ำที่แจ้งเตือน (บาท), อัปโหลดรูปภาพแสดงผล (JPG/PNG/GIF)
     - _เสียง & TTS_: เสียงแจ้งเตือน Presets (Mythic Horn, Dragon Roar, Ancient Bell, เสียง MP3 ของฉัน, ปิดเสียง), ตัวปรับระดับเสียง, TTS อ่านข้อความโดเนท (ไทย/อังกฤษ, ชาย/หญิง, ความเร็ว 0.5x–2.0x)
     - _ข้อความ_: Message Template `{user} {amount}`, Shine Effect, ฟอนต์ (Kanit, FC Vision), ขนาดตัวอักษร, Palette สี (ข้อความ, ชื่อ, จำนวนเงิน, สีขอบตัวอักษร), ขนาดขอบตัวอักษร
     - _เอฟเฟกต์ & Tiers_: แอนิเมชั่นเข้า/ออก, เวลาแสดงผล, ฟิลเตอร์ (Glow, Pulse, Shake, Glitch ฯลฯ), ระบบแสดงผลตามช่วงยอดเงิน (Amount Tiers) ปรับเสียงและเอฟเฟกต์แยกตามยอดเงิน
  2. **Donate Goal**: ชื่อเป้าหมาย, ธีมสี (Mana, Crimson, Gold), ยอดเริ่มต้น/ยอดเป้าหมาย, กำหนดช่วงวันที่, หลอดความคืบหน้า Progress Bar เรืองแสง
  3. **Leaderboard**: ชื่อหัวข้อ, สวิตช์แสดงยอดเงิน, กำหนดช่วงเวลา, ปรับจำนวนอันดับ 1–10 (Stepper +/-)
  4. **Mission Donate**: จัดการช่องภารกิจสูงสุด 12 ช่อง (ชื่อภารกิจ + ราคา ฿) สำหรับนำไปแสดงผลบน Donor Page
- **BrowserSourceCard**: แสดงป้ายสถานะ `Live` / `ยังไม่ได้บันทึก`, Browser Source URL สำหรับ OBS, ปุ่มคัดลอก URL, และปุ่มทดสอบ Alert พร้อมจำลอง Web Audio API เสียงจริง
- **OverlayAlertPage (`/overlay/alert/:token`)**:
  - พื้นหลังโปร่งใส 100% สำหรับใส่ใน OBS Browser Source
  - ระบบ **FIFO Alert Queue**: รองรับกรณีมีโดเนทเข้ามาพร้อมกันหรือต่อเนื่อง จัดการแสดงผลทีละรายการตามลำดับพร้อมพัก Cooldown 400ms ป้องกันเสียงและแอนิเมชั่นทับซ้อน
  - กรองยอดเงินขั้นต่ำ (`minAmount`) อัตโนมัติ รายการที่ต่ำกว่าเกณฑ์จะไม่ถูกนำเข้าคิว
  - Animation Lifecycle ครบ 3 เฟส: เข้า (`entering`) -> แสดงผล (`visible`) -> เลือนออก (`exiting`) -> ว่าง (`idle`)
  - รองรับ Amount Tiers, Web Audio API Sound Presets & Custom MP3, และ Responsive Thai TTS
  - ควบคุมการทดสอบผ่าน Footer Toolbar: ปุ่มทดสอบแจ้งเตือน, ปุ่มข้าม (`skipAlert`), ปุ่มล้างคิว (`clearQueue`) พร้อมตัวนับจำนวนคิวรอ

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
├── pages/                     → หน้าหลักทั้ง 12 หน้า, NotFound, OverlayAlertPage.jsx, OverlayAlertPage.test.js
├── utils/
│   ├── alertAudio.js          → ระบบเสียงแจ้งเตือน Web Audio API Synth, custom MP3, Google TTS HTTPS Direct, Web Speech API fallback
│   ├── alertAudio.test.js     → ชุดทดสอบระบบเสียงและการสังเคราะห์เสียง TTS (23 tests)
│   ├── api.js                 → ฟังก์ชัน fetch กลาง (fetchCurrentUser, updateCurrentUser, updatePaymentSettings, updateDonationPageSettings, changePassword, fetchDonationHistory, fetchDonationStats, updateDonationStatus) + API Endpoint Constants
│   ├── passwordValidation.js  → ฟังก์ชันตรวจสอบความปลอดภัยของรหัสผ่าน
│   ├── passwordValidation.test.js
│   ├── sanitizeStorage.js     → ฟังก์ชันกรองและจัดเก็บข้อมูล localStorage ให้ปลอดภัย
│   ├── sanitizeStorage.test.js
│   ├── socket.js              → Socket.IO Client singleton (getSocket, joinStreamRoom, leaveStreamRoom, onDonationAlert, emitTestAlert, disconnectSocket)
│   └── socket.test.js         → ชุดทดสอบ Socket.IO integration (9 tests)
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
   - หน้า **Account**, **Payment**, **DonatePage**, **DonorPage**, **Dashboard**, และ **HistoryPage** ย้ายขึ้น MongoDB ผ่าน REST API (`api.js`) แล้วทั้งหมด — ห้ามอ่าน/เขียนข้อมูลหลักลง `localStorage` โดยตรงในหน้าเหล่านี้
   - หน้า **Widget** ยังอ่านและบันทึกข้อมูลผ่านไฟล์กลาง `widgetStorage.js` และ `sanitizeStorage.js` (เตรียมสำหรับการย้ายขึ้น REST API ใน Phase 7)
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
| **Phase 5 — Cloud Deployment**   | ✅ สมบูรณ์  | Server บน Render (`final-project-xntd.onrender.com`), Client บน Vercel (`final-project-orpin-five.vercel.app`), Database บน MongoDB Atlas |
| **Phase 6 — Donation Pipeline & Backoffice** | ✅ สมบูรณ์ | Public API, Donation Submission, Slip Upload, Dashboard Analytics (`/stats`), History Table (`/`), Status Update (`PATCH /:id`) |
| **Phase 7 — Real-time Alert & OBS Widget** | ✅ สมบูรณ์ (PR #57) | OBS Overlay Alert Page, FIFO Queue, Cooldown 400ms, Web Audio API Sound Presets, Google TTS Direct HTTPS, Real-time Socket.IO (`donation-alert`, `test-alert`) |
| **Test Suites**              | ✅ สมบูรณ์       | Client: 24 Suites (242 Tests ผ่าน 100%, Coverage > 91%), Server: 6 Suites (107 Tests ผ่าน 100%, Coverage > 97%), รวม 349 Tests ผ่าน 100% |
| **CI / CD Pipeline**         | ✅ สมบูรณ์       | GitHub Actions (`client`, `server`, `sonar`) ผ่านทุก Check พร้อมส่ง Coverage ทั้งสองฝั่ง                   |
| **SonarCloud Quality Gate**  | ✅ ผ่าน          | Security: A, Reliability: A, Duplication ≤ 3%, Coverage on New Code ≥ 80.0%, 0 Bugs, 0 Vulnerabilities    |
| **Database Models**          | ✅ สมบูรณ์       | มี `User` และ `Donation` Model แล้ว, เตรียมเพิ่ม `Widget`, `Mission` ตามแผนงาน                              |
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

> **Phase 1–7 เสร็จสมบูรณ์แล้ว** ✅ — Backend Foundation, Auth, Frontend Pages, Widget System, REST API Migration (Account/Payment/DonatePage), Cloud Deployment (Render + Vercel + MongoDB Atlas), Donation Pipeline, Dashboard Analytics & History Backoffice, และ Real-time Alert & OBS Widget System (PR #57)

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

- **Phase 7: Real-time Alert & OBS Widget System (เสร็จสมบูรณ์ ✅ - PR #57)**
  - **Step 1: Preset & Visual Upgrades**: ปรับขนาดและรายการฟอนต์ให้เหลือ Kanit และ FC Vision, รองรับ Dynamic Template TTS `{user}` และ `{amount}`, เพิ่มปุ่มทดสอบแอนิเมชันและพรีวิวทันทีเมื่อเปลี่ยนตัวเลือก
  - **Step 2: Persistent Uploads**: แปลงไฟล์รูปภาพแสดงผล (JPG/PNG/GIF) และไฟล์เสียงแจ้งเตือน MP3 เป็น Data URL บันทึกลง Storage ป้องกันข้อมูลหายเมื่อรีเฟรชหน้าเว็บ
  - **Step 3: Minimum Donation Sync**: ซิงค์ค่ายอดโดเนทขั้นต่ำ (`minAmount`) ระหว่างการตั้งค่าวิดเจ็ตและหน้ารับเงิน (`DonorPage`), ล็อกไม่ให้ผู้สนับสนุนกรอกยอดต่ำกว่าขั้นต่ำพร้อมระบบแก้ไขเลขอัตโนมัติเมื่อหลุดโฟกัส
  - **Step 4: FIFO Alert Queue & Sound Sync**: ระบบคิวการแจ้งเตือนแบบ FIFO (`alertQueue`) บน `OverlayAlertPage` พร้อมคูลดาวน์ 400ms, กรองยอดเงินที่ต่ำกว่า `minAmount`, ปุ่มข้ามแจ้งเตือนและล้างคิว
  - **Step 5: Real-time Socket.IO Integration**: เชื่อมต่อ `socket.io-client` ทั้งฝั่ง Client และ Server (`client/src/utils/socket.js`), จัดการห้องสตรีมเมอร์ (`join-stream`), รับอีเวนต์ `donation-alert` แบบเรียลไทม์บน OBS Browser Source, และปุ่มส่ง `test-alert` จากหน้า `WidgetPage` ไปแสดงผลบน OBS Studio ทันที
  - **Step 6: Security Hardening & Quality Gate Optimization**:
    - **SSRF Protection**: ตัด TTS Proxy endpoint บน Express API ออก และเปลี่ยนมาใช้ Direct HTTPS Stream พร้อม `no-referrer` ป้องกันความเสี่ยง Server-Side Request Forgery
    - **CSPRNG**: แทนที่ `Math.random()` ด้วย `window.crypto.getRandomValues()` ใน `OverlayAlertPage.jsx` ขจัดความเสี่ยงด้านความปลอดภัย
    - **Promise Handling**: กำกับ Floating Promises ด้วย `void` ป้องกัน unhandled rejections
    - **Refactoring & Clean Code**: ลด Cognitive Complexity ของฟังก์ชันจัดการเสียงใน `alertAudio.js`
    - **Quality Gate Passed**: ผลักดัน Coverage บน New Code ให้ผ่านเกณฑ์ SonarCloud (≥ 80.0%) และ Lines Coverage รวมทั้ง Client สูงถึง **91.17%**
  - ครอบคลุมชุดทดสอบ Jest ทั้งหมด (Server 6 Suites 107 Tests, Client 24 Suites 242 Tests รวม **30 Suites, 349 Tests ผ่าน 100%**) และ Build สำหรับ Production ผ่านฉลุย (0 Warnings, 0 Errors)

- **Phase 8: OCR Slip Verification (ระบบตรวจสอบสลิปอัตโนมัติ — ตัวเลือกเสริม)**
  - เชื่อมต่อ OCR ตรวจสอบยอดเงิน วันที่ และเลขอ้างอิงธุรกรรมจากสลิปโอนเงิน
  - ป้องกันสลิปซ้ำด้วย unique index ของ Transaction Reference

