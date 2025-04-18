import dotenv from 'dotenv';
dotenv.config();

export default async function handler(req, res) {
  console.log('GitHub OAuth callback received:', { url: req.url, query: req.query });
  const { code, state } = req.query;
  if (!code) {
    console.log('No code parameter in GitHub callback');
    return res.status(400).send('Missing code parameter in GitHub callback');
  }

  try {
    const clientId = process.env.GITHUB_ID || process.env.VITE_GITHUB_ID;
    const clientSecret = process.env.GITHUB_SECRET || process.env.VITE_GITHUB_SECRET;
    console.log('Exchanging GitHub code for token...');
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: `${req.headers.origin}/api/auth/callback/github`
      })
    });

    const tokenData = await tokenResponse.json();
    console.log('GitHub token response:', tokenData);

    const userResponse = await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });
    const userData = await userResponse.json();
    console.log('GitHub user data:', userData);

    const user = {
      id: userData.id,
      name: userData.name || userData.login,
      email: userData.email,
      provider: 'github'
    };
    console.log('User authenticated (GitHub):', user);
    return res.redirect('/?auth=success&user=' + encodeURIComponent(JSON.stringify(user)));
  } catch (error) {
    console.error('GitHub OAuth error:', error);
    return res.redirect('/?error=AuthenticationFailed');
  }
}
