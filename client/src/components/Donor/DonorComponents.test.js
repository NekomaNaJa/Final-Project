import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import DonorHeader from "./DonorHeader";
import DonorPaymentTabs from "./DonorPaymentTabs";
import DonorOfflineCard from "./DonorOfflineCard";
import DonorDisabledCard from "./DonorDisabledCard";
import DonorStatusCard from "./DonorStatusCard";
import DonorPromptPayForm from "./DonorPromptPayForm";
import DonorBankForm from "./DonorBankForm";
import DonorTrueMoneyForm from "./DonorTrueMoneyForm";
import DonorSlipUpload from "./DonorSlipUpload";
import DonorMissionList from "./DonorMissionList";

describe("Donor Components", () => {
  describe("DonorHeader", () => {
    test("renders streamer name and live status badge when online", () => {
      render(
        <DonorHeader
          username="StreamerTest"
          isOnline={true}
          welcomeMessage="ยินดีต้อนรับครับ"
        />
      );
      expect(screen.getByText("StreamerTest")).toBeInTheDocument();
      expect(screen.getByText("LIVE")).toBeInTheDocument();
      expect(screen.getByText("ยินดีต้อนรับครับ")).toBeInTheDocument();
    });

    test("renders offline status badge when offline", () => {
      render(
        <DonorHeader
          username="StreamerTest"
          isOnline={false}
          welcomeMessage="ยินดีต้อนรับครับ"
        />
      );
      expect(screen.getByText("ออฟไลน์")).toBeInTheDocument();
    });
  });

  describe("DonorStatusCard & Variants", () => {
    test("renders custom status card", () => {
      render(<DonorStatusCard title="ปิดชั่วคราว" description="รายละเอียด" />);
      expect(screen.getByText("ปิดชั่วคราว")).toBeInTheDocument();
      expect(screen.getByText("รายละเอียด")).toBeInTheDocument();
    });

    test("renders DonorOfflineCard and DonorDisabledCard", () => {
      const { rerender } = render(<DonorOfflineCard />);
      expect(screen.getByText("ขณะนี้ปิดรับโดเนทชั่วคราว")).toBeInTheDocument();

      rerender(<DonorDisabledCard />);
      expect(screen.getByText("ไม่พร้อมให้บริการ")).toBeInTheDocument();
    });
  });

  describe("DonorPaymentTabs", () => {
    test("renders payment tabs and triggers tab change", () => {
      const handleTabChange = jest.fn();
      render(
        <DonorPaymentTabs activeTab="promptpay" onTabChange={handleTabChange} />
      );

      expect(screen.getByText("พร้อมเพย์")).toBeInTheDocument();
      expect(screen.getByText("ธนาคาร")).toBeInTheDocument();
      expect(screen.getByText("ทรูมันนี่")).toBeInTheDocument();

      fireEvent.click(screen.getByText("ธนาคาร"));
      expect(handleTabChange).toHaveBeenCalledWith("bank");
    });

    test("disables tab buttons and prevents tab change when disabled is true", () => {
      const handleTabChange = jest.fn();
      render(
        <DonorPaymentTabs
          activeTab="promptpay"
          onTabChange={handleTabChange}
          disabled={true}
        />
      );

      const bankBtn = screen.getByRole("button", { name: /ธนาคาร/i });
      expect(bankBtn).toBeDisabled();
      fireEvent.click(bankBtn);
      expect(handleTabChange).not.toHaveBeenCalled();
    });
  });

  describe("DonorPromptPayForm", () => {
    test("renders PromptPay form and handles amount validation", () => {
      const handleSubmit = jest.fn();
      window.alert = jest.fn();

      render(
        <DonorPromptPayForm
          minAmount={20}
          promptpayNumber="0812345678"
          onSubmit={handleSubmit}
        />
      );

      const amountInput = screen.getByPlaceholderText("ขั้นต่ำ 20 บาท");
      expect(amountInput.value).toBe("20");

      fireEvent.change(amountInput, { target: { value: "10" } });
      const submitBtn = screen.getByRole("button", { name: "ยืนยันการชำระเงิน" });
      fireEvent.click(submitBtn);

      expect(window.alert).toHaveBeenCalledWith("จำนวนเงินขั้นต่ำคือ 20 บาท");
      expect(handleSubmit).not.toHaveBeenCalled();
    });

    test("handles blur validation when amount is less than minAmount or NaN", () => {
      render(
        <DonorPromptPayForm
          minAmount={30}
          promptpayNumber="0812345678"
        />
      );

      const amountInput = screen.getByPlaceholderText("ขั้นต่ำ 30 บาท");
      fireEvent.change(amountInput, { target: { value: "5" } });
      fireEvent.blur(amountInput);
      expect(amountInput.value).toBe("30");

      fireEvent.change(amountInput, { target: { value: "invalid" } });
      fireEvent.blur(amountInput);
      expect(amountInput.value).toBe("30");
    });


    test("handles valid submission with slip in PromptPay form", () => {
      const handleSubmit = jest.fn();
      render(
        <DonorPromptPayForm
          minAmount={10}
          promptpayNumber="0812345678"
          onSubmit={handleSubmit}
        />
      );

      // Try submit without slip
      window.alert = jest.fn();
      const submitBtn = screen.getByRole("button", { name: "ยืนยันการชำระเงิน" });
      fireEvent.click(submitBtn);
      expect(window.alert).toHaveBeenCalledWith("กรุณาแนบรูปภาพสลิปการโอนเงินเพื่อยืนยัน");

      // Attach slip
      const fileInput = document.querySelector('input[type="file"]');
      const file = new File(["dummy"], "slip.png", { type: "image/png" });
      fireEvent.change(fileInput, { target: { files: [file] } });

      fireEvent.click(submitBtn);
      expect(handleSubmit).toHaveBeenCalledWith({
        amount: 10,
        slipFile: file,
        method: "promptpay",
      });
    });

    test("handles image onError fallback without infinite loop", () => {
      render(
        <DonorPromptPayForm
          minAmount={10}
          promptpayNumber="0812345678"
        />
      );

      const img = screen.getByAltText(/PromptPay QR/i);
      fireEvent.error(img);
      expect(img.src).toContain("api.qrserver.com");
    });
  });

  describe("DonorBankForm", () => {
    test("renders bank details and copies account number", () => {
      render(
        <DonorBankForm
          bankName="SCB"
          accountNumber="1234567890"
          accountName="นายสมหวัง"
          minAmount={50}
        />
      );

      expect(screen.getByText("SCB")).toBeInTheDocument();
      expect(screen.getByText("1234567890")).toBeInTheDocument();
      expect(screen.getByText("นายสมหวัง")).toBeInTheDocument();
      expect(screen.getByText("ยอดโดเนทขั้นต่ำ")).toBeInTheDocument();
      expect(screen.getAllByText(/50 บาท/).length).toBeGreaterThanOrEqual(1);

      const copyBtn = screen.getByTitle("คัดลอกเลขที่บัญชี");
      fireEvent.click(copyBtn);
      expect(screen.getByText("คัดลอกแล้ว")).toBeInTheDocument();
    });

    test("handles slip validation and submission in Bank form", () => {
      const handleSubmit = jest.fn();
      window.alert = jest.fn();

      render(
        <DonorBankForm
          bankName="SCB"
          accountNumber="1234567890"
          accountName="นายสมหวัง"
          onSubmit={handleSubmit}
        />
      );

      const submitBtn = screen.getByRole("button", { name: "ยืนยันการชำระเงิน" });
      fireEvent.click(submitBtn);
      expect(window.alert).toHaveBeenCalledWith("กรุณาแนบรูปภาพสลิปการโอนเงินเพื่อยืนยัน");

      // Attach slip
      const fileInput = document.querySelector('input[type="file"]');
      const file = new File(["dummy"], "slip.png", { type: "image/png" });
      fireEvent.change(fileInput, { target: { files: [file] } });

      fireEvent.click(submitBtn);
      expect(handleSubmit).toHaveBeenCalledWith({
        slipFile: file,
        method: "bank",
      });
    });
  });

  describe("DonorTrueMoneyForm", () => {
    test("validates gift link on submit", () => {
      const handleSubmit = jest.fn();
      window.alert = jest.fn();

      render(<DonorTrueMoneyForm onSubmit={handleSubmit} />);

      const input = screen.getByPlaceholderText("https://gift.truemoney.com/campaign/?v=xxxx");
      const submitBtn = screen.getByRole("button", { name: "ยืนยันการชำระเงิน" });

      // Empty submission
      fireEvent.click(submitBtn);
      expect(window.alert).toHaveBeenCalledWith("กรุณากรอกลิงก์ซองของขวัญทรูมันนี่ อั่งเปา");

      // Invalid submission
      fireEvent.change(input, { target: { value: "https://invalid-link.com" } });
      fireEvent.click(submitBtn);
      expect(window.alert).toHaveBeenCalledWith("กรุณากรอกลิงก์ซองของขวัญทรูมันนี่ที่ถูกต้อง");

      // Valid submission
      fireEvent.change(input, { target: { value: "https://gift.truemoney.com/campaign/?v=1234" } });
      fireEvent.click(submitBtn);
      expect(handleSubmit).toHaveBeenCalledWith({
        giftLink: "https://gift.truemoney.com/campaign/?v=1234",
        method: "truemoney",
      });
    });
  });

  describe("DonorSlipUpload", () => {
    test("handles file upload and file removal", () => {
      const handleSlip = jest.fn();
      global.URL.createObjectURL = jest.fn(() => "blob:http://localhost/sample-slip");

      const { container } = render(<DonorSlipUpload onSlipSelected={handleSlip} />);

      const fileInput = document.querySelector('input[type="file"]');
      const file = new File(["dummy content"], "slip.png", { type: "image/png" });

      fireEvent.change(fileInput, { target: { files: [file] } });

      expect(screen.getByAltText("Slip Preview")).toBeInTheDocument();
      expect(handleSlip).toHaveBeenCalledWith(file, "blob:http://localhost/sample-slip");

      const removeBtn = container.querySelector('button[type="button"]');
      fireEvent.click(removeBtn);
      expect(handleSlip).toHaveBeenCalledWith(null, null);
    });

    test("validates file type and rejects non-image", () => {
      window.alert = jest.fn();
      render(<DonorSlipUpload />);

      const fileInput = document.querySelector('input[type="file"]');
      const badFile = new File(["dummy"], "doc.pdf", { type: "application/pdf" });

      fireEvent.change(fileInput, { target: { files: [badFile] } });
      expect(window.alert).toHaveBeenCalledWith("รองรับเฉพาะไฟล์รูปภาพประเภท jpg, png, gif, webp เท่านั้น");
    });

    test("handles drag, drop, and keyboard events in DonorSlipUpload", () => {
      const handleSlip = jest.fn();
      render(<DonorSlipUpload onSlipSelected={handleSlip} />);

      const dropzone = screen.getByRole("button");
      fireEvent.dragOver(dropzone);
      fireEvent.dragLeave(dropzone);

      const file = new File(["dummy content"], "slip.png", { type: "image/png" });
      fireEvent.drop(dropzone, {
        dataTransfer: { files: [file] },
      });
      expect(handleSlip).toHaveBeenCalled();

      fireEvent.keyDown(dropzone, { key: "Enter" });
      fireEvent.keyDown(dropzone, { key: " " });
    });
  });

  describe("DonorBankForm additional coverage", () => {
    test("handles bank form submission with slip", () => {
      const handleSubmit = jest.fn();
      render(<DonorBankForm onSubmit={handleSubmit} />);

      const file = new File(["dummy"], "slip.png", { type: "image/png" });
      const fileInput = document.querySelector('input[type="file"]');
      fireEvent.change(fileInput, { target: { files: [file] } });

      const submitBtn = screen.getByRole("button", { name: "ยืนยันการชำระเงิน" });
      fireEvent.click(submitBtn);
      expect(handleSubmit).toHaveBeenCalled();
    });

    test("handles copy button click in DonorBankForm", () => {
      render(<DonorBankForm accountNumber="123-456" />);
      const copyBtn = screen.getByRole("button", { name: /คัดลอก/i });
      fireEvent.click(copyBtn);
    });

    test("renders selectedMission badge in DonorBankForm", () => {
      const mockMission = { id: "m-1", name: "เล่นเกมมือเดียว", price: 50 };
      render(<DonorBankForm selectedMission={mockMission} />);

      expect(screen.getByTestId("bank-mission-badge")).toBeInTheDocument();
      expect(screen.getByText("เล่นเกมมือเดียว")).toBeInTheDocument();
      expect(screen.getByText("50 บาท")).toBeInTheDocument();
    });
  });

  describe("DonorPromptPayForm with Mission", () => {
    test("syncs amount with presetAmount and shows selectedMission badge", () => {
      const mockMission = { id: "m-2", name: "ร้องเพลง", price: 100 };
      const { rerender } = render(
        <DonorPromptPayForm
          minAmount={10}
          presetAmount={100}
          selectedMission={mockMission}
        />
      );

      const amountInput = screen.getByRole("spinbutton");
      expect(amountInput.value).toBe("100");
      expect(screen.getByTestId("promptpay-mission-badge")).toBeInTheDocument();
      expect(screen.getByText("ร้องเพลง")).toBeInTheDocument();

      // Rerender with different presetAmount
      rerender(
        <DonorPromptPayForm
          minAmount={10}
          presetAmount={200}
          selectedMission={{ id: "m-3", name: "เต้น 1 เพลง", price: 200 }}
        />
      );
      expect(amountInput.value).toBe("200");
      expect(screen.getByText("เต้น 1 เพลง")).toBeInTheDocument();
    });
  });

  describe("DonorMissionList", () => {
    const mockMissions = [
      { id: "m-1", name: "ดื่มน้ำ 1 แก้ว", price: 20 },
      { id: "m-2", name: "เล่นเกมไม่พูด 1 ตา", price: 50 },
    ];

    test("renders null when missions list is empty", () => {
      const { container } = render(
        <DonorMissionList missionConfig={{ title: "ภารกิจ", missions: [] }} />
      );
      expect(container.firstChild).toBeNull();
    });

    test("renders missions and handles selection and deselection", () => {
      const handleSelect = jest.fn();
      const { rerender } = render(
        <DonorMissionList
          missionConfig={{ title: "ภารกิจสตรีมเมอร์", missions: mockMissions }}
          selectedMission={null}
          onSelectMission={handleSelect}
        />
      );

      expect(screen.getByText("ภารกิจสตรีมเมอร์")).toBeInTheDocument();
      expect(screen.getByText("2 ภารกิจ")).toBeInTheDocument();
      expect(screen.getByText("ดื่มน้ำ 1 แก้ว")).toBeInTheDocument();
      expect(screen.getByText("เล่นเกมไม่พูด 1 ตา")).toBeInTheDocument();

      // Click first mission
      fireEvent.click(screen.getByText("ดื่มน้ำ 1 แก้ว"));
      expect(handleSelect).toHaveBeenCalledWith(mockMissions[0]);

      // Rerender with mission 1 selected
      rerender(
        <DonorMissionList
          missionConfig={{ title: "ภารกิจสตรีมเมอร์", missions: mockMissions }}
          selectedMission={mockMissions[0]}
          onSelectMission={handleSelect}
        />
      );

      expect(screen.getByTestId("selected-mission-banner")).toBeInTheDocument();
      expect(screen.getByText("เลือกอยู่")).toBeInTheDocument();

      // Click clear button
      const clearBtn = screen.getByTestId("clear-mission-btn");
      fireEvent.click(clearBtn);
      expect(handleSelect).toHaveBeenCalledWith(null);

      // Clicking already selected mission triggers deselect (calls with null)
      fireEvent.click(screen.getByTestId("mission-item-m-1"));
      expect(handleSelect).toHaveBeenCalledWith(null);
    });
  });
});
