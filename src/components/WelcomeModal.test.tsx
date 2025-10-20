import { render, screen, fireEvent } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import WelcomeModal from './WelcomeModal';

// Mock the dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

const mockPush = jest.fn();
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('WelcomeModal', () => {
  beforeEach(() => {
    mockUseRouter.mockReturnValue({
      push: mockPush,
    } as ReturnType<typeof useRouter>);
    
    mockUseAuth.mockReturnValue({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      refreshUser: jest.fn(),
    } as ReturnType<typeof useAuth>);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders when open', () => {
    render(<WelcomeModal isOpen={true} onClose={jest.fn()} />);
    
    expect(screen.getByText('Login to continue using Blockyfi for free and access real-time market data, news, and analysis.')).toBeInTheDocument();
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByText('Maybe Later')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<WelcomeModal isOpen={false} onClose={jest.fn()} />);
    
    expect(screen.queryByText('Login to continue using Blockyfi for free and access real-time market data, news, and analysis.')).not.toBeInTheDocument();
  });

  it('redirects to auth page when Login is clicked', () => {
    render(<WelcomeModal isOpen={true} onClose={jest.fn()} />);
    
    fireEvent.click(screen.getByText('Login'));
    expect(mockPush).toHaveBeenCalledWith('/auth');
  });

  it('calls onClose when Maybe Later is clicked', () => {
    const mockOnClose = jest.fn();
    render(<WelcomeModal isOpen={true} onClose={mockOnClose} />);
    
    fireEvent.click(screen.getByText('Maybe Later'));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('calls onClose when backdrop is clicked', () => {
    const mockOnClose = jest.fn();
    render(<WelcomeModal isOpen={true} onClose={mockOnClose} />);
    
    const backdrop = document.querySelector('.fixed.inset-0');
    if (backdrop) {
      fireEvent.click(backdrop);
      expect(mockOnClose).toHaveBeenCalled();
    }
  });
});
