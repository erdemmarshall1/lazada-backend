const https = require('https');
const API = 'https://lazada-backend-production-3b57.up.railway.app';

const ids = [
  '6a4b5d11507b0208132b1e05',
  '6a4b5d10507b0208132b06cc',
  '6a4b5d10507b0208132b02e3',
  '6a4b5d10507b0208132afdc0',
  '6a4b5d0e507b0208132abb9c',
];

async function check(id) {
  return new Promise((resolve) => {
    const url = API + '/uploads/product_images/' + id + '.jpg';
    https.get(url, { timeout: 10000 }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        console.log(`${id}: status=${res.statusCode}, type=${res.headers['content-type']}, size=${d.length}`);
        console.log(`  Body: ${d.slice(0, 100)}`);
        resolve();
      });
    }).on('error', (e) => {
      console.log(`${id}: Error: ${e.message}`);
      resolve();
    });
  });
}

async function main() {
  for (const id of ids) {
    await check(id);
  }
}
main();
