import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

describe('Sidebar Component', () => {
  it('renders all menu items correctly', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Sidebar />
      </MemoryRouter>
    );

    expect(screen.getByText('ข้อมูลเบื้องต้น')).toBeInTheDocument();
    expect(screen.getByText('บัญชีผู้ใช้')).toBeInTheDocument();
    expect(screen.getByText('บัญชีรับเงิน')).toBeInTheDocument();
    expect(screen.getByText('หน้ารับเงิน')).toBeInTheDocument();
    expect(screen.getByText('วิดเจ็ตรับเงิน')).toBeInTheDocument();
    expect(screen.getByText('ประวัติการรับเงิน')).toBeInTheDocument();
    expect(screen.getByText('ออกจากระบบ')).toBeInTheDocument();
  });

  it('handles custom onLogout callback or default logout removing token', () => {
    const mockLogout = jest.fn();
    render(
      <MemoryRouter>
        <Sidebar onLogout={mockLogout} />
      </MemoryRouter>
    );

    const logoutBtn = screen.getByText('ออกจากระบบ');
    fireEvent.click(logoutBtn);
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it('handles default logout by clearing token and navigating', () => {
    localStorage.setItem('token', 'sample_token');
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    );

    const logoutBtn = screen.getByText('ออกจากระบบ');
    fireEvent.click(logoutBtn);
    expect(localStorage.getItem('token')).toBeNull();
  });
});

describe('Topbar Component', () => {
  it('renders default breadcrumb and test username', () => {
    render(
      <MemoryRouter>
        <Topbar />
      </MemoryRouter>
    );

    expect(screen.getByText('หน้าหลัก')).toBeInTheDocument();
    expect(screen.getByText('ข้อมูลเบื้องต้น')).toBeInTheDocument();
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('renders custom username and custom breadcrumb', () => {
    render(
      <MemoryRouter>
        <Topbar username="nekoma" breadcrumb="วิดเจ็ตรับเงิน" />
      </MemoryRouter>
    );

    expect(screen.getByText('วิดเจ็ตรับเงิน')).toBeInTheDocument();
    expect(screen.getByText('nekoma')).toBeInTheDocument();
  });
});
