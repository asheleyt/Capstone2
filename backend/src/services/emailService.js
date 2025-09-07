const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Email configuration - you can use any email service
// For development, you can use Gmail, Outlook, or any SMTP service
const createTransporter = () => {
  return nodemailer.createTransporter({
    // Gmail example (you'll need to use an App Password)
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER || 'your-email@gmail.com',
      pass: process.env.EMAIL_PASSWORD || 'your-app-password'
    }
    
    // Alternative: Custom SMTP
    // host: process.env.SMTP_HOST || 'smtp.gmail.com',
    // port: process.env.SMTP_PORT || 587,
    // secure: false,
    // auth: {
    //   user: process.env.EMAIL_USER,
    //   pass: process.env.EMAIL_PASSWORD
    // }
  });
};

// Generate a secure random token
const generateResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Send password reset email (LAN-friendly version)
const sendPasswordResetEmail = async (email, resetToken, username) => {
  try {
    // Create reset URL (adjust the frontend URL as needed)
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    
    // For LAN setup: Log to console instead of sending email
    console.log('\n' + '='.repeat(80));
    console.log('🔑 PASSWORD RESET REQUEST - KRAEZEUS GRILL AND RESTAURANT');
    console.log('='.repeat(80));
    console.log(`👤 User: ${username}`);
    console.log(`📧 Email: ${email}`);
    console.log(`🔗 Reset Link: ${resetUrl}`);
    console.log(`⏰ Expires: ${new Date(Date.now() + 3600000).toLocaleString()}`);
    console.log(`📅 Requested: ${new Date().toLocaleString()}`);
    console.log('='.repeat(80));
    console.log('📋 Instructions:');
    console.log('1. Copy the reset link above');
    console.log('2. Open it in a browser');
    console.log('3. Set a new password');
    console.log('4. Link expires in 1 hour');
    console.log('='.repeat(80) + '\n');
    
    // If email is configured, try to send email as well
    if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
      try {
        const transporter = createTransporter();
        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: email,
          subject: 'Password Reset Request - Kraezeus Grill and Restaurant',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Password Reset Request</h2>
              <p>Hello ${username},</p>
              <p>You have requested to reset your password for your Kraezeus Grill and Restaurant account.</p>
              <p>Click the button below to reset your password:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" 
                   style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                  Reset Password
                </a>
              </div>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #666;">${resetUrl}</p>
              <p><strong>This link will expire in 1 hour.</strong></p>
              <p>If you did not request this password reset, please ignore this email.</p>
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
              <p style="color: #666; font-size: 12px;">
                Kraezeus Grill and Restaurant<br>
                This is an automated message, please do not reply.
              </p>
            </div>
          `
        };
        
        const result = await transporter.sendMail(mailOptions);
        console.log('✅ Password reset email also sent:', result.messageId);
      } catch (emailError) {
        console.log('⚠️  Email sending failed, but reset link is available in console above');
      }
    }
    
    return { success: true, messageId: 'console-log' };
  } catch (error) {
    console.error('Error in password reset process:', error);
    return { success: false, error: error.message };
  }
};

// Send password reset confirmation email (LAN-friendly version)
const sendPasswordResetConfirmation = async (email, username) => {
  try {
    // Log confirmation to console
    console.log('\n' + '='.repeat(60));
    console.log('✅ PASSWORD RESET CONFIRMATION');
    console.log('='.repeat(60));
    console.log(`👤 User: ${username}`);
    console.log(`📧 Email: ${email}`);
    console.log(`📅 Reset completed: ${new Date().toLocaleString()}`);
    console.log('✅ Password has been successfully reset');
    console.log('='.repeat(60) + '\n');
    
    // If email is configured, try to send confirmation email as well
    if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
      try {
        const transporter = createTransporter();
        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: email,
          subject: 'Password Successfully Reset - Kraezeus Grill and Restaurant',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #28a745;">Password Successfully Reset</h2>
              <p>Hello ${username},</p>
              <p>Your password has been successfully reset for your Kraezeus Grill and Restaurant account.</p>
              <p>If you did not make this change, please contact your administrator immediately.</p>
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
              <p style="color: #666; font-size: 12px;">
                Kraezeus Grill and Restaurant<br>
                This is an automated message, please do not reply.
              </p>
            </div>
          `
        };
        
        const result = await transporter.sendMail(mailOptions);
        console.log('✅ Password reset confirmation email also sent:', result.messageId);
      } catch (emailError) {
        console.log('⚠️  Confirmation email sending failed, but reset is logged above');
      }
    }
    
    return { success: true, messageId: 'console-log' };
  } catch (error) {
    console.error('Error in password reset confirmation:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  generateResetToken,
  sendPasswordResetEmail,
  sendPasswordResetConfirmation
};
