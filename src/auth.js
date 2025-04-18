const config = {
  providers: [
    {
      id: 'github',
      name: 'GitHub',
      authorization: 'https://github.com/login/oauth/authorize',
      token: 'https://github.com/login/oauth/access_token',
      userinfo: 'https://api.github.com/user',
      clientId: import.meta.env.VITE_GITHUB_ID
    },
    {
      id: 'google',
      name: 'Google',
      authorization: 'https://accounts.google.com/o/oauth2/v2/auth',
      token: 'https://oauth2.googleapis.com/token',
      userinfo: 'https://www.googleapis.com/oauth2/v3/userinfo',
      clientId: import.meta.env.VITE_GOOGLE_ID,
      scope: 'openid profile email'
    }
  ]
};

export const signIn = (provider = 'github') => {
  const params = new URLSearchParams({
    client_id: provider === 'github' 
      ? import.meta.env.VITE_GITHUB_ID 
      : import.meta.env.VITE_GOOGLE_ID,
    redirect_uri: `${window.location.origin}/api/auth/callback/${provider}`,
    scope: provider === 'github' 
      ? 'read:user user:email' 
      : 'email profile',
    state: Date.now().toString(),
    response_type: 'code'
  });

  // For GitHub
  if (provider === 'github') {
    window.location.href = `https://github.com/login/oauth/authorize?${params}`;
  }
  // For Google
  else {
    window.location.href = `https://accounts.google.com/o/oauth2/auth?${params}`;
  }
};

export const signOut = () => {
  localStorage.removeItem('user');
  window.location.href = '/';
};

export const getSession = () => {
  try {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  } catch (error) {
    console.error('Failed to get session:', error);
    return null;
  }
};

// Handle URL parameters after OAuth callback
export const handleCallback = () => {
  const params = new URLSearchParams(window.location.search);
  const authStatus = params.get('auth');
  const userData = params.get('user');

  if (authStatus === 'success' && userData) {
    try {
      const user = JSON.parse(decodeURIComponent(userData));
      localStorage.setItem('user', JSON.stringify(user));
      // Clean up URL
      window.history.replaceState({}, document.title, '/');
      return user;
    } catch (error) {
      console.error('Failed to parse user data:', error);
    }
  }
  return null;
};
