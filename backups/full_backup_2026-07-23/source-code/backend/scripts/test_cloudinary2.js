const cloudinary = require('cloudinary').v2;
const https = require('https');
const fs = require('fs');
const path = require('path');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'u7xxu5dq',
  api_key: process.env.CLOUDINARY_API_KEY || '726627823236327',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'qJmfLkCQ-wvbAhx6RQcf4MCVBUE',
});

const API = 'https://supportive-delight-production-b90c.up.railway.app';
const TMP = path.join(__dirname, '..', 'uploads', 'tmp_test');

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
  
  if (!fs.existsSync(TMP)) fs.mkdirSync(TMP, { recursive: true });
  const localFile = path.join(TMP, 'test_image.jpg');
  
  const file = fs.createWriteStream(localFile);
  await new Promise((resolve, reject) => {
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

  if (stats.size > 100) {
    const fd = fs.openSync(localFile, 'r');
    const buf = Buffer.alloc(4);
    fs.readSync(fd, buf, 0, 4, 0);
    fs.closeSync(fd);
    const isJPEG = buf[0] === 0xFF && buf[1] === 0xD8;
    const isPNG = buf[0] === 0x89 && buf[1] === 0x50;
    console.log('File signature:', buf.toString('hex'));
    console.log('Is valid JPEG:', isJPEG);
    console.log('Is valid PNG:', isPNG);

    // Test 3: Upload to Cloudinary from local file
    try {
      const result = await cloudinary.uploader.upload(localFile, {
        public_id: 'test_upload_local',
        overwrite: true,
      });
      console.log('\nUpload from local file SUCCESS:');
      console.log('  URL:', result.secure_url);
    } catch (e) {
      console.log('\nUpload from local file FAILED:', e.message);
    }
  }

  // Test 4: Upload from Railway URL
  try {
    const result = await cloudinary.uploader.upload(testUrl, {
      public_id: 'test_url_upload',
      overwrite: true,
      timeout: 30000,
    });
    console.log('\nUpload from URL SUCCESS:');
    console.log('  URL:', result.secure_url);
  } catch (e) {
    console.log('\nUpload from URL FAILED:', e.message);
  }

  // Cleanup
  try { fs.unlinkSync(localFile); } catch(e) {}
  try { fs.rmdirSync(TMP); } catch(e) {}
}

main().catch(console.error);
