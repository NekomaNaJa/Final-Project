import {
  sanitizeValue,
  sanitizeData,
  safeSetItem,
  safeGetItem,
} from "./sanitizeStorage";

describe("sanitizeStorage utility", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe("sanitizeValue", () => {
    test("returns non-string values as is", () => {
      expect(sanitizeValue(123)).toBe(123);
      expect(sanitizeValue(true)).toBe(true);
      expect(sanitizeValue(null)).toBe(null);
      expect(sanitizeValue(undefined)).toBe(undefined);
    });

    test("strips HTML tags and dangerous characters", () => {
      expect(sanitizeValue("<script>alert('xss')</script>Hello")).toBe("alert(xss)Hello");
      expect(sanitizeValue("  <b>Bold</b>  ")).toBe("Bold");
      expect(sanitizeValue('Safe "value" & text')).toBe("Safe value  text");
    });
  });

  describe("sanitizeData", () => {
    test("handles primitives correctly", () => {
      expect(sanitizeData(42)).toBe(42);
      expect(sanitizeData(false)).toBe(false);
      expect(sanitizeData(null)).toBe(null);
      expect(sanitizeData("<div>clean</div>")).toBe("clean");
    });

    test("recursively cleans arrays", () => {
      const arr = ["<b>one</b>", 2, "<img src=x onerror=alert(1)>"];
      expect(sanitizeData(arr)).toEqual(["one", 2, ""]);
    });

    test("recursively cleans objects", () => {
      const obj = {
        title: "<h1>Title</h1>",
        count: 10,
        nested: {
          tag: "<span>tag</span>",
        },
      };
      expect(sanitizeData(obj)).toEqual({
        title: "Title",
        count: 10,
        nested: {
          tag: "tag",
        },
      });
    });
  });

  describe("safeSetItem and safeGetItem", () => {
    test("saves sanitized data to localStorage and retrieves it", () => {
      const data = {
        message: "Hello <script>bad</script>",
        amount: 50,
      };

      safeSetItem("test_key", data);
      const retrieved = safeGetItem("test_key");

      expect(retrieved).toEqual({
        message: "Hello bad",
        amount: 50,
      });
    });

    test("returns default value when key does not exist or JSON parsing fails", () => {
      expect(safeGetItem("non_existing", { fallback: true })).toEqual({
        fallback: true,
      });

      localStorage.setItem("corrupted", "{invalid_json");
      expect(safeGetItem("corrupted", { fallback: true })).toEqual({
        fallback: true,
      });
    });

    test("handles localStorage error gracefully in safeSetItem", () => {
      const spy = jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw new Error("QuotaExceeded");
      });
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      expect(() => safeSetItem("key", { test: 1 })).not.toThrow();
      expect(consoleSpy).toHaveBeenCalled();

      spy.mockRestore();
      consoleSpy.mockRestore();
    });
  });
});
