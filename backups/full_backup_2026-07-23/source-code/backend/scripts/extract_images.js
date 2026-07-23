const fs = require('fs');
const path = require('path');

const jsonPath = path.join(__dirname, '..', '..', 'products_with_images.json');
const products = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Save each product's image as a file
products.forEach((p, i) => {
  const ext = 'png';
  const filename = `product_${i}.${ext}`;
  const base64Data = p.Image.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(base64Data, 'base64');
  fs.writeFileSync(path.join(uploadsDir, filename), buffer);
  p.imageFile = `/uploads/${filename}`;
  delete p.Image;
  console.log(`  [${i}/${products.length}] ${filename} <- ${p.Name.slice(0, 50)}`);
});

// Save updated JSON with file paths
fs.writeFileSync(jsonPath, JSON.stringify(products, null, 2));
console.log(`\nDone! ${products.length} images saved to ${uploadsDir}`);
