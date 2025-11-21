import dotenv from 'dotenv';
import { sendEmailOTP, sendPasswordResetEmail } from './services/email.js';

// Load environment variables
dotenv.config();

console.log('🧪 Testing Email Service\n');
console.log('Environment Variables:');
console.log('  EMAIL_HOST:', process.env.EMAIL_HOST);
console.log('  EMAIL_PORT:', process.env.EMAIL_PORT);
console.log('  EMAIL_USER:', process.env.EMAIL_USER);
console.log('  EMAIL_PASS:', process.env.EMAIL_PASS ? '***configured***' : 'NOT SET');
console.log('  EMAIL_FROM_NAME:', process.env.EMAIL_FROM_NAME);
console.log('\n');

// Test email address (change this to test with different emails)
const testEmail = process.argv[2] || 'leadmoderator123@gmail.com';
const testOTP = '123456';
const testUserName = 'Test User';

console.log(`📧 Sending test OTP email to: ${testEmail}\n`);

// Test OTP email
sendEmailOTP(testEmail, testOTP, testUserName)
  .then(result => {
    console.log('\n✅ Test completed!');
    console.log('Result:', result);
    
    if (result.success) {
      console.log('\n✅ Email sent successfully!');
      console.log('📬 Check your inbox (and spam folder) for the email.');
    } else {
      console.log('\n❌ Email failed to send.');
      console.log('Error:', result.message);
    }
    
    process.exit(result.success ? 0 : 1);
  })
  .catch(error => {
    console.error('\n❌ Test failed with error:', error);
    process.exit(1);
  });
