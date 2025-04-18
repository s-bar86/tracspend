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

export const signIn = async (provider) => {
  const providerConfig = config.providers.find(p => p.id === provider);
  if (!providerConfig) throw new Error(`Provider ${provider} not found`);

  const state = Math.random().toString(36).substring(7);
  sessionStorage.setItem('oauth_state', state);

  const params = new URLSearchParams({
    client_id: providerConfig.clientId,
    redirect_uri: `${window.location.origin}/api/auth/callback/${provider}`,
    scope: providerConfig.scope || 'read:user user:email',
    state,
    response_type: 'code'
  });

  window.location.href = `${providerConfig.authorization}?${params}`;
};

export const signOut = async () => {
  await fetch('/api/auth/signout', { method: 'POST' });
  window.location.reload();
};

export const getSession = async () => {
  try {
    const response = await fetch('/api/auth/session');
    if (response.ok) {
      return await response.json();
    }
    return null;
  } catch (error) {
    console.error('Failed to get session:', error);
    return null;
  }
};
