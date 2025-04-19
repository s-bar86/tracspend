import dotenv from 'dotenv';
dotenv.config();

export default async function handler(req, res) {
  console.log('Google OAuth callback received:', { url: req.url, query: req.query });
  const { code, state } = req.query;
  if (!code) {
    console.log('Missing code parameter in Google callback');
    return res.status(400).send('Missing code parameter in Google callback');
  }

  try {
    // Exchange code for access token
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_ID || process.env.VITE_GOOGLE_ID,
      client_secret: process.env.GOOGLE_SECRET || process.env.VITE_GOOGLE_SECRET,
      code,
      redirect_uri: `${req.headers.origin}/api/google`,
      grant_type: 'authorization_code'
    });
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    });
    const tokenData = await tokenResponse.json();
    console.log('Google token response:', tokenData);

    // Get user info
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });
    const userData = await userResponse.json();
    console.log('Google user data:', userData);

    // Create session and redirect
    const user = { id: userData.sub, name: userData.name, email: userData.email, provider: 'google' };
    console.log('User authenticated (Google):', user);
    return res.redirect('/?auth=success&user=' + encodeURIComponent(JSON.stringify(user)));
  } catch (error) {
    console.error('Google OAuth error:', error);
    return res.redirect('/?error=AuthenticationFailed');
  }
}
