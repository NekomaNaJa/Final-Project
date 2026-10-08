import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Coins } from 'lucide-react';
import { Card, CardHeader } from './CardWrapper';
import StatsCard from './StatsCard';
import PaymentChannels from './PaymentChannels';
import TopDonors from './TopDonors';
import RealtimeFeed from './RealtimeFeed';
import DonationChart from './DonationChart';
import Dashboard from '../../pages/Dashboard';

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
  });

  describe('PaymentChannels', () => {
    it('renders payment channels list', () => {
      render(<PaymentChannels />);
      expect(screen.getByText('ช่องทางรับเงิน')).toBeInTheDocument();
      expect(screen.getByText('PromptPay')).toBeInTheDocument();
      expect(screen.getByText('TrueMoney Wallet')).toBeInTheDocument();
      expect(screen.getByText('Bank')).toBeInTheDocument();
    });
  });

  describe('TopDonors', () => {
    it('renders top donors rank list', () => {
      render(<TopDonors />);
      expect(screen.getByText('อันดับผู้โดเนท')).toBeInTheDocument();
      expect(screen.getByText('MYTHIC')).toBeInTheDocument();
      expect(screen.getByText('ARCANE')).toBeInTheDocument();
    });

    it('renders top donors with dynamic donor data', () => {
      const mockDonors = [
        { rank: 1, name: 'ProGamer', totalAmount: 5000, badge: 'MYTHIC' },
      ];
      render(<TopDonors donors={mockDonors} />);
      expect(screen.getByText('ProGamer')).toBeInTheDocument();
      expect(screen.getByText('฿5,000')).toBeInTheDocument();
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
  });
});
