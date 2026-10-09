const STORAGE_KEY = "donix_widget_config";

export const WIDGET_TYPES = [
  {
    id: "alert",
    label: "Donate Alert",
    description: "แจ้งเตือนเมื่อมีโดเนทเข้ามาแบบเรียลไทม์",
  },
  {
    id: "goal",
    label: "Donate Goal",
    description: "แถบความคืบหน้าเป้าหมายยอดโดเนท",
  },
  {
    id: "leaderboard",
    label: "Leaderboard",
    description: "จัดอันดับผู้สนับสนุนสูงสุด",
  },
  {
    id: "mission",
    label: "Mission Donate",
    description: "ภารกิจโดเนทแบบกำหนดเป้าหมายรายช่อง",
  },
];

export const SOUND_PRESETS = [
  { id: "mythic-horn", label: "Mythic Horn" },
  { id: "dragon-roar", label: "Dragon Roar" },
  { id: "ancient-bell", label: "Ancient Bell" },
  { id: "custom", label: "เสียงของฉัน (Custom)" },
  { id: "none", label: "ไม่มีเสียง" },
];

export const TTS_VOICES = [
  { id: "th-female", label: "Thai หญิง (สิริพร)" },
  { id: "th-male", label: "Thai ชาย (สมชาย)" },
];

export const TTS_SPEEDS = ["0.5x", "0.75x", "1.0x", "1.25x", "1.5x", "2.0x"];

export const FONT_OPTIONS = [
  { id: "Kanit", label: "Kanit (มาตรฐาน)" },
  { id: "FC Vision", label: "FC Vision" },
];

export const FONT_WEIGHTS = [
  { id: "400", label: "Regular (400)" },
  { id: "500", label: "Medium (500)" },
  { id: "700", label: "Bold (700)" },
  { id: "800", label: "ExtraBold (800)" },
];

export const ANIMATIONS_IN = [
  { id: "fadeIn", label: "Fade In (เลือนเข้า)" },
  { id: "slideInDown", label: "Slide In Down (เลื่อนลง)" },
  { id: "slideInUp", label: "Slide In Up (เลื่อนขึ้น)" },
  { id: "zoomIn", label: "Zoom In (ขยายเข้า)" },
  { id: "bounceIn", label: "Bounce In (เด้งเข้า)" },
  { id: "flipInX", label: "Flip In X (หมุนเข้า)" },
];

export const ANIMATIONS_OUT = [
  { id: "fadeOut", label: "Fade Out (เลือนออก)" },
  { id: "slideOutUp", label: "Slide Out Up (เลื่อนขึ้น)" },
  { id: "slideOutDown", label: "Slide Out Down (เลื่อนลง)" },
  { id: "zoomOut", label: "Zoom Out (ย่อออก)" },
  { id: "bounceOut", label: "Bounce Out (เด้งออก)" },
  { id: "flipOutX", label: "Flip Out X (หมุนออก)" },
];

export const FILTER_EFFECTS = [
  { id: "None", label: "None (ไม่มี)" },
  { id: "Glow", label: "Glow (เรืองแสง)" },
  { id: "Pulse", label: "Pulse (เต้นเป็นจังหวะ)" },
  { id: "Shake", label: "Shake (สั่นสะเทือน)" },
  { id: "Glitch", label: "Glitch (กลิทช์ไซเบอร์)" },
  { id: "Wave", label: "Wave (คลื่นน้ำ)" },
  { id: "Random Direction", label: "Random Direction (สุ่มทิศทาง)" },
];

export const GOAL_THEMES = [
  {
    id: "mana",
    label: "Mana",
    desc: "ม่วงครามลึกลับ Mana",
    color: "#a855f7",
    gradient: "from-[#8b5cf6] to-[#6366f1]",
    glow: "rgba(168,85,247,0.5)",
  },
  {
    id: "crimson",
    label: "Crimson",
    desc: "แดงทับทิมร้อนแรง Crimson",
    color: "#ef4444",
    gradient: "from-[#ef4444] to-[#f43f5e]",
    glow: "rgba(239,68,68,0.5)",
  },
  {
    id: "gold",
    label: "Gold",
    desc: "ทองคำประกายเจิดจรัส Gold",
    color: "#eab308",
    gradient: "from-[#eab308] to-[#f59e0b]",
    glow: "rgba(234,179,8,0.5)",
  },
];

export const DEFAULT_WIDGET_CONFIG = {
  alert: {
    minAmount: 10,
    overlayImage: null,
    soundPreset: "mythic-horn",
    customSoundFile: null,
    volume: 80,
    ttsEnabled: true,
    ttsVoice: "th-female",
    ttsVolume: 80,
    ttsSpeed: "1.0x",
    template: "{user} โดเนท {amount} บาท",
    shineEffect: true,
    fontFamily: "Kanit",
    fontWeight: "700",
    fontSize: 28,
    textColor: "#ffffff",
    strokeSize: 2,
    strokeColor: "#000000",
    userNameColor: "#c084fc",
    amountColor: "#fbbf24",
    animationIn: "bounceIn",
    animationOut: "fadeOut",
    durationIn: 0.8,
    durationDisplay: 5,
    durationOut: 0.8,
    filterEffect: "Glow",
    useAmountTiers: false,
    amountTiers: [
      { id: "tier-1", min: 1, max: 99, image: null, sound: "mythic-horn" },
      { id: "tier-2", min: 100, max: 499, image: null, sound: "dragon-roar" },
      { id: "tier-3", min: 500, max: 999999, image: null, sound: "ancient-bell" },
    ],
  },
  goal: {
    title: "เป้าหมายพัฒนาสตรีม",
    theme: "mana",
    target: 10000,
    current: 3500,
    startDate: "2026-09-01",
    endDate: "2026-09-30",
  },
  leaderboard: {
    title: "TOP DONORS ประจำเดือน",
    showAmount: true,
    startDate: "2026-09-01",
    endDate: "2026-09-30",
    limit: 5,
  },
  mission: {
    title: "ภารกิจสตรีมเมอร์วันนี้",
    missions: [
      { id: "m-1", name: "เล่นเกมมือเดียว 1 ตา", price: 50 },
      { id: "m-2", name: "ดื่มน้ำ 1 แก้วใหญ่", price: 20 },
      { id: "m-3", name: "ร้องเพลงตามคำขอ 1 เพลง", price: 100 },
      { id: "m-4", name: "เล่นตัวละครที่คนดูโหวต", price: 150 },
    ],
  },
};

export const getWidgetConfig = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    return {
      alert: { ...DEFAULT_WIDGET_CONFIG.alert, ...saved.alert },
      goal: { ...DEFAULT_WIDGET_CONFIG.goal, ...saved.goal },
      leaderboard: { ...DEFAULT_WIDGET_CONFIG.leaderboard, ...saved.leaderboard },
      mission: { ...DEFAULT_WIDGET_CONFIG.mission, ...saved.mission },
    };
  } catch {
    return { ...DEFAULT_WIDGET_CONFIG };
  }
};

export const saveWidgetConfig = (config) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config)); // NOSONAR
};

export const getBrowserSourceUrl = (type, username) => {
  const origin = window.location.origin;
  return `${origin}/overlay/${type}/${username || "guest"}`;
};
