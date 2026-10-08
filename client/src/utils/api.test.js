import {
  API,
  API_URL,
  getAuthToken,
  getAuthHeaders,
  fetchCurrentUser,
  updateCurrentUser,
  updatePaymentSettings,
  updateDonationPageSettings,
  fetchPublicStreamer,
  createDonation,
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
    expect(API.usersPayment).toBe(`${API_URL}/users/payment`);
    expect(API.usersDonationPage).toBe(`${API_URL}/users/donation-page`);
    expect(API.publicStreamer("streamer1")).toBe(`${API_URL}/public/streamer1`);
    expect(API.donations).toBe(`${API_URL}/donations`);
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

  test("updatePaymentSettings sends PUT to API.usersPayment and returns updated data", async () => {
    const payload = { promptpay: { enabled: true, type: "เบอร์โทรศัพท์", number: "0812345678" } };
    const mockPaymentData = { promptpay: { enabled: true, type: "เบอร์โทรศัพท์", number: "0812345678" } };

    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: "อัปเดตช่องทางรับเงินสำเร็จ", data: mockPaymentData }),
    });

    localStorage.setItem("token", "valid-token");
    const result = await updatePaymentSettings(payload);

    expect(result).toEqual(mockPaymentData);
    expect(global.fetch).toHaveBeenCalledWith(API.usersPayment, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer valid-token",
      },
      body: JSON.stringify(payload),
    });
  });

  test("updatePaymentSettings throws error when response is not ok", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: "ข้อมูลพร้อมเพย์ไม่ถูกต้อง" }),
    });

    await expect(updatePaymentSettings({ promptpay: "invalid" })).rejects.toThrow("ข้อมูลพร้อมเพย์ไม่ถูกต้อง");
  });

  test("updatePaymentSettings throws fallback error when response has no message", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      json: async () => ({}),
    });

    await expect(updatePaymentSettings({})).rejects.toThrow("ไม่สามารถอัปเดตช่องทางรับเงินได้");
  });

  test("updateDonationPageSettings sends PUT to API.usersDonationPage and returns updated data", async () => {
    const payload = {
      welcomeMessage: "ยินดีต้อนรับ",
      minAmount: 50,
    };
    const mockDonationData = {
      welcomeMessage: "ยินดีต้อนรับ",
      minAmount: 50,
    };

    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: "อัปเดตการตั้งค่าหน้ารับเงินสำเร็จ", data: mockDonationData }),
    });

    localStorage.setItem("token", "valid-token");
    const result = await updateDonationPageSettings(payload);

    expect(result).toEqual(mockDonationData);
    expect(global.fetch).toHaveBeenCalledWith(API.usersDonationPage, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer valid-token",
      },
      body: JSON.stringify(payload),
    });
  });

  test("updateDonationPageSettings throws error when response is not ok", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: "ข้อมูลการตั้งค่าหน้ารับเงินไม่ถูกต้อง" }),
    });

    await expect(updateDonationPageSettings({ minAmount: -10 })).rejects.toThrow(
      "ข้อมูลการตั้งค่าหน้ารับเงินไม่ถูกต้อง"
    );
  });

  test("updateDonationPageSettings throws fallback error when response has no message", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      json: async () => ({}),
    });

    await expect(updateDonationPageSettings({})).rejects.toThrow(
      "ไม่สามารถอัปเดตการตั้งค่าหน้ารับเงินได้"
    );
  });

  test("fetchPublicStreamer fetches public streamer data successfully", async () => {
    const mockPublicData = { username: "streamer_one", isLive: true };
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: "สำเร็จ", data: mockPublicData }),
    });

    const result = await fetchPublicStreamer("streamer_one");

    expect(result).toEqual(mockPublicData);
    expect(global.fetch).toHaveBeenCalledWith(API.publicStreamer("streamer_one"), {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
  });

  test("fetchPublicStreamer throws error on failure", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: "ไม่พบสตรีมเมอร์นี้" }),
    });

    await expect(fetchPublicStreamer("unknown")).rejects.toThrow(
      "ไม่พบสตรีมเมอร์นี้"
    );
  });

  test("fetchPublicStreamer throws fallback error on empty message", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      json: async () => ({}),
    });

    await expect(fetchPublicStreamer("unknown")).rejects.toThrow(
      "ไม่สามารถดึงข้อมูลสตรีมเมอร์ได้"
    );
  });

  test("createDonation creates donation successfully", async () => {
    const mockDonation = { id: "d123", amount: 100, status: "pending" };
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: "สำเร็จ", data: mockDonation }),
    });

    const payload = { username: "streamer_one", amount: 100, paymentMethod: "promptpay" };
    const result = await createDonation(payload);

    expect(result).toEqual(mockDonation);
    expect(global.fetch).toHaveBeenCalledWith(API.donations, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  });

  test("createDonation throws error on failure", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: "จำนวนเงินต้องมากกว่า 0 บาท" }),
    });

    await expect(createDonation({ amount: 0 })).rejects.toThrow(
      "จำนวนเงินต้องมากกว่า 0 บาท"
    );
  });

  test("createDonation throws fallback error on empty message", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      json: async () => ({}),
    });

    await expect(createDonation({})).rejects.toThrow(
      "ไม่สามารถสร้างรายการบริจาคได้"
    );
  });
});

