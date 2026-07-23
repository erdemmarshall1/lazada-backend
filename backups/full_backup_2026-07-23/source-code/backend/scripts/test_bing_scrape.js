const https = require('https');
const cheerio = require('cheerio');

const url = 'https://www.bing.com/images/search?q=Nike+Air+Max&form=HDRSC2&first=1';
https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }, timeout: 15000 }, (res) => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    const $ = cheerio.load(d);
    
    // Try various selectors for Bing image results
    let found = [];
    $('img').each((i, el) => {
      const src = $(el).attr('src') || $(el).attr('data-src');
      if (src && src.startsWith('http')) {
        found.push(src);
      }
    });
    
    console.log('Total img tags:', found.length);
    console.log('First 5:');
    found.slice(0, 5).forEach((s, i) => console.log(`  ${i+1}. ${s.substring(0, 100)}`));
    console.log('HTML length:', d.length);
  });
}).on('error', e => console.log('Error:', e.message));
