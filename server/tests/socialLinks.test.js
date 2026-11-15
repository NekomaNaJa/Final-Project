import {
  ALLOWED_SOCIAL_PLATFORMS,
  MAX_SOCIAL_INPUT_LENGTH,
  isValidSocialHandle,
  normalizeSocialLink,
  validateSocialPayload,
  sanitizeStoredSocialLinks,
} from "../utils/socialLinks.js";

describe("socialLinks Utility", () => {
  describe("isValidSocialHandle", () => {
    it("accepts valid handles with alphanumeric, underscore, hyphen, and interior dots", () => {
      expect(isValidSocialHandle("streamer_01")).toBe(true);
      expect(isValidSocialHandle("my.channel-name")).toBe(true);
      expect(isValidSocialHandle("UC1234567890abcdef")).toBe(true);
    });

    it("rejects non-strings, empty strings, overlong strings, and reserved words", () => {
      expect(isValidSocialHandle(null)).toBe(false);
      expect(isValidSocialHandle(123)).toBe(false);
      expect(isValidSocialHandle("")).toBe(false);
      expect(isValidSocialHandle("a".repeat(61))).toBe(false);
      expect(isValidSocialHandle("watch")).toBe(false);
      expect(isValidSocialHandle("profile.php")).toBe(false);
      expect(isValidSocialHandle("login")).toBe(false);
    });

    it("rejects leading/trailing dots, consecutive dots, and invalid characters", () => {
      expect(isValidSocialHandle(".leading")).toBe(false);
      expect(isValidSocialHandle("trailing.")).toBe(false);
      expect(isValidSocialHandle("two..dots")).toBe(false);
      expect(isValidSocialHandle("has space")).toBe(false);
      expect(isValidSocialHandle("has/slash")).toBe(false);
      expect(isValidSocialHandle("has@at")).toBe(false);
      expect(isValidSocialHandle("bad<script>")).toBe(false);
    });
  });

  describe("normalizeSocialLink", () => {
    it("rejects unknown or non-string platform", () => {
      expect(normalizeSocialLink("myspace", "user")).toEqual({
        valid: false,
        value: "",
        error: "แพลตฟอร์มโซเชียลมีเดียไม่ถูกต้อง",
      });
      expect(normalizeSocialLink(null, "user")).toEqual({
        valid: false,
        value: "",
        error: "แพลตฟอร์มโซเชียลมีเดียไม่ถูกต้อง",
      });
    });

    it("rejects non-string input values", () => {
      expect(normalizeSocialLink("facebook", 12345)).toEqual({
        valid: false,
        value: "",
        error: "ข้อมูลโซเชียล facebook ไม่ถูกต้อง",
      });
      expect(normalizeSocialLink("youtube", { $ne: "" })).toEqual({
        valid: false,
        value: "",
        error: "ข้อมูลโซเชียล youtube ไม่ถูกต้อง",
      });
    });

    it("returns empty canonical value when input is empty or whitespace", () => {
      expect(normalizeSocialLink("facebook", "")).toEqual({
        valid: true,
        value: "",
        handle: "",
      });
      expect(normalizeSocialLink("twitch", "   ")).toEqual({
        valid: true,
        value: "",
        handle: "",
      });
    });

    it("normalizes plain handles and @handles for all 6 platforms", () => {
      expect(normalizeSocialLink("facebook", "my_page")).toEqual({
        valid: true,
        value: "https://facebook.com/my_page",
        handle: "@my_page",
      });
      expect(normalizeSocialLink("facebook", "@my_page")).toEqual({
        valid: true,
        value: "https://facebook.com/my_page",
        handle: "@my_page",
      });
      expect(normalizeSocialLink("instagram", "@ig.creator")).toEqual({
        valid: true,
        value: "https://instagram.com/ig.creator",
        handle: "@ig.creator",
      });
      expect(normalizeSocialLink("youtube", "yt_gamer")).toEqual({
        valid: true,
        value: "https://youtube.com/@yt_gamer",
        handle: "@yt_gamer",
      });
      expect(normalizeSocialLink("tiktok", "tiktok_user")).toEqual({
        valid: true,
        value: "https://tiktok.com/@tiktok_user",
        handle: "@tiktok_user",
      });
      expect(normalizeSocialLink("tiktok", "@tiktok_user")).toEqual({
        valid: true,
        value: "https://tiktok.com/@tiktok_user",
        handle: "@tiktok_user",
      });
      expect(normalizeSocialLink("twitch", "@pro_streamer")).toEqual({
        valid: true,
        value: "https://twitch.tv/pro_streamer",
        handle: "@pro_streamer",
      });
      expect(normalizeSocialLink("x", "x_account")).toEqual({
        valid: true,
        value: "https://x.com/x_account",
        handle: "@x_account",
      });
    });

    it("normalizes valid profile URLs per platform including www, mobile, and alias domains", () => {
      expect(
        normalizeSocialLink("facebook", "https://www.facebook.com/fb_streamer")
      ).toEqual({
        valid: true,
        value: "https://facebook.com/fb_streamer",
        handle: "@fb_streamer",
      });
      expect(normalizeSocialLink("facebook", "https://fb.com/fb_short")).toEqual({
        valid: true,
        value: "https://facebook.com/fb_short",
        handle: "@fb_short",
      });
      expect(
        normalizeSocialLink("instagram", "https://www.instagram.com/insta_star")
      ).toEqual({
        valid: true,
        value: "https://instagram.com/insta_star",
        handle: "@insta_star",
      });
      expect(
        normalizeSocialLink("tiktok", "https://www.tiktok.com/@tt_creator")
      ).toEqual({
        valid: true,
        value: "https://tiktok.com/@tt_creator",
        handle: "@tt_creator",
      });
      expect(
        normalizeSocialLink("twitch", "https://www.twitch.tv/twitch_hero")
      ).toEqual({
        valid: true,
        value: "https://twitch.tv/twitch_hero",
        handle: "@twitch_hero",
      });
      expect(
        normalizeSocialLink("x", "https://twitter.com/legacy_bird")
      ).toEqual({
        valid: true,
        value: "https://x.com/legacy_bird",
        handle: "@legacy_bird",
      });
      expect(normalizeSocialLink("x", "https://www.x.com/new_x")).toEqual({
        valid: true,
        value: "https://x.com/new_x",
        handle: "@new_x",
      });
    });

    it("supports all YouTube URL variants (/@name, /channel/UC..., /c/name, /user/name)", () => {
      expect(
        normalizeSocialLink("youtube", "https://www.youtube.com/@AlphaHandle")
      ).toEqual({
        valid: true,
        value: "https://youtube.com/@AlphaHandle",
        handle: "@AlphaHandle",
      });
      expect(
        normalizeSocialLink(
          "youtube",
          "https://youtube.com/channel/UC_x5XG1OV2P6uZZ5FSM9Ttw"
        )
      ).toEqual({
        valid: true,
        value: "https://youtube.com/channel/UC_x5XG1OV2P6uZZ5FSM9Ttw",
        handle: "UC_x5XG1OV2P6uZZ5FSM9Ttw",
      });
      expect(
        normalizeSocialLink("youtube", "https://www.youtube.com/c/CustomName")
      ).toEqual({
        valid: true,
        value: "https://youtube.com/c/CustomName",
        handle: "@CustomName",
      });
      expect(
        normalizeSocialLink("youtube", "https://m.youtube.com/user/LegacyUser")
      ).toEqual({
        valid: true,
        value: "https://youtube.com/user/LegacyUser",
        handle: "@LegacyUser",
      });
      expect(
        normalizeSocialLink("youtube", "https://youtube.com/c/@CustomWithAt")
      ).toEqual({
        valid: true,
        value: "https://youtube.com/c/CustomWithAt",
        handle: "@CustomWithAt",
      });
    });

    it("upgrades http: URLs to https:, normalizes uppercase hosts, and strips trailing slashes/query/hash", () => {
      expect(
        normalizeSocialLink(
          "instagram",
          "http://WWW.INSTAGRAM.COM/MyProfile/?igsh=abc123#bio"
        )
      ).toEqual({
        valid: true,
        value: "https://instagram.com/MyProfile",
        handle: "@MyProfile",
      });
      expect(
        normalizeSocialLink(
          "facebook",
          "HTTP://FACEBOOK.COM/MyPage///?ref=bookmarks"
        )
      ).toEqual({
        valid: true,
        value: "https://facebook.com/MyPage",
        handle: "@MyPage",
      });
    });

    it("rejects URLs with wrong host or cross-platform host", () => {
      expect(
        normalizeSocialLink("facebook", "https://evil.com/my_page").valid
      ).toBe(false);
      expect(
        normalizeSocialLink("facebook", "https://instagram.com/my_page").valid
      ).toBe(false);
      expect(
        normalizeSocialLink("youtube", "https://notyoutube.com/@channel").valid
      ).toBe(false);
    });

    it("rejects dangerous schemes (javascript:, data:, vbscript:, ftp:, protocol-relative)", () => {
      expect(
        normalizeSocialLink("facebook", "javascript:alert(1)").valid
      ).toBe(false);
      expect(
        normalizeSocialLink(
          "instagram",
          "data:text/html,<script>alert(1)</script>"
        ).valid
      ).toBe(false);
      expect(
        normalizeSocialLink("twitch", "ftp://twitch.tv/streamer").valid
      ).toBe(false);
      expect(
        normalizeSocialLink("x", "//x.com/streamer").valid
      ).toBe(false);
    });

    it("rejects URLs with credentials, custom ports, missing path, or extra path segments", () => {
      expect(
        normalizeSocialLink("facebook", "https://user:pass@facebook.com/page")
          .valid
      ).toBe(false);
      expect(
        normalizeSocialLink("facebook", "https://user@facebook.com/page").valid
      ).toBe(false);
      expect(
        normalizeSocialLink("facebook", "https://facebook.com:8080/page").valid
      ).toBe(false);
      expect(normalizeSocialLink("facebook", "https://facebook.com/").valid).toBe(
        false
      );
      expect(
        normalizeSocialLink("facebook", "https://facebook.com/user/posts/123")
          .valid
      ).toBe(false);
      expect(
        normalizeSocialLink("youtube", "https://youtube.com/watch?v=123").valid
      ).toBe(false);
      expect(
        normalizeSocialLink("youtube", "https://youtube.com/invalid_prefix/abc")
          .valid
      ).toBe(false);
      expect(
        normalizeSocialLink("youtube", "https://youtube.com/c/a/b").valid
      ).toBe(false);
      expect(
        normalizeSocialLink("youtube", "https://youtube.com/c/..").valid
      ).toBe(false);
      expect(
        normalizeSocialLink("facebook", "https://facebook.com/..").valid
      ).toBe(false);
      expect(
        normalizeSocialLink("facebook", "https://[invalid-url").valid
      ).toBe(false);
    });

    it("rejects invalid bare handles with special characters or empty @", () => {
      expect(normalizeSocialLink("facebook", "bad!handle")).toEqual({
        valid: false,
        value: "",
        error: "ชื่อบัญชี Facebook ไม่ถูกต้อง",
      });
      expect(normalizeSocialLink("instagram", "@")).toEqual({
        valid: false,
        value: "",
        error: "ชื่อบัญชี Instagram ไม่ถูกต้อง",
      });
    });

    it("rejects over-length input and completes in < 20ms on very long malformed input (no ReDoS)", () => {
      const overLength = `https://facebook.com/${"a".repeat(MAX_SOCIAL_INPUT_LENGTH)}`;
      expect(normalizeSocialLink("facebook", overLength).valid).toBe(false);

      const start = Date.now();
      const hugeMalformed = `https://facebook.com/${"a".repeat(100000)}!@#$%`;
      const res = normalizeSocialLink("facebook", hugeMalformed);
      const elapsed = Date.now() - start;

      expect(res.valid).toBe(false);
      expect(elapsed).toBeLessThan(20);
    });
  });

  describe("validateSocialPayload & sanitizeStoredSocialLinks", () => {
    it("rejects non-object social payloads", () => {
      expect(validateSocialPayload(null).valid).toBe(false);
      expect(validateSocialPayload("bad").valid).toBe(false);
      expect(validateSocialPayload([]).valid).toBe(false);
    });

    it("returns error when any platform in validateSocialPayload is invalid", () => {
      const res = validateSocialPayload({
        facebook: "@valid_fb",
        twitch: "https://evil.com/not_twitch",
      });
      expect(res.valid).toBe(false);
      expect(res.data).toBeNull();
      expect(res.error).toContain("Twitch");
    });

    it("validates and normalizes all allowed platforms and ignores unknown keys", () => {
      const res = validateSocialPayload({
        facebook: "@fb_user",
        youtube: "https://www.youtube.com/c/MyChannel/",
        twitch: "",
        unknownKey: "ignored",
      });
      expect(res).toEqual({
        valid: true,
        error: null,
        data: {
          facebook: "https://facebook.com/fb_user",
          youtube: "https://youtube.com/c/MyChannel",
          twitch: "",
        },
      });
    });

    it("sanitizes stored/legacy social links safely on read, clearing invalid ones", () => {
      const sanitized = sanitizeStoredSocialLinks({
        facebook: "legacy_fb_handle",
        instagram: "https://www.instagram.com/valid_ig/?hl=th",
        youtube: "javascript:alert(1)",
        tiktok: "https://evil.com/@hacker",
        twitch: "   ",
        x: 12345,
      });

      expect(sanitized).toEqual({
        facebook: "https://facebook.com/legacy_fb_handle",
        instagram: "https://instagram.com/valid_ig",
        youtube: "",
        tiktok: "",
        twitch: "",
        x: "",
      });
      expect(Object.keys(sanitized)).toEqual(ALLOWED_SOCIAL_PLATFORMS);
    });

    it("returns all empty strings when sanitizeStoredSocialLinks receives null or undefined", () => {
      expect(sanitizeStoredSocialLinks(null)).toEqual({
        facebook: "",
        instagram: "",
        youtube: "",
        tiktok: "",
        twitch: "",
        x: "",
      });
    });
  });
});
