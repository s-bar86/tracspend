import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { URLSearchParams } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

// Google OAuth callback
app.get('/api/auth/callback/google', async (req, res) => {
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
      redirect_uri: `${req.headers.origin}/api/auth/callback/google`,
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
});

// GitHub OAuth callback
app.get('/api/auth/callback/github', async (req, res) => {
  console.log('GitHub OAuth callback received:', { url: req.url, query: req.query });
  const { code, state } = req.query;
  if (!code) {
    console.log('Missing code parameter in GitHub callback');
    return res.status(400).send('Missing code parameter in GitHub callback');
  }
  try {
    // Exchange code for access token
    const params = new URLSearchParams({
      client_id: process.env.GITHUB_ID || process.env.VITE_GITHUB_ID,
      client_secret: process.env.GITHUB_SECRET || process.env.VITE_GITHUB_SECRET,
      code,
      redirect_uri: `${req.headers.origin}/api/auth/callback/github`
    });
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ client_id: params.get('client_id'), client_secret: params.get('client_secret'), code })
    });
    const tokenData = await tokenResponse.json();
    console.log('GitHub token response:', tokenData);

    // Get user info
    const userResponse = await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });
    const userData = await userResponse.json();
    console.log('GitHub user data:', userData);

    // Create session and redirect
    const user = { id: userData.id, name: userData.name || userData.login, email: userData.email, provider: 'github' };
    console.log('User authenticated (GitHub):', user);
    return res.redirect('/?auth=success&user=' + encodeURIComponent(JSON.stringify(user)));
  } catch (error) {
    console.error('GitHub OAuth error:', error);
    return res.redirect('/?error=AuthenticationFailed');
  }
});

// Sign out (no-op, session is client-side)
app.post('/api/auth/signout', (req, res) => {
  console.log('Sign out');
  res.status(200).send('Signed out');
});

// Serve static assets
app.use(express.static(path.join(__dirname, '../dist')));

// SPA fallback
app.use('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

export default app;
