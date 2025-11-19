import express from 'express';
import jwt from 'jsonwebtoken';
import Seller from '../models/Seller.js';
import { authenticateAdmin, authenticateSeller } from '../middleware/auth.js';

const router = express.Router();

// Seller Registration
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, whatsappNo, country, city, productCategory } = req.body;

    // Check if seller already exists
    const existingSeller = await Seller.findOne({
      $or: [{ email }, { username }]
    });

    if (existingSeller) {
      return res.status(400).json({ 
        message: 'Seller already exists with this email or username' 
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

    // Support login with username, email, or WhatsApp number
    const seller = await Seller.findOne({
      $or: [
        { username }, 
        { email: username },
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
      { expiresIn: '24h' }
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
        productListingRequests: seller.productListingRequests || []
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/', authenticateAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    
    console.log('Sellers API called with status:', status); // Debug log
    
    const query = {};
    
    // Filter based on verification status logic
    if (status && status !== 'all') {
      if (status === 'approved') {
        // Only sellers with completed verification (ID card approved)
        query.verificationStatus = 'approved';
        console.log('Filtering for approved sellers:', query); // Debug log
      } else if (status === 'pending') {
        // Sellers who registered and can login but haven't completed verification
        query.verificationStatus = { $in: ['required', 'not_required'] };
        console.log('Filtering for pending sellers:', query); // Debug log
      } else if (status === 'rejected') {
        // Sellers who were rejected by admin
        query.$or = [
          { verificationStatus: 'rejected' },
          { status: 'rejected' }
        ];
        console.log('Filtering for rejected sellers:', query); // Debug log
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
    
    console.log(`Found ${sellers.length} sellers for status: ${status}`); // Debug log

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
        status: 'approved',
        approvedBy: req.admin._id,
        approvedAt: new Date()
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

    // Delete the seller
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
    console.log('Fetching profile for seller ID:', req.seller._id); // Debug log
    const seller = await Seller.findById(req.seller._id).select('-password');
    
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }
    
    console.log('Seller profile found:', seller.username); // Debug log
    res.json(seller);
  } catch (error) {
    console.error('Profile fetch error:', error); // Debug log
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update seller profile
router.put('/profile', authenticateSeller, async (req, res) => {
  try {
    const { whatsappNo, contactNo, country, city, productCategory } = req.body;
    console.log('Updating profile for seller:', req.seller._id, 'with data:', { whatsappNo, contactNo, country, city, productCategory }); // Debug
    
    const seller = await Seller.findByIdAndUpdate(
      req.seller._id,
      { whatsappNo, contactNo, country, city, productCategory },
      { new: true }
    ).select('-password');

    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    console.log('Profile updated successfully for:', seller.username); // Debug
    res.json({ message: 'Profile updated successfully', seller });
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
    const seller = await Seller.findById(req.seller._id).select('paymentHistory');
    res.json(seller.paymentHistory);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Submit verification documents
router.post('/verification/submit', authenticateSeller, async (req, res) => {
  try {
    const { cnicNumber, idCardFront, idCardBack, idCardWithFace } = req.body;

    if (!cnicNumber || !idCardFront || !idCardBack || !idCardWithFace) {
      return res.status(400).json({ 
        message: 'CNIC number and all three documents are required: CNIC front, CNIC back, and CNIC with selfie' 
      });
    }

    console.log('Verification submission for seller:', req.seller._id, 'CNIC:', cnicNumber); // Debug

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

    res.json({ 
      message: 'Verification documents submitted successfully. Please wait for admin approval.',
      seller 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Check dashboard access
router.get('/dashboard-access', authenticateSeller, async (req, res) => {
  try {
    console.log('Checking dashboard access for seller ID:', req.seller._id); // Debug log
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
        dashboardAccessible: true
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
      { verificationStatus: 'approved' },
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

    // Generate 6-digit OTP (use default for development)
    const otp = process.env.NODE_ENV === 'development' ? '123456' : Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save OTP to seller record
    seller.passwordResetOTP = otp;
    seller.passwordResetOTPExpiry = otpExpiry;
    await seller.save();

    // Send OTP via WhatsApp (in development, just log it)
    if (process.env.NODE_ENV === 'development') {
      console.log('\n🔧 DEVELOPMENT MODE - PASSWORD RESET OTP');
      console.log('=====================================');
      console.log(`📱 Phone: ${seller.whatsappNo}`);
      console.log(`🔑 OTP: ${otp}`);
      console.log(`👤 User: ${seller.username}`);
      console.log(`⏰ Expires: ${otpExpiry.toLocaleString()}`);
      console.log('=====================================\n');
    } else {
      // In production, send actual WhatsApp message
      console.log(`📱 Sending OTP to ${seller.whatsappNo}: ${otp}`);
    }

    res.json({
      success: true,
      message: 'OTP sent to your WhatsApp number',
      whatsappNo: seller.whatsappNo.replace(/(\+\d{2})(\d{3})\d{4}(\d{4})/, '$1$2****$3'), // Masked number
      // Return OTP in development mode only
      otp: process.env.NODE_ENV === 'development' ? otp : undefined
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

    // Check OTP (allow development default)
    const isValidOTP = seller.passwordResetOTP === otp || 
                      (process.env.NODE_ENV === 'development' && otp === '123456');
    
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

// Get seller's product listing requests
router.get('/listing-requests', authenticateSeller, async (req, res) => {
  try {
    const seller = await Seller.findById(req.seller._id).select('productListingRequests');
    res.json({
      requests: seller.productListingRequests || []
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
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

export default router;