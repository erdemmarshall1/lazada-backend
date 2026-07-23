const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: 'u7xxu5dq',
  api_key: '726627823236327',
  api_secret: 'qJmfLkCQ-wvbAhx6RQcf4MCVBUE',
});

const merchProdUrls = [
  'https://s3.outnetsource.top/tikiproduct/uploads/20260205/dda90c18b7c78af00574e6cea867375c.jpg',
  'https://s3.outnetsource.top/tikiproduct/uploads/20260205/e9ced1b2fa875cca62028d9a3b0b79e8.jpg',
  'https://s3.outnetsource.top/tikiproduct/static/men-Accessories/1624682800597-5AtqFF7suAJXKfLYD.jpg',
  'https://s3.outnetsource.top/tikiproduct/uploads/20260202/6bbf820c938fb594333128c35f34b373.jpg',
  'https://s3.outnetsource.top/tikiproduct/uploads/20260205/56a3d0827e16310baeedb53c336191e6.jpg',
  'https://s3.outnetsource.top/tikiproduct/uploads/20260204/afd793c3117653a9a0ac422b2d79c16f.jpg',
];

const merchantAvatarUrls = [
  'https://s3.popularity1.shop/tikiproduct/uploads/20260116/712e0a2b239f13608ad0678be0336d4e.webp',
  'https://s3.popularity1.shop/tikiproduct/uploads/20260116/644071227bdb78253c24f6a3836708da.webp',
  'https://s3.popularity1.shop/tikiproduct/uploads/20260116/c318603168ee6c090ce90e03c772a03a.webp',
  'https://s3.popularity1.shop/tikiproduct/uploads/20260116/b62f1aeb3a2ff5977d5dbc59da4a3c6b.webp',
  'https://s3.popularity1.shop/tikiproduct/uploads/20260116/753fbd9557ec67f7bfd0b040f2fb32d0.webp',
  'https://s3.popularity1.shop/tikiproduct/uploads/20260116/1a0be269d8de5e2d1812dedabd1b890a.webp',
];

async function uploadAll() {
  console.log('=== Uploading Merchant Product Images ===');
  for (let i = 0; i < merchProdUrls.length; i++) {
    try {
      const r = await cloudinary.uploader.upload(merchProdUrls[i], {
        public_id: 'merchants/prod_' + (i + 1),
        overwrite: true, timeout: 20000,
      });
      console.log(`  prod_${i+1}: ${r.secure_url}`);
    } catch (e) {
      console.log(`  prod_${i+1} FAIL: ${e.message}`);
    }
  }

  const names = ['VELORA','SERAVYN','MAISON_VELLE','NORVIA','SAVVY_DEALS','Zion_Store'];
  console.log('\n=== Uploading Merchant Avatars ===');
  for (let i = 0; i < merchantAvatarUrls.length; i++) {
    try {
      const r = await cloudinary.uploader.upload(merchantAvatarUrls[i], {
        public_id: 'merchants/avatar_' + names[i],
        overwrite: true, timeout: 20000,
      });
      console.log(`  avatar_${names[i]}: ${r.secure_url}`);
    } catch (e) {
      console.log(`  avatar_${names[i]} FAIL: ${e.message}`);
    }
  }
  console.log('\nDone!');
}

uploadAll();
