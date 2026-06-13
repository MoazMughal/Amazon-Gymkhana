// SMS OTP Service using Twilio
import twilio from 'twilio';

const getTwilioClient = () => {
  const sid = process.env.TWILIO_ACCOUNT_SID || process.env.TWILIO_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) return null;
  return twilio(sid, token);
};

/**
 * Send a 6-digit OTP via SMS using Twilio
 * @param {string} phoneNumber - E.164 format, e.g. +447911123456
 * @param {string} otp
 * @param {string} appName
 */
export const sendSmsOTP = async (phoneNumber, otp, appName = 'PoundlandWholesale') => {
  // Always log in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`\n📱 SMS OTP ================================`);
    console.log(`   To:  ${phoneNumber}`);
    console.log(`   OTP: ${otp}`);
    console.log(`=========================================\n`);
    return { success: true, message: 'OTP sent (development mode)', sid: 'dev' };
  }

  const client = getTwilioClient();
  if (!client) {
    console.warn('⚠️  Twilio not configured — SMS OTP skipped');
    return { success: false, message: 'SMS service not configured' };
  }

  const from = process.env.TWILIO_PHONE_NUMBER;
  if (!from) {
    return { success: false, message: 'TWILIO_PHONE_NUMBER not set' };
  }

  try {
    const msg = await client.messages.create({
      from,
      to: phoneNumber,
      body: `Your ${appName} verification code is: ${otp}. Valid for 5 minutes. Do not share this code.`
    });
    console.log(`📱 SMS sent via Twilio: ${msg.sid}`);
    return { success: true, message: 'OTP sent via SMS', sid: msg.sid };
  } catch (err) {
    console.error('Twilio SMS error:', err.message);
    return { success: false, message: err.message };
  }
};

/**
 * Validate an E.164 phone number
 */
export const validatePhone = (phone) => /^\+[1-9]\d{7,14}$/.test(phone);
