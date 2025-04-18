export default async function handler(req, res) {
  const { provider } = req.query;

  if (req.url.includes('/callback')) {
    try {
      // Exchange code for access token
      const tokenEndpoint = provider === 'github' 
        ? 'https://github.com/login/oauth/access_token'
        : 'https://oauth2.googleapis.com/token';
      
      const tokenResponse = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          client_id: process.env.VITE_GITHUB_ID,
          client_secret: process.env.VITE_GITHUB_SECRET,
          code: req.query.code,
          redirect_uri: `${req.headers.origin}/api/auth/callback/${provider}`,
          grant_type: 'authorization_code'
        })
      });

      const tokenData = await tokenResponse.json();
      
      // Get user info
      const userResponse = await fetch(
        provider === 'github' 
          ? `https://api.github.com/user?access_token=${tokenData.access_token}`
          : `https://www.googleapis.com/oauth2/v1/userinfo?access_token=${tokenData.access_token}`,
        {
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`
          }
        }
      );

      const userData = await userResponse.json();
      
      // Create session
      const user = {
        id: userData.id || userData.sub,
        name: userData.name,
        email: userData.email,
        provider
      };
      
      // Redirect with success parameter
      res.redirect('/?auth=success&user=' + encodeURIComponent(JSON.stringify(user)));
    } catch (error) {
      console.error('Auth error:', error);
      res.redirect('/?error=AuthenticationFailed');
    }
  } else {
    res.status(400).json({ error: 'Invalid request' });
  }
}
