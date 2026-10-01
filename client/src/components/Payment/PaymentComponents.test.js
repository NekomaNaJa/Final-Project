import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import PaymentHeader from "./PaymentHeader";
import PromptPayCard from "./PromptPayCard";
import TrueMoneyCard from "./TrueMoneyCard";
import BankCard from "./BankCard";
import ComingSoonCard from "./ComingSoonCard";

describe("Payment Components", () => {
  describe("PaymentHeader", () => {
    test("renders header title and description", () => {
      render(<PaymentHeader />);
      expect(screen.getByText("PAYMENT CHANNELS")).toBeInTheDocument();
      expect(screen.getByText(/ช่องทาง/i)).toBeInTheDocument();
      expect(screen.getByText(/การรับเงิน/i)).toBeInTheDocument();
    });
  });

  describe("ComingSoonCard", () => {
    test("renders coming soon card", () => {
      render(<ComingSoonCard />);
      expect(screen.getByText("ช่องทางใหม่กำลังจะมา")).toBeInTheDocument();
      expect(screen.getByText("COMING SOON")).toBeInTheDocument();
    });
  });

  describe("PromptPayCard", () => {
    test("renders PromptPayCard and handles toggling, expansion, and saving", () => {
      const handleSave = jest.fn();
      const { container } = render(
        <PromptPayCard
          initialData={{ enabled: true, type: "เบอร์โทรศัพท์", number: "0812345678" }}
          onSave={handleSave}
        />
      );

      expect(screen.getByText("พร้อมเพย์")).toBeInTheDocument();
      expect(screen.getByText("เปิดใช้งาน")).toBeInTheDocument();

      // Toggle switch
      const toggle = screen.getByRole("switch");
      fireEvent.click(toggle);
      expect(screen.getByText("ปิดใช้งาน")).toBeInTheDocument();

      // Expand card
      const expandBtn = screen.getByText(/จัดการ/i);
      fireEvent.click(expandBtn);
      expect(screen.getByPlaceholderText("เช่น 0812345678 หรือ 1234567890123")).toBeInTheDocument();

      // Change number
      const input = screen.getByPlaceholderText("เช่น 0812345678 หรือ 1234567890123");
      fireEvent.change(input, { target: { value: "0899999999" } });
      expect(input.value).toBe("0899999999");

      // Save via form submit button
      const submitBtn = container.querySelector('button[type="submit"]');
      fireEvent.click(submitBtn);
      expect(handleSave).toHaveBeenCalledWith({
        enabled: false,
        type: "เบอร์โทรศัพท์",
        number: "0899999999",
      });
    });
  });

  describe("TrueMoneyCard", () => {
    test("renders TrueMoneyCard and allows changing phone number", () => {
      const handleSave = jest.fn();
      const { container } = render(
        <TrueMoneyCard
          initialData={{ enabled: true, phone: "0812345678" }}
          onSave={handleSave}
        />
      );

      expect(screen.getByText("ทรูมันนี่")).toBeInTheDocument();

      // Expand card
      const expandBtn = screen.getByText(/จัดการ/i);
      fireEvent.click(expandBtn);

      const phoneInput = screen.getByPlaceholderText("เช่น 0812345678");
      fireEvent.change(phoneInput, { target: { value: "0888888888" } });

      const submitBtn = container.querySelector('button[type="submit"]');
      fireEvent.click(submitBtn);
      expect(handleSave).toHaveBeenCalledWith({
        enabled: true,
        phone: "0888888888",
      });
    });
  });

  describe("BankCard", () => {
    test("renders BankCard and allows editing bank details", () => {
      const handleSave = jest.fn();
      const { container } = render(
        <BankCard
          initialData={{
            enabled: true,
            bankName: "ธนาคารไทยพาณิชย์ (SCB)",
            accountNumber: "1234567890",
            accountName: "ผู้ทดสอบ",
          }}
          onSave={handleSave}
        />
      );

      expect(screen.getByText("ธนาคาร")).toBeInTheDocument();

      // Expand card
      const expandBtn = screen.getByText(/จัดการ/i);
      fireEvent.click(expandBtn);

      const accNumberInput = screen.getByPlaceholderText("เช่น 123-4-56789-0");
      fireEvent.change(accNumberInput, { target: { value: "9876543210" } });

      const submitBtn = container.querySelector('button[type="submit"]');
      fireEvent.click(submitBtn);
      expect(handleSave).toHaveBeenCalledWith({
        enabled: true,
        bankName: "ธนาคารไทยพาณิชย์ (SCB)",
        accountNumber: "9876543210",
        accountName: "ผู้ทดสอบ",
      });
    });
  });
});
