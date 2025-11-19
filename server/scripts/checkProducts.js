import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const productSchema = new mongoose.Schema({
  name: String,
  category: String,
  price: Number,
  isAmazonsChoice: Boolean,
  isBestSeller: Boolean,
  status: String
}, { strict: false });

const Product = mongoose.model('Product', productSchema);

async function checkProducts() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Total products
    const total = await Product.countDocuments();
    console.log(`📦 Total Products: ${total}`);

    // Amazon's Choice products
    const amazonsChoice = await Product.countDocuments({ isAmazonsChoice: true });
    console.log(`🏆 Amazon's Choice: ${amazonsChoice}`);

    // Best Sellers
    const bestSellers = await Product.countDocuments({ isBestSeller: true });
    console.log(`🔥 Best Sellers: ${bestSellers}`);

    // Active products
    const active = await Product.countDocuments({ status: 'active' });
    console.log(`✅ Active Products: ${active}\n`);

    // Products by category
    const categories = await Product.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    console.log('📂 Products by Category:');
    categories.forEach(cat => {
      console.log(`  ${cat._id || 'Uncategorized'}: ${cat.count} products`);
    });

    console.log(`\n📊 Total Categories: ${categories.length}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

checkProducts();
