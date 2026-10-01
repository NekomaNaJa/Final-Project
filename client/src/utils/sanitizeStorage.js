/**
 * Sanitizes input string to prevent Browser Storage Poisoning and XSS
 * Removes HTML tags, script markers, and dangerous characters.
 */
export const sanitizeValue = (value) => {
  if (typeof value !== "string") {
    return value;
  }
  return value
    .replace(/<[^>]*>?/gm, "")
    .replace(/[<>"'&]/g, "")
    .trim();
};

/**
 * Recursively sanitizes objects or arrays before storage
 */
export const sanitizeData = (data) => {
  if (data === null || data === undefined) {
    return data;
  }
  if (typeof data === "string") {
    return sanitizeValue(data);
  }
  if (typeof data === "number" || typeof data === "boolean") {
    return data;
  }
  if (Array.isArray(data)) {
    return data.map((item) => sanitizeData(item));
  }
  if (typeof data === "object") {
    const clean = {};
    for (const key of Object.keys(data)) {
      clean[key] = sanitizeData(data[key]);
    }
    return clean;
  }
  return data;
};

/**
 * Safely writes data to localStorage after sanitization
 */
export const safeSetItem = (key, data) => {
  try {
    const sanitized = sanitizeData(data);
    localStorage.setItem(key, JSON.stringify(sanitized));
  } catch (error) {
    console.error(`Failed to safeSetItem for key "${key}":`, error);
  }
};

/**
 * Safely reads data from localStorage with fallback
 */
export const safeGetItem = (key, defaultValue = {}) => {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return defaultValue;
    return JSON.parse(stored) || defaultValue;
  } catch {
    return defaultValue;
  }
};
