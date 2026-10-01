import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AccountProfileCard from "./AccountProfileCard";
import ManageAccountCard from "./ManageAccountCard";
import AccountTabs from "./AccountTabs";

describe("Account Components", () => {
  describe("AccountProfileCard", () => {
    beforeEach(() => {
      localStorage.clear();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("แสดงชื่อผู้ใช้ ตัวอักษรแรก และลิงก์ donix", () => {
      render(<AccountProfileCard user={{ username: "streamer_pro" }} />);

      expect(screen.getByText("streamer_pro")).toBeInTheDocument();
      expect(screen.getByText("S")).toBeInTheDocument();
      expect(screen.getByText("donix.app/streamer_pro")).toBeInTheDocument();
    });

    it("ใช้ค่า default เมื่อไม่มีข้อมูลผู้ใช้", () => {
      render(<AccountProfileCard />);

      expect(screen.getByText("Test")).toBeInTheDocument();
      expect(screen.getByText("donix.app/Test")).toBeInTheDocument();
      // วันที่สมัคร / อายุ / ผู้ติดตาม ไม่มีข้อมูลจึงแสดง dash
      expect(screen.getAllByText("—")).toHaveLength(3);
    });

    it("แปลงวันที่สมัครสมาชิกเป็นวันที่แบบไทย", () => {
      const { container } = render(
        <AccountProfileCard user={{ username: "tester", joinedAt: "2026-01-15" }} />,
      );

      const joinedValue = container
        .querySelector("p + p")
        .textContent.trim();

      expect(joinedValue).not.toBe("—");
      expect(joinedValue).toMatch(/\d/);
    });

    it("คัดลอกลิงก์แล้วแสดงไอคอนเครื่องหมายถูกชั่วครู่", async () => {
      const writeText = jest.fn().mockResolvedValue(undefined);
      Object.assign(navigator, { clipboard: { writeText } });
      jest.useFakeTimers();

      render(<AccountProfileCard user={{ username: "streamer_pro" }} />);

      fireEvent.click(screen.getByTitle("คัดลอกลิงก์"));
      expect(writeText).toHaveBeenCalledWith(
        "https://donix.app/streamer_pro",
      );

      jest.advanceTimersByTime(2000);
      expect(writeText).toHaveBeenCalledTimes(1);
      jest.useRealTimers();
    });

    it("ไม่พังเมื่อ browser ไม่รองรับ clipboard", () => {
      Object.assign(navigator, { clipboard: undefined });

      render(<AccountProfileCard user={{ username: "nobody" }} />);
      fireEvent.click(screen.getByTitle("คัดลอกลิงก์"));

      expect(screen.getByText("donix.app/nobody")).toBeInTheDocument();
    });

    it("แสดงอายุและจำนวนผู้ติดตามเมื่อมีข้อมูล", () => {
      render(
        <AccountProfileCard
          user={{ username: "u", age: 24, followers: 1200 }}
        />,
      );

      expect(screen.getByText("24")).toBeInTheDocument();
      expect(screen.getByText("1200")).toBeInTheDocument();
    });
  });

  describe("ManageAccountCard", () => {
    it("แสดงค่าที่บันทึกไว้และป้ายสถานะ", () => {
      render(
        <ManageAccountCard
          user={{ email: "user@donix.app", phone: "0800000000" }}
        />,
      );

      expect(screen.getByText("user@donix.app")).toBeInTheDocument();
      expect(screen.getByText("0800000000")).toBeInTheDocument();
      expect(screen.getByText("ยืนยันแล้ว")).toBeInTheDocument();
      expect(screen.getByText("บันทึกแล้ว")).toBeInTheDocument();
    });

    it("แสดงค่า fallback และปุ่มเชื่อมต่อเมื่อยังไม่มีข้อมูล", () => {
      render(<ManageAccountCard user={{}} />);

      expect(screen.getByText("ยังไม่ได้ใส่อีเมล")).toBeInTheDocument();
      expect(screen.getByText("ยังไม่ได้ใส่เบอร์โทรศัพท์")).toBeInTheDocument();
      expect(screen.getAllByText("ยังไม่ได้เชื่อมต่อ")).toHaveLength(2);
      expect(
        screen.getAllByText("คลิกเพื่อเชื่อมต่อ").length,
      ).toBeGreaterThan(0);
    });

    it("ทำงานได้แม้ไม่ส่ง prop user เลย", () => {
      render(<ManageAccountCard />);

      expect(screen.getByText("จัดการบัญชี")).toBeInTheDocument();
    });
  });

  describe("AccountTabs", () => {
    it("แสดง tab โซเชียลมีเดียเป็นค่าเริ่มต้น", () => {
      render(<AccountTabs user={{ username: "u" }} />);

      expect(screen.getAllByText("โซเชียลมีเดีย")).toHaveLength(2);
      expect(screen.getByText("SOCIAL MEDIA")).toBeInTheDocument();
    });

    it("สลับไปยัง tab ข้อมูลผู้ใช้งานและเติมชื่อเล่นได้", () => {
      render(<AccountTabs user={{ username: "streamer_pro" }} />);

      fireEvent.click(screen.getByText("ข้อมูลผู้ใช้งาน"));
      expect(screen.getByText("USER INFORMATION")).toBeInTheDocument();

      const nickname = screen.getByDisplayValue("streamer_pro");
      fireEvent.change(nickname, { target: { value: "new_nick" } });
      expect(nickname).toHaveValue("new_nick");
    });

    it("สลับไปยัง tab ความปลอดภัยและแสดง/ซ่อนรหัสผ่านได้", () => {
      render(<AccountTabs user={{ username: "u" }} />);

      fireEvent.click(screen.getByText("ความปลอดภัย"));
      expect(screen.getByText("SECURITY")).toBeInTheDocument();

      const passwordInputs = screen.getAllByPlaceholderText("••••••••••••");
      expect(passwordInputs).toHaveLength(3);
      expect(passwordInputs[0]).toHaveAttribute("type", "password");

      fireEvent.click(screen.getAllByLabelText("แสดงรหัสผ่าน")[0]);
      expect(passwordInputs[0]).toHaveAttribute("type", "text");
      expect(
        screen.getAllByLabelText("ซ่อนรหัสผ่าน").length,
      ).toBeGreaterThan(0);
    });

    it("เปิด 2FA และบันทึกฟอร์มความปลอดภัยได้", () => {
      const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
      render(<AccountTabs user={{ username: "u" }} />);

      fireEvent.click(screen.getByText("ความปลอดภัย"));

      const twoFactor = screen.getByRole("switch");
      expect(twoFactor).toHaveAttribute("aria-checked", "false");
      fireEvent.click(twoFactor);
      expect(twoFactor).toHaveAttribute("aria-checked", "true");

      const passwordInputs = screen.getAllByPlaceholderText("••••••••••••");
      fireEvent.change(passwordInputs[0], {
        target: { name: "currentPassword", value: "Old12345!" },
      });
      fireEvent.click(screen.getByText("บันทึก"));

      // ต้องไม่ log ค่ารหัสผ่านออกไปที่ console
      expect(logSpy).toHaveBeenCalledWith("Saving security settings:", {
        twoFactorEnabled: true,
      });
      expect(logSpy).not.toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ currentPassword: "Old12345!" }),
      );
      logSpy.mockRestore();
    });

    it("เติมลิงก์โซเชียลและบันทึกได้", () => {
      const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
      render(<AccountTabs user={{ username: "u" }} />);

      const facebook = screen
        .getAllByPlaceholderText("ยังไม่ได้เชื่อมต่อ")
        .find((el) => el.tagName === "INPUT");
      fireEvent.change(facebook, {
        target: { value: "https://facebook.com/donix" },
      });

      expect(facebook).toHaveValue("https://facebook.com/donix");

      fireEvent.click(screen.getByText("บันทึก"));
      expect(logSpy).toHaveBeenCalledWith("Saving account social links");
      logSpy.mockRestore();
    });
  });

  describe("UserInfoTab", () => {
    it("เติมชื่อ-สกุล วันเกิด เพศ และเกี่ยวกับฉัน แล้วบันทึก", async () => {
      const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
      render(<AccountTabs user={{ username: "streamer_pro" }} />);
      fireEvent.click(screen.getByText("ข้อมูลผู้ใช้งาน"));

      fireEvent.change(screen.getByPlaceholderText("ชื่อ - นามสกุล"), {
        target: { name: "fullName", value: "โดนิก ทดสอบ" },
      });
      fireEvent.change(screen.getByPlaceholderText("DD / MM / YYYY"), {
        target: { name: "birthDate", value: "01/01/2000" },
      });
      fireEvent.change(screen.getByDisplayValue("ระบุเพศ"), {
        target: { name: "gender", value: "female" },
      });
      fireEvent.change(
        screen.getByPlaceholderText("แนะนำตัวสั้นๆ ให้ผู้ติดตามรู้จัก"),
        { target: { name: "bio", value: "สวัสดี" } },
      );

      fireEvent.click(screen.getByText("บันทึก"));
      await waitFor(() =>
        expect(logSpy).toHaveBeenCalledWith(
          "Saving user information:",
          expect.objectContaining({
            fullName: "โดนิก ทดสอบ",
            birthDate: "01/01/2000",
            gender: "female",
            bio: "สวัสดี",
          }),
        ),
      );
      logSpy.mockRestore();
    });

    it("ใช้ Test เป็นชื่อเล่นเริ่มต้นเมื่อไม่มีผู้ใช้", () => {
      render(<AccountTabs />);
      fireEvent.click(screen.getByText("ข้อมูลผู้ใช้งาน"));

      expect(screen.getByDisplayValue("Test")).toBeInTheDocument();
    });
  });
});
