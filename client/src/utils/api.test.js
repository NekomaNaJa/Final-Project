import {
  API,
  API_URL,
  getAuthToken,
  getAuthHeaders,
  fetchCurrentUser,
  updateCurrentUser,
} from "./api";

describe("API utility functions", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.restoreAllMocks();
  });

  test("API endpoints are properly defined", () => {
    expect(API.login).toBe(`${API_URL}/auth/login`);
    expect(API.register).toBe(`${API_URL}/auth/register`);
    expect(API.usersMe).toBe(`${API_URL}/users/me`);
  });

  test("getAuthToken returns token or empty string", () => {
    expect(getAuthToken()).toBe("");
    localStorage.setItem("token", "mock-token-xyz");
    expect(getAuthToken()).toBe("mock-token-xyz");
  });

  test("getAuthHeaders includes Content-Type and Authorization when token exists", () => {
    expect(getAuthHeaders()).toEqual({
      "Content-Type": "application/json",
    });

    localStorage.setItem("token", "bearer-token-123");
    expect(getAuthHeaders()).toEqual({
      "Content-Type": "application/json",
      Authorization: "Bearer bearer-token-123",
    });
  });

  test("fetchCurrentUser fetches successfully and returns data", async () => {
    const mockUserData = { username: "streamer_one", email: "one@donix.app" };
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: "สำเร็จ", data: mockUserData }),
    });

    localStorage.setItem("token", "valid-token");
    const result = await fetchCurrentUser();

    expect(result).toEqual(mockUserData);
    expect(global.fetch).toHaveBeenCalledWith(API.usersMe, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer valid-token",
      },
    });
  });

  test("fetchCurrentUser throws error when response is not ok", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: "ไม่ได้รับอนุญาต" }),
    });

    await expect(fetchCurrentUser()).rejects.toThrow("ไม่ได้รับอนุญาต");
  });

  test("fetchCurrentUser throws fallback error when response has no message", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      json: async () => ({}),
    });

    await expect(fetchCurrentUser()).rejects.toThrow("ไม่สามารถดึงข้อมูลผู้ใช้ได้");
  });

  test("updateCurrentUser sends PUT request with payload and returns updated data", async () => {
    const payload = { nickname: "NewNick" };
    const mockUpdated = { username: "streamer_one", nickname: "NewNick" };

    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: "อัปเดตสำเร็จ", data: mockUpdated }),
    });

    localStorage.setItem("token", "valid-token");
    const result = await updateCurrentUser(payload);

    expect(result).toEqual(mockUpdated);
    expect(global.fetch).toHaveBeenCalledWith(API.usersMe, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer valid-token",
      },
      body: JSON.stringify(payload),
    });
  });

  test("updateCurrentUser throws error when response is not ok", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: "ข้อมูลไม่ถูกต้อง" }),
    });

    await expect(updateCurrentUser({ nickname: 123 })).rejects.toThrow("ข้อมูลไม่ถูกต้อง");
  });

  test("updateCurrentUser throws fallback error when response has no message", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      json: async () => ({}),
    });

    await expect(updateCurrentUser({})).rejects.toThrow("ไม่สามารถอัปเดตข้อมูลผู้ใช้ได้");
  });
});
