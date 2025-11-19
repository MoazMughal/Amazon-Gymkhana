# 🚀 Paymob Payment Integration - Complete Setup Guide

## 📋 Overview
This guide will help you integrate Paymob to accept payments via:
- 💳 **Credit/Debit Cards** (Visa, Mastercard)
- 📱 **JazzCash** wallet
- 💰 **Easypaisa** wallet
- 🏦 **Bank transfers**

Money will be deposited directly into your Paymob merchant account, which you can then transfer to your bank.

---

## 🎯 Step 1: Create Paymob Account (15 minutes)

### 1.1 Register on Paymob
1. Go to: **https://accept.paymob.com/portal2/en/register**
2. Fill in your business information:
   - Business Name: `Amazon Gymkhana` (or your business name)
   - Email: Your business email
   - Phone: Your business phone number
   - Country: **Pakistan**
3. Click **"Sign Up"**
4. Check your email and verify your account

### 1.2 Complete Your Profile
1. Login to: **https://accept.paymob.com/portal2/en/login**
2. Complete your business profile:
   - Business Type
   - Business Address
   - Tax ID (if applicable)
   - Bank Account Details (for settlements)

---

## 📄 Step 2: Submit KYC Documents (1-3 business days)

### 2.1 Required Documents
Upload these documents in the Paymob dashboard:

**For Individual:**
- ✅ CNIC (front and back)
- ✅ Bank statement (last 3 months)
- ✅ Utility bill (for address proof)

**For Company:**
- ✅ Company registration certificate
- ✅ Tax registration certificate
- ✅ Director's CNIC
- ✅ Bank account statement
- ✅ Memorandum of Association

### 2.2 Wait for Approval
- Paymob will review your documents
- Usually takes **1-3 business days**
- You'll receive an email when approved
- You can use **test mode** while waiting

---

## 🔑 Step 3: Get Your API Credentials (5 minutes)

### 3.1 Get API Key
1. Login to Paymob dashboard
2. Go to: **Settings** → **Account Info**
3. Find your **API Key** (looks like: `ZXlKaGJHY2lPaUpJVXpVeE1pSXNJblI1Y0NJNklrcFhWQ0o5...`)
4. **Copy it** - you'll need this!

### 3.2 Get Integration IDs
1. Go to: **Developers** → **Payment Integrations**
2. You'll see different integrations for different payment methods:
   - **Card Integration** (for Visa/Mastercard)
   - **JazzCash Integration** (for JazzCash wallet)
   - **Easypaisa Integration** (for Easypaisa wallet)
3. **Copy each Integration ID** (looks like: `123456`)

### 3.3 Get iFrame ID (Optional)
1. Go to: **Developers** → **iFrames**
2. Create a new iFrame or use existing
3. **Copy the iFrame ID** (looks like: `789012`)

---

## ⚙️ Step 4: Configure Your Application (2 minutes)

### 4.1 Update server/.env File
Open `server/.env` and add these lines:

```env
# Paymob Payment Gateway Configuration
PAYMOB_API_KEY=paste_your_api_key_here
PAYMOB_INTEGRATION_ID=paste_your_integration_id_here
PAYMOB_IFRAME_ID=paste_your_iframe_id_here

# Optional: Separate integration IDs for different payment methods
PAYMOB_CARD_INTEGRATION_ID=your_card_integration_id
PAYMOB_JAZZCASH_INTEGRATION_ID=your_jazzcash_integration_id
PAYMOB_EASYPAISA_INTEGRATION_ID=your_easypaisa_integration_id
```

### 4.2 Example Configuration
```env
PAYMOB_API_KEY=ZXlKaGJHY2lPaUpJVXpVeE1pSXNJblI1Y0NJNklrcFhWQ0o5LmV5SndjbTltYVd4bFgzQnJJam94TnpZMU1Td2lZMnhoYzNNaU9pSk5aWEpqYUdGdWRDSjkuVGhpc0lzQVNhbXBsZUtleQ
PAYMOB_INTEGRATION_ID=123456
PAYMOB_IFRAME_ID=789012
```

### 4.3 Save and Restart Server
```bash
# Stop your server (Ctrl+C)
# Then restart it
cd server
npm start
```

---

## 🧪 Step 5: Test Payment Integration (10 minutes)

### 5.1 Use Test Cards (While in Test Mode)

**Test Visa Card (Always Succeeds):**
```
Card Number: 4987 6543 2109 8769
Expiry Date: 12/25
CVV: 123
Cardholder Name: Test User
```

**Test Mastercard (Always Succeeds):**
```
Card Number: 5123 4567 8901 2346
Expiry Date: 12/25
CVV: 123
Cardholder Name: Test User
```

**Test Card (Always Fails):**
```
Card Number: 4000 0000 0000 0002
Expiry Date: 12/25
CVV: 123
```

### 5.2 Test the Payment Flow
1. Start your backend: `cd server && npm start`
2. Start your frontend: `cd .. && npm run dev`
3. Open: `http://localhost:3000`
4. Login as a buyer
5. Try to unlock a supplier contact
6. Use the test card details above
7. Payment should process successfully!

### 5.3 Verify in Paymob Dashboard
1. Login to Paymob dashboard
2. Go to: **Transactions**
3. You should see your test transaction
4. Status should be **"Success"** or **"Pending"**

---

## 🎉 Step 6: Go Live with Real Payments

### 6.1 Switch to Production Mode
Once your account is approved:

1. In Paymob dashboard, switch from **Test Mode** to **Live Mode**
2. Get your **production API credentials** (they're different from test)
3. Update your `server/.env` with production credentials
4. Restart your server

### 6.2 Test with Real Money (Small Amount First!)
1. Use a real card with small amount (e.g., PKR 10)
2. Complete the payment
3. Verify it appears in Paymob dashboard
4. Check if money is in your Paymob balance

### 6.3 Production Checklist
- ✅ Paymob account fully verified
- ✅ Production API credentials configured
- ✅ SSL certificate installed (HTTPS)
- ✅ Test payment successful
- ✅ Money received in Paymob account
- ✅ Webhook configured (optional but recommended)

---

## 💰 Step 7: Receive Money in Your Bank Account

### 7.1 Configure Bank Account
1. In Paymob dashboard, go to: **Settings** → **Bank Accounts**
2. Add your bank account details:
   - Bank Name
   - Account Number
   - IBAN
   - Account Title
3. Verify your bank account (Paymob will send a small test deposit)

### 7.2 Settlement Schedule
- Paymob transfers money to your bank account automatically
- Default schedule: **Every 3-7 business days**
- You can request manual withdrawal anytime
- Minimum withdrawal amount: Usually PKR 1,000

### 7.3 Check Your Balance
1. Go to: **Dashboard** → **Balance**
2. See your available balance
3. Click **"Request Withdrawal"** to transfer to bank

---

## 🔧 Payment Methods Configuration

### Method 1: Credit/Debit Cards (Visa, Mastercard)
Already configured! Uses `PAYMOB_INTEGRATION_ID`

### Method 2: JazzCash Wallet
1. In Paymob dashboard, enable JazzCash integration
2. Get JazzCash Integration ID
3. Add to `.env`: `PAYMOB_JAZZCASH_INTEGRATION_ID=your_id`

### Method 3: Easypaisa Wallet
1. In Paymob dashboard, enable Easypaisa integration
2. Get Easypaisa Integration ID
3. Add to `.env`: `PAYMOB_EASYPAISA_INTEGRATION_ID=your_id`

### Method 4: Bank Transfer
1. Enable bank transfer in Paymob dashboard
2. Customers will see bank details to transfer money
3. Payment confirmed after bank transfer received

---

## 📊 Monitor Your Payments

### In Paymob Dashboard
1. **Transactions**: See all payments
2. **Analytics**: View success rates, revenue
3. **Settlements**: Track money transfers to bank
4. **Disputes**: Handle chargebacks/refunds

### In Your Application
1. Check `server/logs` for payment logs
2. View payment history in buyer dashboard
3. Monitor failed payments and retry

---

## 🚨 Troubleshooting

### Issue: "Authentication failed"
**Solution:**
```bash
# Check your .env file
# Make sure API key has no extra spaces
# Verify you're using the correct key (test vs production)
```

### Issue: "Integration ID not found"
**Solution:**
- Go to Paymob dashboard → Developers → Payment Integrations
- Make sure integration is **Active**
- Copy the correct Integration ID
- Update `.env` file

### Issue: "Payment declined"
**Solution:**
- Check if card has sufficient balance
- Verify card details are correct
- Try a different card
- Check Paymob dashboard for decline reason

### Issue: "Still using simulation mode"
**Solution:**
```bash
# Make sure .env has correct values
# Restart your server after updating .env
cd server
npm start
```

---

## 💡 Important Notes

### Security
- ✅ Never commit `.env` file to git
- ✅ Use HTTPS in production
- ✅ Never store card details in your database
- ✅ Rotate API keys periodically

### Fees
- **Card Payments**: ~2.5% + PKR 5 per transaction
- **Mobile Wallets**: ~1.5% + PKR 3 per transaction
- **Check latest fees**: https://accept.paymob.com/pricing

### Support
- **Paymob Support**: support@paymob.com
- **Phone**: +20 2 25284243 (Egypt HQ)
- **Pakistan Support**: Check dashboard for local number
- **Documentation**: https://docs.paymob.com

---

## ✅ Quick Start Checklist

Use this checklist to track your progress:

- [ ] Created Paymob account
- [ ] Verified email
- [ ] Submitted KYC documents
- [ ] Account approved by Paymob
- [ ] Got API Key
- [ ] Got Integration ID(s)
- [ ] Updated `server/.env` file
- [ ] Restarted server
- [ ] Tested with test cards
- [ ] Verified transaction in Paymob dashboard
- [ ] Added bank account details
- [ ] Switched to production mode
- [ ] Tested with real payment (small amount)
- [ ] Received money in Paymob balance
- [ ] Withdrew money to bank account

---

## 🎯 Current Status

**Your Application:**
- ✅ Paymob integration code: **Ready**
- ✅ Payment simulation: **Working**
- ⏳ Paymob credentials: **Needs configuration**
- ⏳ Production mode: **Waiting for setup**

**Next Steps:**
1. Create Paymob account (if not done)
2. Get API credentials
3. Update `server/.env` file
4. Test with test cards
5. Go live!

---

## 📞 Need Help?

If you get stuck at any step:
1. Check Paymob documentation: https://docs.paymob.com
2. Contact Paymob support: support@paymob.com
3. Check server logs for errors
4. Review this guide again

---

**Good luck with your payment integration! 🚀**

*Last Updated: November 2024*
