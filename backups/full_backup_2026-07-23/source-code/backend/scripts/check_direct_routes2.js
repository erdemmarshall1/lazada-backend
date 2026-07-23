const https = require('https');

async function checkUrl(url) {
  try {
    const html = await new Promise((resolve, reject) => {
      https.get(url, { timeout: 15000 }, (res) => {
        let d = '';
        res.on('data', c => d += c);
        res.on('end', () => resolve({ status: res.statusCode, body: d.slice(0, 2000) }));
      }).on('error', reject).on('timeout', function() { this.destroy(); reject(new Error('timeout')); });
    });
    const isOffline = html.body.includes("You're Offline") || html.body.includes('You are offline');
    const hasSPA = html.body.includes('id="app"');
    console.log(url);
    console.log('  Status: ' + html.status + ' | Offline: ' + (isOffline ? 'YES' : 'No') + ' | SPA: ' + (hasSPA ? 'Yes' : 'No'));
  } catch (e) {
    console.log(url + ' -> Error: ' + e.message);
  }
}

async function main() {
  await checkUrl('https://master.theoutnet-wholesales.pages.dev/');
  await checkUrl('https://master.theoutnet-wholesales.pages.dev/login');
  await checkUrl('https://master.theoutnet-wholesales.pages.dev/searchgoods');
  await checkUrl('https://master.theoutnet-wholesales.pages.dev/register');
}
main();
