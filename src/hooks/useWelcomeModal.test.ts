import { renderHook, act } from '@testing-library/react';
import { useAuth } from '@/contexts/AuthContext';
import { useWelcomeModal } from './useWelcomeModal';

// Import the AuthContextType for proper typing
interface User {
  id: string;
  email: string;
  username: string | null;
  provider: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  last_login_at: Date | null;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, username?: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

// Mock the AuthContext
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('useWelcomeModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  it('shows modal for first-time visitors', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      refreshUser: jest.fn(),
    } as AuthContextType);

    const { result } = renderHook(() => useWelcomeModal());

    expect(result.current.showModal).toBe(true);
    expect(localStorageMock.setItem).toHaveBeenCalledWith('blockyfi_first_visit', 'true');
  });

  it('does not show modal for authenticated users', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', email: 'test@example.com', username: 'test', provider: 'local', is_active: true, created_at: new Date(), updated_at: new Date(), last_login_at: new Date() },
      token: 'mock-token',
      isAuthenticated: true,
      isLoading: false,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      refreshUser: jest.fn(),
    } as AuthContextType);

    const { result } = renderHook(() => useWelcomeModal());

    expect(result.current.showModal).toBe(false);
  });

  it('does not show modal while loading', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      refreshUser: jest.fn(),
    } as AuthContextType);

    const { result } = renderHook(() => useWelcomeModal());

    expect(result.current.showModal).toBe(false);
  });

  it('shows modal after 5 minutes for returning users', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      refreshUser: jest.fn(),
    } as AuthContextType);

    // Mock that user has visited before
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'blockyfi_first_visit') return 'true';
      if (key === 'blockyfi_last_modal_shown') return (Date.now() - 6 * 60 * 1000).toString(); // 6 minutes ago
      return null;
    });

    const { result } = renderHook(() => useWelcomeModal());

    expect(result.current.showModal).toBe(true);
  });

  it('does not show modal if less than 5 minutes have passed', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      refreshUser: jest.fn(),
    } as AuthContextType);

    // Mock that user has visited before and modal was shown recently
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'blockyfi_first_visit') return 'true';
      if (key === 'blockyfi_last_modal_shown') return (Date.now() - 2 * 60 * 1000).toString(); // 2 minutes ago
      return null;
    });

    const { result } = renderHook(() => useWelcomeModal());

    expect(result.current.showModal).toBe(false);
  });

  it('closes modal when closeModal is called', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      refreshUser: jest.fn(),
    } as AuthContextType);

    const { result } = renderHook(() => useWelcomeModal());

    expect(result.current.showModal).toBe(true);

    act(() => {
      result.current.closeModal();
    });

    expect(result.current.showModal).toBe(false);
  });
});
