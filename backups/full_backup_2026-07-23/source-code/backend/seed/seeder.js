const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const User = require('../models/User');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Shop = require('../models/Shop');
const Banner = require('../models/Banner');
const Cart = require('../models/Cart');
const Wallet = require('../models/Wallet');
const PaymentSetting = require('../models/PaymentSetting');

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    await Promise.all([
      User.deleteMany({}), Category.deleteMany({}),
      Product.deleteMany({}), Shop.deleteMany({}),
      Banner.deleteMany({}), Cart.deleteMany({}),
      Wallet.deleteMany({}),
    ]);

    const admin = await User.create({
      username: 'admin', email: 'admin@shopifywholesale.com',
      password: 'admin123', role: 'admin',
    });

    const buyer = await User.create({
      username: 'buyer', email: 'buyer@shopifywholesale.com',
      password: 'buyer123', role: 'buyer',
    });

    const seller = await User.create({
      username: 'seller', email: 'seller@shopifywholesale.com',
      password: 'seller123', role: 'seller',
    });

    await Cart.create({ userId: buyer._id, items: [] });
    await Cart.create({ userId: seller._id, items: [] });
    await Wallet.create({ userId: buyer._id, balance: 10000 });
    await Wallet.create({ userId: seller._id, balance: 50000 });

    const LOGO_PREFIX = 'https://picsum.photos/seed'

    const shop = await Shop.create({
      userId: seller._id, name: 'Global Fashion Store',
      description: 'Best fashion products from around the world',
      logo: `${LOGO_PREFIX}/globalstore/200/200`, status: 1, rating: 4.5, 
      salesCount: 1523, productCount: 0, followerCount: 845,
      storeNumber: 'S00001',
    });

    const storeDefs = [
      { name: 'Tech Haven', desc: 'Premium electronics and gadgets for tech enthusiasts', rating: 4.7, sales: 2841, followers: 1230, logo: `${LOGO_PREFIX}/techhaven/200/200` },
      { name: 'Fashion Forward', desc: 'Trendy clothing and accessories for every style', rating: 4.3, sales: 1956, followers: 980, logo: `${LOGO_PREFIX}/fashionfwd/200/200` },
      { name: 'Home & Living Co.', desc: 'Everything to make your home beautiful and cozy', rating: 4.6, sales: 1642, followers: 756, logo: `${LOGO_PREFIX}/homeliving/200/200` },
      { name: 'Sports Central', desc: 'Gear up with top-quality sports equipment and apparel', rating: 4.4, sales: 2108, followers: 892, logo: `${LOGO_PREFIX}/sports/200/200` },
      { name: 'Beauty Bloom', desc: 'Skincare, makeup, and beauty essentials', rating: 4.8, sales: 3215, followers: 1567, logo: `${LOGO_PREFIX}/beautybloom/200/200` },
      { name: 'Book Nook', desc: 'Discover your next great read from our curated collection', rating: 4.2, sales: 987, followers: 534, logo: `${LOGO_PREFIX}/booknook/200/200` },
      { name: 'Gadget Galaxy', desc: 'Latest tech innovations and smart devices', rating: 4.5, sales: 2534, followers: 1102, logo: `${LOGO_PREFIX}/gadgetgalaxy/200/200` },
    ]
    const createdStores = [shop]
    for (let i = 0; i < storeDefs.length; i++) {
      const def = storeDefs[i]
      const user = await User.create({
        username: `seller${i + 2}`, email: `seller${i + 2}@shopifywholesale.com`,
        password: 'seller123', role: 'seller',
      })
      await Cart.create({ userId: user._id, items: [] })
      await Wallet.create({ userId: user._id, balance: 10000 })
      const s = await Shop.create({
        userId: user._id, name: def.name, description: def.desc,
        logo: def.logo, status: 1, rating: def.rating,
        salesCount: def.sales, productCount: 0, followerCount: def.followers,
        storeNumber: `S${String(i + 2).padStart(5, '0')}`,
      })
      createdStores.push(s)
    }

    const categories = await Category.create([
      { name: 'Fashion', level: 1, icon: '', sort: 1 },
      { name: 'Electronics', level: 1, icon: '', sort: 2 },
      { name: 'Home & Living', level: 1, icon: '', sort: 3 },
      { name: 'Beauty', level: 1, icon: '', sort: 4 },
      { name: 'Sports', level: 1, icon: '', sort: 5 },
    ]);

    const subCats = await Category.create([
      { name: 'Men Clothing', parentId: categories[0]._id, level: 2, sort: 1 },
      { name: 'Women Clothing', parentId: categories[0]._id, level: 2, sort: 2 },
      { name: 'Shoes', parentId: categories[0]._id, level: 2, sort: 3 },
      { name: 'Smartphones', parentId: categories[1]._id, level: 2, sort: 1 },
      { name: 'Laptops', parentId: categories[1]._id, level: 2, sort: 2 },
      { name: 'Headphones', parentId: categories[1]._id, level: 2, sort: 3 },
      { name: 'Furniture', parentId: categories[2]._id, level: 2, sort: 1 },
      { name: 'Skincare', parentId: categories[3]._id, level: 2, sort: 1 },
      { name: 'Makeup', parentId: categories[3]._id, level: 2, sort: 2 },
      { name: 'Fitness', parentId: categories[4]._id, level: 2, sort: 1 },
    ]);

    const productData = [
      {
            "name": "New Spring 2022 new arrival side slit Women Cheongsam Polyester Chinese style traditional ladies qipao dress 718579",
            "image": "/uploads/product_99.png",
            "price": 86.66,
            "description": "High quality New Spring 2022 new arrival side slit Women Cheongsam Polyester Chinese style traditional ladies qipao dress 718579 at great price. Shop now!"
      },
      {
            "name": "Custom high quality women  casual work clothes  fashion O neck dress summer suitable for work wear",
            "image": "/uploads/product_96.png",
            "price": 61.6,
            "description": "High quality Custom high quality women  casual work clothes  fashion O neck dress summer suitable for work wear at great price. Shop now!"
      },
      {
            "name": "2023 Spring and summer popula Women's tail Women's clothing coat Mixed package Second-hand clothing Tail cargo",
            "image": "/uploads/product_85.png",
            "price": 0.99,
            "description": "High quality 2023 Spring and summer popula Women's tail Women's clothing coat Mixed package Second-hand clothing Tail cargo at great price. Shop now!"
      },
      {
            "name": "Wholesale 2023 Spring Small Fragrant Coat Women's Senior Design Sense Small Leisure Women's Suit",
            "image": "/uploads/product_88.png",
            "price": 48.7,
            "description": "High quality Wholesale 2023 Spring Small Fragrant Coat Women's Senior Design Sense Small Leisure Women's Suit at great price. Shop now!"
      },
      {
            "name": "Knitted Tassel Sleeveless Plain Maxi Dress Women Plus Size Holiday Beach Long Dress",
            "image": "/uploads/product_90.png",
            "price": 13.5,
            "description": "High quality Knitted Tassel Sleeveless Plain Maxi Dress Women Plus Size Holiday Beach Long Dress at great price. Shop now!"
      },
      {
            "name": "Neck care, neck and shoulder relaxation device, Liaolee, 2024 new masterpiece, Mother's Day gift, EMS &amp; TENS, vibration, heat, neck relaxation",
            "image": "/uploads/product_89.png",
            "price": 49,
            "description": "High quality Neck care, neck and shoulder relaxation device, Liaolee, 2024 new masterpiece, Mother's Day gift, EMS &amp; TENS, vibration, heat, neck relaxation at great price. Shop now!"
      },
      {
            "name": "women's slim long dress seaside holiday floral pattern pleated maxi dress",
            "image": "/uploads/product_94.png",
            "price": 39.9,
            "description": "High quality women's slim long dress seaside holiday floral pattern pleated maxi dress at great price. Shop now!"
      },
      {
            "name": "High-End Design Sense Irregular Midii Dress  Cotton Knitted Long Sleeved A-Line Dress Summer Sustainable Chiffon Material",
            "image": "/uploads/product_97.png",
            "price": 21,
            "description": "High quality High-End Design Sense Irregular Midii Dress  Cotton Knitted Long Sleeved A-Line Dress Summer Sustainable Chiffon Material at great price. Shop now!"
      },
      {
            "name": "TWOTWINSTYLE Fashion Square Collar Long Sleeve High Waist Folds One Piece Elegant Women Dresses",
            "image": "/uploads/product_87.png",
            "price": 39.27,
            "description": "High quality TWOTWINSTYLE Fashion Square Collar Long Sleeve High Waist Folds One Piece Elegant Women Dresses at great price. Shop now!"
      },
      {
            "name": "New Arrival Regular Sleeve 18-24 25-35 Years Dress Woman Fashion Dresses 2022 Women",
            "image": "/uploads/product_95.png",
            "price": 114.15,
            "description": "High quality New Arrival Regular Sleeve 18-24 25-35 Years Dress Woman Fashion Dresses 2022 Women at great price. Shop now!"
      },
      {
            "name": "Hot Selling Spring and Summer Suitable for Women's Clothing Casual Printed Two-Piece Set Organza Silk Co-Ords Set (Top+bottom)",
            "image": "/uploads/product_93.png",
            "price": 25.08,
            "description": "High quality Hot Selling Spring and Summer Suitable for Women's Clothing Casual Printed Two-Piece Set Organza Silk Co-Ords Set (Top+bottom) at great price. Shop now!"
      },
      {
            "name": "Ocstrade Hot Sale Summer V Neck Elegant Dresses Fashion Solid Color Sleeveless Slit Short Custom Oem Casual Dresses Women",
            "image": "/uploads/product_84.png",
            "price": 18.91,
            "description": "High quality Ocstrade Hot Sale Summer V Neck Elegant Dresses Fashion Solid Color Sleeveless Slit Short Custom Oem Casual Dresses Women at great price. Shop now!"
      },
      {
            "name": "Brand New Shining Sequins Cloth For Women Long Sleeve Single Button Casual Shorts Suit Lady Fashion 2Pcs",
            "image": "/uploads/product_92.png",
            "price": 57.9,
            "description": "High quality Brand New Shining Sequins Cloth For Women Long Sleeve Single Button Casual Shorts Suit Lady Fashion 2Pcs at great price. Shop now!"
      },
      {
            "name": "Summer Beach Dresses Lady Women Elegant Long Party Slip Ribbed Wrap Bodycon Casual Maxi Knitted Dress",
            "image": "/uploads/product_91.png",
            "price": 8.86,
            "description": "High quality Summer Beach Dresses Lady Women Elegant Long Party Slip Ribbed Wrap Bodycon Casual Maxi Knitted Dress at great price. Shop now!"
      },
      {
            "name": "Best-selling Sleeveless Women's Dresses Black Summer Clothes Organic Fabric LIAM MAXI DRESS With Floral Straps WHITE ANT",
            "image": "/uploads/product_82.png",
            "price": 95,
            "description": "High quality Best-selling Sleeveless Women's Dresses Black Summer Clothes Organic Fabric LIAM MAXI DRESS With Floral Straps WHITE ANT at great price. Shop now!"
      },
      {
            "name": "New Arrival Long Sleeve Short Women's Dress Front Zipper Stunning ARYM MINI DRESS WITH FEATHERS WHITEANT Summer Collection",
            "image": "/uploads/product_83.png",
            "price": 89,
            "description": "High quality New Arrival Long Sleeve Short Women's Dress Front Zipper Stunning ARYM MINI DRESS WITH FEATHERS WHITEANT Summer Collection at great price. Shop now!"
      },
      {
            "name": "High quality dress brands women Summer dress women clothing Sleeveless v-neck embroidery Glitter dresses women sexy",
            "image": "/uploads/product_98.png",
            "price": 100,
            "description": "High quality High quality dress brands women Summer dress women clothing Sleeveless v-neck embroidery Glitter dresses women sexy at great price. Shop now!"
      },
      {
            "name": "Ruffled mini diamond-embellished long-sleeved dress light luxury high-end women's clothing wholesale factory",
            "image": "/uploads/product_86.png",
            "price": 72.9,
            "description": "High quality Ruffled mini diamond-embellished long-sleeved dress light luxury high-end women's clothing wholesale factory at great price. Shop now!"
      },
      {
            "name": "Anker Eufy Smart Scale P2 Pro (Body Composition Scale) [App compatible/Fitbit compatible/Body fat percentage/BMI/Heart rate/Muscle mass",
            "image": "/uploads/product_81.png",
            "price": 49,
            "description": "High quality Anker Eufy Smart Scale P2 Pro (Body Composition Scale) [App compatible/Fitbit compatible/Body fat percentage/BMI/Heart rate/Muscle mass at great price. Shop now!"
      },
      {
            "name": "Factory directly supply custom double breasted jackets classic long windproof belt trench coat women long trench coat",
            "image": "/uploads/product_80.png",
            "price": 29.7,
            "description": "High quality Factory directly supply custom double breasted jackets classic long windproof belt trench coat women long trench coat at great price. Shop now!"
      },
      {
            "name": "Wholesale Clothes Dress Direct Imported Stock Swimsuit Bulk Clothes Mix Bulk Bales Tops Bale Clothes Apparel Stock",
            "image": "/uploads/product_77.png",
            "price": 0.98,
            "description": "High quality Wholesale Clothes Dress Direct Imported Stock Swimsuit Bulk Clothes Mix Bulk Bales Tops Bale Clothes Apparel Stock at great price. Shop now!"
      },
      {
            "name": "Buy H&amp;M Gift Card AUD AU $500",
            "image": "/uploads/product_60.png",
            "price": 495,
            "description": "High quality Buy H&amp;M Gift Card AUD AU $500 at great price. Shop now!"
      },
      {
            "name": "Work clothes female technician clothes beautician high-end health center technician hakama suit dress",
            "image": "/uploads/product_68.png",
            "price": 40.5,
            "description": "High quality Work clothes female technician clothes beautician high-end health center technician hakama suit dress at great price. Shop now!"
      },
      {
            "name": "Top Quality Short Women's Dress PHOEBE MINI DRESS With Collar 73%Polyester 17%Rayon 10%Spandex WHITEANT Vietnam Manufacturers",
            "image": "/uploads/product_71.png",
            "price": 56,
            "description": "High quality Top Quality Short Women's Dress PHOEBE MINI DRESS With Collar 73%Polyester 17%Rayon 10%Spandex WHITEANT Vietnam Manufacturers at great price. Shop now!"
      },
      {
            "name": "2024 Custom logo Summer Loungewear Suit beach Terry towel white 2 piece short set tank top and boxer short sets for women",
            "image": "/uploads/product_65.png",
            "price": 15.8,
            "description": "High quality 2024 Custom logo Summer Loungewear Suit beach Terry towel white 2 piece short set tank top and boxer short sets for women at great price. Shop now!"
      },
      {
            "name": "Stock new orleans mardi gras apparel clothing sequin jackets mardi gras apparel for women",
            "image": "/uploads/product_64.png",
            "price": 17.17,
            "description": "High quality Stock new orleans mardi gras apparel clothing sequin jackets mardi gras apparel for women at great price. Shop now!"
      },
      {
            "name": "BC-21-3 Luxury Manufacturer Lounge Wear Sets Women Women's Clothing Wholesale Ladies Clothes Summer Outfits Women",
            "image": "/uploads/product_66.png",
            "price": 91.78,
            "description": "High quality BC-21-3 Luxury Manufacturer Lounge Wear Sets Women Women's Clothing Wholesale Ladies Clothes Summer Outfits Women at great price. Shop now!"
      },
      {
            "name": "Feather Tassel Mesh Beaded Sling Women Dress Summer Elegant Sleeveless Female Holiday Beach Party Mini Dresses",
            "image": "/uploads/product_67.png",
            "price": 15.8,
            "description": "High quality Feather Tassel Mesh Beaded Sling Women Dress Summer Elegant Sleeveless Female Holiday Beach Party Mini Dresses at great price. Shop now!"
      },
      {
            "name": "Pink Casual Two Piece Set Zipper Hoodie Crop Top and Pants Tracksuit Women Set Solid 2 Piece Set Women Autumn Summer Outfits New",
            "image": "/uploads/product_63.png",
            "price": 12.6,
            "description": "High quality Pink Casual Two Piece Set Zipper Hoodie Crop Top and Pants Tracksuit Women Set Solid 2 Piece Set Women Autumn Summer Outfits New at great price. Shop now!"
      },
      {
            "name": "2024Fashion Long Dress Chinese Style Print Flower Cheongsam Qipao",
            "image": "/uploads/product_73.png",
            "price": 53.2,
            "description": "High quality 2024Fashion Long Dress Chinese Style Print Flower Cheongsam Qipao at great price. Shop now!"
      },
      {
            "name": "Omron Digital Automatic Blood Pressure Monitor HEM-1000",
            "image": "/uploads/product_69.png",
            "price": 79,
            "description": "High quality Omron Digital Automatic Blood Pressure Monitor HEM-1000 at great price. Shop now!"
      },
      {
            "name": "Omron Wrist Blood Pressure Monitor HEM-6164 White",
            "image": "/uploads/product_72.png",
            "price": 39,
            "description": "High quality Omron Wrist Blood Pressure Monitor HEM-6164 White at great price. Shop now!"
      },
      {
            "name": "SS2311 New Trending Summer Luxury Beaded Bandage Fabric Crystal Rhinestone Sets For Women Two Pieces",
            "image": "/uploads/product_70.png",
            "price": 42,
            "description": "High quality SS2311 New Trending Summer Luxury Beaded Bandage Fabric Crystal Rhinestone Sets For Women Two Pieces at great price. Shop now!"
      },
      {
            "name": "Women's Blouses 2024 Tops Long Sleeve Cotton Chic Blouse  Design Lace Tassels Oversize Loose Women White Shirt Blouses",
            "image": "/uploads/product_76.png",
            "price": 18.23,
            "description": "High quality Women's Blouses 2024 Tops Long Sleeve Cotton Chic Blouse  Design Lace Tassels Oversize Loose Women White Shirt Blouses at great price. Shop now!"
      },
      {
            "name": "Summer New Women Casual Dress Slim Dress Chinese Style Sexy Cheongsam",
            "image": "/uploads/product_61.png",
            "price": 55.65,
            "description": "High quality Summer New Women Casual Dress Slim Dress Chinese Style Sexy Cheongsam at great price. Shop now!"
      },
      {
            "name": "Great Quality Elegant Green Color 82% Polyester 18% Elastane Lime Juice Tube One piece Women's Dress For Export by Lotte Duty Free",
            "image": "/uploads/product_79.png",
            "price": 114,
            "description": "High quality Great Quality Elegant Green Color 82% Polyester 18% Elastane Lime Juice Tube One piece Women's Dress For Export by Lotte Duty Free at great price. Shop now!"
      },
      {
            "name": "Fashion Design 2023 new arrivals Summer Dresses Women Sexy New Women Style V-Neck One-piece Dress",
            "image": "/uploads/product_74.png",
            "price": 34,
            "description": "High quality Fashion Design 2023 new arrivals Summer Dresses Women Sexy New Women Style V-Neck One-piece Dress at great price. Shop now!"
      },
      {
            "name": "Dark Color Summer New Long Qipao Print Flower Chinese Cheongsam",
            "image": "/uploads/product_75.png",
            "price": 62.2,
            "description": "High quality Dark Color Summer New Long Qipao Print Flower Chinese Cheongsam at great price. Shop now!"
      },
      {
            "name": "clothes designer supplier wholesale casual  summer clothes for womendresses for ladies dresses and skirts",
            "image": "/uploads/product_78.png",
            "price": 68,
            "description": "High quality clothes designer supplier wholesale casual  summer clothes for womendresses for ladies dresses and skirts at great price. Shop now!"
      },
      {
            "name": "Summer Fashion 2022 New Tulle Beading Prom V-neck Ruffles Party Dress Banquet Long Plus Size Evening Dresses",
            "image": "/uploads/product_62.png",
            "price": 162,
            "description": "High quality Summer Fashion 2022 New Tulle Beading Prom V-neck Ruffles Party Dress Banquet Long Plus Size Evening Dresses at great price. Shop now!"
      },
      {
            "name": "Anker Eufy Smart Scale P3 (Body Composition Scale) [App compatible/Fitbit compatible/Body fat percentage/BMI/Heart rate/Muscle mass",
            "image": "/uploads/product_41.png",
            "price": 69,
            "description": "High quality Anker Eufy Smart Scale P3 (Body Composition Scale) [App compatible/Fitbit compatible/Body fat percentage/BMI/Heart rate/Muscle mass at great price. Shop now!"
      },
      {
            "name": "High quality Spring new fashion style trench coat British style thin wild small high school trench coat women ladies trench coat",
            "image": "/uploads/product_47.png",
            "price": 35,
            "description": "High quality High quality Spring new fashion style trench coat British style thin wild small high school trench coat women ladies trench coat at great price. Shop now!"
      },
      {
            "name": "Womens Suit Knit Sweater Set Custom Designer Winter Cotton Polyester Knit Sweater 2 Piece Set Women Knit Two Piece Sweater Set",
            "image": "/uploads/product_40.png",
            "price": 18,
            "description": "High quality Womens Suit Knit Sweater Set Custom Designer Winter Cotton Polyester Knit Sweater 2 Piece Set Women Knit Two Piece Sweater Set at great price. Shop now!"
      },
      {
            "name": "Amazing Long Women's Dress Back Slit Luxury DIAZ FEATHER LONG DRESS Floral Cotton Jacquard Fabric Summer Clothes WHITEANT",
            "image": "/uploads/product_59.png",
            "price": 79,
            "description": "High quality Amazing Long Women's Dress Back Slit Luxury DIAZ FEATHER LONG DRESS Floral Cotton Jacquard Fabric Summer Clothes WHITEANT at great price. Shop now!"
      },
      {
            "name": "TAOP&amp;ZA 2023 new summer women's asymmetric sleeveless suspender striped tight midi dress Vestidos Mujer 5584179",
            "image": "/uploads/product_52.png",
            "price": 10.4,
            "description": "High quality TAOP&amp;ZA 2023 new summer women's asymmetric sleeveless suspender striped tight midi dress Vestidos Mujer 5584179 at great price. Shop now!"
      },
      {
            "name": "2024  Summer Ldyllic Vacation Style High-End luxury Women's V-Collar Dress Embroidery Sunflower SilK Dress",
            "image": "/uploads/product_58.png",
            "price": 67,
            "description": "High quality 2024  Summer Ldyllic Vacation Style High-End luxury Women's V-Collar Dress Embroidery Sunflower SilK Dress at great price. Shop now!"
      },
      {
            "name": "Custom Hoodies 3 Piece Crop Top Jogger Set Causal Tanktop Pants Women'S Hoodies Sweatshirts Hoodie Set Women'S Sets",
            "image": "/uploads/product_51.png",
            "price": 28,
            "description": "High quality Custom Hoodies 3 Piece Crop Top Jogger Set Causal Tanktop Pants Women'S Hoodies Sweatshirts Hoodie Set Women'S Sets at great price. Shop now!"
      },
      {
            "name": "Casual Dress Print Women 3 4 Sleeve Mini Length Navy Blue Quantity Custom OEM Spandex Silhouette Anti Rayon Long Logo Style Time",
            "image": "/uploads/product_46.png",
            "price": 66,
            "description": "High quality Casual Dress Print Women 3 4 Sleeve Mini Length Navy Blue Quantity Custom OEM Spandex Silhouette Anti Rayon Long Logo Style Time at great price. Shop now!"
      },
      {
            "name": "Best-selling Long Women's Dress With Small Belt EMILIA PLEATED MIDI DRESS Floral Cotton Jacquard Custom Labels Summer Clothes",
            "image": "/uploads/product_53.png",
            "price": 82,
            "description": "High quality Best-selling Long Women's Dress With Small Belt EMILIA PLEATED MIDI DRESS Floral Cotton Jacquard Custom Labels Summer Clothes at great price. Shop now!"
      },
      {
            "name": "High Quality Solid Cashmere Coats for Women Elegant Luxury Winter Handmade Custom Long Wrap Wool Coat",
            "image": "/uploads/product_45.png",
            "price": 106,
            "description": "High quality High Quality Solid Cashmere Coats for Women Elegant Luxury Winter Handmade Custom Long Wrap Wool Coat at great price. Shop now!"
      },
      {
            "name": "GIMILY oem custom Solid color Lace long dress lapel Waist hollow Single-breasted irregular dress for women with very popular",
            "image": "/uploads/product_43.png",
            "price": 62,
            "description": "High quality GIMILY oem custom Solid color Lace long dress lapel Waist hollow Single-breasted irregular dress for women with very popular at great price. Shop now!"
      },
      {
            "name": "Heavyweight 240 Gsm Blank Oversized Graphic Men'S Clothing Plain Custom Oversized T Shirt Pour Les Hommes Hemp T-Shirt",
            "image": "/uploads/product_49.png",
            "price": 5.3,
            "description": "High quality Heavyweight 240 Gsm Blank Oversized Graphic Men'S Clothing Plain Custom Oversized T Shirt Pour Les Hommes Hemp T-Shirt at great price. Shop now!"
      },
      {
            "name": "Fashion puffer coat Wholesale Top Quality Quilted Trench Coat Long Sleeve Women Padded coat",
            "image": "/uploads/product_56.png",
            "price": 40,
            "description": "High quality Fashion puffer coat Wholesale Top Quality Quilted Trench Coat Long Sleeve Women Padded coat at great price. Shop now!"
      },
      {
            "name": "2023 New Women's Fashion Luxury Dress D Logo Letter Thread Spliced Women's Dress",
            "image": "/uploads/product_42.png",
            "price": 72.63,
            "description": "High quality 2023 New Women's Fashion Luxury Dress D Logo Letter Thread Spliced Women's Dress at great price. Shop now!"
      },
      {
            "name": "Winter New Year Christmas Slim Drawstring Sleeveless Pullover Women Dress High Waist Short Skirt Set Summer Sexy Mini Natural",
            "image": "/uploads/product_55.png",
            "price": 5.99,
            "description": "High quality Winter New Year Christmas Slim Drawstring Sleeveless Pullover Women Dress High Waist Short Skirt Set Summer Sexy Mini Natural at great price. Shop now!"
      },
      {
            "name": "Women Shining Tight Mini Dress Strapless Viscose Polyamide Black Fashion Casual Choice Quantity Simple",
            "image": "/uploads/product_50.png",
            "price": 55,
            "description": "High quality Women Shining Tight Mini Dress Strapless Viscose Polyamide Black Fashion Casual Choice Quantity Simple at great price. Shop now!"
      },
      {
            "name": "HOSTARON Gym Clothing Workout Women Skirts High Waist Breathable Lightweight Running Golf Pickleball Tennis Short Pleated Skirt",
            "image": "/uploads/product_57.png",
            "price": 10.98,
            "description": "High quality HOSTARON Gym Clothing Workout Women Skirts High Waist Breathable Lightweight Running Golf Pickleball Tennis Short Pleated Skirt at great price. Shop now!"
      },
      {
            "name": "summer clothes for women 2023 Hot Sale Off Shoulder Halter Neck Loose Ladies Dress For Women",
            "image": "/uploads/product_44.png",
            "price": 6.35,
            "description": "High quality summer clothes for women 2023 Hot Sale Off Shoulder Halter Neck Loose Ladies Dress For Women at great price. Shop now!"
      },
      {
            "name": "Verified Suppliers Clothing Apparel Casual Dresses Manufacturers Factory In China Wholesale Custom High Quality Women",
            "image": "/uploads/product_54.png",
            "price": 14.98,
            "description": "High quality Verified Suppliers Clothing Apparel Casual Dresses Manufacturers Factory In China Wholesale Custom High Quality Women at great price. Shop now!"
      },
      {
            "name": "Haute Couture Casual  Silk Dresses Clothing Women Dresses Women Lady Elegant Clothing Manufacturers Custom Silk Dress",
            "image": "/uploads/product_48.png",
            "price": 493.52,
            "description": "High quality Haute Couture Casual  Silk Dresses Clothing Women Dresses Women Lady Elegant Clothing Manufacturers Custom Silk Dress at great price. Shop now!"
      },
      {
            "name": "GX0265 Fashion 2024 summer boutique clothing women unique dresses sleeveless ruffle design square neck mini irregular dress",
            "image": "/uploads/product_29.png",
            "price": 12.8,
            "description": "High quality GX0265 Fashion 2024 summer boutique clothing women unique dresses sleeveless ruffle design square neck mini irregular dress at great price. Shop now!"
      },
      {
            "name": "Clothing manufacturers for customs Fashion clothes ladies Dresses Summer Female Elegant Evening casual dresses Women wholesale",
            "image": "/uploads/product_39.png",
            "price": 14.9,
            "description": "High quality Clothing manufacturers for customs Fashion clothes ladies Dresses Summer Female Elegant Evening casual dresses Women wholesale at great price. Shop now!"
      },
      {
            "name": "TWOTWINSTYLE Lapel Long Sleeve High Waist Spliced Button winter windbreak  jacket for women",
            "image": "/uploads/product_20.png",
            "price": 75.35,
            "description": "High quality TWOTWINSTYLE Lapel Long Sleeve High Waist Spliced Button winter windbreak  jacket for women at great price. Shop now!"
      },
      {
            "name": "Top Fashion clothes women elegant OEM/ODM Chinese style silk vintage dresses ink and wash printed dress",
            "image": "/uploads/product_26.png",
            "price": 67,
            "description": "High quality Top Fashion clothes women elegant OEM/ODM Chinese style silk vintage dresses ink and wash printed dress at great price. Shop now!"
      },
      {
            "name": "2024 Spring Summer lounge wears lime green XXXS ribbed tshirt and shorts 2 two pieces loungewear women sets clothing streetwear",
            "image": "/uploads/product_21.png",
            "price": 10.6,
            "description": "High quality 2024 Spring Summer lounge wears lime green XXXS ribbed tshirt and shorts 2 two pieces loungewear women sets clothing streetwear at great price. Shop now!"
      },
      {
            "name": "Silk Skirt French  Summer Fashion Casual Womens V-neck Dress Small Floral Skirt",
            "image": "/uploads/product_30.png",
            "price": 64.7,
            "description": "High quality Silk Skirt French  Summer Fashion Casual Womens V-neck Dress Small Floral Skirt at great price. Shop now!"
      },
      {
            "name": "New Plaid business casual coat for men's wear",
            "image": "/uploads/product_23.png",
            "price": 48,
            "description": "High quality New Plaid business casual coat for men's wear at great price. Shop now!"
      },
      {
            "name": "Buy Razer Gold Gift Card USD $1000",
            "image": "/uploads/product_24.png",
            "price": 998,
            "description": "High quality Buy Razer Gold Gift Card USD $1000 at great price. Shop now!"
      },
      {
            "name": "Luxury Suit Women Ladies Church Suits Tweed Set Midi Office Designer Elegant Lady Bosses Cape Skirt Suit",
            "image": "/uploads/product_27.png",
            "price": 120,
            "description": "High quality Luxury Suit Women Ladies Church Suits Tweed Set Midi Office Designer Elegant Lady Bosses Cape Skirt Suit at great price. Shop now!"
      },
      {
            "name": "Spring fashion solid color long sleeved loose oversized top plus size knitted skirt 2 piece suit dress women's sweater",
            "image": "/uploads/product_33.png",
            "price": 20.98,
            "description": "High quality Spring fashion solid color long sleeved loose oversized top plus size knitted skirt 2 piece suit dress women's sweater at great price. Shop now!"
      },
      {
            "name": "AD1895 Fashion Sexy Long Sleeve High Neck Outfits Mesh Bodycon Women Sexy Dress Club Wear Woman",
            "image": "/uploads/product_22.png",
            "price": 76,
            "description": "High quality AD1895 Fashion Sexy Long Sleeve High Neck Outfits Mesh Bodycon Women Sexy Dress Club Wear Woman at great price. Shop now!"
      },
      {
            "name": "Wool Knitted Pullover Hoodie Sweater Wholesale Custom Thick Full Zip Cashmere High Quality Casual Standard Long Sleeve Crew Neck",
            "image": "/uploads/product_36.png",
            "price": 40,
            "description": "High quality Wool Knitted Pullover Hoodie Sweater Wholesale Custom Thick Full Zip Cashmere High Quality Casual Standard Long Sleeve Crew Neck at great price. Shop now!"
      },
      {
            "name": "High-End Luxury Brand HangZhou Authentic 2024 Summer 100% Silk Dress Half-Sleeved V-Neck Embroidered Dress",
            "image": "/uploads/product_28.png",
            "price": 68,
            "description": "High quality High-End Luxury Brand HangZhou Authentic 2024 Summer 100% Silk Dress Half-Sleeved V-Neck Embroidered Dress at great price. Shop now!"
      },
      {
            "name": "NO MOQ Wholesale Sexy Long Sleeve v Neck Beach Skirt Nightclub Dress Chiffon Stitching Party Solid Color Casual Women Clothing",
            "image": "/uploads/product_37.png",
            "price": 7.15,
            "description": "High quality NO MOQ Wholesale Sexy Long Sleeve v Neck Beach Skirt Nightclub Dress Chiffon Stitching Party Solid Color Casual Women Clothing at great price. Shop now!"
      },
      {
            "name": "2024 Latest Pattern High Quality Women Elastic Stretch Free Size Fashion Print Womens 2 Piece Outfit Two Piece Sets",
            "image": "/uploads/product_35.png",
            "price": 38,
            "description": "High quality 2024 Latest Pattern High Quality Women Elastic Stretch Free Size Fashion Print Womens 2 Piece Outfit Two Piece Sets at great price. Shop now!"
      },
      {
            "name": "2025 Best-selling Latest Smartphone 17air Phone Model Best-selling Latest Release True 5G Smartphone US Version Unlocked",
            "image": "/uploads/product_38.png",
            "price": 1299,
            "description": "High quality 2025 Best-selling Latest Smartphone 17air Phone Model Best-selling Latest Release True 5G Smartphone US Version Unlocked at great price. Shop now!"
      },
      {
            "name": "TZ114 New 2024 European Chic  Long Sleeve Shirt jacket + skirt Set Women's Casual Clothing 1",
            "image": "/uploads/product_31.png",
            "price": 33.98,
            "description": "High quality TZ114 New 2024 European Chic  Long Sleeve Shirt jacket + skirt Set Women's Casual Clothing 1 at great price. Shop now!"
      },
      {
            "name": "CITIZEN Forehead Thermometer HL710H",
            "image": "/uploads/product_34.png",
            "price": 35,
            "description": "High quality CITIZEN Forehead Thermometer HL710H at great price. Shop now!"
      },
      {
            "name": "Hot Summer Sexy Solid Color Mini Backless Fringed Ripped Hooded Night Club Wholesale Bodycon Custom Stock Factory Women Dress",
            "image": "/uploads/product_25.png",
            "price": 7,
            "description": "High quality Hot Summer Sexy Solid Color Mini Backless Fringed Ripped Hooded Night Club Wholesale Bodycon Custom Stock Factory Women Dress at great price. Shop now!"
      },
      {
            "name": "2023 Women Winter Clothes Custom Sweet Elegant V Neck A Line Dresses Ladies Casual Sexy Shiny New Autumn Skinny Velvet  Dress",
            "image": "/uploads/product_32.png",
            "price": 22.79,
            "description": "High quality 2023 Women Winter Clothes Custom Sweet Elegant V Neck A Line Dresses Ladies Casual Sexy Shiny New Autumn Skinny Velvet  Dress at great price. Shop now!"
      },
      {
            "name": "Muslin Pencil Dress with Straps %100 Cotton Pure Organic Daily Spring Unique Dress Model Summer Spring Daily boutique",
            "image": "/uploads/product_8.png",
            "price": 51,
            "description": "High quality Muslin Pencil Dress with Straps %100 Cotton Pure Organic Daily Spring Unique Dress Model Summer Spring Daily boutique at great price. Shop now!"
      },
      {
            "name": "Plastic Gift Cards With Logo And Barcode,Qr Code Pvc Gift Card,Serial Number Discount PVC Cards",
            "image": "/uploads/product_2.png",
            "price": 10,
            "description": "High quality Plastic Gift Cards With Logo And Barcode,Qr Code Pvc Gift Card,Serial Number Discount PVC Cards at great price. Shop now!"
      },
      {
            "name": "Aimedata Non-contact Electronic Thermometer, Infrared, 32 Records, TOAMIT, Toa Sangyo, Large LED LCD Screen, 2 Measurement Modes, Automatic Power Off, White, Battery Operated, Body Temperature",
            "image": "/uploads/product_6.png",
            "price": 25,
            "description": "High quality Aimedata Non-contact Electronic Thermometer, Infrared, 32 Records, TOAMIT, Toa Sangyo, Large LED LCD Screen, 2 Measurement Modes, Automatic Power Off, White, Battery Operated, Body Temperature at great price. Shop now!"
      },
      {
            "name": "GIMILY oem custom wholesale sexy women party dresses Female Double Ruffle Edge one line collar Embroidered mini dress for women",
            "image": "/uploads/product_16.png",
            "price": 65,
            "description": "High quality GIMILY oem custom wholesale sexy women party dresses Female Double Ruffle Edge one line collar Embroidered mini dress for women at great price. Shop now!"
      },
      {
            "name": "Popular new fashion short sleeve clothes square collar casual cute dresses for women summer",
            "image": "/uploads/product_9.png",
            "price": 117.46,
            "description": "High quality Popular new fashion short sleeve clothes square collar casual cute dresses for women summer at great price. Shop now!"
      },
      {
            "name": "new Summer Casual Fashion Clothes OEM Wholesale Custom V Neck Embroidered Trim Long Maxi Dresses Women",
            "image": "/uploads/product_7.png",
            "price": 16.9,
            "description": "High quality new Summer Casual Fashion Clothes OEM Wholesale Custom V Neck Embroidered Trim Long Maxi Dresses Women at great price. Shop now!"
      },
      {
            "name": "Autumn and winter new design elegant British and Chinese windbreaker coat temperament women's windbreaker Women's Sets",
            "image": "/uploads/product_19.png",
            "price": 26,
            "description": "High quality Autumn and winter new design elegant British and Chinese windbreaker coat temperament women's windbreaker Women's Sets at great price. Shop now!"
      },
      {
            "name": "Brand New Fast Shipping 17 Pro Max Phone 6.9 Inch I New 17 Pro Max Mobile Phone Unlocked 5G Dual Sim 2TB, 1TB 256GB +512GB",
            "image": "/uploads/product_0.png",
            "price": 1699,
            "description": "High quality Brand New Fast Shipping 17 Pro Max Phone 6.9 Inch I New 17 Pro Max Mobile Phone Unlocked 5G Dual Sim 2TB, 1TB 256GB +512GB at great price. Shop now!"
      },
      {
            "name": "womenwears office women Suit Set sexy v neck hollow out Outerwear clothes Two piece long Pants set casual outfit Lisa Same clothes",
            "image": "/uploads/product_18.png",
            "price": 64.8,
            "description": "High quality womenwears office women Suit Set sexy v neck hollow out Outerwear clothes Two piece long Pants set casual outfit Lisa Same clothes at great price. Shop now!"
      },
      {
            "name": "Womens Clothing Luxury Coats for Ladies Long Down Winter Puffer Jacket Women Woman Down Jacket Stand Woven Padding Bomber Jacket",
            "image": "/uploads/product_11.png",
            "price": 75.4,
            "description": "High quality Womens Clothing Luxury Coats for Ladies Long Down Winter Puffer Jacket Women Woman Down Jacket Stand Woven Padding Bomber Jacket at great price. Shop now!"
      },
      {
            "name": "Men Hanfu Readymade 4Xl 5Xl Men Hanfu Costume Hot Sale Adult Ming Dynasty Flying fish Suit Chinese Traditional Men Hanfu",
            "image": "/uploads/product_1.png",
            "price": 35.45,
            "description": "High quality Men Hanfu Readymade 4Xl 5Xl Men Hanfu Costume Hot Sale Adult Ming Dynasty Flying fish Suit Chinese Traditional Men Hanfu at great price. Shop now!"
      },
      {
            "name": "Omron Upper Arm Blood Pressure Monitor HEM-7140 Series HCR-7204T",
            "image": "/uploads/product_4.png",
            "price": 69,
            "description": "High quality Omron Upper Arm Blood Pressure Monitor HEM-7140 Series HCR-7204T at great price. Shop now!"
      },
      {
            "name": "factory custom logo Winter sexy crop top sweater set women's fashion suspender skirt nylon knitted two piece suit",
            "image": "/uploads/product_12.png",
            "price": 13.8,
            "description": "High quality factory custom logo Winter sexy crop top sweater set women's fashion suspender skirt nylon knitted two piece suit at great price. Shop now!"
      },
      {
            "name": "Linen clothing for women 2-piece set Casual sports linen shorts crop top 2023 Fashion clothing summer vacation set",
            "image": "/uploads/product_17.png",
            "price": 7.79,
            "description": "High quality Linen clothing for women 2-piece set Casual sports linen shorts crop top 2023 Fashion clothing summer vacation set at great price. Shop now!"
      },
      {
            "name": "New Fashion Winter Real Wool Cashmere Coats Women with Fox Fur Cuffs",
            "image": "/uploads/product_5.png",
            "price": 135,
            "description": "High quality New Fashion Winter Real Wool Cashmere Coats Women with Fox Fur Cuffs at great price. Shop now!"
      },
      {
            "name": "Buy Spotify Gift Card CHF CH fr.13",
            "image": "/uploads/product_3.png",
            "price": 13,
            "description": "High quality Buy Spotify Gift Card CHF CH fr.13 at great price. Shop now!"
      },
      {
            "name": "Birdtree 100% Mulberry Real Silk Dress Female Summer V-neck Print Half Sleeves Elegant Pretty Women's Dresses Clothing D36533QM",
            "image": "/uploads/product_15.png",
            "price": 72.99,
            "description": "High quality Birdtree 100% Mulberry Real Silk Dress Female Summer V-neck Print Half Sleeves Elegant Pretty Women's Dresses Clothing D36533QM at great price. Shop now!"
      },
      {
            "name": "2024 fashion summer custom logo floral print short dress For Women Formal Bodycon Evening Dress women Lady Elegant Casual Dress",
            "image": "/uploads/product_14.png",
            "price": 10.4,
            "description": "High quality 2024 fashion summer custom logo floral print short dress For Women Formal Bodycon Evening Dress women Lady Elegant Casual Dress at great price. Shop now!"
      },
      {
            "name": "OEM custom logo soft clothing lounge wear tank top and hot shorts two pieces women's summer sets 2023",
            "image": "/uploads/product_10.png",
            "price": 13.8,
            "description": "High quality OEM custom logo soft clothing lounge wear tank top and hot shorts two pieces women's summer sets 2023 at great price. Shop now!"
      },
      {
            "name": "High-Quality Two-Piece Women's Fashion Summer 2023 New Best-Selling European And American Pleated Skirt 2-Piece Set",
            "image": "/uploads/product_13.png",
            "price": 38,
            "description": "High quality High-Quality Two-Piece Women's Fashion Summer 2023 New Best-Selling European And American Pleated Skirt 2-Piece Set at great price. Shop now!"
      }
];

    const createdProducts = [];
    for (let i = 0; i < productData.length; i++) {
      const p = productData[i];
      const catIdx = [1,3,1,1,1,3,1,1,1,1,1,3,1,1,1,1,3,1,3,1,1,5,1,1,1,1,1,1,1,1,3,3,1,1,1,1,3,1,1,3,3,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,3,1,1,3,1,1,1,1,3,1,5,1,1,3,3,3,3,1,3,1,3,1,3,1,5,3,1,1,3,1,3,3,1,1,3,1,1,1,5,3,1,1,1];
      const subCat = subCats[catIdx[i]];
      const price = Math.round(p.price * 1.8 * 100) / 100;
      const originalPrice = Math.round(price * (1.2 + Math.random() * 0.3) * 100) / 100;
      const product = await Product.create({
        name: p.name,
        description: p.description,
        images: [p.image],
        categoryId: subCat._id,
        shopId: shop._id,
        skus: [
          {
            attrs: [{ name: 'Size', value: 'S' }, { name: 'Color', value: 'Black' }],
            price: price, originalPrice: originalPrice,
            stock: Math.floor(Math.random() * 200) + 50,
          },
          {
            attrs: [{ name: 'Size', value: 'M' }, { name: 'Color', value: 'White' }],
            price: price, originalPrice: originalPrice,
            stock: Math.floor(Math.random() * 200) + 50,
          },
          {
            attrs: [{ name: 'Size', value: 'L' }, { name: 'Color', value: 'Blue' }],
            price: Math.round(price * 1.1 * 100) / 100,
            originalPrice: Math.round(originalPrice * 1.1 * 100) / 100,
            stock: Math.floor(Math.random() * 200) + 50,
          },
        ],
        minPrice: price,
        maxPrice: Math.round(price * 1.1 * 100) / 100,
        salesCount: Math.floor(Math.random() * 500) + 10,
        reviewCount: Math.floor(Math.random() * 100) + 5,
        rating: Math.round((3.5 + Math.random() * 1.5) * 10) / 10,
        status: 1,
        isHot: i < 20,
        isRecommended: i >= 20 && i < 40,
      });
      createdProducts.push(product);
      if ((i + 1) % 20 === 0) console.log(`  Created ${i + 1} products`);
    }

    await Shop.findByIdAndUpdate(shop._id, { productCount: createdProducts.length });

    await PaymentSetting.create([
      { method: 'USDT_TRC20', label: 'USDT TRC20', walletAddress: 'TXxMu8nG3Tyokqq7td8phfjNPPEUybicyV', isActive: true, sort: 1 },
      { method: 'BTC', label: 'Bitcoin', walletAddress: '', isActive: true, sort: 2 },
      { method: 'ETH', label: 'Ethereum', walletAddress: '', isActive: true, sort: 3 },
      { method: 'Debit/Credit Card', label: 'Debit/Credit Card', walletAddress: '', isActive: true, sort: 4 },
      { method: 'ACH Transfer', label: 'ACH Transfer', walletAddress: '', isActive: true, sort: 5 },
      { method: 'Wire Transfer', label: 'Wire Transfer', walletAddress: '', isActive: true, sort: 6 },
    ]);

    await Banner.create([
      { title: 'Summer Sale - Up to 70% Off', image: '/uploads/banner1.jpg', link: '/miaoshalist', sort: 1, position: 'home' },
      { title: 'New Arrivals Fashion 2026', image: '/uploads/banner2.jpg', link: '/tuijianlist', sort: 2, position: 'home' },
      { title: 'Electronics Mega Deals', image: '/uploads/banner3.jpg', link: '/remenglist', sort: 3, position: 'home' },
      { title: 'Beauty & Skincare Special', image: '/uploads/banner4.jpg', link: '/searchgoods?keyword=beauty', sort: 4, position: 'home' },
      { title: 'Sports & Outdoors Collection', image: '/uploads/banner5.jpg', link: '/searchgoods?keyword=sports', sort: 5, position: 'home' },
    ]);

    console.log('Seed data created successfully');
    console.log(`  Admin: admin@shopifywholesale.com / admin123`);
    console.log(`  Buyer: buyer@shopifywholesale.com / buyer123`);
    console.log(`  Seller: seller@shopifywholesale.com / seller123`);
    console.log(`  Seller2-8: seller2@shopifywholesale.com through seller8@shopifywholesale.com / seller123`);
    console.log(`  ${createdProducts.length} products created`);
    console.log(`  ${createdStores.length} stores created`);
    console.log(`  ${categories.length} categories created`);
    console.log(`  ${subCats.length} sub-categories created`);

    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
  }
};

if (require.main === module) {
  seed();
}
