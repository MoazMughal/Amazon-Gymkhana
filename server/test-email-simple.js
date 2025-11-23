#!/usr/bin/env node

/**
 * Simple Email Test Script
 * Tests the email configuration and sends a test OTP
 */

import dotenv from 'dotenv';
import { sendEmailOTP, testEmailConnection } from './services/email.js';

// Load environment variables from server directory
dotenv.config({ path: './server/.env' });

console.log('🧪 Email Configuration Test\n');

// Display current configuration (without sensitive data)
console.log('📧 Current Email Configuration:');
console.log('   HOST:', process.env.EMAIL_HOST || 'NOT SET');
console.log('   PORT:', process.env.EMAIL_PORT || 'NOT SET');
console.log('   SECURE:', process.env.EMAIL_SECURE || 'NOT SET');
console.log('   USER:', process.env.EMAIL_USER || 'NOT SET');
console.log('   PASS:', process.env.EMAIL_PASS ? '***SET***' : 'NOT SET');
console.log('   FROM_NAME:', process.env.EMAIL_FROM_NAME || 'NOT SET');
console.log('');

// Test email connection
console.log('🔍 Testing email connection...');
testEmailConnection()
  .then(result => {
    if (result.success) {
      console.log('✅ Connection test passed!');
      
      // If connection works, test sending OTP
      const testEmail = process.env.EMAIL_USER; // Send to self for testing
      const testOTP = '123456';
      
      console.log(`\n📧 Sending test OTP to: ${testEmail}`);
      
      return sendEmailOTP(testEmail, testOTP, 'Test User');
    } else {
      console.log('❌ Connection test failed:', result.message);
      console.log('\n🔧 Troubleshooting steps:');
      console.log('1. Check if Gmail 2-factor authentication is enabled');
      console.log('2. Verify the app password is correct (not your regular Gmail password)');
      console.log('3. Ensure "Less secure app access" is enabled (if not using app password)');
      console.log('4. Check if your Gmail account has any security restrictions');
      return Promise.resolve({ success: false });
    }
  })
  .then(result => {
    if (result && result.success) {
      console.log('✅ Test OTP sent successfully!');
      console.log('📬 Check your email inbox for the test OTP');
    } else if (result) {
      console.log('❌ Failed to send test OTP:', result.message);
    }
    
    console.log('\n🎯 Test completed!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Test failed with error:', error.message);
    console.error('Full error:', error);
    
    console.log('\n🔧 Common solutions:');
    console.log('1. Generate a new Gmail App Password:');
    console.log('   - Go to Google Account settings');
    console.log('   - Security > 2-Step Verification > App passwords');
    console.log('   - Generate new password for "Mail"');
    console.log('   - Update EMAIL_PASS in .env file');
    console.log('');
    console.log('2. Check Gmail settings:');
    console.log('   - Ensure 2FA is enabled');
    console.log('   - Use app password instead of regular password');
    console.log('   - Check for any account restrictions');
    
    process.exit(1);
  });