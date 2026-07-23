const https = require('https');
const http = require('http');

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.6321.0 Mobile Safari/537.36',
];

function fetch(url, opts = {}) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    const headers = {
      'User-Agent': opts.ua || USER_AGENTS[0],
      'Accept': opts.accept || 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      ...(opts.headers || {}),
    };
    const req = mod.get(url, { headers, timeout: 15000 }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: d }));
    });
    req.on('error', reject);
    req.on('timeout', function() { this.destroy(); reject(new Error('timeout')); });
  });
}

async function testGoogleImages(query) {
  const q = encodeURIComponent(query);
  // Try different Google image search URL formats
  const urls = [
    `https://www.google.com/search?tbm=isch&q=${q}&gbv=1`,  // basic HTML
    `https://images.google.com/images?q=${q}&gbv=1`,        // images subdomain
    `https://www.google.com/search?tbm=isch&q=${q}&hl=en`,  // with language
  ];
  
  for (const url of urls) {
    for (const ua of USER_AGENTS) {
      try {
        const { status, body, headers } = await fetch(url, { ua });
        const hasImages = body.includes('img') || body.includes('src=');
        const size = body.length;
        console.log(`  [G] ${status} ${Math.round(size/1024)}KB has= ${hasImages} | ${url.split('?')[0].substring(0, 60)}`);
        
        if (status === 200 && hasImages) {
          // Extract image URLs
          const matches = body.match(/"(https?:\/\/[^"]+\.(?:jpg|jpeg|png|gif|webp)[^"]*)"/gi) || [];
          const unique = [...new Set(matches.slice(0, 5))];
          console.log(`      Found ${matches.length} image URLs`);
          unique.forEach(u => console.log(`      ${u.substring(0, 80)}`));
          return unique;
        }
      } catch(e) {
        // console.log(`  [G] Error: ${e.message}`);
      }
    }
  }
  return [];
}

async function testYandexImages(query) {
  const q = encodeURIComponent(query);
  const urls = [
    `https://yandex.com/images/search?text=${q}`,
    `https://yandex.ru/images/search?text=${q}`,
  ];
  
  for (const url of urls) {
    for (const ua of USER_AGENTS) {
      try {
        const { status, body } = await fetch(url, { ua });
        const hasImages = body.includes('img') || body.includes('src=') || body.includes('serp-item');
        const size = body.length;
        console.log(`  [Y] ${status} ${Math.round(size/1024)}KB has= ${hasImages} | ${url.split('?')[0].substring(0, 60)}`);
        
        if (status === 200 && hasImages) {
          const matches = body.match(/"(https?:\/\/[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/gi) || [];
          const unique = [...new Set(matches.slice(0, 5))];
          console.log(`      Found ${matches.length} image URLs`);
          unique.forEach(u => console.log(`      ${u.substring(0, 80)}`));
          return unique;
        }
      } catch(e) {
        // console.log(`  [Y] Error: ${e.message}`);
      }
    }
  }
  return [];
}

async function testBingImages(query) {
  const q = encodeURIComponent(query);
  const urls = [
    `https://www.bing.com/images/search?q=${q}&form=HDRSC2`,
    `https://www.bing.com/images/search?q=${q}&form=QBIR`,
  ];
  
  for (const url of urls) {
    for (const ua of USER_AGENTS) {
      try {
        const { status, body } = await fetch(url, { ua });
        const hasImages = body.includes('img') || body.includes('src=') || body.includes('mimg');
        const size = body.length;
        console.log(`  [B] ${status} ${Math.round(size/1024)}KB has= ${hasImages} | ${url.split('?')[0].substring(0, 60)}`);
        
        if (status === 200 && hasImages) {
          const matches = body.match(/"(https?:\/\/[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/gi) || [];
          const unique = [...new Set(matches.slice(0, 5))];
          console.log(`      Found ${matches.length} image URLs`);
          unique.forEach(u => console.log(`      ${u.substring(0, 80)}`));
          return unique;
        }
      } catch(e) {
        // console.log(`  [B] Error: ${e.message}`);
      }
    }
  }
  return [];
}

async function testDuckDuckGoImages(query) {
  const q = encodeURIComponent(query);
  // Use the HTML version
  const urls = [
    `https://html.duckduckgo.com/html/?q=${q}`,
    `https://lite.duckduckgo.com/lite/?q=${q}`,
  ];
  
  for (const url of urls) {
    try {
      const { status, body } = await fetch(url, { 
        ua: USER_AGENTS[1],
        accept: 'text/html',
        headers: { 'DNT': '1' }
      });
      const size = body.length;
      const hasImages = body.includes('<img') || body.includes('src=');
      console.log(`  [D] ${status} ${Math.round(size/1024)}KB has= ${hasImages} | ${url}`);
      if (hasImages) {
        const imgRegex = /<img[^>]+src="([^"]+)"[^>]*>/g;
        let match, urls = [];
        while ((match = imgRegex.exec(body)) !== null) {
          if (match[1].startsWith('http')) urls.push(match[1]);
          if (urls.length >= 3) break;
        }
        console.log(`      Images: ${urls.length > 0 ? urls.map(u => u.substring(0, 60)).join(', ') : 'extracted but non-http'}`);
        return urls;
      }
    } catch(e) {
      // skip
    }
  }
  return [];
}

async function main() {
  const queries = [
    'BCBGMAXAZRIA Women Sleeveless Halter Neck Velvet Gown Black',
    'Issey Miyake L\'eau d\'Issey Rose & Rose for Women',
    'Tory Burch Britten Pebble Chain Shoulder Bag Ivory',
  ];
  
  for (const query of queries) {
    console.log(`\nQuery: ${query.substring(0, 60)}...`);
    console.log('--- Google Images ---');
    let results = await testGoogleImages(query);
    if (results.length === 0) {
      console.log('  No results from Google');
    }
    
    console.log('--- Bing Images ---');
    results = await testBingImages(query);
    if (results.length === 0) {
      console.log('  No results from Bing');
    }
    
    console.log('--- Yandex Images ---');
    results = await testYandexImages(query);
    if (results.length === 0) {
      console.log('  No results from Yandex');
    }
    
    console.log('--- DuckDuckGo ---');
    results = await testDuckDuckGoImages(query);
    if (results.length === 0) {
      console.log('  No results from DDG');
    }
  }
  
  console.log('\n=== DONE ===');
}

main().catch(console.error);
