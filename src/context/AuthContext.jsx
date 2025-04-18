import { createContext, useContext, useEffect, useState } from 'react';
import { signIn, signOut, getSession, handleCallback } from '../auth';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for OAuth callback first
    const callbackUser = handleCallback();
    if (callbackUser) {
      setUser(callbackUser);
      setLoading(false);
      return;
    }

    // Otherwise check for existing session
    const session = getSession();
    setUser(session);
    setLoading(false);
  }, []);

  const login = (provider = 'github') => signIn(provider);
  const logout = async () => {
    try {
      await signOut();
      setUser(null);
    } catch (error) {
      console.error('Failed to sign out:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
