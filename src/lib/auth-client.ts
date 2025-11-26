/**
 * Client-side authentication utilities
 * Handles token management and authenticated API calls
 */

/**
 * Get the stored auth token from localStorage
 */
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
}

/**
 * Clear auth token and user data from localStorage
 */
export function clearAuthData(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user');
}

/**
 * Make an authenticated API call with automatic token handling
 * Automatically handles 401 errors by clearing auth data
 */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = getAuthToken();
  
  const headers = new Headers(options.headers);
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  const response = await fetch(url, {
    ...options,
    headers,
  });
  
  // If we get a 401, the token is invalid/expired
  if (response.status === 401) {
    clearAuthData();
    // Trigger a custom event that AuthContext can listen to
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('auth:token-expired'));
    }
  }
  
  return response;
}

/**
 * Check if a token is expired (client-side check)
 * This is a basic check - the server will do the real validation
 */
export function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp;
    if (!exp) return false;
    
    // Check if token is expired (with 60 second buffer)
    return Date.now() >= (exp * 1000) - 60000;
  } catch {
    return false;
  }
}

