export default function handler(req, res) {
  console.log('Session request headers:', req.headers);
  
  try {
    // Parse cookies manually from header
    const cookieHeader = req.headers.cookie;
    console.log('Cookie header:', cookieHeader);
    
    if (!cookieHeader) {
      console.log('No cookies found');
      return res.status(401).json({ error: 'No session found' });
    }

    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {});

    console.log('Parsed cookies:', cookies);

    const userCookie = cookies.user;
    if (!userCookie) {
      console.log('No user cookie found');
      return res.status(401).json({ error: 'No session found' });
    }
    
    const user = JSON.parse(decodeURIComponent(userCookie));
    console.log('Parsed user:', user);
    
    res.status(200).json(user);
  } catch (error) {
    console.error('Session error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to get session' });
  }
}
