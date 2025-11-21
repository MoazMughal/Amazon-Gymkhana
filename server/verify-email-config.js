import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

// Load environment variables
dotenv.config();

console.log('🔍 Email Configuration Verification\n');
console.log('=' .repeat(50));

// Check environment variables
const checks = {
  'EMAIL_HOST': process.env.EMAIL_HOST,
  'EMAIL_PORT': process.env.EMAIL_PORT,
  'EMAIL_USER': process.env.EMAIL_USER,
  'EMAIL_PASS': process.env.EMAIL_PASS ? '***configured***' : undefined,
  'EMAIL_FROM_NAME': process.env.EMAIL_FROM_NAME,
  'EMAIL_SECURE': process.env.EMAIL_SECURE
};

console.log('\n📋 Environment Variables:');
let allConfigured = true;
for (const [key, value] of Object.entries(checks)) {
  const status = value ? '✅' : '❌';
  console.log(`  ${status} ${key}: ${value || 'NOT SET'}`);
  if (!value && key !== 'EMAIL_FROM_NAME' && key !== 'EMAIL_SECURE') {
    allConfigured = false;
  }
}

if (!allConfigured) {
  console.log('\n❌ Some required environment variables are missing!');
  console.log('Please check your server/.env file.');
  process.exit(1);
}

console.log('\n✅ All required environment variables are configured!');

// Test SMTP connection
console.log('\n🔌 Testing SMTP Connection...');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

transporter.verify()
  .then(() => {
    console.log('✅ SMTP connection successful!');
    console.log('✅ Email service is ready to send emails.');
    console.log('\n📧 Configuration Summary:');
    console.log(`  Server: ${process.env.EMAIL_HOST}:${process.env.EMAIL_PORT}`);
    console.log(`  From: ${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_USER}>`);
    console.log(`  Secure: ${process.env.EMAIL_SECURE === 'true' ? 'Yes (SSL)' : 'No (TLS/STARTTLS)'}`);
    console.log('\n💡 Tips:');
    console.log('  - If emails go to spam, ask recipients to check spam folder');
    console.log('  - Add sender to contacts to improve deliverability');
    console.log('  - Gmail has a limit of 500 emails per day');
    console.log('\n🧪 To send a test email, run:');
    console.log('  node test-email.js your-email@example.com');
    process.exit(0);
  })
  .catch((error) => {
    console.log('❌ SMTP connection failed!');
    console.log('\nError Details:');
    console.log('  Code:', error.code);
    console.log('  Message:', error.message);
    
    console.log('\n🔧 Troubleshooting:');
    
    if (error.code === 'EAUTH') {
      console.log('  ❌ Authentication failed!');
      console.log('  Solutions:');
      console.log('    1. Verify your Gmail app password is correct');
      console.log('    2. Generate a new app password at:');
      console.log('       https://myaccount.google.com/apppasswords');
      console.log('    3. Make sure 2-Step Verification is enabled');
      console.log('    4. Update EMAIL_PASS in server/.env');
    } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED') {
      console.log('  ❌ Connection timeout!');
      console.log('  Solutions:');
      console.log('    1. Check your internet connection');
      console.log('    2. Verify port 587 is not blocked by firewall');
      console.log('    3. Try disabling VPN if using one');
      console.log('    4. Check if antivirus is blocking SMTP');
    } else if (error.code === 'ESOCKET') {
      console.log('  ❌ Socket error!');
      console.log('  Solutions:');
      console.log('    1. Check EMAIL_HOST is correct (smtp.gmail.com)');
      console.log('    2. Verify EMAIL_PORT is correct (587 for TLS)');
      console.log('    3. Try EMAIL_PORT=465 with EMAIL_SECURE=true');
    } else {
      console.log('  ❌ Unknown error!');
      console.log('  Solutions:');
      console.log('    1. Check all environment variables');
      console.log('    2. Review EMAIL_TROUBLESHOOTING.md');
      console.log('    3. Try regenerating Gmail app password');
    }
    
    console.log('\n📚 For more help, see: EMAIL_TROUBLESHOOTING.md');
    process.exit(1);
  });
