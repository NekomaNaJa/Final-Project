import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AuthLayout from './AuthLayout';
import InputField from './InputField';
import PasswordChecklist from './PasswordChecklist';
import SocialAuthButtons from './SocialAuthButtons';

describe('Auth Components', () => {
  describe('AuthLayout', () => {
    it('renders auth layout with children and back link', () => {
      render(
        <MemoryRouter>
          <AuthLayout>
            <div>Auth Form Content</div>
          </AuthLayout>
        </MemoryRouter>
      );
      expect(screen.getByText('Auth Form Content')).toBeInTheDocument();
      expect(screen.getByText('← กลับหน้าหลัก')).toBeInTheDocument();
    });
  });

  describe('InputField', () => {
    it('renders standard text input', () => {
      const handleChange = jest.fn();
      render(
        <InputField
          label="ชื่อผู้ใช้"
          name="username"
          placeholder="กรอกชื่อผู้ใช้"
          value="myuser"
          onChange={handleChange}
        />
      );
      expect(screen.getByText('ชื่อผู้ใช้')).toBeInTheDocument();
      const input = screen.getByPlaceholderText('กรอกชื่อผู้ใช้');
      expect(input).toHaveValue('myuser');

      fireEvent.change(input, { target: { value: 'newuser' } });
      expect(handleChange).toHaveBeenCalledTimes(1);
    });

    it('toggles password visibility when type is password', () => {
      render(
        <InputField
          label="รหัสผ่าน"
          type="password"
          name="password"
          placeholder="กรอกรหัสผ่าน"
          value="Secret123!"
          onChange={() => {}}
        />
      );
      const input = screen.getByPlaceholderText('กรอกรหัสผ่าน');
      expect(input).toHaveAttribute('type', 'password');

      const toggleBtn = screen.getByRole('button', { name: /แสดงรหัสผ่าน/i });
      fireEvent.click(toggleBtn);
      expect(input).toHaveAttribute('type', 'text');

      const hideBtn = screen.getByRole('button', { name: /ซ่อนรหัสผ่าน/i });
      fireEvent.click(hideBtn);
      expect(input).toHaveAttribute('type', 'password');
    });
  });

  describe('PasswordChecklist', () => {
    it('returns null when password is empty', () => {
      const { container } = render(<PasswordChecklist password="" />);
      expect(container.firstChild).toBeNull();
    });

    it('displays validation items when password is provided', () => {
      render(<PasswordChecklist password="Abc1" />);
      expect(screen.getByText(/อย่างน้อย 8 ตัวอักษร/)).toBeInTheDocument();
      expect(screen.getByText(/มีตัวพิมพ์เล็ก/)).toBeInTheDocument();
      expect(screen.getByText(/มีตัวพิมพ์ใหญ่/)).toBeInTheDocument();
      expect(screen.getByText(/มีตัวเลข/)).toBeInTheDocument();
      expect(screen.getByText(/มีอักขระพิเศษ/)).toBeInTheDocument();
    });
  });

  describe('SocialAuthButtons', () => {
    it('renders Google, Youtube, Twitch login options', () => {
      render(<SocialAuthButtons />);
      expect(screen.getByText(/ดำเนินการต่อด้วย Google/i)).toBeInTheDocument();
      expect(screen.getByText(/ดำเนินการต่อด้วย Youtube/i)).toBeInTheDocument();
      expect(screen.getByText(/ดำเนินการต่อด้วย Twitch/i)).toBeInTheDocument();
    });
  });
});
