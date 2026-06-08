// Google OAuth Routes
import express from 'express';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import Buyer from '../models/Buyer.js';
import Seller from '../models/Seller.js';

const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * POST /auth/google
 * Body: { credential: <Google ID token OR access_token>, userType: 'buyer' | 'seller', flow?: 'access_token' }
 */
router.post('/google', async (req, res) => {
  try {
    const { credential, userType, flow } = req.body;

    if (!credential) {
      return res.status(400).json({ message: 'Google credential is required' });
    }

    if (!userType || !['buyer', 'seller'].includes(userType)) {
      return res.status(400).json({ message: 'Valid userType (buyer or seller) is required' });
    }

    let googleProfile;

    if (flow === 'access_token') {
      // Fetch user info using the access token
      const userInfoRes = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo`, {
        headers: { Authorization: `Bearer ${credential}` },
      });
      if (!userInfoRes.ok) {
        return res.status(401).json({ message: 'Failed to verify Google access token' });
      }
      googleProfile = await userInfoRes.json();
    } else {
      // Verify Google ID token
      try {
        const ticket = await client.verifyIdToken({
          idToken: credential,
          audience: process.env.GOOGLE_CLIENT_ID,
        });
        googleProfile = ticket.getPayload();
      } catch (err) {
        console.error('Google token verification failed:', err.message);
        return res.status(401).json({ message: 'Invalid Google token. Please try again.' });
      }
    }

    const { sub: googleId, email, given_name, family_name, name } = googleProfile;

    if (!email) {
      return res.status(400).json({ message: 'Google account must have an email address' });
    }

    if (userType === 'buyer') {
      return handleBuyerGoogleAuth({ googleId, email, given_name, family_name }, res);
    } else {
      return handleSellerGoogleAuth({ googleId, email, name }, res);
    }
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ message: 'Server error during Google authentication' });
  }
});

async function handleBuyerGoogleAuth({ googleId, email, given_name, family_name }, res) {
  // Check if buyer exists by googleId or email
  let buyer = await Buyer.findOne({ $or: [{ googleId }, { email: email.toLowerCase() }] });

  if (buyer) {
    // Existing buyer — link Google if not already linked
    if (!buyer.googleId) {
      buyer.googleId = googleId;
      buyer.authProvider = 'google';
      await buyer.save();
    }

    if (buyer.status === 'suspended') {
      return res.status(403).json({ message: 'Your account has been suspended. Please contact support.' });
    }
  } else {
    // New buyer — create account
    buyer = new Buyer({
      firstName: given_name || email.split('@')[0],
      lastName: family_name || '',
      email: email.toLowerCase(),
      password: null,
      googleId,
      authProvider: 'google',
      userType: 'buyer',
      status: 'active',
    });
    await buyer.save();
  }

  const token = jwt.sign({ id: buyer._id, role: 'buyer' }, process.env.JWT_SECRET, { expiresIn: '7d' });

  return res.json({
    message: 'Google login successful',
    token,
    buyer: {
      id: buyer._id,
      firstName: buyer.firstName,
      lastName: buyer.lastName,
      email: buyer.email,
      userType: buyer.userType,
      status: buyer.status,
    },
    isNewUser: !buyer.whatsappNo,
  });
}

async function handleSellerGoogleAuth({ googleId, email, name }, res) {
  // Check if seller exists by googleId or email
  let seller = await Seller.findOne({ $or: [{ googleId }, { email: email.toLowerCase() }] });

  if (seller) {
    // Existing seller — link Google if not already linked
    if (!seller.googleId) {
      seller.googleId = googleId;
      seller.authProvider = 'google';
      await seller.save();
    }

    if (seller.status === 'suspended' || seller.status === 'rejected') {
      return res.status(403).json({
        message: 'Your account has been suspended or rejected. Please contact support.',
        status: seller.status,
      });
    }

    const dashboardAccess = seller.canAccessDashboard();
    const token = jwt.sign({ id: seller._id, role: 'seller' }, process.env.JWT_SECRET, { expiresIn: '24h' });

    return res.json({
      message: 'Google login successful',
      token,
      seller: {
        id: seller._id,
        username: seller.username,
        email: seller.email,
        status: seller.status,
        supplierId: seller.supplierId,
        dashboardAccess,
        authProvider: seller.authProvider || 'google',
      },
      isNewUser: false,
    });
  }

  // New seller via Google — create a skeleton account
  // Generate a username from email
  const baseUsername = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
  let username = baseUsername;
  let suffix = 1;
  while (await Seller.findOne({ username })) {
    username = `${baseUsername}${suffix++}`;
  }

  seller = new Seller({
    username,
    email: email.toLowerCase(),
    password: null,
    googleId,
    authProvider: 'google',
    // Required fields — will be completed in profile setup
    whatsappNo: 'pending',
    country: 'pending',
    city: 'pending',
    productCategory: 'Other',
    status: 'active',
  });
  await seller.save();

  const token = jwt.sign({ id: seller._id, role: 'seller' }, process.env.JWT_SECRET, { expiresIn: '24h' });

  return res.json({
    message: 'Google login successful',
    token,
    seller: {
      id: seller._id,
      username: seller.username,
      email: seller.email,
      status: seller.status,
      supplierId: seller.supplierId,
      authProvider: 'google',
    },
    isNewUser: true, // Frontend should prompt for whatsapp/country/city/category
  });
}

export default router;
