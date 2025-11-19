// Unified Authentication Routes
import express from 'express';
import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';
import Buyer from '../models/Buyer.js';
import Seller from '../models/Seller.js';
import { 
  generateOTP, 
  sendOTP, 
  createOTPRecord, 
  validateOTPRecord, 
  verifyOTP, 
  maskContact,
  identifyContactMethod 
} from '../services/otp.js';

const router = express.Router();

// POST /auth/login - Admin login with username/email and password
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ 
        message: 'Username/email and password are required' 
      });
    }

    // Find admin by username or email
    const admin = await Admin.findOne({
      $or: [
        { username: username.toLowerCase().trim() },
        { email: username.toLowerCase().trim() }
      ]
    });

    if (!admin) {
      return res.status(401).json({ 
        message: 'Invalid credentials' 
      });
    }

    // Verify password
    const isPasswordValid = await admin.comparePassword(password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ 
        message: 'Invalid credentials' 
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: admin._id, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return admin data without password
    const adminData = {
      id: admin._id,
      username: admin.username,
      email: admin.email,
      role: admin.role
    };

    console.log(`✅ Admin login successful: ${admin.username}`);

    res.json({
      message: 'Login successful',
      token,
      admin: adminData
    });

  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ 
      message: 'Server error. Please try again later.' 
    });
  }
});

// POST /auth/send-otp - Send OTP via email or WhatsApp
router.post('/send-otp', async (req, res) => {
  try {
    const { identifier, userType } = req.body;

    if (!identifier || !identifier.trim()) {
      return res.status(400).json({ 
        success: false,
        message: 'Email or WhatsApp number is required' 
      });
    }

    if (!userType || !['buyer', 'seller'].includes(userType)) {
      return res.status(400).json({ 
        success: false,
        message: 'Valid user type (buyer/seller) is required' 
      });
    }

    const cleanIdentifier = identifier.trim().toLowerCase();
    const contactMethod = identifyContactMethod(cleanIdentifier);
    
    if (contactMethod === 'unknown') {
      return res.status(400).json({ 
        success: false,
        message: 'Please enter a valid email address or WhatsApp number (with country code)' 
      });
    }

    // Find user based on type
    let user;
    if (userType === 'buyer') {
      user = await Buyer.findOne({
        $or: [
          { email: cleanIdentifier },
          { whatsappNo: cleanIdentifier }
        ]
      });
    } else {
      user = await Seller.findOne({
        $or: [
          { username: cleanIdentifier },
          { email: cleanIdentifier },
          { whatsappNo: cleanIdentifier }
        ]
      });
    }

    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: `No ${userType} account found with this ${contactMethod === 'email' ? 'email' : 'WhatsApp number'}` 
      });
    }

    // Determine contact method for sending OTP
    let contactInfo;
    if (contactMethod === 'email') {
      contactInfo = user.email;
    } else if (contactMethod === 'whatsapp') {
      contactInfo = user.whatsappNo;
    } else {
      // If identifier is username, use email or WhatsApp from user record
      contactInfo = user.email || user.whatsappNo;
    }

    if (!contactInfo) {
      return res.status(400).json({ 
        success: false,
        message: `No ${contactMethod === 'email' ? 'email' : 'WhatsApp number'} associated with this account. Please contact support.` 
      });
    }

    // Generate OTP and create record
    const otp = generateOTP();
    const otpRecord = createOTPRecord(otp);

    // Save OTP to user record
    user.passwordResetOTP = otpRecord.otpHash;
    user.passwordResetOTPSalt = otpRecord.otpSalt;
    user.passwordResetOTPExpiry = otpRecord.otpExpiry;
    user.passwordResetOTPAttempts = 0;
    await user.save();

    // Send OTP
    const userName = userType === 'buyer' ? user.getFullName() : user.username;
    const sendResult = await sendOTP(contactInfo, otp, userName);

    if (!sendResult.success) {
      return res.status(500).json({ 
        success: false,
        message: sendResult.message 
      });
    }

    // Log for development
    if (process.env.NODE_ENV === 'development') {
      console.log('\n🔧 DEVELOPMENT MODE - PASSWORD RESET OTP');
      console.log('=====================================');
      console.log(`👤 User: ${userName} (${userType})`);
      console.log(`📧 Contact: ${contactInfo}`);
      console.log(`🔑 OTP: ${otp}`);
      console.log(`⏰ Expires: ${otpRecord.otpExpiry.toLocaleString()}`);
      console.log('=====================================\n');
    }

    res.json({
      success: true,
      message: `OTP sent to your ${contactMethod === 'email' ? 'email' : 'WhatsApp'}`,
      contactInfo: maskContact(contactInfo),
      method: contactMethod,
      expiresIn: '5 minutes',
      // Return OTP in development mode only
      ...(process.env.NODE_ENV === 'development' && { developmentOTP: otp })
    });

  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error. Please try again later.' 
    });
  }
});

// POST /auth/verify-otp - Verify OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { identifier, otp, userType } = req.body;

    if (!identifier || !otp || !userType) {
      return res.status(400).json({ 
        success: false,
        message: 'Identifier, OTP, and user type are required' 
      });
    }

    if (!['buyer', 'seller'].includes(userType)) {
      return res.status(400).json({ 
        success: false,
        message: 'Valid user type (buyer/seller) is required' 
      });
    }

    const cleanIdentifier = identifier.trim().toLowerCase();

    // Find user
    let user;
    if (userType === 'buyer') {
      user = await Buyer.findOne({
        $or: [
          { email: cleanIdentifier },
          { whatsappNo: cleanIdentifier }
        ]
      });
    } else {
      user = await Seller.findOne({
        $or: [
          { username: cleanIdentifier },
          { email: cleanIdentifier },
          { whatsappNo: cleanIdentifier }
        ]
      });
    }

    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    // Validate OTP record
    const validation = validateOTPRecord({
      otpHash: user.passwordResetOTP,
      otpSalt: user.passwordResetOTPSalt,
      otpExpiry: user.passwordResetOTPExpiry,
      otpAttempts: user.passwordResetOTPAttempts || 0,
      maxAttempts: 3
    });

    if (!validation.valid) {
      return res.status(400).json({ 
        success: false,
        message: validation.message 
      });
    }

    // Verify OTP
    const isValidOTP = verifyOTP(otp, user.passwordResetOTP, user.passwordResetOTPSalt);

    if (!isValidOTP) {
      // Increment failed attempts
      user.passwordResetOTPAttempts = (user.passwordResetOTPAttempts || 0) + 1;
      await user.save();

      const remainingAttempts = 3 - user.passwordResetOTPAttempts;
      
      return res.status(400).json({ 
        success: false,
        message: remainingAttempts > 0 
          ? `Invalid OTP. ${remainingAttempts} attempts remaining.`
          : 'Too many failed attempts. Please request a new OTP.'
      });
    }

    // OTP verified successfully
    res.json({
      success: true,
      message: 'OTP verified successfully',
      canResetPassword: true
    });

  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error. Please try again later.' 
    });
  }
});

// POST /auth/reset-password - Reset password after OTP verification
router.post('/reset-password', async (req, res) => {
  try {
    const { identifier, otp, newPassword, userType } = req.body;

    if (!identifier || !otp || !newPassword || !userType) {
      return res.status(400).json({ 
        success: false,
        message: 'All fields are required' 
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ 
        success: false,
        message: 'Password must be at least 8 characters long' 
      });
    }

    if (!['buyer', 'seller'].includes(userType)) {
      return res.status(400).json({ 
        success: false,
        message: 'Valid user type (buyer/seller) is required' 
      });
    }

    const cleanIdentifier = identifier.trim().toLowerCase();

    // Find user
    let user;
    if (userType === 'buyer') {
      user = await Buyer.findOne({
        $or: [
          { email: cleanIdentifier },
          { whatsappNo: cleanIdentifier }
        ]
      });
    } else {
      user = await Seller.findOne({
        $or: [
          { username: cleanIdentifier },
          { email: cleanIdentifier },
          { whatsappNo: cleanIdentifier }
        ]
      });
    }

    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    // Validate OTP record
    const validation = validateOTPRecord({
      otpHash: user.passwordResetOTP,
      otpSalt: user.passwordResetOTPSalt,
      otpExpiry: user.passwordResetOTPExpiry,
      otpAttempts: user.passwordResetOTPAttempts || 0,
      maxAttempts: 3
    });

    if (!validation.valid) {
      return res.status(400).json({ 
        success: false,
        message: validation.message 
      });
    }

    // Verify OTP one final time
    const isValidOTP = verifyOTP(otp, user.passwordResetOTP, user.passwordResetOTPSalt);

    if (!isValidOTP) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid OTP. Please verify OTP first.' 
      });
    }

    // Update password and clear OTP data
    user.password = newPassword; // Will be hashed by pre-save middleware
    user.passwordResetOTP = undefined;
    user.passwordResetOTPSalt = undefined;
    user.passwordResetOTPExpiry = undefined;
    user.passwordResetOTPAttempts = undefined;
    await user.save();

    console.log(`✅ Password reset successful for ${userType}: ${user.email || user.username}`);

    res.json({
      success: true,
      message: 'Password reset successfully. You can now login with your new password.'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error. Please try again later.' 
    });
  }
});

export default router;