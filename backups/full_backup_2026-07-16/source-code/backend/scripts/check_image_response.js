const https = require('https');

const url = 'https://supportive-delight-production-b90c.up.railway.app/uploads/product_images/6a4b5d13507b0208132b5e96.jpg';

https.get(url, { timeout: 15000 }, (res) => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Headers:', JSON.stringify(res.headers, null, 2));
    console.log('Body:', d);
  });
}).on('error', console.error);

// Also check the lazada-backend URL
const url2 = 'https://lazada-backend-production-3b57.up.railway.app/uploads/product_images/6a4b5d13507b0208132b5e96.jpg';

https.get(url2, { timeout: 15000 }, (res) => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    console.log('\nLazada-backend:');
    console.log('Status:', res.statusCode);
    console.log('Headers:', JSON.stringify(res.headers, null, 2));
    console.log('Body:', d);
  });
}).on('error', console.error);
