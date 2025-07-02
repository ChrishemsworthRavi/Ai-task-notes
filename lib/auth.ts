export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  team: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

const AUTH_STORAGE_KEY = 'miro_auth';

export const authStorage = {
  getAuth: (): AuthState => {
    if (typeof window === 'undefined') {
      return { user: null, isAuthenticated: false };
    }
    
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error reading auth from localStorage:', error);
    }
    
    return { user: null, isAuthenticated: false };
  },

  setAuth: (authState: AuthState): void => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authState));
    } catch (error) {
      console.error('Error saving auth to localStorage:', error);
    }
  },

  clearAuth: (): void => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing auth from localStorage:', error);
    }
  }
};

export const login = async (email: string, password: string): Promise<User> => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Simple validation for demo
  if (email && password.length >= 6) {
    const user: User = {
      id: Math.random().toString(36).substr(2, 9),
      email,
      name: email.split('@')[0],
      avatar: `https://api.dicebear.com/7.x/avatars/svg?seed=${email}`,
      team: 'SmartFlow'
    };
    
    const authState: AuthState = {
      user,
      isAuthenticated: true
    };
    
    authStorage.setAuth(authState);
    return user;
  }
  
  throw new Error('Invalid credentials');
};

export const logout = (): void => {
  authStorage.clearAuth();
};

export const getCurrentUser = (): User | null => {
  const authState = authStorage.getAuth();
  return authState.isAuthenticated ? authState.user : null;
};