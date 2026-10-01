# DONIX - Streamer Donation Platform (AGENTS.md)

เอกสารรวบรวมรายละเอียดสถาปัตยกรรม โครงสร้างโค้ด หน้าระบบทั้งหมด ข้อตกลงในการพัฒนา แนวทางความปลอดภัย
และกระบวนการ CI/CD ของโปรเจกต์ **DONIX** ทั้งในส่วนของ **Client (Frontend)** และ **Server (Backend)**

---

## 1. ข้อมูลภาพรวมของระบบ (Project Overview)

**DONIX** คือแพลตฟอร์มรับบริจาคและสนับสนุนสตรีมเมอร์ (Streamer Donation & Overlay Platform) ในรูปแบบ Monorepo ประกอบด้วย 2 แพ็กเกจหลักที่ทำงานแยกกันอย่างอิสระ:

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
npm run dev      # รันในโหมด Development (Nodemon, Hot-reload บนพอร์ต 5000)
npm start        # รันในโหมด Production
```

### 2.2 ฝั่ง Client (Frontend)

```bash
cd client
npm install
npm start                        # รัน React Dev Server บนพอร์ต 3000 (http://localhost:3000)
npm test -- --watchAll=false     # รัน Jest Test Suite ครั้งเดียวแล้วจบ (ไม่ค้างโหมด watch)
npm run build                    # Build สำหรับ Production (รองรับ CI=true บน GitHub Actions)
```

### 2.3 คำสั่งทดสอบและตรวจสอบ CI สำหรับ Local Environment

```bash
# ทดสอบ Build บน Client ให้เหมือนบน GitHub Actions (CI=true จะเปลี่ยน Warning เป็น Fatal Error)
cd client
set CI=true&& npm test -- --coverage --watchAll=false
set CI=true&& npm run build
```

---

## 3. สภาพแวดล้อมและการตั้งค่า (Environment Variables)

### 3.1 Server (`server/.env`)

| ตัวแปร        | รายละเอียด                                         | ค่าเริ่มต้น (Default)             |
| ------------- | -------------------------------------------------- | --------------------------------- |
| `PORT`        | พอร์ตสำหรับเซิร์ฟเวอร์ Express API                 | `5000`                            |
| `MONGODB_URI` | Connection String สำหรับเชื่อมต่อฐานข้อมูล MongoDB | `mongodb://localhost:27017/donix` |
| `CLIENT_URL`  | URL ฝั่ง Client สำหรับกำหนดสิทธิ์ CORS             | `http://localhost:3000`           |
| `JWT_SECRET`  | คีย์ลับสำหรับเซ็น JWT Token                        | -                                 |

### Client

- Base URL ของ API กำหนดไว้ที่ `http://localhost:5000`
- การจัดการสิทธิ์และการสื่อสารข้ามโดเมนใช้ CORS จากฝั่ง Server

---

## 4. โครงสร้างและรายละเอียดระบบฝั่ง Server (`server/`)

### 4.1 สถาปัตยกรรมและเทคโนโลยี

- **ES Modules**: กำหนด `"type": "module"` ใน `package.json` ใช้ `import` / `export`
- **Express 5**: รองรับ Async/Await และ Promise-returning route handlers
- **Socket.IO**: เชื่อมต่อแบบเรียลไทม์ (Attached กับ `req.io`) สำหรับสตรีม Event: `join-stream`, `disconnect`, `donation-alert`
- **Mongoose & MongoDB**: จัดการ Schema ฐานข้อมูล

### 4.2 โครงสร้างไฟล์ Server

```
server/
├── config/
│   └── db.js                    → การเชื่อมต่อฐานข้อมูล MongoDB (Mongoose)
├── Models/
│   └── User.js                  → Central User Schema
├── routes/
│   └── auth.js                  → เส้นทาง /api/auth (register, login)
├── utils/
│   └── passwordValidation.js    → ฟังก์ชันตรวจสอบความปลอดภัยของรหัสผ่าน
├── index.js                     → Entry Point ของเซิร์ฟเวอร์ Express + Socket.IO
└── package.json
```

### 4.3 รายละเอียด User Schema (`server/Models/User.js`)

- **ข้อมูลการยืนยันตัวตน**: `username`, `email`, `password`, `googleId`
- **โปรไฟล์**: `profile` (`displayName`, `avatar`, `bio`)
- **โซเชียลมีเดีย**: `socialLinks` (Facebook, Instagram, YouTube, TikTok, Twitch, X)
- **ช่องทางรับเงิน (`payment`)**:
  - `promptpay`: `enabled`, `type` (เบอร์โทรศัพท์/เลขบัตร ปชช.), `number`
  - `bank`: `enabled`, `bankName`, `accountNumber`, `accountName`
  - `truemoney`: `enabled`, `phone`
- **การตั้งค่าหน้ารับเงิน (`donationPage`)**:
  - `welcomeMessage`, `thankYouMessage`, `minAmount`, `charLimit`, `filteredWords`, `coverImage`, `backgroundImage`

### 4.4 การป้องกัน NoSQL Injection (บังคับทุก route ใหม่)

ทุก route ที่รับค่าจาก `req.body`, `req.query` หรือ `req.params` แล้วนำไปใช้ใน query ของ Mongoose (`findOne`, `find`, `updateOne` ฯลฯ) **ต้องทำตามลำดับนี้เสมอ** อ้างอิงจาก `server/routes/auth.js`:

1. **ตรวจชนิดก่อน** ด้วย `typeof` ว่าเป็น `string` (หรือชนิดที่คาดไว้) ปฏิเสธด้วย `400` ถ้าไม่ตรง
2. **ตัดสาย taint** ด้วยการสร้างตัวแปรใหม่ผ่าน `String(value)` ก่อนใช้ ห้ามส่งตัวแปรจาก `req.body` เข้า query ตรงๆ แม้จะเช็ก `typeof` มาก่อนแล้วก็ตาม
3. **ครอบเงื่อนไขด้วย `$eq`** ในทุก query object เช่น `User.findOne({ email: { $eq: safeEmail } })` แทน `User.findOne({ email })`

ตัวอย่างรูปแบบที่ถูกต้อง:

```js
const { email } = req.body;

if (typeof email !== "string") {
  return res.status(400).json({ message: "ข้อมูลไม่ถูกต้อง" });
}

const safeEmail = String(email);
const user = await User.findOne({ email: { $eq: safeEmail } });
```

เหตุผล: SonarCloud (กฎ `jssecurity:S5147`) ตามรอยค่าจาก `req.body` ว่าไหลเข้า query โดยตรง (taint tracking) การเช็ก `typeof` เพียงอย่างเดียวหรือครอบ `$eq` โดยไม่ตัดสายตัวแปรก่อน ไม่เพียงพอที่จะปิด Quality Gate

ไม่ส่ง error ภายใน (`err.message`) กลับไปให้ client ในทุก route ใช้ `console.error` เก็บ log ฝั่ง server แล้วตอบข้อความไทยทั่วไปแทน (ดูตัวอย่างใน `catch` ของ `auth.js`)

---

## 5. โครงสร้างและรายละเอียดระบบฝั่ง Client (`client/`)

### 5.1 สถาปัตยกรรมและเทคโนโลยี

- **React 18**: Single Page Application (SPA)
- **React Router v7**: กำหนดเส้นทาง URL ทั้งหมดใน `src/App.js` พร้อม `<ProtectedRoute>`
- **Tailwind CSS v3**: ตกแต่ง UI ด้วยโทนสีแบรนด์และ Dark Theme:
  - สี: `void` (`#090812`), `abyss` (`#0f0d1b`), `mana` (`#7c3aed`), `gold` (`#fbbf24`), `crimson` (`#ef4444`), `border` (`rgba(255,255,255,0.08)`)
  - ฟอนต์: `Kanit` (Sans-serif ภาษาไทย/สากล) และ `Nanum Myeongjo` (Serif)
- **Lucide React**: ไลบรารีไอคอนมาตรฐาน
- **Recharts**: แสดงกราฟสถิติยอดโดเนทในหน้า Dashboard

---

### 5.2 เส้นทาง URL และหน้าระบบ (Routing & Pages)

| เส้นทาง (Route)                      | คอมโพเนนต์หน้า | สิทธิ์เข้าถึง      | คำอธิบาย                                                             |
| ------------------------------------ | -------------- | ------------------ | -------------------------------------------------------------------- |
| `/`                                  | `MainPage`     | สาธารณะ            | หน้าแรก (Landing Page), Hero, ฟีเจอร์, รายชื่อสตรีมเมอร์, Footer     |
| `/how-it-works`                      | `HowToUse`     | สาธารณะ            | หน้าคู่มือและขั้นตอนการเริ่มต้นใช้งานระบบ                            |
| `/login`                             | `Login`        | สาธารณะ            | หน้าเข้าสู่ระบบ (Email/Password, Google Auth) ได้รับ JWT Token       |
| `/register`                          | `Register`     | สาธารณะ            | หน้าสมัครสมาชิก พร้อม Password Checklist ตรวจสอบเงื่อนไข 5 ข้อ       |
| `/dashboard`                         | `Dashboard`    | สมาชิก (Protected) | หน้าสรุปภาพรวมบัญชี (สถิติยอดเงิน, จำนวนโดเนท, กราฟ, ช่องทางรับเงิน) |
| `/payment`                           | `PaymentPage`  | สมาชิก (Protected) | หน้าตั้งค่าช่องทางรับเงิน (PromptPay, TrueMoney, Bank, Coming Soon)  |
| `/donate-page`                       | `DonatePage`   | สมาชิก (Protected) | หน้าตกแต่งหน้ารับเงิน, ข้อความต้อนรับ/ขอบคุณ, ตัวกรองคำหยาบ, โซเชียล |
| `/account`                           | `Account`      | สมาชิก (Protected) | หน้าจัดการโปรไฟล์ ข้อมูลส่วนตัว ความปลอดภัย และเชื่อมต่อโซเชียล      |
| `/history`                           | `HistoryPage`  | สมาชิก (Protected) | หน้าตรวจสอบประวัติการรับเงินและตารางรายการโดเนท                      |
| `/widget`                            | `WidgetPage`   | สมาชิก (Protected) | หน้าตั้งค่าวิดเจ็ต OBS (Alert, Goal, Leaderboard, Mission) + Preview |
| `/:username` หรือ `/donor/:username` | `DonorPage`    | สาธารณะ            | หน้ารับเงินจริงสำหรับผู้สนับสนุน (Donor) รองรับ 5 สถานะการทำงาน      |
| `*`                                  | `NotFound`     | สาธารณะ            | หน้าแจ้งเตือน 404 ไม่พบหน้าที่ค้นหา                                  |

---

### 5.3 รายละเอียดของแต่ละหน้าระบบหลัก

#### 1) หน้า Dashboard (`/dashboard`)

- การ์ดสถิติ (StatCards): ยอดการรับเงิน (บาท), จำนวนโดเนท (ครั้ง), จำนวนผู้ชม (คน)
- กราฟสถิติโดเนท (DonationChart) แสดงรายสัปดาห์/รายเดือนด้วย Recharts
- แผงควบคุม RecentDonations, SupportPanel และ PaymentChannels
- โครงสร้างใช้ **Sticky Sidebar** ทางซ้าย และ **Sticky Topbar** ด้านบน

#### 2) หน้าบัญชีรับเงิน (`/payment`)

- การ์ด 4 ช่องทางการเงิน (2x2 Grid กว้าง `max-w-[1240px]`):
  - **PromptPayCard**: แบนเนอร์สีน้ำเงิน, สวิตช์เปิด/ปิด, เมนูกด `จัดการ ˅`, เลือกเบอร์โทรศัพท์/เลขบัตร ปชช., บันทึกข้อมูล
  - **TrueMoneyCard**: แบนเนอร์สีส้ม, สวิตช์เปิด/ปิด, ฟอร์มเบอร์โทรศัพท์ TrueMoney Wallet
  - **BankCard**: แบนเนอร์สี Slate, สวิตช์เปิด/ปิด, เลือกธนาคาร (SCB, KBank, BBL ฯลฯ), เลขบัญชี, ชื่อบัญชี
  - **ComingSoonCard**: การ์ดแจ้งช่องทางใหม่ในอนาคต

#### 3) หน้าหน้ารับเงิน (`/donate-page`)

- **DonatePageLink**: แสดงลิงก์หน้ารับเงิน `donix.app/{username}`, ปุ่มคัดลอก, ปุ่มแชร์โซเชียล, และปุ่มเปิดดูตัวอย่างหน้าเว็บในแท็บใหม่
- **DecorateSection**: ข้อความต้อนรับ, ข้อความขอบคุณ, กำหนดยอดโดเนทขั้นต่ำ, อัปโหลดรูปภาพหน้าปกและพื้นหลัง
- **MessageFilterSection**: กำหนดความยาวตัวอักษรสูงสุด, สวิตช์ตัวกรองคำหยาบ, ระบบแท็กคำที่ต้องการบล็อก
- **SocialMediaSection**: เชื่อมต่อลิงก์โซเชียลมีเดีย 6 แพลตฟอร์ม

#### 4) หน้า Donor Page (`/:username`) — หน้ารับโดเนทสำหรับผู้สนับสนุน

- ดีไซน์ครอบคลุม **5 สถานะการแสดงผล** ตามแบบ Figma:
  1. **Donor-page (offline)**: เมื่อ Widget ออฟไลน์ Avatar แสดงป้าย `ออฟไลน์` พร้อมการ์ดไอคอน 🚫 "ขณะนี้ปิดรับโดเนทชั่วคราว"
  2. **Online - PromptPay**: Avatar มีวงแหวนสีแดงเรืองแสงและป้าย `🔴 LIVE`, ข้อความต้อนรับ, แท็บเลือกช่องทาง, ช่องกรอกชื่อและข้อความ, ช่องกรอกจำนวนเงิน, **PromptPay QR Code อัตโนมัติตามยอดเงิน**, กล่องอัปโหลดสลิป, ปุ่มยืนยันชำระเงิน
  3. **Online - Bank**: แสดงข้อมูลบัญชีธนาคารพร้อมปุ่มกดคัดลอกเลขบัญชี, อัปโหลดสลิป, ปุ่มยืนยันชำระเงิน
  4. **Online - TrueMoney**: ช่องกรอกลิงก์ซองของขวัญทรูมันนี่ อั่งเปา, ปุ่มยืนยันชำระเงิน
  5. **Online - Channel Disabled**: เมื่อสตรีมเมอร์ปิดรับเงินช่องทางนั้น จะแสดงการ์ดไอคอน 🚫 "ไม่พร้อมให้บริการ"
- **Floating Test Controls**: ปุ่มจำลองสลับสถานะ Online/Offline และเปิด/ปิดช่องทางรับเงินเพื่อทดสอบ UI ได้ทันที

#### 5) หน้า Widget Settings (`/widget`)

- รองรับการตั้งค่าวิดเจ็ต 4 รูปแบบใน Layout 2 คอลัมน์ (ฟอร์มตั้งค่า + Real-time Preview):
  1. **Donate Alert**:
     - _พื้นฐาน_: ยอดขั้นต่ำที่แจ้งเตือน (บาท), อัปโหลดรูปภาพ (JPG/PNG/GIF)
     - _เสียง & TTS_: เสียงแจ้งเตือน (Mythic Horn, Dragon Roar, Ancient Bell, เสียงของฉัน MP3, ไม่มีเสียง), ปรับระดับเสียง, TTS อ่านข้อความโดเนท (ไทย/อังกฤษ, ชาย/หญิง, ปรับความเร็ว 0.5x–2.0x)
     - _ข้อความ_: Template `{user} {amount}`, Shine Effect, ฟอนต์ (Kanit, Cinzel, FC Vision ฯลฯ), ขนาด, สีข้อความ, ขอบตัวอักษร, สีชื่อ/สีจำนวนเงิน
     - _เอฟเฟกต์ & ช่วงเงิน_: แอนิเมชั่นเข้า/ออก, เวลาแสดงผล, ฟิลเตอร์ (Glow, Pulse, Shake, Glitch ฯลฯ), ระบบแสดงผลตามช่วงยอดเงิน (Amount Tiers)
  2. **Donate Goal**: ชื่อเป้าหมาย, ธีมสี (Mana, Crimson, Gold), ยอดเริ่มต้น/เป้าหมาย, ช่วงวันที่, หลอด Progress Bar เรืองแสง
  3. **Leaderboard**: ชื่อหัวข้อ, เปิด/ปิดแสดงยอดบาท, ช่วงวันที่, ตัวปรับอันดับ 1–10 (ปุ่ม +/-)
  4. **Mission Donate**: จัดการช่องภารกิจสูงสุด 12 ช่อง (ชื่อ + ราคา ฿) แสดงผลบนหน้า Donor Page
- **BrowserSourceCard**: แสดงป้ายสถานะ `Live` / `ยังไม่ได้บันทึก`, Browser Source URL สำหรับ OBS, ปุ่มคัดลอก และปุ่ม "ทดสอบ Alert" พร้อมเสียงจำลอง

#### 6) หน้าจัดการบัญชีผู้ใช้ (`/account`)

- `AccountProfileCard`: แสดงรูป Avatar, ชื่อผู้ใช้, อีเมล, สถานะยืนยันตัวตน
- `AccountTabs`: แท็บสลับข้อมูลส่วนตัว (UserInfoTab), ความปลอดภัยเปลี่ยนรหัสผ่าน (SecurityTab), โซเชียลมีเดีย (SocialMediaTab)

---

## 6. โครงสร้างโฟลเดอร์ Component ฝั่ง Client

```
client/src/
├── assets/                  → โลโก้ รูปภาพประกอบ (PrimaryLogo, HeroLogo, hero, bg-login)
├── components/
│   ├── Account/             → AccountProfileCard, AccountTabs, SecurityTab, SocialMediaTab, UserInfoTab
│   ├── Auth/                → AuthLayout, InputField, PasswordChecklist, SocialAuthButtons
│   ├── Dashboard/           → StatCard, DonationChart, RecentDonations, PaymentChannels, SupportPanel
│   ├── DonatePage/          → DonatePageLink, DecorateSection, MessageFilterSection, SocialMediaSection, SettingsCard, RichTextField, ImageUploadBox
│   ├── Donor/               → DonorHeader, DonorPaymentTabs, DonorPromptPayForm, DonorBankForm, DonorTrueMoneyForm, DonorSlipUpload, DonorOfflineCard, DonorDisabledCard
│   ├── History/             → DonationHistoryTable
│   ├── MainPage/            → Navbar, Hero, Features, StreamerList, CTASection, Footer
│   ├── Payment/             → PaymentHeader, PromptPayCard, TrueMoneyCard, BankCard, ComingSoonCard
│   ├── Widget/              → WidgetHeader, WidgetTypeTabs, DonateAlertPanel, DonateGoalPanel, LeaderboardPanel, MissionDonatePanel, WidgetPreview, BrowserSourceCard, AccordionSection, AudioUploadField, widgetStorage.js
│   ├── Sidebar.jsx          → เมนูหลักซ้ายแบบ Sticky (มีเมนูทั่วไปและการชำระเงิน)
│   └── Topbar.jsx           → แถบเมนูด้านบนแบบ Sticky (มี Breadcrumb หน้าหลัก/Dashboard/ชื่อหน้า, กระดิ่งแจ้งเตือน, รูปโปรไฟล์)
├── pages/                   → หน้าระบบทั้ง 12 หน้า
├── utils/
│   └── passwordValidation.js→ ตรวจสอบความถูกต้องของรหัสผ่าน
├── App.js                   → การกำหนดเส้นทาง Routing ทั้งหมด
├── App.test.js              → Test พื้นฐาน (render หน้า Landing Page) ที่ CI ใช้
├── setupTests.js            → ตั้งค่า Jest (jest-dom และ polyfill TextEncoder/TextDecoder)
├── index.css                → สไตล์ CSS หลักและนำเข้า Font Kanit / Tailwind
└── index.js                 → React Root Mounting
```

---

## 7. กฎและข้อตกลงสำคัญในการพัฒนา (Key Conventions)

1. **ภาษาและข้อความ UI**: ข้อความทั้งหมดที่ผู้ใช้เห็น (Labels, Placeholders, Error Messages, Buttons) ให้ใช้ **ภาษาไทย** เสมอ
2. **ไอคอน**: ใช้ named imports จากไลบรารี `lucide-react` เท่านั้น (ยกเว้นโลโก้โซเชียลมีเดีย/แบรนด์ใช้ SVG inline)
3. **การตกแต่งและเลย์เอาต์**:
   - หน้าแดชบอร์ดและหน้าการจัดการทั้งหมดต้องมี **Sidebar** (`sticky top-0 h-screen z-30`) และ **Topbar** (`sticky top-0 z-40 backdrop-blur-xl`)
   - ห้ามใส่ `overflow-x: hidden` บน Container ชั้นนอกที่ครอบ Sidebar/Topbar เพราะจะทำให้ `position: sticky` ของเบราว์เซอร์ไม่ทำงาน
4. **ความปลอดภัยของรหัสผ่าน**: ฟังก์ชัน `utils/passwordValidation.js` มีการใช้งานเหมือนกันทั้งใน `client/` และ `server/` หากมีการปรับเงื่อนไข ต้องอัปเดตทั้ง 2 ฝั่งให้ตรงกัน
5. **การจัดการ State**: หน้า Donor และ Widget รองรับการซิงค์ข้อมูลผ่าน `localStorage` เป็นหลัก และพร้อมสำหรับการต่อยอดเชื่อมต่อ REST API / Cloud Database ในอนาคต
6. **ห้าม import ที่ไม่ได้ใช้ (ESLint warning)**: บน CI ตัวแปร `CI=true` ทำให้ warning กลายเป็น error และ build จะแดง
7. **การป้องกัน NoSQL Injection**: ทุก route ฝั่ง server ที่ query MongoDB ด้วยค่าจาก request ต้องทำตามรูปแบบในหัวข้อ 4.4 (ตรวจ `typeof` → ตัดสายด้วย `String()` → ครอบ `$eq`)

---

## 8. สถานะงานปัจจุบัน (Project Status)

| ส่วนงาน                                                             | สถานะ                                                                          |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Auth (register / login, JWT)                                        | ใช้งานได้จริง (Client → Server → MongoDB) ปิดช่องโหว่ NoSQL Injection แล้ว     |
| Dashboard, Payment, DonatePage, Account, History, Widget, DonorPage | UI เสร็จแล้ว ข้อมูลเก็บที่ `localStorage` ชั่วคราว                             |
| Models ฝั่ง Server                                                  | มีแค่ `User` (รวม `payment` และ `donationPage`)                                |
| Models ที่จะเพิ่ม                                                   | `Donation` (Phase 6), `Widget`, `Mission`, `Blacklist` (Phase 7) — ดูหัวข้อ 11 |
| Socket.IO                                                           | มี event `join-stream`, `disconnect`, `donation-alert` ยังไม่ผูกกับข้อมูลจริง  |
| CI (GitHub Actions) + branch protection                             | ใช้งานได้ (Phase 1 เสร็จ) `client` และ `server` ต้องผ่านก่อน merge เข้า `main` |
| SonarCloud                                                          | ใช้งานได้ (Phase 2 เสร็จ) Security: 0 open issues บน `main`                    |
| OCR ตรวจสลิป                                                        | ยังไม่ได้ทำ (ตามแผน Phase 8)                                                   |

**แนวทางย้ายจาก localStorage → MongoDB**

- ทุกหน้าเรียกข้อมูลผ่านไฟล์กลาง (เช่น `widgetStorage.js`) ห้ามเรียก `localStorage` ตรงๆ ในคอมโพเนนต์
- เมื่อมี API ให้แก้เฉพาะไฟล์กลาง เปลี่ยนจากอ่าน/เขียน localStorage เป็น `fetch` ไปยัง server

---

## 9. CI (GitHub Actions)

ไฟล์: `.github/workflows/ci.yml` รันตอน push เข้า `main` และตอนเปิด PR เข้า `main` ใช้ Node 22 และ npm 11

| Job      | ขั้นตอน                                                                                          |
| -------- | ------------------------------------------------------------------------------------------------ |
| `client` | `npm ci` แล้ว `npm test -- --watchAll=false` แล้ว `npm run build`                                |
| `server` | `npm ci` แล้ว `npm test --if-present` (ยังไม่มี test ฝั่ง server)                                |
| `sonar`  | checkout แบบ `fetch-depth: 0` แล้วสแกนด้วย `sonarqube-scan-action` (ต้องมี secret `SONAR_TOKEN`) |

**Branch protection บน `main`**

- ต้องเปิด PR เท่านั้น ห้าม push ตรง
- ต้องผ่านทั้ง `client` และ `server` ก่อน merge
- ต้องผ่าน `SonarCloud Code Analysis` (Quality Gate) ก่อน merge
- ต้องอัปเดต branch ให้ทันกับ `main` ก่อน merge
- ไม่บังคับ approval (ทีมเล็ก) แต่ควรให้เพื่อนรีวิวก่อน merge

**ตรวจในเครื่องก่อนเปิด PR** (ใน `client/`, Windows cmd):

```cmd
set CI=true&& npm run build
npm test -- --watchAll=false
```

**ค่าที่จำเป็นต่อ Jest (อย่าลบ)**

- `moduleNameMapper` ใน `client/package.json` ชี้ `react-router/dom` ไปที่ `dom-export.js` เพราะ Jest ของ CRA ไม่อ่านฟิลด์ `exports`
- polyfill `TextEncoder` / `TextDecoder` ใน `client/src/setupTests.js` เพราะ React Router v7 ต้องใช้แต่ jsdom ไม่มี

**แก้ปัญหา CI แดงที่เจอบ่อย**

| อาการ                                                | สาเหตุและวิธีแก้                                                                                                              |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `npm ci` แจ้ง `Missing ... from lock file`           | lock file สร้างด้วย npm คนละเวอร์ชัน ใช้ npm 11 รัน `npm install` ใน `client/` หรือ `server/` แล้ว commit `package-lock.json` |
| `Treating warnings as errors because process.env.CI` | มี ESLint warning (เช่น import ที่ไม่ได้ใช้) แก้ตามที่ log ระบุ                                                               |
| `Cannot find module ...` เฉพาะบน CI                  | ตัวพิมพ์ใหญ่เล็กของ path ใน `import` ไม่ตรงกับชื่อไฟล์จริง (Windows ไม่จับ Linux จับ)                                         |
| `Unable to find an element with the text ...`        | UI เปลี่ยนแต่ `App.test.js` ยังหา text เก่า แก้ test ให้ตรงกับหน้าจริง                                                        |

**SonarCloud**

- ไฟล์ตั้งค่า: `sonar-project.properties` ที่ root (กำหนด organization, project key, โฟลเดอร์ที่สแกน `client/src` และ `server`, ข้ามไฟล์ test)
- Secret: `SONAR_TOKEN` (GitHub repo แล้ว Settings แล้ว Secrets and variables แล้ว Actions) ห้ามใส่ token ในโค้ด
- Main Branch บน SonarCloud ต้องชื่อ `main` ให้ตรงกับ GitHub เป๊ะ (ถ้าตั้งผิดเป็น `master` ผลสแกนจาก CI จะไม่อัปเดตหน้า Overview เพราะแผนฟรีวิเคราะห์เฉพาะ Main Branch)
- Quality Gate ตรวจเฉพาะโค้ดใหม่ (New Code) ส่วนปัญหาเก่าเป็น baseline ค่อยๆ แก้ทีละ branch
- ดูผลสแกนที่ sonarcloud.io (โปรเจค `nekomanaja_Final-Project`) และในคอมเมนต์ของบอทบน PR
- ห้ามเปิด Automatic Analysis บน SonarCloud (ชนกับการสแกนผ่าน CI)
- แก้ Security/Bug ที่ Sonar แจ้ง: ดูรูปแบบการแก้ NoSQL Injection ในหัวข้อ 4.4 ก่อนเขียนวิธีแก้ใหม่

---

## 10. Git Workflow

1. `main` ต้องรันได้เสมอ ห้ามแก้หรือ push ตรงบน `main` (GitHub ล็อกไว้แล้ว ต้องผ่าน PR และ CI เขียว)
2. 1 feature = 1 branch แตกจาก `main` ล่าสุด ตั้งชื่อตัวพิมพ์เล็กทั้งหมด (เช่น `donor-page`)
   Windows แยกตัวพิมพ์ใหญ่เล็กไม่ได้ ชื่อ `History` กับ `history` จึงกลายเป็น branch ซ้ำบน GitHub
3. ไฟล์ร่วม (`Sidebar.jsx`, `Topbar.jsx`, `App.js`, `index.css`, `package.json`, `package-lock.json`, `utils/`, `.github/workflows/`) แก้ใน branch สั้นๆ แยกต่างหาก แล้ว merge เข้า `main` ทันที จากนั้นแจ้งทีมให้ `git pull origin main`
4. ก่อน commit: `git status` แล้ว `git add` เฉพาะไฟล์ที่ตั้งใจ ห้ามให้ `.env` และ `node_modules` หลุดเข้า repo
5. หลัง merge ที่แตะ `package.json` ให้รัน `npm install` ทั้ง `client/` และ `server/` (ใช้ npm 11) และ commit `package-lock.json` ที่เปลี่ยนด้วย
6. แก้ conflict ให้ไม่เหลือเครื่องหมาย `<<<<<<<` / `=======` / `>>>>>>>` ใน `App.js` ให้รวม route ของทั้งสองฝั่ง และ route `*` (NotFound) ต้องอยู่ล่างสุดเสมอ
7. ก่อนเปิด PR: รันใน `client/` ให้ผ่านทั้ง `set CI=true&& npm run build` และ `npm test -- --watchAll=false` และ `git status` ต้องสะอาด
8. ห้าม push เข้า branch ของเพื่อนโดยไม่แจ้งก่อน
9. ชื่อโฟลเดอร์และ `import` ต้องสะกดตัวพิมพ์ใหญ่เล็กตรงกัน (เช่น `Models/`) เพราะ deploy บน Linux (Render)
10. CI แดง ห้าม merge: กด Details ดู log แก้แล้ว push ซ้ำใน branch เดิม PR จะรัน CI ใหม่เอง

---

## 11. แผน Models ที่จะเพิ่ม (ตาม Phase)

ตอนนี้มีแค่ `User` เท่านั้น Model ใหม่จะทยอยเพิ่มตามลำดับ Phase ด้านล่าง **Phase 3 (รากฐาน backend) ไม่มีการสร้างหรือแก้ Model** เป็นแค่ middleware, error handler, validation และ test

| Model       | Phase | รายละเอียดคร่าวๆ                                                                                                                                   |
| ----------- | ----- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Donation`  | 6     | `streamerId`, `donorName`, `amount`, `message`, `paymentMethod`, `status`, `slipImage`, `missionId`, timestamps; index บน `streamerId + createdAt` |
| `Widget`    | 7     | เก็บ token สำหรับ URL Browser Source ของ OBS และการตั้งค่า Alert/Goal/Leaderboard/Mission ต่อผู้ใช้                                                |
| `Mission`   | 7     | ภารกิจโดเนทของแต่ละสตรีมเมอร์ (ชื่อ + ราคา) อ้างอิงจาก `missionId` ใน `Donation`                                                                   |
| `Blacklist` | 7     | รายชื่อ/คำที่ถูกบล็อกไม่ให้โดเนทหรือใช้ข้อความ                                                                                                     |

เมื่อถึง Phase ที่เกี่ยวข้อง ให้ออกแบบ schema แล้วอัปเดตหัวข้อ 4.2 (โครงสร้างไฟล์) และหัวข้อ 8 (สถานะงาน) ในเอกสารนี้ทันที
|
| `Blacklist` | 7 | รายชื่อ/คำที่ถูกบล็อกไม่ให้โดเนทหรือใช้ข้อความ |

เมื่อถึง Phase ที่เกี่ยวข้อง ให้ออกแบบ schema แล้วอัปเดตหัวข้อ 4.2 (โครงสร้างไฟล์) และหัวข้อ 8 (สถานะงาน) ในเอกสารนี้ทันที
