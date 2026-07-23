const https = require('https');

function checkUrl(url) {
  return new Promise((resolve) => {
    https.get(url, { method: 'GET', timeout: 15000 }, (res) => {
      let d = '';
      res.on('data', c => { d += c; if (d.length > 500) res.destroy(); });
      res.on('end', () => {
        const isOffline = d.includes("You're Offline") || d.includes('You are offline');
        const hasSPA = d.includes('id="app"') || d.includes('main');
        console.log(`  ${url}`);
        console.log(`    Status: ${res.statusCode}`);
        console.log(`    Offline page: ${isOffline ? 'YES' : 'No'}`);
        console.log(`    SPA content: ${hasSPA ? 'Yes' : 'No'}`);
        resolve();
      });
    }).on('error', (e) => {
      console.log(`  ${url} -> Error: ${e.message}`);
      resolve();
    });
  });
}

async function main() {
  const urls = [
    'https://master.theoutnet-wholesales.pages.dev/',
    'https://master.theoutnet-wholesales.pages.dev/login',
    'https://master.theoutnet-wholesales.pages.dev/searchgoods',
    'https://master.theoutnet-wholesales.pages.dev/register',
    'https://811db5f7.theoutnet-wholesales.pages.dev/login',
    'https://811db5f7.theoutnet-wholesales.pages.dev/searchgoods',
  ];
  for (const u of urls) {
    await checkUrl(u);
  }
}
main();
