export default function handler(req, res) {
  try {
    const userCookie = req.cookies.user;
    if (!userCookie) {
      return res.status(401).json({ error: 'No session found' });
    }
    
    const user = JSON.parse(userCookie);
    res.status(200).json(user);
  } catch (error) {
    console.error('Session error:', error);
    res.status(500).json({ error: 'Failed to get session' });
  }
}
