const mongoose = require('mongoose');

async function main() {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGO_URI or MONGODB_URI environment variable required');
    process.exit(1);
  }
  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  const collection = mongoose.connection.collection('products');
  const cursor = collection.find({ images: { $type: 'string' } });
  let fixed = 0;
  while (await cursor.hasNext()) {
    const doc = await cursor.next();
    if (typeof doc.images === 'string' && doc.images.trim()) {
      const arr = doc.images.split(/\s+/).filter(Boolean);
      await collection.updateOne({ _id: doc._id }, { $set: { images: arr } });
      fixed++;
    }
  }
  console.log(`Fixed ${fixed} products with string images`);
  await mongoose.disconnect();
}

main().catch(err => { console.error(err); process.exit(1); });
