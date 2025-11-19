import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  price: {
    type: Number,
    required: true
  },
  originalPrice: Number,
  discount: Number,
  category: {
    type: String,
    required: true
  },
  subcategory: String,
  brand: String,
  images: [String],
  rating: {
    type: Number,
    default: 0
  },
  reviews: {
    type: Number,
    default: 0
  },
  stock: {
    type: Number,
    default: 0
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Seller'
  },
  isAmazonsChoice: {
    type: Boolean,
    default: false
  },
  isBestSeller: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending', 'approved', 'rejected'],
    default: 'active'
  },
  isAdminProduct: {
    type: Boolean,
    default: true // Admin products are default
  },
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'approved' // Admin products are auto-approved
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  approvedAt: Date,
  rejectionReason: String,
  weight: String,
  dimensions: String,
  originalAdminProductId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  },
  paymentTransactionId: String,
  listedAt: Date,
  monthlyProfit: String,
  yearlyProfit: String
}, { timestamps: true });

productSchema.index({ name: 'text', description: 'text', brand: 'text' });

export default mongoose.model('Product', productSchema);
