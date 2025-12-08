/**
 * Auth Storage Hook
 * Manages secure storage of authentication tokens and auto-login
 */

export interface StoredAuthToken {
  token: string;
  expiresAt: number;
  userRole: 'client' | 'admin' | 'staff';
  userEmail: string;
  userId: string;
}

const TOKEN_KEY = 'pwa_auth_token';
const REMEMBER_ME_KEY = 'pwa_remember_me';

export const useAuthStorage = () => {
  // Save auth token with expiration
  const saveAuthToken = (
    token: string,
    expiresIn: number, // in seconds
    userRole: string,
    userEmail: string,
    userId: string,
    rememberMe: boolean = false
  ) => {
    const expiresAt = Date.now() + expiresIn * 1000;
    const authData: StoredAuthToken = {
      token,
      expiresAt,
      userRole: userRole as 'client' | 'admin' | 'staff',
      userEmail,
      userId,
    };

    // Store in localStorage if remember me is checked
    if (rememberMe) {
      localStorage.setItem(TOKEN_KEY, JSON.stringify(authData));
      localStorage.setItem(REMEMBER_ME_KEY, 'true');
    } else {
      // Use sessionStorage for current session only
      sessionStorage.setItem(TOKEN_KEY, JSON.stringify(authData));
      localStorage.removeItem(REMEMBER_ME_KEY);
    }
  };

  // Get stored token if valid
  const getStoredToken = (): StoredAuthToken | null => {
    // Check remember me first (localStorage), then session (sessionStorage)
    let tokenStr = localStorage.getItem(TOKEN_KEY);
    const rememberMe = localStorage.getItem(REMEMBER_ME_KEY) === 'true';
    
    if (!tokenStr) {
      tokenStr = sessionStorage.getItem(TOKEN_KEY);
    }

    if (!tokenStr) {
      return null;
    }

    try {
      const authData: StoredAuthToken = JSON.parse(tokenStr);
      
      // Check if token is expired
      if (authData.expiresAt < Date.now()) {
        clearAuthToken();
        return null;
      }

      return authData;
    } catch {
      return null;
    }
  };

  // Clear stored token
  const clearAuthToken = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REMEMBER_ME_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
  };

  // Check if user has enabled remember me
  const isRememberMeEnabled = (): boolean => {
    return localStorage.getItem(REMEMBER_ME_KEY) === 'true';
  };

  // Use Credential Management API to save credentials
  const saveCredentials = (email: string, password: string) => {
    if (!navigator.credentials) {
      return;
    }

    try {
      const credential = new (window as any).PasswordCredential({
        id: email,
        password: password,
        name: email,
      });
      navigator.credentials.store(credential);
    } catch (error) {
      // Credential API might not be available in some contexts
      console.debug('Credential Management API not available');
    }
  };

  // Get credentials from browser if available
  const getCredentials = async (): Promise<{
    email: string;
    password: string;
  } | null> => {
    if (!navigator.credentials) {
      return null;
    }

    try {
      const credential = (await navigator.credentials.get({
        password: true,
      } as any)) as any;

      if (credential) {
        return {
          email: credential.id,
          password: credential.password || '',
        };
      }
    } catch (error) {
      console.debug('Error retrieving credentials:', error);
    }

    return null;
  };

  return {
    saveAuthToken,
    getStoredToken,
    clearAuthToken,
    isRememberMeEnabled,
    saveCredentials,
    getCredentials,
  };
};
