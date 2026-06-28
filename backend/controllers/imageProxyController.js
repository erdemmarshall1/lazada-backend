const https = require('https');
const http = require('http');
const { URL } = require('url');
const fs = require('fs');
const path = require('path');

const ALLOWED_DOMAINS = [
  'pixabay.com',
  'd3oobv9weovhej.cloudfront.net',
  'images.pexels.com',
  'cdn.pixabay.com',
  'i.imgur.com',
  'unsplash.com',
  'images.unsplash.com',
  'via.placeholder.com',
  'picsum.photos',
  'img.ltwebstatic.com',
  'sc.ltwebstatic.com',
  'sheinsz.ltwebstatic.com',
  'cjs.ltwebstatic.com',
  'img.shein.com',
  'us.shein.com',
  'count.shein.com',
];

const PLACEHOLDER_DIR = path.join(__dirname, '..', 'uploads', 'product_images');

const isAllowedUrl = (urlStr) => {
  try {
    const parsed = new URL(urlStr);
    return ALLOWED_DOMAINS.some(d => parsed.hostname === d || parsed.hostname.endsWith('.' + d));
  } catch { return false }
};

exports.proxy = async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) return res.redirect('/home/image/placeholder');
    if (!isAllowedUrl(url)) return res.redirect('/home/image/placeholder');

    const mod = url.startsWith('https') ? https : http;
    const reqOptions = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://pixabay.com/',
      },
      timeout: 10000,
    };

    mod.get(url, reqOptions, (proxyRes) => {
      if (proxyRes.statusCode >= 300 && proxyRes.statusCode < 400 && proxyRes.headers.location) {
        const redirectUrl = new URL(proxyRes.headers.location, url).href;
        mod.get(redirectUrl, reqOptions, (r2) => {
          if (r2.statusCode !== 200) { r2.resume(); return res.redirect('/home/image/placeholder'); }
          const ct = r2.headers['content-type'] || 'image/jpeg';
          res.setHeader('Content-Type', ct);
          res.setHeader('Cache-Control', 'public, max-age=86400');
          r2.pipe(res);
        }).on('error', () => res.redirect('/home/image/placeholder'));
        return;
      }
      if (proxyRes.statusCode !== 200) {
        proxyRes.resume();
        return res.redirect('/home/image/placeholder');
      }
      const contentType = proxyRes.headers['content-type'] || 'image/jpeg';
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      proxyRes.pipe(res);
    }).on('error', () => res.redirect('/home/image/placeholder'));
  } catch (error) {
    res.redirect('/home/image/placeholder');
  }
};

exports.placeholder = (req, res) => {
  const { text, w = 400, h = 400 } = req.query;
  const label = text ? text.replace(/[<>&"]/g, '').slice(0, 30) : 'Product Image';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#667eea"/>
        <stop offset="100%" style="stop-color:#764ba2"/>
      </linearGradient>
    </defs>
    <rect width="${w}" height="${h}" fill="url(#bg)" rx="8"/>
    <text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle" fill="rgba(255,255,255,0.3)" font-size="${Math.round(w * 0.25)}" font-family="sans-serif">📦</text>
    <text x="50%" y="60%" dominant-baseline="middle" text-anchor="middle" fill="white" font-size="${Math.round(w * 0.055)}" font-family="Arial,sans-serif" font-weight="600">${label}</text>
    <text x="50%" y="72%" dominant-baseline="middle" text-anchor="middle" fill="rgba(255,255,255,0.6)" font-size="${Math.round(w * 0.035)}" font-family="Arial,sans-serif">Shopify Wholesale</text>
  </svg>`;
  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.send(svg);
};
