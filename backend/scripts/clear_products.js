const mongoose = require('mongoose');
async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) { console.error('MONGODB_URI not set'); process.exit(1); }
  await mongoose.connect(uri);
  const result = await mongoose.connection.db.collection('products').deleteMany({});
  console.log(`Deleted ${result.deletedCount} products`);
  await mongoose.disconnect();
}
main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
