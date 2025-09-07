# Email Setup Guide for Password Reset

## Overview
The forgot password feature requires email configuration to send password reset links to users. This guide explains how to set up email functionality.

## Email Service Options

### Option 1: Gmail (Recommended for Development)
1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate an App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a password for "Mail"
3. **Set Environment Variables**:
   ```bash
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-16-character-app-password
   ```

### Option 2: Outlook/Hotmail
1. **Enable 2-Factor Authentication**
2. **Generate App Password**:
   - Go to Microsoft Account security settings
   - Advanced security options → App passwords
3. **Set Environment Variables**:
   ```bash
   EMAIL_USER=your-email@outlook.com
   EMAIL_PASSWORD=your-app-password
   ```

### Option 3: Custom SMTP Server
```bash
EMAIL_USER=your-email@yourdomain.com
EMAIL_PASSWORD=your-password
SMTP_HOST=mail.yourdomain.com
SMTP_PORT=587
```

## Environment Variables Setup

Create a `.env` file in the `backend` directory with the following variables:

```bash
# Database Configuration
DB_USER=postgres
DB_HOST=localhost
DB_NAME=capstone2
DB_PASSWORD=098611059
DB_PORT=5432

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Email Configuration
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587

# Frontend URL (for password reset links)
FRONTEND_URL=http://localhost:3000
```

## Testing Email Functionality

### 1. Update Default Admin Account
First, update the default admin account to include an email:

```sql
UPDATE users SET email = 'admin@yourdomain.com' WHERE username = 'admin';
```

### 2. Test Password Reset Flow
1. Go to the login page
2. Click "Reset Password"
3. Enter the admin email address
4. Check your email for the reset link
5. Click the link and set a new password

## Production Considerations

### Security
- Use environment variables for all sensitive data
- Use a dedicated email service (SendGrid, Mailgun, etc.) for production
- Implement rate limiting for password reset requests
- Consider adding CAPTCHA to prevent abuse

### Email Templates
- Customize email templates in `backend/src/services/emailService.js`
- Add your company branding
- Include contact information for support

### Monitoring
- Log email sending attempts
- Monitor failed email deliveries
- Set up alerts for email service issues

## Troubleshooting

### Common Issues

1. **"Invalid login" error**:
   - Check your email credentials
   - Ensure 2FA is enabled and app password is used
   - Verify SMTP settings

2. **Emails not received**:
   - Check spam folder
   - Verify email address is correct
   - Check email service logs

3. **Reset link not working**:
   - Ensure FRONTEND_URL is set correctly
   - Check if the token has expired (1 hour limit)
   - Verify the frontend is running on the correct port

### Testing Without Email
For development/testing without email setup, you can:
1. Check the server logs for the reset token
2. Manually construct the reset URL
3. Use a test email service like Mailtrap

## Alternative: Console Logging (Development Only)
If you want to test without email setup, you can modify the email service to log the reset link to the console instead of sending emails. This is useful for development but should never be used in production.

```javascript
// In emailService.js, replace the email sending with:
console.log('Password reset link:', resetUrl);
return { success: true, messageId: 'console-log' };
```
