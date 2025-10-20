import { renderHook, act } from '@testing-library/react';
import { useAuth } from '@/contexts/AuthContext';
import { useWelcomeModal } from './useWelcomeModal';

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
      isAuthenticated: false,
      isLoading: false,
    } as any);

    const { result } = renderHook(() => useWelcomeModal());

    expect(result.current.showModal).toBe(true);
    expect(localStorageMock.setItem).toHaveBeenCalledWith('blockyfi_first_visit', 'true');
  });

  it('does not show modal for authenticated users', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
    } as any);

    const { result } = renderHook(() => useWelcomeModal());

    expect(result.current.showModal).toBe(false);
  });

  it('does not show modal while loading', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
    } as any);

    const { result } = renderHook(() => useWelcomeModal());

    expect(result.current.showModal).toBe(false);
  });

  it('shows modal after 5 minutes for returning users', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
    } as any);

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
      isAuthenticated: false,
      isLoading: false,
    } as any);

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
      isAuthenticated: false,
      isLoading: false,
    } as any);

    const { result } = renderHook(() => useWelcomeModal());

    expect(result.current.showModal).toBe(true);

    act(() => {
      result.current.closeModal();
    });

    expect(result.current.showModal).toBe(false);
  });
});
