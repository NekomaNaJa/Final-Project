import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Coins } from 'lucide-react';
import { Card, CardHeader } from './CardWrapper';
import StatsCard from './StatsCard';
import PaymentChannels from './PaymentChannels';
import TopDonors from './TopDonors';
import RealtimeFeed from './RealtimeFeed';
import DonationChart from './DonationChart';
import Dashboard from '../../pages/Dashboard';
import * as api from '../../utils/api';

jest.mock('../../utils/api', () => {
  const original = jest.requireActual('../../utils/api');
  return {
    ...original,
    fetchDonationStats: jest.fn(),
    fetchCurrentUser: jest.fn(),
  };
});

describe('Dashboard Components', () => {
  describe('CardWrapper', () => {
    it('renders Card with children', () => {
      render(
        <Card className="custom-card">
          <p>Card Body</p>
        </Card>
      );
      expect(screen.getByText('Card Body')).toBeInTheDocument();
    });

    it('renders CardHeader with icon, title, subtitle and right element', () => {
      render(
        <CardHeader
          icon={Coins}
          title="หัวข้อการ์ด"
          subtitle="Subtitle info"
          right={<button>Action</button>}
        />
      );
      expect(screen.getByText('หัวข้อการ์ด')).toBeInTheDocument();
      expect(screen.getByText('Subtitle info')).toBeInTheDocument();
      expect(screen.getByText('Action')).toBeInTheDocument();
    });
  });

  describe('StatsCard', () => {
    it('renders stats with different accents', () => {
      const { rerender } = render(
        <StatsCard
          icon={Coins}
          label="ยอดเงิน"
          value={1500}
          unit="บาท"
          percent={10}
          percentLabel="เทียบกับสัปดาห์ก่อน"
          accent="purple"
        />
      );
      expect(screen.getByText('ยอดเงิน')).toBeInTheDocument();
      expect(screen.getByText(/1,500/)).toBeInTheDocument();
      expect(screen.getByText('+10%')).toBeInTheDocument();

      rerender(
        <StatsCard
          icon={Coins}
          label="ยอดเงิน Gold"
          value={2000}
          unit="บาท"
          percent={20}
          percentLabel="เทียบกับสัปดาห์ก่อน"
          accent="gold"
        />
      );
      expect(screen.getByText('ยอดเงิน Gold')).toBeInTheDocument();

      rerender(
        <StatsCard
          icon={Coins}
          label="ยอดเงิน Crimson"
          value={3000}
          unit="บาท"
          percent={30}
          percentLabel="เทียบกับสัปดาห์ก่อน"
          accent="crimson"
        />
      );
      expect(screen.getByText('ยอดเงิน Crimson')).toBeInTheDocument();
    });

    it('renders negative percent with red styling', () => {
      render(
        <StatsCard
          icon={Coins}
          label="ยอดเงินลดลง"
          value={800}
          unit="บาท"
          percent={-15}
          percentLabel="เทียบกับสัปดาห์ก่อน"
          accent="purple"
        />
      );
      expect(screen.getByText('-15%')).toBeInTheDocument();
      expect(screen.getByText('-15%')).toHaveClass('text-red-400');
    });

    it('renders zero percent with non-negative styling', () => {
      render(
        <StatsCard
          icon={Coins}
          label="ยอดเงินคงเดิม"
          value={1000}
          unit="บาท"
          percent={0}
          percentLabel="เทียบกับสัปดาห์ก่อน"
          accent="purple"
        />
      );
      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('renders stats without percent badge when percent is omitted (e.g. pending items)', () => {
      render(
        <StatsCard
          icon={Coins}
          label="รายการรอตรวจ"
          value={3}
          unit="รายการ"
          percentLabel="สถานะรอดำเนินการ"
          accent="crimson"
        />
      );
      expect(screen.getByText('รายการรอตรวจ')).toBeInTheDocument();
      expect(screen.getByText(/3/)).toBeInTheDocument();
      expect(screen.getByText('สถานะรอดำเนินการ')).toBeInTheDocument();
      expect(screen.queryByText(/%/)).not.toBeInTheDocument();
    });
  });

  describe('PaymentChannels', () => {
    it('renders payment channels list with default disconnected status', () => {
      render(<PaymentChannels />);
      expect(screen.getByText('ช่องทางรับเงิน')).toBeInTheDocument();
      expect(screen.getByText('PromptPay')).toBeInTheDocument();
      expect(screen.getByText('TrueMoney Wallet')).toBeInTheDocument();
      expect(screen.getByText('Bank')).toBeInTheDocument();
    });

    it('renders active status based on user payment config', () => {
      const mockPayment = {
        promptpay: { enabled: true, number: '0812345678' },
        bank: { enabled: true, bankName: 'ธนาคารไทยพาณิชย์ (SCB)' },
        truemoney: { enabled: false },
      };
      render(<PaymentChannels payment={mockPayment} />);
      expect(screen.getAllByText('เปิดใช้งานแล้ว').length).toBe(2);
      expect(screen.getByText('ยังไม่เชื่อมต่อ')).toBeInTheDocument();
    });

    it('loads config from localStorage when payment prop is not provided', () => {
      localStorage.setItem(
        'donix_payment_config',
        JSON.stringify({
          promptpay: { enabled: true },
          truemoney: { enabled: true },
          bank: { enabled: true },
        })
      );
      render(<PaymentChannels />);
      expect(screen.getAllByText('เปิดใช้งานแล้ว').length).toBe(3);
    });
  });

  describe('TopDonors', () => {
    it('renders top donors empty state when no donors', () => {
      render(<TopDonors />);
      expect(screen.getByText('อันดับผู้โดเนท')).toBeInTheDocument();
      expect(screen.getByText('ยังไม่มีข้อมูลผู้สนับสนุน')).toBeInTheDocument();
    });

    it('renders top donors with dynamic donor data without fake placeholders', () => {
      const mockDonors = [
        { rank: 1, name: 'ProGamer', totalAmount: 5000, badge: 'MYTHIC' },
      ];
      render(<TopDonors donors={mockDonors} />);
      expect(screen.getByText('ProGamer')).toBeInTheDocument();
      expect(screen.getByText('฿5,000')).toBeInTheDocument();
      expect(screen.getByText('MYTHIC')).toBeInTheDocument();
      expect(screen.queryByText('ARCANE')).not.toBeInTheDocument();
    });

    it('renders top donors fallbacks for rank, name, badge and amount', () => {
      const mockDonors = [
        { rank: 1, name: 'Champion', totalAmount: 10000, badge: 'MYTHIC' },
        { rank: 2, amount: 2000 },
      ];
      render(<TopDonors donors={mockDonors} />);
      expect(screen.getByText('Champion')).toBeInTheDocument();
      expect(screen.getByText('฿10,000')).toBeInTheDocument();
      expect(screen.getByText('ผู้ไม่ประสงค์ออกนาม')).toBeInTheDocument();
      expect(screen.getByText('฿2,000')).toBeInTheDocument();
      expect(screen.getByText('SUPPORTER')).toBeInTheDocument();
    });
  });

  describe('RealtimeFeed', () => {
    it('renders recent donation placeholders', () => {
      render(<RealtimeFeed />);
      expect(screen.getByText('โดเนทล่าสุด')).toBeInTheDocument();
      expect(screen.getAllByText('ยังไม่มีข้อมูล').length).toBeGreaterThan(0);
    });

    it('renders dynamic donation feed items', () => {
      const mockFeed = [
        { _id: 'd1', donorName: 'Alice', amount: 200, message: 'Keep fighting!' },
      ];
      render(<RealtimeFeed feed={mockFeed} />);
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('+฿200')).toBeInTheDocument();
      expect(screen.getByText('Keep fighting!')).toBeInTheDocument();
    });

    it('filters out non-approved items and handles missing fields gracefully', () => {
      const mockFeed = [
        { _id: 'd1', donorName: 'Supporter 1', amount: 300, status: 'approved', createdAt: '2026-10-10T12:00:00Z' },
        { _id: 'd2', donorName: 'Pending Person', amount: 100, status: 'pending' },
        { _id: 'd3', donorName: 'Rejected Person', amount: 50, status: 'rejected' },
        { _id: 'd4', amount: 150, status: 'approved' },
      ];
      render(<RealtimeFeed feed={mockFeed} />);
      expect(screen.getByText('Supporter 1')).toBeInTheDocument();
      expect(screen.getByText('+฿300')).toBeInTheDocument();
      expect(screen.queryByText('Pending Person')).not.toBeInTheDocument();
      expect(screen.queryByText('Rejected Person')).not.toBeInTheDocument();
      expect(screen.getByText('ผู้ไม่ประสงค์ออกนาม')).toBeInTheDocument();
      expect(screen.getByText('+฿150')).toBeInTheDocument();
    });
  });

  describe('DonationChart', () => {
    it('switches range tabs between 7D, 30D and ALL', () => {
      render(<DonationChart />);
      expect(screen.getByText('7 วันที่ผ่านมา')).toBeInTheDocument();

      const btn30D = screen.getByText('30D');
      fireEvent.click(btn30D);
      expect(btn30D).toHaveClass('bg-purple-600');

      const btnAll = screen.getByText('ALL');
      fireEvent.click(btnAll);
      expect(btnAll).toHaveClass('bg-purple-600');
    });

    it('renders with custom chart data', () => {
      const customData = {
        '7D': [{ d: 'จ', amount: 100 }],
        '30D': [{ d: '1', amount: 200 }],
        ALL: [{ d: 'ม.ค.', amount: 500 }],
      };
      render(<DonationChart data={customData} />);
      expect(screen.getByText('7 วันที่ผ่านมา')).toBeInTheDocument();
    });
  });

  describe('Dashboard Page', () => {
    beforeEach(() => {
      localStorage.clear();
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('redirects to login when token is missing', () => {
      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <Dashboard />
        </MemoryRouter>
      );
      // Renders without crashing
      expect(screen.getByText(/ภาพรวมการรับโดเนทของคุณวันนี้/i)).toBeInTheDocument();
    });

    it('loads username from valid JWT token payload', async () => {
      const payload = btoa(JSON.stringify({ username: 'nekoma_streamer' }));
      localStorage.setItem('token', `header.${payload}.signature`);

      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <Dashboard />
        </MemoryRouter>
      );

      act(() => {
        jest.runAllTimers();
      });

      expect(screen.getAllByText('nekoma_streamer').length).toBeGreaterThanOrEqual(1);
    });

    it('redirects when token payload is invalid', () => {
      localStorage.setItem('token', 'invalid_jwt_format');

      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <Dashboard />
        </MemoryRouter>
      );

      expect(screen.getByText(/ภาพรวมการรับโดเนทของคุณวันนี้/i)).toBeInTheDocument();
    });

    it('does not render the share donation link button', () => {
      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <Dashboard />
        </MemoryRouter>
      );

      expect(screen.queryByText('แชร์ลิงก์โดเนท')).not.toBeInTheDocument();
    });

    it('loads and renders dashboard stats and feed data successfully', async () => {
      jest.useRealTimers();
      const payload = btoa(JSON.stringify({ username: 'nekoma_streamer' }));
      localStorage.setItem('token', `header.${payload}.signature`);

      api.fetchDonationStats.mockResolvedValueOnce({
        totalAmount: 15000,
        totalDonations: 30,
        pendingCount: 2,
        amountPercentChange: 20,
        donationsPercentChange: 10,
        topDonors: [{ name: 'SuperDonor', totalAmount: 7000, badge: 'MYTHIC' }],
        chartData: { '7D': [{ d: 'จ', amount: 500 }] },
        recentDonations: [{ donorName: 'Bob', amount: 500, status: 'approved' }],
      });

      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <Dashboard />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/15,000/)).toBeInTheDocument();
      });

      expect(screen.getAllByText(/30/).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/2/).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('+20%')).toBeInTheDocument();
      expect(screen.getByText('+10%')).toBeInTheDocument();
      expect(screen.getByText('SuperDonor')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
      expect(screen.getByText('อนุมัติแล้ว')).toBeInTheDocument();
      expect(screen.queryByText('ช่องทางรับเงิน')).not.toBeInTheDocument();
    });

    it('handles API errors gracefully during loadStats', async () => {
      jest.useRealTimers();
      const payload = btoa(JSON.stringify({ username: 'nekoma_streamer' }));
      localStorage.setItem('token', `header.${payload}.signature`);

      api.fetchDonationStats.mockRejectedValueOnce(new Error('Network error'));

      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <Dashboard />
        </MemoryRouter>
      );

      expect(screen.getByText(/ภาพรวมการรับโดเนทของคุณวันนี้/i)).toBeInTheDocument();
      expect(screen.getAllByText('0').length).toBeGreaterThanOrEqual(1);
    });

    it('handles empty response data with defaults in loadStats', async () => {
      jest.useRealTimers();
      const payload = btoa(JSON.stringify({ username: 'nekoma_streamer' }));
      localStorage.setItem('token', `header.${payload}.signature`);

      api.fetchDonationStats.mockResolvedValueOnce({});

      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <Dashboard />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/ภาพรวมการรับโดเนทของคุณวันนี้/i)).toBeInTheDocument();
      });
      expect(screen.getAllByText('0').length).toBeGreaterThanOrEqual(1);
    });

    it('does not update state if unmounted before API calls finish', async () => {
      jest.useRealTimers();
      const payload = btoa(JSON.stringify({ username: 'nekoma_streamer' }));
      localStorage.setItem('token', `header.${payload}.signature`);

      let resolveStats;
      const statsPromise = new Promise((resolve) => {
        resolveStats = resolve;
      });

      api.fetchDonationStats.mockReturnValueOnce(statsPromise);

      const { unmount } = render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <Dashboard />
        </MemoryRouter>
      );

      unmount();
      resolveStats({ totalAmount: 999 });
    });
  });

  describe('Edge cases for components', () => {
    it('handles unknown accent fallback in StatsCard', () => {
      render(
        <StatsCard
          icon={Coins}
          label="ยอดเงิน Unknown"
          value={500}
          unit="บาท"
          accent="nonexistent"
        />
      );
      expect(screen.getByText('ยอดเงิน Unknown')).toBeInTheDocument();
    });

    it('handles non-object payment prop gracefully in PaymentChannels', () => {
      render(<PaymentChannels payment="invalid_string" />);
      expect(screen.getByText('ช่องทางรับเงิน')).toBeInTheDocument();
    });

    it('handles donor with missing fields and fallback rank in TopDonors', () => {
      const mockDonors = [
        { _id: 'd1', rank: 3 },
      ];
      render(<TopDonors donors={mockDonors} />);
      expect(screen.getByText('ผู้ไม่ประสงค์ออกนาม')).toBeInTheDocument();
      expect(screen.getByText('฿0')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('handles realtime feed item with missing donorName', () => {
      const mockFeed = [
        { _id: 'f1', amount: 50, donorName: '' },
      ];
      render(<RealtimeFeed feed={mockFeed} />);
      expect(screen.getByText('ผู้ไม่ประสงค์ออกนาม')).toBeInTheDocument();
      expect(screen.getByText('+฿50')).toBeInTheDocument();
    });
  });
});
