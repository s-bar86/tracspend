export default async function handler(req, res) {
  console.log('Auth callback received:', {
    url: req.url,
    method: req.method,
    query: req.query,
    cookies: req.cookies
  });
  const { provider } = req.query;

  if (req.url.includes('/callback')) {
    const { code, state } = req.query;
    
    try {
      // Exchange code for access token
      console.log('Attempting to exchange code for token...');
      const tokenEndpoint = provider === 'github' 
        ? 'https://github.com/login/oauth/access_token'
        : 'https://oauth2.googleapis.com/token';
      console.log('Token endpoint:', tokenEndpoint);
      
      const tokenResponse = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          client_id: process.env[`VITE_${provider.toUpperCase()}_ID`],
          client_secret: process.env[`VITE_${provider.toUpperCase()}_SECRET`],
          code,
          redirect_uri: `${req.headers.origin}/api/auth/callback/${provider}`,
          grant_type: 'authorization_code'
        })
      });

      const tokenData = await tokenResponse.json();
      console.log('Token response:', tokenData);
      
      // Get user info
      const userResponse = await fetch(
        provider === 'github'
          ? 'https://api.github.com/user'
          : 'https://www.googleapis.com/oauth2/v3/userinfo',
        {
          headers: {
            Authorization: `Bearer ${tokenData.access_token}`,
          },
        }
      );

      const userData = await userResponse.json();
      console.log('User data:', userData);
      
      // Create session
      res.setHeader('Set-Cookie', [
        `user=${JSON.stringify({
          id: userData.id || userData.sub,
          name: userData.name,
          email: userData.email,
          provider
        })}; Path=/; HttpOnly; SameSite=Lax`
      ]);

      console.log('Setting cookie and redirecting...');
      res.redirect('/');
    } catch (error) {
      console.error('Auth error:', error);
      console.error('Error stack:', error.stack);
      res.redirect('/?error=AuthenticationFailed');
    }
  } else {
    res.status(400).json({ error: 'Invalid request' });
  }
}
