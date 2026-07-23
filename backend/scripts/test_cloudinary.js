const cloudinary = require('cloudinary').v2;
const https = require('https');
const fs = require('fs');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'u7xxu5dq',
  api_key: process.env.CLOUDINARY_API_KEY || '726627823236327',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'qJmfLkCQ-wvbAhx6RQcf4MCVBUE',
});

const API = 'https://supportive-delight-production-b90c.up.railway.app';

async function main() {
  // Test 1: Ping Cloudinary
  try {
    const ping = await cloudinary.api.ping();
    console.log('Cloudinary ping:', ping.status || 'OK');
  } catch (e) {
    console.log('Cloudinary ping failed:', e.message);
  }

  // Test 2: Download a product image from Railway
  const testUrl = API + '/uploads/product_images/6a4b5d13507b0208132b5e96.jpg';
  console.log('\nDownloading test image from:', testUrl);
  const localFile = 'C:\\Users\\Tron\\AppData\\Local\\Temp\\opencode\\test_image.jpg';
  
  await new Promise((resolve, reject) => {
    const file = fs.createWriteStream(localFile);
    https.get(testUrl, { timeout: 15000 }, (res) => {
      if (res.statusCode !== 200) {
        console.log('HTTP status:', res.statusCode);
        reject(new Error('HTTP ' + res.statusCode));
        return;
      }
      console.log('Content-Type:', res.headers['content-type']);
      console.log('Content-Length:', res.headers['content-length']);
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    }).on('error', reject);
  });
  
  const stats = fs.statSync(localFile);
  console.log('Downloaded file size:', stats.size, 'bytes');

  // Read first bytes to check if it's a valid image
  const fd = fs.openSync(localFile, 'r');
  const buf = Buffer.alloc(4);
  fs.readSync(fd, buf, 0, 4, 0);
  fs.closeSync(fd);
  const isJPEG = buf[0] === 0xFF && buf[1] === 0xD8;
  const isPNG = buf[0] === 0x89 && buf[1] === 0x50;
  console.log('File signature:', buf.toString('hex'));
  console.log('Is JPEG:', isJPEG);
  console.log('Is PNG:', isPNG);

  // Test 3: Upload to Cloudinary from local file
  if (stats.size > 100) {
    try {
      const result = await cloudinary.uploader.upload(localFile, {
        public_id: 'test_upload',
        overwrite: true,
      });
      console.log('\nUpload from local file SUCCESS:');
      console.log('  URL:', result.secure_url);
      console.log('  Public ID:', result.public_id);
      console.log('  Format:', result.format);
      console.log('  Width:', result.width, 'Height:', result.height);
    } catch (e) {
      console.log('\nUpload from local file FAILED:', e.message);
    }
  }

  // Test 4: Upload from Railway URL
  try {
    const result = await cloudinary.uploader.upload(testUrl, {
      public_id: 'test_url_upload',
      overwrite: true,
    });
    console.log('\nUpload from URL SUCCESS:');
    console.log('  URL:', result.secure_url);
  } catch (e) {
    console.log('\nUpload from URL FAILED:', e.message);
  }
}

main().catch(console.error);
