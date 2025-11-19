# 💳 Paymob Payment Gateway Setup Guide

## Overview
Paymob is a payment gateway that supports Visa, Mastercard, JazzCash, and EasyPaisa in Pakistan.

## Features
- ✅ Visa & Mastercard payments
- ✅ JazzCash wallet integration
- ✅ EasyPaisa wallet integration
- ✅ Secure payment processing
- ✅ Real-time payment verification
- ✅ PKR currency support

---

## Step 1: Create Paymob Account

### 1.1 Register
1. Go to: https://accept.paymob.com/portal2/en/register
2. Fill in your business details
3. Verify your email
4. Complete KYC (Know Your Customer) verification

### 1.2 Get Verified
- Submit business documents
- Wait for approval (usually 1-3 business days)
- Once approved, you can process live payments

---

## Step 2: Get API Credentials

### 2.1 Login to Dashboard
1. Go to: https://accept.paymob.com/portal2/en/login
2. Login with your credentials

### 2.2 Get API Key
1. Navigate to **Settings** → **Account Info**
2. Copy your **API Key**
3. Save it securely

### 2.3 Get Integration ID
1. Navigate to **Developers** → **Payment Integrations**
2. Create a new integration or use existing one
3. Copy the **Integration ID**
4. Note: You may need different IDs for:
   - Card payments (Visa/Mastercard)
   - JazzCash wallet
   - EasyPaisa wallet

### 2.4 Get iFrame ID (Optional)
1. Navigate to **Developers** → **iFrames**
2. Create a new iFrame or use existing one
3. Copy the **iFrame ID**

---

## Step 3: Configure Environment Variables

### 3.1 Update `.env` file
```env
# Paymob Configuration
PAYMOB_API_KEY=your_actual_api_key_here
PAYMOB_INTEGRATION_ID=your_integration_id_here
PAYMOB_IFRAME_ID=your_iframe_id_here
```

### 3.2 Example Values
```env
PAYMOB_API_KEY=ZXlKaGJHY2lPaUpJVXpVeE1pSXNJblI1Y0NJNklrcFhWQ0o5...
PAYMOB_INTEGRATION_ID=123456
PAYMOB_IFRAME_ID=789012
```

---

## Step 4: Install Dependencies

### 4.1 Install Axios (if not already installed)
```bash
cd server
npm install axios
```

### 4.2 Verify Installation
```bash
npm list axios
```

---

## Step 5: Test Payment Integration

### 5.1 Test Mode
Paymob provides test cards for testing:

**Test Visa Card:**
```
Card Number: 4987654321098769
Expiry: 12/25
CVV: 123
```

**Test Mastercard:**
```
Card Number: 5123456789012346
Expiry: 12/25
CVV: 123
```

### 5.2 Test Payment Flow
1. Start your server
2. Login as buyer
3. Try to unlock a supplier
4. Use test card details
5. Payment should process successfully

---

## Step 6: Go Live

### 6.1 Switch to Production
1. Ensure your Paymob account is verified
2. Update `.env` with production credentials
3. Test with real cards (small amounts first)
4. Monitor transactions in Paymob dashboard

### 6.2 Production Checklist
- [ ] Paymob account verified
- [ ] Business documents approved
- [ ] API credentials configured
- [ ] SSL certificate installed
- [ ] Test payments successful
- [ ] Error handling implemented
- [ ] Webhook configured (optional)

---

## Payment Flow

### Current Implementation

```
1. User enters card details
   ↓
2. Frontend sends to backend
   ↓
3. Backend validates card details
   ↓
4. Backend calls Paymob API:
   - Get auth token
   - Create order
   - Generate payment key
   - Process payment
   ↓
5. Paymob processes payment
   ↓
6. If SUCCESS:
   - Unlock supplier
   - Save payment record
   - Return success
   ↓
7. If FAILED:
   - Save failed payment
   - Return error
```

---

## API Endpoints Used

### 1. Authentication
```
POST https://accept.paymob.com/api/auth/tokens
Body: { "api_key": "YOUR_API_KEY" }
Response: { "token": "auth_token" }
```

### 2. Create Order
```
POST https://accept.paymob.com/api/ecommerce/orders
Body: {
  "auth_token": "token",
  "amount_cents": 20000,
  "currency": "PKR",
  "items": [...]
}
Response: { "id": order_id }
```

### 3. Generate Payment Key
```
POST https://accept.paymob.com/api/acceptance/payment_keys
Body: {
  "auth_token": "token",
  "order_id": order_id,
  "amount_cents": 20000,
  "billing_data": {...},
  "integration_id": integration_id
}
Response: { "token": "payment_key" }
```

### 4. Process Payment
```
POST https://accept.paymob.com/api/acceptance/payments/pay
Body: { "payment_token": "payment_key" }
Response: { "success": true/false }
```

---

## Fallback Mode

### Simulation Mode
If Paymob credentials are not configured, the system falls back to simulation mode:

```javascript
// In server/routes/buyer.js
const usePaymob = process.env.PAYMOB_API_KEY && 
                  process.env.PAYMOB_API_KEY !== 'your_paymob_api_key';

if (usePaymob) {
  // Use Paymob
} else {
  // Use simulation
  console.log('⚠️ Using payment simulation mode');
}
```

### Simulation Rules:
- Cards ending in **even numbers** → SUCCESS
- Cards ending in **odd numbers** → FAIL (80% success rate)

---

## Troubleshooting

### Issue: "Authentication failed"
**Solution:**
- Check if API key is correct
- Ensure no extra spaces in .env file
- Verify account is active

### Issue: "Integration ID not found"
**Solution:**
- Check if integration ID is correct
- Ensure integration is active in dashboard
- Create new integration if needed

### Issue: "Payment declined"
**Solution:**
- Check if card details are valid
- Ensure sufficient balance
- Try different card
- Check Paymob dashboard for details

### Issue: "Supplier already unlocked"
**Solution:**
- This is now fixed - each product has unique supplier ID
- Clear browser cache and try again
- Check payment history in buyer dashboard

---

## Security Best Practices

### 1. Environment Variables
- Never commit `.env` file to git
- Use different keys for dev/production
- Rotate keys periodically

### 2. API Security
- Always use HTTPS in production
- Validate all inputs
- Log all transactions
- Implement rate limiting

### 3. Card Data
- Never store card details
- Use Paymob tokenization
- Comply with PCI DSS standards

---

## Monitoring & Analytics

### Paymob Dashboard
1. Login to Paymob dashboard
2. View real-time transactions
3. Check success/failure rates
4. Download transaction reports
5. Monitor chargebacks

### Application Logs
```javascript
// Check server logs for:
console.log('⚠️ Using payment simulation mode');
console.error('Paymob payment error:', error);
```

---

## Webhook Integration (Optional)

### Setup Webhook
1. Go to Paymob Dashboard → Webhooks
2. Add your webhook URL: `https://yourdomain.com/api/webhook/paymob`
3. Select events to listen for
4. Save webhook

### Handle Webhook
```javascript
// server/routes/webhook.js
router.post('/paymob', async (req, res) => {
  const { obj } = req.body;
  
  if (obj.success === true) {
    // Update payment status
    // Unlock supplier if not already unlocked
  }
  
  res.status(200).send('OK');
});
```

---

## Cost & Fees

### Paymob Fees (Approximate)
- **Card Payments**: 2.5% + PKR 5 per transaction
- **JazzCash/EasyPaisa**: 1.5% + PKR 3 per transaction
- **Monthly Fee**: May vary based on volume

### Check Latest Pricing
Visit: https://accept.paymob.com/pricing

---

## Support

### Paymob Support
- **Email**: support@paymob.com
- **Phone**: Check website for local number
- **Documentation**: https://docs.paymob.com

### Our Support
- Check server logs for errors
- Review payment history in database
- Contact development team

---

## Alternative: JazzCash Direct API

If you prefer JazzCash direct integration:

### 1. Register as JazzCash Merchant
- Visit: https://sandbox.jazzcash.com.pk/
- Register for merchant account
- Get API credentials

### 2. Use JazzCash API
```javascript
// Similar integration as Paymob
// But specific to JazzCash
```

---

## Quick Start Checklist

- [ ] Create Paymob account
- [ ] Get verified
- [ ] Copy API credentials
- [ ] Update `.env` file
- [ ] Install axios
- [ ] Test with test cards
- [ ] Verify payments in dashboard
- [ ] Go live with real cards

---

## Current Status

✅ **Paymob Integration**: Implemented  
✅ **Fallback Mode**: Simulation available  
✅ **Unique Supplier IDs**: Fixed  
⏳ **Production**: Awaiting Paymob credentials  

---

**Last Updated**: November 2024  
**Version**: 1.0.0  
**Status**: Ready for Paymob Configuration
