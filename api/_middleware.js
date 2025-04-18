export default function middleware(req, res) {
  // Parse cookies
  req.cookies = req.headers.cookie?.split(';').reduce((cookies, cookie) => {
    const [name, value] = cookie.trim().split('=');
    if (name && value) {
      cookies[name] = decodeURIComponent(value);
    }
    return cookies;
  }, {}) || {};

  return Promise.resolve();
}
