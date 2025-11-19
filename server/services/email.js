// Email Service using Nodemailer
import nodemailer from 'nodemailer';
import crypto from 'crypto';

// Create transporter for Gmail SMTP
const createTransporter = () => {
  return nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER, // Your Gmail address
      pass: process.env.GMAIL_APP_PASSWORD // Gmail App Password (not regular password)
    }
  });
};

// Send OTP via Email
const sendEmailOTP = async (email, otp, userName = 'User') => {
  try {
    if (process.env.NODE_ENV === 'development') {
      console.log(`📧 Email OTP for ${email}: ${otp}`);
      console.log(`Subject: Amazon Choice - Password Reset OTP`);
      console.log(`Message: Hi ${userName}, your verification code is: ${otp}. Valid for 5 minutes.`);
      return { success: true, message: 'OTP sent (development mode)' };
    }

    // Production email sending
    const transporter = createTransporter();
    
    const mailOptions = {
      from: {
        name: 'Amazon Choice',
        address: process.env.GMAIL_USER
      },
      to: email,
      subject: 'Amazon Choice - Password Reset OTP',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #ff9900; margin: 0;">Amazon Choice</h1>
              <p style="color: #666; margin: 5px 0;">Password Reset Request</p>
            </div>
            
            <div style="text-align: center; margin-bottom: 30px;">
              <h2 style="color: #333; margin-bottom: 10px;">Hi ${userName}!</h2>
              <p style="color: #666; margin-bottom: 20px;">You requested to reset your password. Use the OTP below:</p>
              
              <div style="background-color: #f0f8ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <div style="font-size: 32px; font-weight: bold; color: #ff9900; letter-spacing: 5px;">${otp}</div>
              </div>
              
              <p style="color: #666; font-size: 14px;">This OTP is valid for 5 minutes only.</p>
            </div>
            
            <div style="border-top: 1px solid #eee; padding-top: 20px; text-align: center;">
              <p style="color: #999; font-size: 12px; margin: 0;">
                If you didn't request this, please ignore this email.<br>
                This is an automated message, please don't reply.
              </p>
            </div>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    return { success: true, message: 'OTP sent to your email' };

  } catch (error) {
    console.error('Email OTP Error:', error);
    return { success: false, message: 'Failed to send email OTP' };
  }
};

// Verify email configuration
const verifyEmailConfig = async () => {
  try {
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      return { success: false, message: 'Email configuration missing' };
    }

    const transporter = createTransporter();
    await transporter.verify();
    return { success: true, message: 'Email configuration verified' };
  } catch (error) {
    console.error('Email config verification failed:', error);
    return { success: false, message: 'Email configuration invalid' };
  }
};

export { sendEmailOTP, verifyEmailConfig };