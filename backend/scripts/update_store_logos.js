const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const Shop = require('../models/Shop');

const logoMap = {
  'Global Fashion Store': 'https://picsum.photos/seed/globalstore/200/200',
  'Tech Haven': 'https://picsum.photos/seed/techhaven/200/200',
  'Fashion Forward': 'https://picsum.photos/seed/fashionfwd/200/200',
  'Home & Living Co.': 'https://picsum.photos/seed/homeliving/200/200',
  'Sports Central': 'https://picsum.photos/seed/sports/200/200',
  'Beauty Bloom': 'https://picsum.photos/seed/beautybloom/200/200',
  'Book Nook': 'https://picsum.photos/seed/booknook/200/200',
  'Gadget Galaxy': 'https://picsum.photos/seed/gadgetgalaxy/200/200',
}

async function updateLogos() {
  await mongoose.connect(process.env.MONGODB_URI)
  console.log('Connected to MongoDB')

  let updated = 0
  for (const [name, logo] of Object.entries(logoMap)) {
    const result = await Shop.updateOne({ name }, { $set: { logo } })
    if (result.modifiedCount > 0) {
      console.log(`  UPDATED: "${name}" -> ${logo}`)
      updated++
    } else {
      console.log(`  SKIP: "${name}" not found or already set`)
    }
  }

  console.log(`\nDone. ${updated} store logos updated.`)
  await mongoose.disconnect()
  process.exit(0)
}

updateLogos().catch(err => { console.error(err); process.exit(1) })
