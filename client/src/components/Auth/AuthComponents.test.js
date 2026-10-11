import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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
    const originalClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;

    beforeEach(() => {
      delete process.env.REACT_APP_GOOGLE_CLIENT_ID;
    });

    afterAll(() => {
      if (originalClientId !== undefined) {
        process.env.REACT_APP_GOOGLE_CLIENT_ID = originalClientId;
      } else {
        delete process.env.REACT_APP_GOOGLE_CLIENT_ID;
      }
    });
    it('renders Google login option and does not render Youtube or Twitch', () => {
      render(
        <MemoryRouter>
          <SocialAuthButtons />
        </MemoryRouter>
      );
      expect(screen.getByText(/ดำเนินการต่อด้วย Google/i)).toBeInTheDocument();
      expect(screen.queryByText(/ดำเนินการต่อด้วย Youtube/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/ดำเนินการต่อด้วย Twitch/i)).not.toBeInTheDocument();
    });

    it('opens demo modal and handles demo login when client ID is missing', async () => {
      const handleSuccess = jest.fn();
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          token: "mock_jwt_token",
          user: { id: "1", username: "demo_user" },
        }),
      });

      render(
        <MemoryRouter>
          <SocialAuthButtons onSuccess={handleSuccess} />
        </MemoryRouter>
      );

      const googleBtn = screen.getByText(/ดำเนินการต่อด้วย Google/i);
      fireEvent.click(googleBtn);

      expect(screen.getByText("Google OAuth Service")).toBeInTheDocument();

      const demoBtn = screen.getByText(/เข้าสู่ระบบด้วย Google \(Demo Mode\)/i);
      fireEvent.click(demoBtn);

      expect(await screen.findByText(/กำลังเชื่อมต่อกับ Google.../i)).toBeInTheDocument();
    });

    it('handles demo login failure gracefully with onError callback', async () => {
      const handleError = jest.fn();
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: "Demo Login Failed" }),
      });

      render(
        <MemoryRouter>
          <SocialAuthButtons onError={handleError} />
        </MemoryRouter>
      );

      fireEvent.click(screen.getByText(/ดำเนินการต่อด้วย Google/i));
      fireEvent.click(screen.getByText(/เข้าสู่ระบบด้วย Google \(Demo Mode\)/i));

      await waitFor(() => {
        expect(handleError).toHaveBeenCalledWith("Demo Login Failed");
      });
    });

    it('blocks Google click when onBeforeAuth returns false', () => {
      const handleBeforeAuth = jest.fn().mockReturnValue(false);
      render(
        <MemoryRouter>
          <SocialAuthButtons onBeforeAuth={handleBeforeAuth} />
        </MemoryRouter>
      );

      fireEvent.click(screen.getByText(/ดำเนินการต่อด้วย Google/i));
      expect(handleBeforeAuth).toHaveBeenCalled();
      expect(screen.queryByText("Google OAuth Service")).not.toBeInTheDocument();
    });

    it('handles Google OAuth2 tokenClient popup flow when clientId is set', async () => {
      const prevEnv = process.env.REACT_APP_GOOGLE_CLIENT_ID;
      process.env.REACT_APP_GOOGLE_CLIENT_ID = "real_google_client_id_123";

      const handleSuccess = jest.fn();
      let capturedCallback = null;
      let capturedErrorCallback = null;

      window.google = {
        accounts: {
          oauth2: {
            initTokenClient: jest.fn(({ callback, error_callback }) => {
              capturedCallback = callback;
              capturedErrorCallback = error_callback;
              return {
                requestAccessToken: () => {},
              };
            }),
          },
        },
      };

      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          token: "mock_oauth_jwt_token",
          user: { id: "oauth_1", username: "oauth_streamer" },
        }),
      });

      render(
        <MemoryRouter>
          <SocialAuthButtons onSuccess={handleSuccess} />
        </MemoryRouter>
      );

      fireEvent.click(screen.getByText(/ดำเนินการต่อด้วย Google/i));
      expect(window.google.accounts.oauth2.initTokenClient).toHaveBeenCalled();

      // Trigger successful access token
      await capturedCallback({ access_token: "test_access_token_xyz" });

      expect(handleSuccess).toHaveBeenCalledWith(
        expect.objectContaining({ token: "mock_oauth_jwt_token" })
      );

      process.env.REACT_APP_GOOGLE_CLIENT_ID = prevEnv;
      delete window.google;
    });

    it('handles Google OAuth2 tokenClient error callback', async () => {
      const prevEnv = process.env.REACT_APP_GOOGLE_CLIENT_ID;
      process.env.REACT_APP_GOOGLE_CLIENT_ID = "real_google_client_id_123";

      const handleError = jest.fn();
      let capturedErrorCallback = null;

      window.google = {
        accounts: {
          oauth2: {
            initTokenClient: jest.fn(({ error_callback }) => {
              capturedErrorCallback = error_callback;
              return {
                requestAccessToken: () => {},
              };
            }),
          },
        },
      };

      render(
        <MemoryRouter>
          <SocialAuthButtons onError={handleError} />
        </MemoryRouter>
      );

      fireEvent.click(screen.getByText(/ดำเนินการต่อด้วย Google/i));
      capturedErrorCallback();

      expect(handleError).toHaveBeenCalledWith("การเข้าสู่ระบบด้วย Google ถูกยกเลิกหรือล้มเหลว");

      process.env.REACT_APP_GOOGLE_CLIENT_ID = prevEnv;
      delete window.google;
    });

    it('handles Google ID initialization flow when accounts.id is present', async () => {
      const prevEnv = process.env.REACT_APP_GOOGLE_CLIENT_ID;
      process.env.REACT_APP_GOOGLE_CLIENT_ID = "real_google_client_id_123";

      const handleSuccess = jest.fn();
      let capturedIdCallback = null;

      window.google = {
        accounts: {
          id: {
            initialize: jest.fn(({ callback }) => {
              capturedIdCallback = callback;
            }),
            prompt: jest.fn((notifCb) => {
              notifCb({ isNotDisplayed: () => true, isSkippedMoment: () => false });
            }),
          },
        },
      };

      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          token: "mock_id_jwt_token",
          user: { id: "id_1", username: "id_streamer" },
        }),
      });

      render(
        <MemoryRouter>
          <SocialAuthButtons onSuccess={handleSuccess} />
        </MemoryRouter>
      );

      fireEvent.click(screen.getByText(/ดำเนินการต่อด้วย Google/i));
      expect(window.google.accounts.id.initialize).toHaveBeenCalled();

      await capturedIdCallback({ credential: "test_credential_jwt" });

      expect(handleSuccess).toHaveBeenCalledWith(
        expect.objectContaining({ token: "mock_id_jwt_token" })
      );

      process.env.REACT_APP_GOOGLE_CLIENT_ID = prevEnv;
      delete window.google;
    });

    it('handles fallback message when clientId is set but window.google is not loaded', () => {
      const prevEnv = process.env.REACT_APP_GOOGLE_CLIENT_ID;
      process.env.REACT_APP_GOOGLE_CLIENT_ID = "real_google_client_id_123";

      const handleError = jest.fn();
      delete window.google;

      render(
        <MemoryRouter>
          <SocialAuthButtons onError={handleError} />
        </MemoryRouter>
      );

      fireEvent.click(screen.getByText(/ดำเนินการต่อด้วย Google/i));
      expect(handleError).toHaveBeenCalledWith(
        "กำลังโหลดระบบ Google Sign-In กรุณาลองใหม่อีกครั้ง"
      );

      process.env.REACT_APP_GOOGLE_CLIENT_ID = prevEnv;
    });
  });
});
