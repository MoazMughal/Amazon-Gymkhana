// Facebook OAuth Routes
import express from 'express';
import jwt from 'jsonwebtoken';
import Buyer from '../models/Buyer.js';
import Seller from '../models/Seller.js';

const router = express.Router();

/**
 * POST /auth/facebook
 * Body: { accessToken: <FB access token>, userType: 'buyer' | 'seller' }
 *
 * Verifies the FB access token via Graph API, then logs in or creates the user.
 */
router.post('/facebook', async (req, res) => {
  try {
    const { accessToken, userType } = req.body;

    if (!accessToken) {
      return res.status(400).json({ message: 'Facebook access token is required' });
    }
    if (!userType || !['buyer', 'seller'].includes(userType)) {
      return res.status(400).json({ message: 'Valid userType (buyer or seller) is required' });
    }

    // Verify token and fetch user profile via Facebook Graph API
    const graphRes = await fetch(
      `https://graph.facebook.com/me?fields=id,name,first_name,last_name,email&access_token=${accessToken}`
    );

    if (!graphRes.ok) {
      return res.status(401).json({ message: 'Invalid Facebook token. Please try again.' });
    }

    const profile = await graphRes.json();

    if (profile.error) {
      console.error('Facebook Graph API error:', profile.error);
      return res.status(401).json({ message: 'Facebook token verification failed.' });
    }

    const { id: facebookId, first_name, last_name, name, email } = profile;

    // Facebook email can be absent if user hasn't granted email permission
    // We use facebookId as the primary key in that case
    if (userType === 'buyer') {
      return handleBuyerFacebookAuth({ facebookId, email, first_name, last_name }, res);
    } else {
      return handleSellerFacebookAuth({ facebookId, email, name }, res);
    }
  } catch (error) {
    console.error('Facebook auth error:', error);
    res.status(500).json({ message: 'Server error during Facebook authentication' });
  }
});

async function handleBuyerFacebookAuth({ facebookId, email, first_name, last_name }, res) {
  // Try to find by facebookId first, then by email (if provided)
  const query = email
    ? { $or: [{ facebookId }, { email: email.toLowerCase() }] }
    : { facebookId };

  let buyer = await Buyer.findOne(query);

  if (buyer) {
    if (!buyer.facebookId) {
      buyer.facebookId = facebookId;
      buyer.authProvider = 'facebook';
      await buyer.save();
    }
    if (buyer.status === 'suspended') {
      return res.status(403).json({ message: 'Your account has been suspended. Please contact support.' });
    }
  } else {
    // New buyer — create account
    // Email might be absent; use a placeholder if so
    const buyerEmail = email
      ? email.toLowerCase()
      : `fb_${facebookId}@facebook.placeholder`;

    buyer = new Buyer({
      firstName: first_name || name?.split(' ')[0] || 'Facebook',
      lastName: last_name || name?.split(' ').slice(1).join(' ') || 'User',
      email: buyerEmail,
      password: null,
      facebookId,
      authProvider: 'facebook',
      userType: 'buyer',
      status: 'active',
    });
    await buyer.save();
  }

  const token = jwt.sign({ id: buyer._id, role: 'buyer' }, process.env.JWT_SECRET, { expiresIn: '7d' });

  return res.json({
    message: 'Facebook login successful',
    token,
    buyer: {
      id: buyer._id,
      firstName: buyer.firstName,
      lastName: buyer.lastName,
      email: buyer.email,
      userType: buyer.userType,
      status: buyer.status,
      authProvider: 'facebook',
    },
    isNewUser: !buyer.whatsappNo,
  });
}

async function handleSellerFacebookAuth({ facebookId, email, name }, res) {
  const query = email
    ? { $or: [{ facebookId }, { email: email.toLowerCase() }] }
    : { facebookId };

  let seller = await Seller.findOne(query);

  if (seller) {
    if (!seller.facebookId) {
      seller.facebookId = facebookId;
      seller.authProvider = 'facebook';
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
      message: 'Facebook login successful',
      token,
      seller: {
        id: seller._id,
        username: seller.username,
        email: seller.email,
        status: seller.status,
        supplierId: seller.supplierId,
        dashboardAccess,
        authProvider: seller.authProvider || 'facebook',
      },
      isNewUser: false,
    });
  }

  // New seller — generate username from name or facebookId
  const baseName = name
    ? name.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase()
    : `fb${facebookId.slice(-6)}`;
  let username = baseName || `fb${facebookId.slice(-6)}`;
  let suffix = 1;
  while (await Seller.findOne({ username })) {
    username = `${baseName}${suffix++}`;
  }

  const sellerEmail = email
    ? email.toLowerCase()
    : `fb_${facebookId}@facebook.placeholder`;

  seller = new Seller({
    username,
    email: sellerEmail,
    password: null,
    facebookId,
    authProvider: 'facebook',
    whatsappNo: 'pending',
    country: 'pending',
    city: 'pending',
    productCategory: 'Other',
    status: 'active',
  });
  await seller.save();

  const token = jwt.sign({ id: seller._id, role: 'seller' }, process.env.JWT_SECRET, { expiresIn: '24h' });

  return res.json({
    message: 'Facebook login successful',
    token,
    seller: {
      id: seller._id,
      username: seller.username,
      email: seller.email,
      status: seller.status,
      supplierId: seller.supplierId,
      authProvider: 'facebook',
    },
    isNewUser: true,
  });
}

export default router;
