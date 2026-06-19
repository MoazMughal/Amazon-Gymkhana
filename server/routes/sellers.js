import express from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import Seller from '../models/Seller.js';
import { authenticateAdmin, authenticateSeller } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { validateSellerRegister } from '../middleware/validation.js';
import { sendSmsOTP, validatePhone } from '../services/sms.js';

const router = express.Router();

// Seller Registration
// Apply rate limiting and validation
router.post('/register', authLimiter, validateSellerRegister, async (req, res) => {
  try {
    const { username, email, password, whatsappNo, country, city, productCategory } = req.body;

    // Check if seller already exists
    const existingSeller = await Seller.findOne({
      $or: [{ email }, { username }]
    });

    if (existingSeller) {
      if (existingSeller.email === email) {
        return res.status(400).json({ 
          message: 'Email already registered. Please use a different email.' 
        });
      }
      return res.status(400).json({ 
        message: 'Username already taken. Please choose a different username.' 
      });
    }

    // Check if email exists in Buyer collection
    const Buyer = (await import('../models/Buyer.js')).default;
    const existingBuyer = await Buyer.findOne({ email });
    if (existingBuyer) {
      return res.status(400).json({ 
        message: 'Email already registered as a buyer. Please use a different email or login as buyer.' 
      });
    }

    // Check if email exists in Admin collection
    const Admin = (await import('../models/Admin.js')).default;
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ 
        message: 'Email already registered. Please use a different email.' 
      });
    }

    // Create new seller
    const seller = new Seller({
      username,
      email,
      password,
      whatsappNo,
      country,
      city,
      productCategory
    });

    await seller.save();

    // Optional webhook trigger - non-blocking, won't affect registration
    setImmediate(async () => {
      try {
        const WebhookLogger = (await import('../services/webhookLogger.js')).default;
        await WebhookLogger.logUserRegistration('seller', {
          _id: seller._id,
          email: seller.email,
          username: seller.username,
          country: seller.country,
          createdAt: seller.createdAt
        });
      } catch (webhookError) {
        // Silent fail - webhook should never break registration
      }
    });

    res.status(201).json({
      message: 'Registration successful! You can now login to your account.',
      supplierId: seller.supplierId
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Seller Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Support login with username, email, phone, or WhatsApp number
    const seller = await Seller.findOne({
      $or: [
        { username }, 
        { email: username },
        { phone: username },
        { whatsappNo: username }
      ]
    });

    if (!seller || !(await seller.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if seller is suspended or rejected
    if (seller.status === 'suspended' || seller.status === 'rejected') {
      return res.status(403).json({ 
        message: 'Your account has been suspended or rejected. Please contact support.',
        status: seller.status
      });
    }

    // Check dashboard access
    const dashboardAccess = seller.canAccessDashboard();
    
    // Update verification status if 15 days have passed (for legacy sellers)
    if (!dashboardAccess.canAccess && dashboardAccess.reason === 'verification_required' && seller.verificationStatus === 'not_required') {
      seller.verificationStatus = 'required';
      await seller.save();
    }

    const token = jwt.sign(
      { id: seller._id, role: 'seller', supplierId: seller.supplierId },
      process.env.JWT_SECRET,
      { expiresIn: '12h' }
    );

    res.json({
      token,
      seller: {
        id: seller._id,
        _id: seller._id,
        username: seller.username,
        email: seller.email,
        whatsappNo: seller.whatsappNo,
        contactNo: seller.contactNo,
        country: seller.country,
        city: seller.city,
        productCategory: seller.productCategory,
        supplierId: seller.supplierId,
        status: seller.status,
        verificationStatus: seller.verificationStatus,
        canListProducts: seller.canListProducts,
        hasRegistrationPayment: seller.hasRegistrationPayment,
        dashboardAccessible: seller.dashboardAccessible,
        createdAt: seller.createdAt,
        updatedAt: seller.updatedAt,
        dashboardAccess: dashboardAccess,
        dashboardAccessExpiry: seller.dashboardAccessExpiry,
        paymentHistory: seller.paymentHistory || [],
        productListingRequests: seller.productListingRequests || [],
        authProvider: seller.authProvider || 'local'
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/', authenticateAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    
    const query = {};
    
    // Filter based on verification status logic
    if (status && status !== 'all') {
      if (status === 'approved') {
        // Only sellers with completed verification (ID card approved)
        query.verificationStatus = 'approved';
      } else if (status === 'pending') {
        // Sellers who registered and can login but haven't completed verification
        query.verificationStatus = { $in: ['required', 'not_required'] };
      } else if (status === 'rejected') {
        // Sellers who were rejected by admin
        query.$or = [
          { verificationStatus: 'rejected' },
          { status: 'rejected' }
        ];
      }
    }
    
    if (search) {
      query.$or = [
        { username: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') }
      ];
    }

    const sellers = await Seller.find(query)
      .select('-password')
      .populate('approvedBy', 'username')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Seller.countDocuments(query);

    res.json({
      sellers,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    console.error('Sellers API error:', error); // Debug log
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/:id', authenticateAdmin, async (req, res) => {
  try {
    const seller = await Seller.findById(req.params.id)
      .select('-password')
      .populate('approvedBy', 'username email');
    
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    res.json(seller);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.put('/:id/approve', authenticateAdmin, async (req, res) => {
  try {
    const seller = await Seller.findByIdAndUpdate(
      req.params.id,
      {
        status: 'verified',
        verificationStatus: 'approved',
        approvedBy: req.admin._id,
        approvedAt: new Date(),
        canListProducts: true,
        dashboardAccessible: true
      },
      { new: true }
    ).select('-password');

    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    res.json({ message: 'Seller approved successfully', seller });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.put('/:id/reject', authenticateAdmin, async (req, res) => {
  try {
    const seller = await Seller.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected' },
      { new: true }
    ).select('-password');

    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    res.json({ message: 'Seller rejected', seller });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete seller (Admin only)
router.delete('/:id', authenticateAdmin, async (req, res) => {
  try {
    const seller = await Seller.findById(req.params.id);
    
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    const Product = (await import('../models/Product.js')).default;

    // Remove this seller's entry from all products they were listed on
    await Product.updateMany(
      { 'sellers.sellerId': req.params.id },
      { $pull: { sellers: { sellerId: req.params.id } } }
    );

    // Delete the seller account
    await Seller.findByIdAndDelete(req.params.id);

    res.json({ 
      message: 'Seller deleted successfully',
      deletedSeller: {
        id: seller._id,
        username: seller.username,
        email: seller.email,
        supplierId: seller.supplierId
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get seller profile
router.get('/profile', authenticateSeller, async (req, res) => {
  try {
    const seller = await Seller.findById(req.seller._id).select('-password');
    
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }
    
    res.json(seller);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update seller profile
router.put('/profile', authenticateSeller, async (req, res) => {
  try {
    const { whatsappNo, contactNo, country, city, productCategory, password, username } = req.body;

    // Find seller
    const seller = await Seller.findById(req.seller._id);
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    // Social OAuth sellers (Google/Facebook) have no password — skip password check
    if (seller.authProvider !== 'google' && seller.authProvider !== 'facebook') {
      if (!password) {
        return res.status(400).json({ message: 'Password is required to update profile' });
      }
      const isPasswordValid = await seller.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid password. Please enter your correct password to update profile.' });
      }
    }
    
    // Build update object — only include username if provided and non-empty
    const updateFields = { whatsappNo, contactNo, country, city, productCategory };
    if (username && username.trim().length >= 3) {
      updateFields.username = username.trim();
    }

    // Update profile
    const updatedSeller = await Seller.findByIdAndUpdate(
      req.seller._id,
      updateFields,
      { new: true }
    ).select('-password');

    // Sync updated contact info + username to all products this seller has listed (cached copy)
    const Product = (await import('../models/Product.js')).default;
    const syncFields = {};
    if (whatsappNo) syncFields['sellers.$[elem].whatsappNo'] = whatsappNo;
    if (city)       syncFields['sellers.$[elem].city']       = city;
    if (country)    syncFields['sellers.$[elem].country']    = country;
    if (updateFields.username) syncFields['sellers.$[elem].username'] = updateFields.username;

    if (Object.keys(syncFields).length > 0) {
      await Product.updateMany(
        { 'sellers.sellerId': req.seller._id },
        { $set: syncFields },
        { arrayFilters: [{ 'elem.sellerId': req.seller._id }], multi: true }
      );
    }

    res.json({ message: 'Profile updated successfully', seller: updatedSeller });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Change seller password
router.put('/change-password', authenticateSeller, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }
    
    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters long' });
    }
    
    // Find seller and verify current password
    const seller = await Seller.findById(req.seller._id);
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }
    
    // Verify current password
    const isCurrentPasswordValid = await seller.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }
    
    // Update password (will be hashed by pre-save middleware)
    seller.password = newPassword;
    await seller.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Record payment for listing products
router.post('/payment', authenticateSeller, async (req, res) => {
  try {
    const { amount, paymentMethod, transactionId, purpose, productId, productName, paymentDetails, status } = req.body;

    const seller = await Seller.findById(req.seller._id);
    
    const paymentRecord = {
      amount,
      paymentDate: new Date(),
      paymentMethod,
      transactionId,
      purpose,
      status: status || 'completed'
    };

    // Add product details for product listing payments
    if (purpose === 'product_listing' && productId) {
      paymentRecord.productId = productId;
      paymentRecord.productName = productName;
    }

    // Add payment details (receipt, card info, etc.)
    if (paymentDetails) {
      paymentRecord.paymentDetails = paymentDetails;
    }

    seller.paymentHistory.push(paymentRecord);

    if (purpose === 'registration') {
      seller.hasRegistrationPayment = true;
      seller.canListProducts = true;
    }

    await seller.save();

    res.json({ 
      message: 'Payment recorded successfully',
      canListProducts: seller.canListProducts 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get payment history
router.get('/payments', authenticateSeller, async (req, res) => {
  try {
    const seller = await Seller.findById(req.seller._id)
      .select('paymentHistory')
      .lean()
      .maxTimeMS(5000);
    
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found', paymentHistory: [] });
    }
    
    res.json(seller.paymentHistory || []);
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ message: 'Server error', error: error.message, paymentHistory: [] });
  }
});

// Submit verification documents
router.post('/verification/submit', authenticateSeller, async (req, res) => {
  try {
    const { cnicNumber, idCardFront, idCardBack, idCardWithFace } = req.body;

    if (!cnicNumber || !idCardFront || !idCardBack || !idCardWithFace) {
      return res.status(400).json({ 
        success: false,
        message: 'CNIC number and all three documents are required: CNIC front, CNIC back, and CNIC with selfie' 
      });
    }

    const seller = await Seller.findByIdAndUpdate(
      req.seller._id,
      {
        verificationDocuments: {
          cnicNumber,
          idCardFront,
          idCardBack,
          idCardWithFace,
          submittedAt: new Date()
        },
        verificationStatus: 'pending'
      },
      { new: true }
    ).select('-password');

    if (!seller) {
      return res.status(404).json({ 
        success: false,
        message: 'Seller not found' 
      });
    }

    res.json({ 
      success: true,
      message: 'Verification documents submitted successfully. Please wait for admin approval.',
      seller 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Server error: ' + error.message 
    });
  }
});

// Check dashboard access
router.get('/dashboard-access', authenticateSeller, async (req, res) => {
  try {
    const seller = await Seller.findById(req.seller._id);
    
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }
    
    const dashboardAccess = seller.canAccessDashboard();
    
    res.json({
      canAccess: dashboardAccess.canAccess,
      reason: dashboardAccess.reason,
      message: dashboardAccess.message,
      verificationStatus: seller.verificationStatus,
      dashboardAccessExpiry: seller.dashboardAccessExpiry,
      daysRemaining: seller.dashboardAccessExpiry ? 
        Math.max(0, Math.ceil((seller.dashboardAccessExpiry - new Date()) / (1000 * 60 * 60 * 24))) : 0
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin routes for verification management

// Get all sellers for SellerCatalog (admin only)
router.get('/admin/sellers', authenticateAdmin, async (req, res) => {
  try {
    const sellers = await Seller.find({})
      .select('-password')
      .sort({ createdAt: -1 });
    res.json({ sellers });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get a single seller's listed products for SellerCatalog (admin only)
router.get('/admin/seller/:id', authenticateAdmin, async (req, res) => {
  try {
    const Product = (await import('../models/Product.js')).default;
    const sellerId = req.params.id;

    // Products where this seller is in the sellers array (listed on admin products)
    const listedProducts = await Product.find(
      { 'sellers.sellerId': sellerId },
      { name: 1, images: 1, price: 1, category: 1, asin: 1, sku: 1, isAmazonsChoice: 1, approvalStatus: 1, status: 1, 'sellers.$': 1 }
    ).lean();

    const products = listedProducts.map(p => {
      const sellerEntry = p.sellers?.[0] || {};
      return {
        _id: p._id,
        name: p.name,
        images: p.images,
        price: p.price,
        category: p.category,
        asin: p.asin,
        sku: p.sku,
        isAmazonsChoice: p.isAmazonsChoice,
        approvalStatus: p.approvalStatus,
        status: p.status,
        sellerPrice: sellerEntry.sellerPrice,
        sellerMoq: sellerEntry.moq,
        listingCountries: sellerEntry.listingCountries,
        listingType: 'listed'
      };
    });

    res.json({ products });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get sellers requiring verification
router.get('/admin/verification-pending', authenticateAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const query = { verificationStatus: 'pending' };

    const sellers = await Seller.find(query)
      .select('-password')
      .sort({ 'verificationDocuments.submittedAt': -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Seller.countDocuments(query);

    res.json({
      sellers,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Approve seller verification
router.put('/admin/verification/:id/approve', authenticateAdmin, async (req, res) => {
  try {
    const seller = await Seller.findByIdAndUpdate(
      req.params.id,
      {
        verificationStatus: 'approved',
        verificationApprovedBy: req.admin._id,
        verificationApprovedAt: new Date(),
        dashboardAccessible: true,
        canListProducts: true
      },
      { new: true }
    ).select('-password');

    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    res.json({ message: 'Seller verification approved successfully', seller });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Reject seller verification
router.put('/admin/verification/:id/reject', authenticateAdmin, async (req, res) => {
  try {
    const { reason } = req.body;
    
    const seller = await Seller.findByIdAndUpdate(
      req.params.id,
      {
        verificationStatus: 'rejected',
        verificationRejectionReason: reason,
        dashboardAccessible: false
      },
      { new: true }
    ).select('-password');

    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    res.json({ message: 'Seller verification rejected', seller });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Fix existing sellers without verification status
router.post('/admin/fix-verification-status', async (req, res) => {
  try {
    const result = await Seller.updateMany(
      { verificationStatus: { $exists: false } },
      { $set: { verificationStatus: 'required' } }
    );
    
    res.json({ 
      message: 'Verification status updated for existing sellers',
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Test route to check if seller API is working
router.get('/test', authenticateSeller, async (req, res) => {
  try {
    res.json({ 
      message: 'Seller API is working',
      sellerId: req.seller._id,
      sellerName: req.seller.username,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Simple test route without authentication
router.get('/health', async (req, res) => {
  try {
    const sellerCount = await Seller.countDocuments();
    res.json({ 
      message: 'Seller service is healthy',
      totalSellers: sellerCount,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({ message: 'Database connection error', error: error.message });
  }
});

// Debug route to check seller verification statuses
router.get('/debug/statuses', authenticateAdmin, async (req, res) => {
  try {
    const sellers = await Seller.find({}).select('username email verificationStatus status');
    
    const statusCounts = {
      approved: 0,
      pending: 0,
      required: 0,
      not_required: 0,
      rejected: 0,
      undefined: 0
    };
    
    sellers.forEach(seller => {
      const status = seller.verificationStatus || 'undefined';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    
    res.json({
      message: 'Seller verification status debug info',
      totalSellers: sellers.length,
      statusCounts,
      sellers: sellers.map(s => ({
        username: s.username,
        email: s.email,
        verificationStatus: s.verificationStatus,
        status: s.status
      }))
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Test route to set a seller as approved (for testing)
router.put('/debug/approve/:id', authenticateAdmin, async (req, res) => {
  try {
    const seller = await Seller.findByIdAndUpdate(
      req.params.id,
      { 
        verificationStatus: 'approved',
        canListProducts: true,
        dashboardAccessible: true
      },
      { new: true }
    ).select('-password');
    
    res.json({
      message: 'Seller verification status set to approved',
      seller
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Forgot Password - Send OTP
router.post('/forgot-password', async (req, res) => {
  try {
    const { identifier } = req.body; // Can be username, email, or WhatsApp number

    // Find seller by username, email, or WhatsApp number
    const seller = await Seller.findOne({
      $or: [
        { username: identifier },
        { email: identifier },
        { whatsappNo: identifier }
      ]
    });

    if (!seller) {
      return res.status(404).json({ 
        message: 'No account found with this username, email, or WhatsApp number' 
      });
    }

    if (!seller.whatsappNo) {
      return res.status(400).json({ 
        message: 'No WhatsApp number associated with this account. Please contact support.' 
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save OTP to seller record
    seller.passwordResetOTP = otp;
    seller.passwordResetOTPExpiry = otpExpiry;
    await seller.save();

    // Send OTP via WhatsApp
    res.json({
      success: true,
      message: 'OTP sent to your WhatsApp number',
      whatsappNo: seller.whatsappNo.replace(/(\+\d{2})(\d{3})\d{4}(\d{4})/, '$1$2****$3') // Masked number
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Verify OTP and Reset Password
router.post('/reset-password', async (req, res) => {
  try {
    const { identifier, otp, newPassword } = req.body;

    if (!identifier || !otp || !newPassword) {
      return res.status(400).json({ 
        message: 'Identifier, OTP, and new password are required' 
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ 
        message: 'Password must be at least 8 characters long' 
      });
    }

    // Find seller by username, email, or WhatsApp number
    const seller = await Seller.findOne({
      $or: [
        { username: identifier },
        { email: identifier },
        { whatsappNo: identifier }
      ]
    });

    if (!seller) {
      return res.status(404).json({ 
        message: 'No account found' 
      });
    }

    // Check if OTP exists and is not expired
    if (!seller.passwordResetOTP || !seller.passwordResetOTPExpiry) {
      return res.status(400).json({ 
        message: 'No OTP request found. Please request a new OTP.' 
      });
    }

    if (new Date() > seller.passwordResetOTPExpiry) {
      return res.status(400).json({ 
        message: 'OTP has expired. Please request a new one.' 
      });
    }

    // Check OTP
    const isValidOTP = seller.passwordResetOTP === otp;
    
    if (!isValidOTP) {
      return res.status(400).json({ 
        message: 'Invalid OTP. Please check and try again.' 
      });
    }

    // Update password and clear OTP
    seller.password = newPassword; // Will be hashed by pre-save middleware
    seller.passwordResetOTP = undefined;
    seller.passwordResetOTPExpiry = undefined;
    await seller.save();

    res.json({
      message: 'Password reset successfully. You can now login with your new password.'
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Submit product listing request with payment (simplified version)
router.post('/submit-product-listing', authenticateSeller, async (req, res) => {
  try {
    const {
      productId,
      productName,
      productPrice,
      transactionId,
      paymentMethod,
      notes,
      receiptImageUrl // For now, we'll accept image URL instead of file upload
    } = req.body;

    // Create a product listing request
    const listingRequest = {
      productId,
      productName,
      productPrice,
      transactionId,
      paymentMethod,
      notes,
      receiptImage: receiptImageUrl,
      status: 'pending_approval',
      submittedAt: new Date()
    };

    // Add to seller's listing requests
    const seller = await Seller.findById(req.seller._id);
    if (!seller.productListingRequests) {
      seller.productListingRequests = [];
    }
    seller.productListingRequests.push(listingRequest);
    await seller.save();

    res.json({
      message: 'Product listing request submitted successfully. Please wait for admin approval.',
      requestId: seller.productListingRequests[seller.productListingRequests.length - 1]._id
    });
  } catch (error) {
    console.error('Product listing submission error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Debug route to test seller authentication and data
router.get('/debug/seller-info', authenticateSeller, async (req, res) => {
  try {
    const seller = await Seller.findById(req.seller._id);
    
    res.json({
      success: true,
      message: 'Seller authentication working',
      authSeller: {
        id: req.seller._id,
        username: req.seller.username,
        email: req.seller.email,
        verificationStatus: req.seller.verificationStatus,
        whatsappNo: req.seller.whatsappNo,
        city: req.seller.city,
        country: req.seller.country
      },
      dbSeller: seller ? {
        id: seller._id,
        username: seller.username,
        email: seller.email,
        verificationStatus: seller.verificationStatus,
        whatsappNo: seller.whatsappNo,
        city: seller.city,
        country: seller.country
      } : null
    });
  } catch (error) {
    console.error('❌ Debug seller info error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Debug failed', 
      error: error.message 
    });
  }
});

// Request to list admin product (requires admin approval)
router.post('/request-admin-product-listing', authenticateSeller, async (req, res) => {
  try {
    const {
      adminProductId,
      productName,
      productPrice,
      sellerPrice,
      sellerShipping = 0,
      moq = 1,
      notes = 'Seller requested to list admin product',
      listingCountries = []
    } = req.body;

    console.log('🔄 Processing admin product listing request:', {
      adminProductId,
      sellerId: req.seller._id,
      sellerUsername: req.seller.username,
      sellerPrice,
      sellerShipping
    });

    // Import Product model
    const Product = (await import('../models/Product.js')).default;
    
    // Check if admin product exists
    const adminProduct = await Product.findById(adminProductId);
    if (!adminProduct) {
      return res.status(404).json({ message: 'Admin product not found' });
    }

    // Check if seller already has a pending or approved request for this product
    const seller = await Seller.findById(req.seller._id);
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    // Check for existing requests
    const existingRequest = seller.productListingRequests?.find(
      request => request.productId.toString() === adminProductId && 
                 (request.status === 'pending_approval' || request.status === 'approved')
    );

    if (existingRequest) {
      return res.status(400).json({ 
        success: false,
        message: `You already have a ${existingRequest.status === 'pending_approval' ? 'pending' : existingRequest.status} request for this product.`,
        error: 'REQUEST_EXISTS'
      });
    }

    // Check if seller is already listed on the product
    const alreadyListed = adminProduct.sellers?.some(
      sellerEntry => sellerEntry.sellerId.toString() === req.seller._id.toString()
    );

    if (alreadyListed) {
      return res.status(400).json({ 
        success: false,
        message: 'You have already listed this product.',
        error: 'ALREADY_LISTED'
      });
    }

    // Create listing request
    if (!seller.productListingRequests) {
      seller.productListingRequests = [];
    }
    
    const listingRequest = {
      productId: adminProduct._id,
      productName: adminProduct.name,
      productPrice: adminProduct.price,
      sellerPrice: sellerPrice ? parseFloat(sellerPrice) : parseFloat(adminProduct.price),
      sellerShipping: sellerShipping ? parseFloat(sellerShipping) : 0,
      moq: moq ? Math.max(1, parseInt(moq)) : 1,
      transactionId: `REQ_${Date.now()}`,
      paymentMethod: 'Pending Admin Approval',
      notes,
      listingCountries: Array.isArray(listingCountries) ? listingCountries : [],
      status: 'pending_approval',
      submittedAt: new Date(),
      requestType: 'admin_product_listing'
    };
    
    seller.productListingRequests.push(listingRequest);
    await seller.save();

    console.log('✅ Product listing request created:', {
      sellerId: seller._id,
      productId: adminProduct._id,
      requestId: listingRequest._id,
      status: 'pending'
    });

    // TODO: Send notification to admin about new listing request
    try {
      console.log(`📧 Admin notification: New listing request from ${seller.username} for ${adminProduct.name}`);
    } catch (notificationError) {
      console.error('Failed to send admin notification:', notificationError);
    }

    res.json({
      success: true,
      message: 'Product listing request submitted successfully! Admin will review your request.',
      requestId: listingRequest._id,
      status: 'pending_approval',
      productName: adminProduct.name,
      sellerPrice: listingRequest.sellerPrice
    });
  } catch (error) {
    console.error('Request admin product listing error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ── Bulk listing request — single DB round-trip ──
router.post('/bulk-request-listing', authenticateSeller, async (req, res) => {
  try {
    const { items } = req.body;
    // items: [{ adminProductId, productName, productPrice, sellerPrice, sellerShipping, moq, listingCountries, notes }]
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'No items provided' });
    }

    const Product = (await import('../models/Product.js')).default;

    // 1. Fetch seller once
    const seller = await Seller.findById(req.seller._id);
    if (!seller) return res.status(404).json({ message: 'Seller not found' });
    if (!seller.productListingRequests) seller.productListingRequests = [];

    // 2. Fetch all products in one batch query
    const productIds = items.map(i => i.adminProductId).filter(Boolean);
    const adminProducts = await Product.find({ _id: { $in: productIds } }).select('_id name price sellers').lean();
    const productMap = {};
    adminProducts.forEach(p => { productMap[p._id.toString()] = p; });

    const success = [];
    const failed = [];
    const now = new Date();

    // 3. Process all in memory — no per-item DB calls
    for (const item of items) {
      const { adminProductId, sellerPrice, sellerShipping = 0, moq = 1, listingCountries = [], notes } = item;
      const adminProduct = productMap[adminProductId];

      if (!adminProduct) { failed.push({ id: adminProductId, name: item.productName || adminProductId, reason: 'Product not found' }); continue; }

      // Check existing request
      const existingRequest = seller.productListingRequests.find(
        r => r.productId.toString() === adminProductId && (r.status === 'pending_approval' || r.status === 'approved')
      );
      if (existingRequest) { failed.push({ id: adminProductId, name: adminProduct.name, reason: 'Request already exists' }); continue; }

      // Check already listed
      const alreadyListed = adminProduct.sellers?.some(s => s.sellerId?.toString() === req.seller._id.toString());
      if (alreadyListed) { failed.push({ id: adminProductId, name: adminProduct.name, reason: 'Already listed' }); continue; }

      seller.productListingRequests.push({
        productId: adminProduct._id,
        productName: adminProduct.name,
        productPrice: adminProduct.price,
        sellerPrice: parseFloat(sellerPrice) || parseFloat(adminProduct.price),
        sellerShipping: parseFloat(sellerShipping) || 0,
        moq: Math.max(1, parseInt(moq) || 1),
        transactionId: `REQ_${Date.now()}_${adminProductId.slice(-4)}`,
        paymentMethod: 'Pending Admin Approval',
        notes: notes || `Bulk listing request for "${adminProduct.name}"`,
        listingCountries: Array.isArray(listingCountries) ? listingCountries : [],
        status: 'pending_approval',
        submittedAt: now,
        requestType: 'admin_product_listing'
      });

      success.push(adminProduct.name);
    }

    // 4. Single save for all requests
    if (success.length > 0) await seller.save();

    console.log(`✅ Bulk listing: ${success.length} added, ${failed.length} failed for seller ${seller.username}`);

    res.json({ success: true, submitted: success, failed, total: items.length });
  } catch (error) {
    console.error('Bulk listing request error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// DEPRECATED: Direct listing route - now requires admin approval
// Use /request-admin-product-listing instead
router.post('/list-admin-product', authenticateSeller, async (req, res) => {
  try {
    console.log('⚠️ DEPRECATED: Direct listing attempt blocked - admin approval required');
    
    return res.status(403).json({
      success: false,
      message: 'Direct product listing is no longer allowed. Please use the request system instead.',
      error: 'DIRECT_LISTING_DISABLED',
      redirectTo: '/request-admin-product-listing',
      instructions: 'All product listings now require admin approval. Please submit a request instead.'
    });
  } catch (error) {
    console.error('Deprecated list admin product error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin routes for product listing requests

// Fast stats endpoint - optimized for quick counts
router.get('/admin/listing-stats', authenticateAdmin, async (req, res) => {
  try {
    // Import Product model
    const Product = (await import('../models/Product.js')).default;
    
    // SIMPLE & FAST: Count directly without aggregation (works on all Mongoose versions)
    const [sellersWithPending, sellersWithRejected, approvedSellerProducts, adminProductsWithSellers] = await Promise.all([
      // Count sellers with pending requests
      Seller.find({ 'productListingRequests.status': 'pending_approval' })
        .select('productListingRequests')
        .lean()
        .maxTimeMS(10000),
      
      // Count sellers with rejected requests
      Seller.find({ 'productListingRequests.status': 'rejected' })
        .select('productListingRequests')
        .lean()
        .maxTimeMS(10000),
      
      // Count approved seller products
      Product.countDocuments({ 
        isAdminProduct: false, 
        approvalStatus: 'approved' 
      }).maxTimeMS(10000),
      
      // Count admin products with sellers
      Product.countDocuments({
        isAdminProduct: true,
        'sellers.0': { $exists: true }
      }).maxTimeMS(10000)
    ]);
    
    // Count pending requests
    let pendingCount = 0;
    sellersWithPending.forEach(seller => {
      if (seller.productListingRequests) {
        pendingCount += seller.productListingRequests.filter(req => req.status === 'pending_approval').length;
      }
    });
    
    // Count rejected requests
    let rejectedCount = 0;
    sellersWithRejected.forEach(seller => {
      if (seller.productListingRequests) {
        rejectedCount += seller.productListingRequests.filter(req => req.status === 'rejected').length;
      }
    });
    
    const approvedCount = approvedSellerProducts + adminProductsWithSellers;
    
    res.json({
      success: true,
      stats: {
        pending: pendingCount,
        rejected: rejectedCount,
        approved: approvedCount,
        total: pendingCount + rejectedCount + approvedCount
      }
    });
  } catch (error) {
    console.error('Get listing stats error:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message,
      stats: { pending: 0, rejected: 0, approved: 0, total: 0 }
    });
  }
});

router.get('/admin/listing-requests', authenticateAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, status = 'pending_approval' } = req.query; // Increased to 10
    
    // Import Product model
    const Product = (await import('../models/Product.js')).default;
    
    // OPTIMIZED: Find sellers with requests in one query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const sellers = await Seller.find({
      'productListingRequests.status': status
    })
      .select('username email productListingRequests verificationStatus')
      .lean()
      .maxTimeMS(15000);
    
    // Extract and flatten all requests
    const allRequests = [];
    const productIds = new Set();
    
    sellers.forEach(seller => {
      if (seller.productListingRequests) {
        seller.productListingRequests
          .filter(r => r.status === status)
          .forEach(request => {
            allRequests.push({
              ...request,
              _id: request._id,
              sellerId: seller._id,
              sellerUsername: seller.username,
              sellerEmail: seller.email,
              sellerVerificationStatus: seller.verificationStatus
            });
            if (request.productId) {
              productIds.add(request.productId.toString());
            }
          });
      }
    });
    
    // Sort by submission date (newest first)
    allRequests.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
    
    // Paginate BEFORE fetching product details
    const paginatedRequests = allRequests.slice(skip, skip + parseInt(limit));
    
    // BATCH FETCH: Get product details only for paginated items
    const paginatedProductIds = paginatedRequests.map(r => r.productId).filter(Boolean);
    
    const products = await Product.find({ _id: { $in: paginatedProductIds } })
      .select('name images shipping price')
      .lean()
      .maxTimeMS(10000);
    
    // Create product map for quick lookup
    const productMap = {};
    products.forEach(p => {
      productMap[p._id.toString()] = p;
    });
    
    // Enrich requests with product details
    const enrichedRequests = paginatedRequests.map(request => {
      const product = productMap[request.productId?.toString()];
      return {
        ...request,
        productName: request.productName || product?.name || 'Unknown Product',
        productImage: product?.images?.[0] || null,
        productShipping: product?.shipping || 0,
        images: product?.images || []
      };
    });
    
    res.json({
      success: true,
      requests: enrichedRequests,
      total: allRequests.length,
      totalPages: Math.ceil(allRequests.length / parseInt(limit)),
      currentPage: parseInt(page)
    });
  } catch (error) {
    console.error('❌ Get listing requests error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message,
      requests: [],
      total: 0,
      totalPages: 0,
      currentPage: 1
    });
  }
});

// Approve product listing request
router.put('/admin/listing-requests/:sellerId/:requestId/approve', authenticateAdmin, async (req, res) => {
  try {
    const { sellerId, requestId } = req.params;
    
    // Find seller and request
    const seller = await Seller.findById(sellerId);
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }
    
    const request = seller.productListingRequests.id(requestId);
    if (!request) {
      return res.status(404).json({ message: 'Listing request not found' });
    }
    
    if (request.status !== 'pending_approval') {
      return res.status(400).json({ message: 'Request is not pending approval' });
    }
    
    // Import Product model
    const Product = (await import('../models/Product.js')).default;
    
    // Get the admin product
    const adminProduct = await Product.findById(request.productId);
    if (!adminProduct) {
      return res.status(404).json({ message: 'Admin product not found' });
    }
    
    // Check if seller is already listed
    const alreadyListed = adminProduct.sellers?.some(
      sellerEntry => sellerEntry.sellerId.toString() === sellerId
    );
    
    if (alreadyListed) {
      // If already listed, just update the request status to approved
      request.status = 'approved';
      request.approvedAt = new Date();
      request.approvedBy = req.admin._id;
      await seller.save();
      
      return res.json({
        success: true,
        message: 'Seller was already listed. Request marked as approved.',
        request: request,
        productName: adminProduct.name
      });
    }
    
    // Add seller to product
    if (!adminProduct.sellers) {
      adminProduct.sellers = [];
    }
    
    const sellerInfo = {
      sellerId: seller._id,
      username: seller.username,
      email: seller.email,
      whatsappNo: seller.whatsappNo,
      city: seller.city,
      country: seller.country,
      verificationStatus: seller.verificationStatus,
      sellerPrice: request.sellerPrice,
      sellerShipping: request.sellerShipping || 0,
      moq: request.moq || 1,
      listingCountries: Array.isArray(request.listingCountries) ? request.listingCountries : [],
      listedAt: new Date(),
      transactionId: request.transactionId,
      paymentMethod: 'Admin Approved',
      notes: request.notes
    };
    
    adminProduct.sellers.push(sellerInfo);
    
    // Update main sellerInfo if this is the first seller
    if (adminProduct.sellers.length === 1 && !adminProduct.seller) {
      adminProduct.sellerInfo = {
        username: seller.username,
        email: seller.email,
        whatsappNo: seller.whatsappNo,
        city: seller.city,
        country: seller.country,
        verificationStatus: seller.verificationStatus,
        sellerPrice: request.sellerPrice,
        sellerShipping: request.sellerShipping || 0, // Add seller shipping
        _id: seller._id
      };
      adminProduct.seller = seller._id;
    }
    
    await adminProduct.save();
    
    // Update request status
    request.status = 'approved';
    request.approvedAt = new Date();
    request.approvedBy = req.admin._id;
    
    await seller.save();
    
    res.json({
      success: true,
      message: 'Product listing request approved successfully',
      request: request,
      productName: adminProduct.name
    });
  } catch (error) {
    console.error('Approve listing request error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ── Bulk approve listing requests — minimal DB round-trips ──
router.put('/admin/listing-requests/bulk-approve', authenticateAdmin, async (req, res) => {
  try {
    // items: [{ sellerId, requestId }]
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'No items provided' });
    }

    const Product = (await import('../models/Product.js')).default;
    const now = new Date();

    // 1. Group by sellerId to minimise seller fetches
    const bySellerMap = {};
    items.forEach(({ sellerId, requestId }) => {
      if (!bySellerMap[sellerId]) bySellerMap[sellerId] = [];
      bySellerMap[sellerId].push(requestId);
    });

    const sellerIds = Object.keys(bySellerMap);

    // 2. Fetch all sellers in one query
    const sellers = await Seller.find({ _id: { $in: sellerIds } });
    const sellerMap = {};
    sellers.forEach(s => { sellerMap[s._id.toString()] = s; });

    // 3. Collect all productIds we need to update
    const productUpdates = []; // { productId, sellerInfo }
    const success = [];
    const failed = [];

    for (const sellerId of sellerIds) {
      const seller = sellerMap[sellerId];
      if (!seller) { bySellerMap[sellerId].forEach(rid => failed.push({ requestId: rid, reason: 'Seller not found' })); continue; }

      for (const requestId of bySellerMap[sellerId]) {
        const request = seller.productListingRequests.id(requestId);
        if (!request) { failed.push({ requestId, reason: 'Request not found' }); continue; }
        if (request.status !== 'pending_approval') { failed.push({ requestId, reason: 'Not pending' }); continue; }

        productUpdates.push({
          productId: request.productId.toString(),
          request,
          seller,
          requestId
        });
      }
    }

    // 4. Batch-fetch all products in one query
    const productIds = [...new Set(productUpdates.map(u => u.productId))];
    const products = await Product.find({ _id: { $in: productIds } });
    const productMap = {};
    products.forEach(p => { productMap[p._id.toString()] = p; });

    // 5. Process all in memory
    const dirtyProducts = new Set();
    const dirtySellers = new Set();

    for (const { productId, request, seller, requestId } of productUpdates) {
      const adminProduct = productMap[productId];
      if (!adminProduct) { failed.push({ requestId, reason: 'Product not found' }); continue; }

      const alreadyListed = adminProduct.sellers?.some(
        s => s.sellerId?.toString() === seller._id.toString()
      );

      if (!alreadyListed) {
        if (!adminProduct.sellers) adminProduct.sellers = [];
        const sellerInfo = {
          sellerId: seller._id,
          username: seller.username,
          email: seller.email,
          whatsappNo: seller.whatsappNo,
          city: seller.city,
          country: seller.country,
          verificationStatus: seller.verificationStatus,
          sellerPrice: request.sellerPrice,
          sellerShipping: request.sellerShipping || 0,
          moq: request.moq || 1,
          listingCountries: Array.isArray(request.listingCountries) ? request.listingCountries : [],
          listedAt: now,
          transactionId: request.transactionId,
          paymentMethod: 'Admin Approved',
          notes: request.notes
        };
        adminProduct.sellers.push(sellerInfo);

        if (adminProduct.sellers.length === 1 && !adminProduct.seller) {
          adminProduct.sellerInfo = { username: seller.username, email: seller.email, whatsappNo: seller.whatsappNo, city: seller.city, country: seller.country, verificationStatus: seller.verificationStatus, sellerPrice: request.sellerPrice, sellerShipping: request.sellerShipping || 0, _id: seller._id };
          adminProduct.seller = seller._id;
        }
        dirtyProducts.add(productId);
      }

      request.status = 'approved';
      request.approvedAt = now;
      request.approvedBy = req.admin._id;
      dirtySellers.add(seller._id.toString());
      success.push({ requestId, productName: adminProduct.name });
    }

    // 6. Save all dirty products and sellers in parallel
    await Promise.all([
      ...Array.from(dirtyProducts).map(pid => productMap[pid].save()),
      ...Array.from(dirtySellers).map(sid => sellerMap[sid].save())
    ]);

    console.log(`✅ Bulk approve: ${success.length} approved, ${failed.length} failed by admin ${req.admin._id}`);

    res.json({ success: true, approved: success, failed, total: items.length });
  } catch (error) {
    console.error('Bulk approve error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Reject product listing request
router.put('/admin/listing-requests/:sellerId/:requestId/reject', authenticateAdmin, async (req, res) => {
  try {
    const { sellerId, requestId } = req.params;
    const { reason = 'Request rejected by admin' } = req.body;
    
    // Find seller and request
    const seller = await Seller.findById(sellerId);
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }
    
    const request = seller.productListingRequests.id(requestId);
    if (!request) {
      return res.status(404).json({ message: 'Listing request not found' });
    }
    
    if (request.status !== 'pending_approval') {
      return res.status(400).json({ message: 'Request is not pending approval' });
    }
    
    // Update request status
    request.status = 'rejected';
    request.rejectedAt = new Date();
    request.rejectedBy = req.admin._id;
    request.rejectionReason = reason;
    
    await seller.save();
    
    console.log('❌ Product listing request rejected:', {
      sellerId,
      requestId,
      reason,
      adminId: req.admin._id
    });
    
    res.json({
      success: true,
      message: 'Product listing request rejected',
      request: request,
      reason: reason
    });
  } catch (error) {
    console.error('Reject listing request error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Cleanup duplicate sellers in products (admin utility)
router.post('/cleanup-duplicate-sellers', authenticateAdmin, async (req, res) => {
  try {
    const Product = (await import('../models/Product.js')).default;
    
    const products = await Product.find({ sellers: { $exists: true, $ne: [] } });
    let cleanedCount = 0;
    
    for (const product of products) {
      const uniqueSellers = [];
      const seenSellerIds = new Set();
      
      for (const seller of product.sellers) {
        const sellerId = seller.sellerId.toString();
        if (!seenSellerIds.has(sellerId)) {
          seenSellerIds.add(sellerId);
          uniqueSellers.push(seller);
        }
      }
      
      if (uniqueSellers.length !== product.sellers.length) {
        product.sellers = uniqueSellers;
        await product.save();
        cleanedCount++;
        console.log(`🧹 Cleaned duplicates from product: ${product.name} (${product._id})`);
      }
    }
    
    res.json({
      success: true,
      message: `Cleanup completed. ${cleanedCount} products had duplicate sellers removed.`,
      cleanedProducts: cleanedCount
    });
    
  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).json({ message: 'Cleanup failed', error: error.message });
  }
});

// Bulk update seller inventory across multiple products in one DB operation
router.put('/bulk-update-inventory', authenticateSeller, async (req, res) => {
  try {
    const { productIds, updates } = req.body;

    if (!Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ message: 'productIds array is required' });
    }
    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({ message: 'updates object is required' });
    }

    const Product = (await import('../models/Product.js')).default;
    const mongoose = (await import('mongoose')).default;
    const sellerId = new mongoose.Types.ObjectId(req.seller._id);

    // Build the $set fields using the positional filtered operator $[s]
    const setFields = {};
    if (updates.price !== undefined && !isNaN(updates.price))
      setFields['sellers.$[s].sellerPrice'] = parseFloat(updates.price);
    if (updates.shipping !== undefined && !isNaN(updates.shipping))
      setFields['sellers.$[s].sellerShipping'] = parseFloat(updates.shipping);
    if (updates.stock !== undefined && !isNaN(updates.stock))
      setFields['sellers.$[s].stock'] = parseInt(updates.stock);
    if (updates.moq !== undefined && !isNaN(updates.moq))
      setFields['sellers.$[s].moq'] = Math.max(1, parseInt(updates.moq));

    if (Object.keys(setFields).length === 0) {
      return res.status(400).json({ message: 'No valid fields to update' });
    }

    const validIds = productIds
      .filter(id => mongoose.Types.ObjectId.isValid(id))
      .map(id => new mongoose.Types.ObjectId(id));

    if (validIds.length === 0) {
      return res.status(400).json({ message: 'No valid product IDs provided' });
    }

    const result = await Product.updateMany(
      { _id: { $in: validIds }, 'sellers.sellerId': sellerId },
      { $set: setFields },
      { arrayFilters: [{ 's.sellerId': sellerId }] }
    );

    res.json({
      success: true,
      message: `Updated ${result.modifiedCount} product${result.modifiedCount !== 1 ? 's' : ''}`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    res.status(500).json({ message: 'Bulk update failed', error: error.message });
  }
});

// Update seller's inventory for a listed product
router.put('/update-inventory/:productId', authenticateSeller, async (req, res) => {
  try {
    const { productId } = req.params;
    const { price, stock, shipping, moq, listingCountries, asinAvailable, asinYearlyCost, asinReviews, asinYearlyIncome, priceCurrency } = req.body;
    
    // Import Product model
    const Product = (await import('../models/Product.js')).default;
    
    // Find the product and check if seller has listed it
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Find the seller's entry in the sellers array
    const sellerIndex = product.sellers?.findIndex(
      s => s.sellerId.toString() === req.seller._id.toString()
    );

    if (sellerIndex === -1) {
      return res.status(403).json({ message: 'You have not listed this product' });
    }

    // Update the seller's specific price in the sellers array
    if (price !== undefined) {
      product.sellers[sellerIndex].sellerPrice = parseFloat(price);
    }

    // Update the seller's specific shipping in the sellers array
    if (shipping !== undefined) {
      product.sellers[sellerIndex].sellerShipping = parseFloat(shipping);
    }

    // Update the seller's specific stock in the sellers array
    if (stock !== undefined) {
      product.sellers[sellerIndex].stock = parseInt(stock);
    }

    // Update the seller's MOQ in the sellers array
    if (moq !== undefined) {
      const parsedMoq = Math.max(1, parseInt(moq));
      product.sellers[sellerIndex].moq = parsedMoq;
    }

    // Update listing countries (array)
    if (listingCountries !== undefined) {
      const valid = ['GBP', 'PKR', 'AED', 'USD'];
      const arr = Array.isArray(listingCountries)
        ? listingCountries.filter(c => valid.includes(c))
        : [];
      product.sellers[sellerIndex].listingCountries = arr;
    }

    // Update ASIN bulk listing data
    if (asinAvailable !== undefined) product.sellers[sellerIndex].asinAvailable = Boolean(asinAvailable);
    if (asinYearlyCost !== undefined) product.sellers[sellerIndex].asinYearlyCost = parseFloat(asinYearlyCost) || 0;
    if (asinReviews !== undefined) product.sellers[sellerIndex].asinReviews = parseInt(asinReviews) || 0;
    if (asinYearlyIncome !== undefined) product.sellers[sellerIndex].asinYearlyIncome = parseFloat(asinYearlyIncome) || 0;

    // Also update the primary sellerInfo if this seller is the primary seller
    if (product.seller && product.seller.toString() === req.seller._id.toString() && product.sellerInfo) {
      if (price !== undefined) {
        product.sellerInfo.sellerPrice = parseFloat(price);
      }
      if (shipping !== undefined) {
        product.sellerInfo.sellerShipping = parseFloat(shipping);
      }
    }

    await product.save();

    res.json({
      success: true,
      message: 'Your inventory updated successfully',
      product: {
        _id: product._id,
        sellerPrice: product.sellers[sellerIndex].sellerPrice,
        sellerStock: product.sellers[sellerIndex].stock,
        sellerShipping: product.sellers[sellerIndex].sellerShipping,
        sellerMoq: product.sellers[sellerIndex].moq || 1
      },
      sellerInfo: {
        username: product.sellers[sellerIndex].username,
        sellerPrice: product.sellers[sellerIndex].sellerPrice,
        stock: product.sellers[sellerIndex].stock
      }
    });
  } catch (error) {
    console.error('Error updating seller inventory:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get seller's listed products (products where seller added their info to admin products)
router.get('/my-listed-products', authenticateSeller, async (req, res) => {
  try {
    const { page = 1, limit = 50, status, marketplace } = req.query;
    
    // Import Product model
    const Product = (await import('../models/Product.js')).default;
    
    // Find products where this seller has added their info
    const query = {
      'sellers.sellerId': req.seller._id,
      $or: [
        { status: 'active' },
        { status: { $exists: false } } // Include products without status field for backward compatibility
      ]
    };
    
    if (status) query.approvalStatus = status;
    if (marketplace) query.marketplace = marketplace;

    const products = await Product.find(query)
      .populate('seller', 'username email whatsappNo city country verificationStatus _id') // Populate seller info
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .select('name price stock category marketplace currency approvalStatus status isAmazonsChoice createdAt images sellers seller sellerInfo');

    const count = await Product.countDocuments(query);

    // Process products to show seller-specific info and ensure seller can see their own info
    const processedProducts = products.map(product => {
      const sellerEntry = product.sellers.find(s => s.sellerId.toString() === req.seller._id.toString());
      const productObj = product.toObject();
      
      // Ensure seller can see their own information
      if (product.seller && product.seller._id.toString() === req.seller._id.toString()) {
        // This seller owns the product - show full seller info
        if (!productObj.sellerInfo) {
          productObj.sellerInfo = {
            username: product.seller.username,
            email: product.seller.email,
            whatsappNo: product.seller.whatsappNo,
            city: product.seller.city,
            country: product.seller.country,
            verificationStatus: product.seller.verificationStatus,
            _id: product.seller._id
          };
        }
        console.log('✅ Showing seller their own info for product:', product.name);
      } else if (product.seller && product.seller.verificationStatus === 'approved') {
        // Other seller's product - show limited info if verified
        if (!productObj.sellerInfo) {
          productObj.sellerInfo = {
            username: product.seller.username,
            whatsappNo: product.seller.whatsappNo,
            city: product.seller.city,
            country: product.seller.country,
            verificationStatus: product.seller.verificationStatus,
            _id: product.seller._id
          };
        } else {
          // Remove email from cached info for other sellers
          delete productObj.sellerInfo.email;
        }
        console.log('✅ Showing limited seller info for verified seller');
      } else {
        // Hide seller info for unverified sellers
        delete productObj.sellerInfo;
        delete productObj.seller;
        console.log('❌ Hiding seller info for unverified seller');
      }
      
      return {
        ...productObj,
        sellerListedAt: sellerEntry?.listedAt,
        sellerTransactionId: sellerEntry?.transactionId,
        sellerPaymentMethod: sellerEntry?.paymentMethod,
        sellerNotes: sellerEntry?.notes,
        sellerMoq: sellerEntry?.moq || 1,
        // Add seller's individual price if they have one
        ...(sellerEntry?.sellerPrice && {
          sellerInfo: {
            ...productObj.sellerInfo,
            sellerPrice: sellerEntry.sellerPrice
          }
        })
      };
    });

    // Get counts by status for seller's listed products
    const statusCounts = await Product.aggregate([
      { $match: { 'sellers.sellerId': req.seller._id } },
      { $group: { _id: '$approvalStatus', count: { $sum: 1 } } }
    ]);

    const counts = {
      total: count,
      pending: statusCounts.find(s => s._id === 'pending')?.count || 0,
      approved: statusCounts.find(s => s._id === 'approved')?.count || 0,
      rejected: statusCounts.find(s => s._id === 'rejected')?.count || 0
    };

    console.log('📋 Seller listed products response:', {
      sellerId: req.seller._id,
      sellerUsername: req.seller.username,
      totalProducts: processedProducts.length,
      productsWithSellerInfo: processedProducts.filter(p => p.sellerInfo).length
    });

    res.json({
      success: true,
      products: processedProducts,
      totalPages: Math.ceil(count / parseInt(limit)),
      currentPage: parseInt(page),
      total: count,
      counts
    });
  } catch (error) {
    console.error('Error fetching seller listed products:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update seller's MOQ for a listed product
router.put('/update-moq/:productId', authenticateSeller, async (req, res) => {
  try {
    const { productId } = req.params;
    const { moq } = req.body;

    const parsedMoq = parseInt(moq);
    if (!parsedMoq || parsedMoq < 1) {
      return res.status(400).json({ message: 'MOQ must be a positive integer (minimum 1)' });
    }

    const Product = (await import('../models/Product.js')).default;
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const sellerEntry = product.sellers?.find(
      s => s.sellerId.toString() === req.seller._id.toString()
    );

    if (!sellerEntry) {
      return res.status(400).json({ message: 'You have not listed this product' });
    }

    sellerEntry.moq = parsedMoq;
    await product.save();

    // Also update in seller's listing requests
    const seller = await Seller.findById(req.seller._id);
    if (seller?.productListingRequests) {
      const request = seller.productListingRequests.find(
        r => r.productId.toString() === productId
      );
      if (request) {
        request.moq = parsedMoq;
        await seller.save();
      }
    }

    res.json({ success: true, message: 'MOQ updated successfully', moq: parsedMoq });
  } catch (error) {
    console.error('Update MOQ error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete seller's listing (remove seller info from admin product)
router.delete('/unlist-product/:productId', authenticateSeller, async (req, res) => {
  try {
    const { productId } = req.params;
    
    // Import Product model
    const Product = (await import('../models/Product.js')).default;
    
    // Find the product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if seller has listed this product (check both seller field and sellers array)
    const isPrimarySeller = product.seller && product.seller.toString() === req.seller._id.toString();
    const sellerIndex = product.sellers?.findIndex(
      s => s.sellerId.toString() === req.seller._id.toString()
    );
    const isInSellersArray = sellerIndex !== -1;

    if (!isPrimarySeller && !isInSellersArray) {
      return res.status(400).json({ message: 'You have not listed this product' });
    }

    console.log('🔍 Unlist check:', {
      productId: product._id,
      sellerId: req.seller._id,
      isPrimarySeller,
      isInSellersArray,
      sellerIndex,
      sellersCount: product.sellers?.length || 0
    });

    // Remove seller from the sellers array if present
    if (isInSellersArray) {
      product.sellers.splice(sellerIndex, 1);
    }

    // Handle primary seller field
    if (isPrimarySeller) {
      if (product.sellers && product.sellers.length > 0) {
        // Set the first remaining seller as primary
        const newPrimarySeller = product.sellers[0];
        product.seller = newPrimarySeller.sellerId;
        product.sellerInfo = {
          username: newPrimarySeller.username,
          email: newPrimarySeller.email,
          whatsappNo: newPrimarySeller.whatsappNo,
          city: newPrimarySeller.city,
          country: newPrimarySeller.country,
          verificationStatus: newPrimarySeller.verificationStatus,
          _id: newPrimarySeller.sellerId
        };
      } else {
        // No sellers left, remove seller info
        product.seller = undefined;
        product.sellerInfo = undefined;
      }
    }

    await product.save();

    // Also remove from seller's listing requests
    const seller = await Seller.findById(req.seller._id);
    if (seller && seller.productListingRequests) {
      seller.productListingRequests = seller.productListingRequests.filter(
        request => request.productId.toString() !== productId
      );
      await seller.save();
    }

    console.log('✅ Seller unlisted from product:', {
      productId: product._id,
      sellerId: req.seller._id,
      remainingSellers: product.sellers?.length || 0,
      newPrimarySeller: product.seller
    });

    res.json({
      success: true,
      message: 'Product unlisted successfully. Your seller information has been removed.',
      productId: product._id,
      remainingSellers: product.sellers?.length || 0
    });
  } catch (error) {
    console.error('Error unlisting product:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all sellers for admin management
router.get('/admin/sellers', authenticateAdmin, async (req, res) => {
  try {
    const sellers = await Seller.find({})
      .select('username email supplierId whatsappNo city country productCategory verificationStatus status createdAt')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      sellers
    });
  } catch (error) {
    console.error('Error fetching sellers:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get products by seller ID for admin (includes both primary and listed products)
router.get('/admin/seller/:sellerId', authenticateAdmin, async (req, res) => {
  try {
    const { sellerId } = req.params;
    const Product = (await import('../models/Product.js')).default;

    const [primaryProducts, listedProducts] = await Promise.all([
      // Products where seller is primary
      Product.find({ seller: sellerId })
        .select('name price stock category marketplace currency approvalStatus status isAmazonsChoice createdAt images asin sku sellers')
        .sort({ createdAt: -1 })
        .lean(),
      // Products where seller is in sellers array
      Product.find({ 'sellers.sellerId': sellerId })
        .select('name price stock category marketplace currency approvalStatus status isAmazonsChoice createdAt images asin sku sellers')
        .sort({ createdAt: -1 })
        .lean()
    ]);

    // Merge and deduplicate
    const allIds = new Set();
    const allProducts = [];
    [...primaryProducts, ...listedProducts].forEach(p => {
      const id = p._id.toString();
      if (!allIds.has(id)) {
        allIds.add(id);
        // Find this seller's specific price/moq from sellers array
        const sellerEntry = p.sellers?.find(s => s.sellerId?.toString() === sellerId);
        allProducts.push({
          ...p,
          sellerPrice: sellerEntry?.sellerPrice || p.price,
          sellerShipping: sellerEntry?.sellerShipping || 0,
          sellerMoq: sellerEntry?.moq || 1,
          listingType: sellerEntry ? 'listed' : 'primary'
        });
      }
    });

    res.json({ success: true, products: allProducts, total: allProducts.length });
  } catch (error) {
    console.error('Error fetching seller products:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get seller's product listing requests
router.get('/listing-requests', authenticateSeller, async (req, res) => {
  try {
    const seller = await Seller.findById(req.seller._id)
      .select('productListingRequests')
      .lean()
      .maxTimeMS(5000);
    
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found', requests: [] });
    }
    
    res.json({
      requests: seller.productListingRequests || []
    });
  } catch (error) {
    console.error('Get listing requests error:', error);
    res.status(500).json({ message: 'Server error', error: error.message, requests: [] });
  }
});

// GET /sellers/my-stats — seller dashboard stats (quotations, listed products, views)
router.get('/my-stats', authenticateSeller, async (req, res) => {
  try {
    const Product = (await import('../models/Product.js')).default;

    const sellerId = req.seller._id;

    // Listed products count by status
    const [totalListed, approvedListed, pendingListed] = await Promise.all([
      Product.countDocuments({ 'sellers.sellerId': sellerId }),
      Product.countDocuments({ 'sellers.sellerId': sellerId, approvalStatus: 'approved' }),
      Product.countDocuments({ 'sellers.sellerId': sellerId, approvalStatus: 'pending' }),
    ]);

    // Quotations — wrapped separately so a missing collection doesn't break the whole response
    let totalQuotations = 0, pendingQuotations = 0, recentQuotations = [];
    try {
      const Quotation = (await import('../models/Quotation.js')).default;
      [totalQuotations, pendingQuotations, recentQuotations] = await Promise.all([
        Quotation.countDocuments({ sellerId }),
        Quotation.countDocuments({ sellerId, status: 'pending' }),
        Quotation.find({ sellerId })
          .sort({ submittedAt: -1 })
          .limit(5)
          .select('productName buyerName buyerPhone quantity submittedAt status senderType')
          .lean(),
      ]);
    } catch (qErr) {
      console.warn('Quotation stats unavailable:', qErr.message);
    }

    // Listing requests count from seller doc
    const seller = await Seller.findById(sellerId).select('productListingRequests').lean();
    const listingRequestsCount = seller?.productListingRequests?.length || 0;

    res.json({
      success: true,
      listedProducts: { total: totalListed, approved: approvedListed, pending: pendingListed },
      quotations: { total: totalQuotations, pending: pendingQuotations, recent: recentQuotations },
      listingRequests: listingRequestsCount,
    });
  } catch (error) {
    console.error('Seller stats error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /sellers/my-listed-preview — top 3 active listings for dashboard widget
router.get('/my-listed-preview', authenticateSeller, async (req, res) => {
  try {
    const Product = (await import('../models/Product.js')).default;
    const products = await Product.find({
      'sellers.sellerId': req.seller._id,
      approvalStatus: 'approved',
      status: 'active',
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name price images category sellers')
      .lean();

    const result = products.map(p => {
      const entry = p.sellers.find(s => s.sellerId.toString() === req.seller._id.toString());
      return {
        _id: p._id,
        name: p.name,
        image: p.images?.[0] || '',
        category: p.category,
        sellerPrice: entry?.sellerPrice || p.price,
      };
    });

    res.json({ success: true, products: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Debug route to check seller verification statuses
router.get('/debug/statuses', authenticateAdmin, async (req, res) => {
  try {
    const sellers = await Seller.find({}).select('username email verificationStatus status');
    
    const statusCounts = {
      approved: 0,
      pending: 0,
      required: 0,
      not_required: 0,
      rejected: 0,
      undefined: 0
    };
    
    sellers.forEach(seller => {
      const status = seller.verificationStatus || 'undefined';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    
    res.json({
      message: 'Seller verification status debug info',
      totalSellers: sellers.length,
      statusCounts,
      sellers: sellers.map(s => ({
        username: s.username,
        email: s.email,
        verificationStatus: s.verificationStatus,
        status: s.status
      }))
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Debug route to check recent seller products
router.get('/debug/recent-products', authenticateSeller, async (req, res) => {
  try {
    const Product = (await import('../models/Product.js')).default;
    
    // Get recent products created by this seller
    const recentProducts = await Product.find({
      seller: req.seller._id,
      $or: [
        { status: 'active' },
        { status: { $exists: false } } // Include products without status field for backward compatibility
      ]
    })
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

    console.log('🔍 Debug - Recent seller products:', {
      sellerId: req.seller._id,
      productCount: recentProducts.length,
      products: recentProducts.map(p => ({
        id: p._id,
        name: p.name,
        hasSeller: !!p.seller,
        hasSellerInfo: !!p.sellerInfo,
        sellerInfo: p.sellerInfo,
        status: p.status,
        approvalStatus: p.approvalStatus
      }))
    });

    res.json({
      success: true,
      sellerId: req.seller._id,
      productCount: recentProducts.length,
      products: recentProducts.map(p => ({
        id: p._id,
        name: p.name,
        hasSeller: !!p.seller,
        hasSellerInfo: !!p.sellerInfo,
        sellerInfo: p.sellerInfo,
        status: p.status,
        approvalStatus: p.approvalStatus,
        createdAt: p.createdAt
      }))
    });
  } catch (error) {
    console.error('❌ Debug recent products error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Debug failed', 
      error: error.message 
    });
  }
});

// Debug route to check specific product's seller info
router.get('/debug/product-seller-info/:productId', authenticateSeller, async (req, res) => {
  try {
    const { productId } = req.params;
    const Product = (await import('../models/Product.js')).default;
    
    const product = await Product.findById(productId).lean();
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    console.log('🔍 Debug - Product seller info check:', {
      productId: product._id,
      productName: product.name,
      hasSeller: !!product.seller,
      sellerValue: product.seller,
      hasSellerInfo: !!product.sellerInfo,
      sellerInfoContent: product.sellerInfo,
      sellerInfoKeys: product.sellerInfo ? Object.keys(product.sellerInfo) : [],
      status: product.status,
      approvalStatus: product.approvalStatus,
      originalProductId: product.originalProductId,
      isAmazonsChoice: product.isAmazonsChoice
    });
    
    res.json({
      success: true,
      productId: product._id,
      productName: product.name,
      hasSeller: !!product.seller,
      sellerValue: product.seller,
      hasSellerInfo: !!product.sellerInfo,
      sellerInfo: product.sellerInfo,
      status: product.status,
      approvalStatus: product.approvalStatus
    });
  } catch (error) {
    console.error('❌ Debug product seller info error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Debug failed', 
      error: error.message 
    });
  }
});

// ============================================
// QUOTATION ROUTES
// ============================================

// Submit a quotation to a specific seller
router.post('/quotation', async (req, res) => {
  try {
    const Quotation = (await import('../models/Quotation.js')).default;
    const Product = (await import('../models/Product.js')).default;

    const {
      productId, sellerId, sellerUsername, sellerWhatsapp,
      buyerName, buyerEmail, buyerPhone,
      quantity, sellerPrice, message
    } = req.body;

    if (!productId || !buyerName) {
      return res.status(400).json({ message: 'productId and buyerName are required' });
    }

    // Rate limit only when we have enough info
    if (sellerId && buyerPhone) {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recentCount = await Quotation.countDocuments({
        productId, sellerId,
        buyerPhone,
        submittedAt: { $gte: since }
      });

      if (recentCount >= 5) {
        return res.status(429).json({
          message: 'You have already sent 5 quotations to this seller for this product in the last 24 hours.'
        });
      }
    }

    // Get product name
    const product = await Product.findById(productId).select('name').lean();

    const quotation = await Quotation.create({
      productId,
      productName: product?.name || 'Unknown Product',
      sellerId,
      sellerUsername,
      sellerWhatsapp,
      buyerName,
      buyerEmail,
      buyerPhone,
      quantity: quantity || 1,
      sellerPrice,
      message,
      ipAddress: req.ip
    });

    res.json({ success: true, message: 'Quotation sent successfully!', quotationId: quotation._id });
  } catch (error) {
    console.error('Quotation error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin: Get all quotations
router.get('/admin/quotations', authenticateAdmin, async (req, res) => {
  try {
    const Quotation = (await import('../models/Quotation.js')).default;
    const { page = 1, limit = 50, status, sellerId, senderType } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = {};
    if (status) query.status = status;
    if (sellerId) query.sellerId = sellerId;

    // senderType filter: handle old records that have no senderType field
    // A record is a "buyer" if senderType='buyer' OR (senderType missing AND buyerName is not 'Guest' and not empty)
    // A record is a "guest" if senderType='guest' OR (senderType missing AND buyerName is 'Guest' or empty)
    if (senderType === 'buyer') {
      query.$or = [
        { senderType: 'buyer' },
        { senderType: { $exists: false }, buyerName: { $nin: ['Guest', '', null] } },
        { senderType: null, buyerName: { $nin: ['Guest', '', null] } }
      ];
    } else if (senderType === 'guest') {
      query.$or = [
        { senderType: 'guest' },
        { senderType: { $exists: false }, buyerName: { $in: ['Guest', '', null] } },
        { senderType: null, buyerName: { $in: ['Guest', '', null] } }
      ];
    }

    const [quotations, total] = await Promise.all([
      Quotation.find(query).sort({ submittedAt: -1 }).skip(skip).limit(parseInt(limit)).lean(),
      Quotation.countDocuments(query)
    ]);

    // Status stats (respects senderType filter)
    const stats = await Quotation.aggregate([
      ...(Object.keys(query).length ? [{ $match: query }] : []),
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Sender type counts — treat missing senderType by buyerName
    const allDocs = await Quotation.find({}).select('senderType buyerName').lean();
    const buyerCount = allDocs.filter(d =>
      d.senderType === 'buyer' ||
      (!d.senderType && d.buyerName && d.buyerName !== 'Guest')
    ).length;
    const guestCount = allDocs.filter(d =>
      d.senderType === 'guest' ||
      (!d.senderType && (!d.buyerName || d.buyerName === 'Guest'))
    ).length;

    res.json({
      success: true,
      quotations,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      stats: stats.reduce((acc, s) => { acc[s._id] = s.count; return acc; }, {}),
      senderStats: { buyer: buyerCount, guest: guestCount }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin: Update quotation status
router.put('/admin/quotations/:id', authenticateAdmin, async (req, res) => {
  try {
    const Quotation = (await import('../models/Quotation.js')).default;
    const quotation = await Quotation.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    if (!quotation) return res.status(404).json({ message: 'Quotation not found' });
    res.json({ success: true, quotation });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;

// ============================================================
// PHONE-BASED REGISTRATION & LOGIN (SMS OTP via Twilio)
// ============================================================

// POST /sellers/register-phone  — register seller with phone + password
router.post('/register-phone', authLimiter, async (req, res) => {
  try {
    const { username, phone, password, country, city, productCategory } = req.body;

    if (!username || !phone || !password || !country || !city || !productCategory) {
      return res.status(400).json({ message: 'username, phone, password, country, city and productCategory are required' });
    }

    const cleanPhone = phone.trim();
    if (!validatePhone(cleanPhone)) {
      return res.status(400).json({ message: 'Phone must be in E.164 format, e.g. +447911123456' });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    const existingByUsername = await Seller.findOne({ username: username.trim() });
    if (existingByUsername) return res.status(400).json({ message: 'Username already taken' });

    const existingByPhone = await Seller.findOne({ phone: cleanPhone });
    if (existingByPhone) return res.status(400).json({ message: 'Phone number already registered' });

    const seller = new Seller({
      username: username.trim(),
      phone: cleanPhone,
      password,
      country: country.trim(),
      city: city.trim(),
      productCategory: productCategory.trim(),
      email: `phone_${cleanPhone.replace(/\+/g, '')}@placeholder.local`,
      whatsappNo: cleanPhone // default whatsapp to phone
    });

    const otp = crypto.randomInt(100000, 999999).toString();
    const { hash, salt } = hashStringSeller(otp);
    seller.phoneOTP = hash;
    seller.phoneOTPSalt = salt;
    seller.phoneOTPExpiry = new Date(Date.now() + 5 * 60 * 1000);
    seller.phoneOTPAttempts = 0;
    seller.phoneVerified = false;

    await seller.save();

    const smsResult = await sendSmsOTP(cleanPhone, otp);
    if (!smsResult.success && process.env.NODE_ENV === 'production') {
      await Seller.deleteOne({ _id: seller._id });
      return res.status(500).json({ message: 'Failed to send SMS OTP. Please try again.' });
    }

    res.status(201).json({
      success: true,
      message: 'OTP sent to your phone. Please verify to complete registration.',
      phone: maskPhoneSeller(cleanPhone),
      requiresVerification: true
    });
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ message: 'Phone number or username already registered' });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /sellers/verify-phone-otp  — verify OTP after phone registration
router.post('/verify-phone-otp', authLimiter, async (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) return res.status(400).json({ message: 'phone and otp are required' });

    const seller = await Seller.findOne({ phone: phone.trim() });
    if (!seller) return res.status(404).json({ message: 'Account not found' });

    const check = checkOTPRecordSeller(seller, 'phone');
    if (!check.valid) return res.status(400).json({ message: check.message });

    const valid = verifyHashSeller(otp, seller.phoneOTP, seller.phoneOTPSalt);
    if (!valid) {
      seller.phoneOTPAttempts = (seller.phoneOTPAttempts || 0) + 1;
      await seller.save();
      const remaining = 3 - seller.phoneOTPAttempts;
      return res.status(400).json({
        message: remaining > 0 ? `Invalid OTP. ${remaining} attempts remaining.` : 'Too many attempts. Request a new OTP.'
      });
    }

    seller.phoneVerified = true;
    seller.phoneOTP = undefined;
    seller.phoneOTPSalt = undefined;
    seller.phoneOTPExpiry = undefined;
    seller.phoneOTPAttempts = 0;
    await seller.save();

    const dashboardAccess = seller.canAccessDashboard();
    const token = jwt.sign(
      { id: seller._id, role: 'seller', supplierId: seller.supplierId },
      process.env.JWT_SECRET,
      { expiresIn: '12h' }
    );

    res.json({
      success: true,
      message: 'Phone verified! Registration complete.',
      token,
      seller: formatSellerResponse(seller, dashboardAccess)
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /sellers/send-phone-otp  — send OTP to seller phone for login
router.post('/send-phone-otp', authLimiter, async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ message: 'phone is required' });

    const cleanPhone = phone.trim();
    if (!validatePhone(cleanPhone)) {
      return res.status(400).json({ message: 'Invalid phone number format (use E.164, e.g. +447911123456)' });
    }

    const seller = await Seller.findOne({ phone: cleanPhone });
    if (!seller) return res.status(404).json({ message: 'No account found with this phone number' });

    const otp = crypto.randomInt(100000, 999999).toString();
    const { hash, salt } = hashStringSeller(otp);

    seller.phoneOTP = hash;
    seller.phoneOTPSalt = salt;
    seller.phoneOTPExpiry = new Date(Date.now() + 5 * 60 * 1000);
    seller.phoneOTPAttempts = 0;
    await seller.save();

    const result = await sendSmsOTP(cleanPhone, otp);

    if (process.env.NODE_ENV === 'development') {
      return res.json({ success: true, message: `OTP sent (dev: ${otp})`, phone: maskPhoneSeller(cleanPhone) });
    }

    res.json({ success: result.success, message: result.success ? 'OTP sent to your phone' : result.message, phone: maskPhoneSeller(cleanPhone) });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /sellers/login-phone  — seller login with phone + OTP
router.post('/login-phone', authLimiter, async (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) return res.status(400).json({ message: 'phone and otp are required' });

    const seller = await Seller.findOne({ phone: phone.trim() });
    if (!seller) return res.status(404).json({ message: 'No account found with this phone number' });

    if (seller.status === 'suspended' || seller.status === 'rejected') {
      return res.status(403).json({ message: 'Your account has been suspended. Please contact support.' });
    }

    const check = checkOTPRecordSeller(seller, 'phone');
    if (!check.valid) return res.status(400).json({ message: check.message });

    const valid = verifyHashSeller(otp, seller.phoneOTP, seller.phoneOTPSalt);
    if (!valid) {
      seller.phoneOTPAttempts = (seller.phoneOTPAttempts || 0) + 1;
      await seller.save();
      const remaining = 3 - seller.phoneOTPAttempts;
      return res.status(400).json({
        message: remaining > 0 ? `Invalid OTP. ${remaining} attempts remaining.` : 'Too many attempts. Request a new OTP.'
      });
    }

    seller.phoneOTP = undefined;
    seller.phoneOTPSalt = undefined;
    seller.phoneOTPExpiry = undefined;
    seller.phoneOTPAttempts = 0;
    seller.phoneVerified = true;
    await seller.save();

    const dashboardAccess = seller.canAccessDashboard();
    const token = jwt.sign(
      { id: seller._id, role: 'seller', supplierId: seller.supplierId },
      process.env.JWT_SECRET,
      { expiresIn: '12h' }
    );

    res.json({ success: true, message: 'Login successful', token, seller: formatSellerResponse(seller, dashboardAccess) });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ---- seller helpers ----
function hashStringSeller(value) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(value, salt, 10000, 64, 'sha512').toString('hex');
  return { hash, salt };
}

function verifyHashSeller(value, storedHash, storedSalt) {
  const hash = crypto.pbkdf2Sync(value, storedSalt, 10000, 64, 'sha512').toString('hex');
  return hash === storedHash;
}

function checkOTPRecordSeller(user, prefix) {
  const otp = user[`${prefix}OTP`];
  const expiry = user[`${prefix}OTPExpiry`];
  const attempts = user[`${prefix}OTPAttempts`] || 0;
  if (!otp || !expiry) return { valid: false, message: 'No OTP request found. Please request a new one.' };
  if (new Date() > expiry) return { valid: false, message: 'OTP has expired. Please request a new one.' };
  if (attempts >= 3) return { valid: false, message: 'Too many failed attempts. Please request a new OTP.' };
  return { valid: true };
}

function maskPhoneSeller(phone) {
  return phone.replace(/(\+\d{2,3})\d+(\d{4})$/, '$1****$2');
}

function formatSellerResponse(seller, dashboardAccess) {
  return {
    id: seller._id,
    _id: seller._id,
    username: seller.username,
    email: seller.email?.includes('@placeholder.local') ? '' : seller.email,
    phone: seller.phone || '',
    phoneVerified: seller.phoneVerified || false,
    whatsappNo: seller.whatsappNo,
    contactNo: seller.contactNo,
    country: seller.country,
    city: seller.city,
    productCategory: seller.productCategory,
    supplierId: seller.supplierId,
    status: seller.status,
    verificationStatus: seller.verificationStatus,
    canListProducts: seller.canListProducts,
    hasRegistrationPayment: seller.hasRegistrationPayment,
    dashboardAccessible: seller.dashboardAccessible,
    createdAt: seller.createdAt,
    dashboardAccess,
    dashboardAccessExpiry: seller.dashboardAccessExpiry,
    authProvider: seller.authProvider || 'local'
  };
}
