const https = require('https');

https.get('https://master.theoutnet-wholesales.pages.dev/login', { timeout: 15000 }, (res) => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Content-Type:', res.headers['content-type']);
    console.log('First 500 chars:');
    console.log(d.slice(0, 500));
    console.log('---');
    console.log('Contains offline:', d.includes("You're Offline"));
    console.log('Contains id="app":', d.includes('id="app"'));
    console.log('Contains div id="app":', d.includes('div id="app"'));
  });
}).on('error', console.error);
