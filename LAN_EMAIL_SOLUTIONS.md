# Email Solutions for LAN-Only Restaurant System

## 🌐 **The Challenge**
In a LAN-only setup, your restaurant system doesn't have direct internet access, making traditional email services (Gmail, Outlook) unavailable. However, there are several solutions to implement password reset functionality.

## 🔧 **Solution Options**

### 1. **Hybrid Approach (Recommended)**
**How it works:**
- Restaurant system runs on LAN (secure, no internet)
- Email service runs on a separate internet-connected machine
- Communication between systems via internal network

**Implementation:**
```javascript
// Backend can call a local email service
const emailService = 'http://192.168.1.100:3001/send-email';
```

**Pros:**
- ✅ Restaurant system stays secure on LAN
- ✅ Email functionality works
- ✅ No internet dependency for core operations

**Cons:**
- ❌ Requires additional machine for email service
- ❌ More complex setup

### 2. **Local SMTP Server**
**Set up your own email server within the LAN:**

**Using hMailServer (Windows):**
1. Install hMailServer on a Windows machine in your LAN
2. Configure local domain (e.g., `restaurant.local`)
3. Create email accounts for users
4. Configure your backend to use local SMTP

**Configuration:**
```bash
SMTP_HOST=192.168.1.100  # IP of your email server
SMTP_PORT=25
EMAIL_USER=admin@restaurant.local
EMAIL_PASSWORD=your-password
```

**Pros:**
- ✅ Complete control over email system
- ✅ No internet dependency
- ✅ Fast internal email delivery

**Cons:**
- ❌ Complex setup and maintenance
- ❌ Requires email server administration knowledge

### 3. **Alternative: Console-Based Reset (Development)**
**For testing/development without email setup:**

Modify the email service to log reset links to console instead of sending emails:

```javascript
// In emailService.js - Development mode
const sendPasswordResetEmail = async (email, resetToken, username) => {
  const resetUrl = `http://localhost:3000/reset-password?token=${resetToken}`;
  
  // Log to console instead of sending email
  console.log('='.repeat(60));
  console.log('PASSWORD RESET REQUEST');
  console.log('='.repeat(60));
  console.log(`User: ${username}`);
  console.log(`Email: ${email}`);
  console.log(`Reset Link: ${resetUrl}`);
  console.log(`Expires: ${new Date(Date.now() + 3600000).toLocaleString()}`);
  console.log('='.repeat(60));
  
  return { success: true, messageId: 'console-log' };
};
```

### 4. **QR Code Alternative**
**Generate QR codes for password reset:**

```javascript
// Generate QR code with reset link
const qr = require('qrcode');
const resetUrl = `http://192.168.1.50:3000/reset-password?token=${resetToken}`;
const qrCodeDataURL = await qr.toDataURL(resetUrl);

// Display QR code on screen for admin to scan
```

### 5. **Admin-Only Reset**
**Simplified approach for LAN environments:**

```javascript
// Admin can reset passwords directly from the system
// No email required - admin handles all password resets
const adminResetPassword = async (userId, newPassword) => {
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await updateUserPassword(userId, hashedPassword);
  return { success: true, message: 'Password reset by admin' };
};
```

## 🏗️ **Recommended LAN Architecture**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Restaurant    │    │   Email Service │    │   Internet      │
│   System        │◄──►│   (Optional)    │◄──►│   (Optional)    │
│   (LAN Only)    │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                        │
        │                        │
        ▼                        ▼
┌─────────────────┐    ┌─────────────────┐
│   Database      │    │   Local SMTP    │
│   (PostgreSQL)  │    │   Server        │
└─────────────────┘    └─────────────────┘
```

## 🚀 **Quick Implementation for LAN**

### Option A: Console Logging (Immediate)
```javascript
// Replace email sending with console logging
const sendPasswordResetEmail = async (email, resetToken, username) => {
  const resetUrl = `http://192.168.1.50:3000/reset-password?token=${resetToken}`;
  console.log(`\n🔑 PASSWORD RESET FOR ${username.toUpperCase()}`);
  console.log(`📧 Email: ${email}`);
  console.log(`🔗 Reset Link: ${resetUrl}`);
  console.log(`⏰ Expires: ${new Date(Date.now() + 3600000).toLocaleString()}\n`);
  return { success: true };
};
```

### Option B: File-Based Reset Links
```javascript
// Save reset links to a file that admin can access
const fs = require('fs');
const sendPasswordResetEmail = async (email, resetToken, username) => {
  const resetUrl = `http://192.168.1.50:3000/reset-password?token=${resetToken}`;
  const resetInfo = {
    username,
    email,
    resetUrl,
    expires: new Date(Date.now() + 3600000).toISOString(),
    timestamp: new Date().toISOString()
  };
  
  // Append to reset-links.txt file
  fs.appendFileSync('reset-links.txt', JSON.stringify(resetInfo) + '\n');
  return { success: true };
};
```

## 📋 **Implementation Steps**

### For Console Logging (Quickest):
1. Modify `backend/src/services/emailService.js`
2. Replace email sending with console.log
3. Check server console for reset links
4. Copy links manually to test

### For Local SMTP:
1. Install hMailServer or similar
2. Configure local domain
3. Update environment variables
4. Test email delivery

### For Admin-Only Reset:
1. Add admin password reset functionality
2. Remove email dependency
3. Admin handles all password resets

## 🎯 **Recommendation for Your Setup**

Given that this is a restaurant system, I recommend:

1. **Start with Console Logging** for immediate testing
2. **Implement Admin-Only Reset** as primary method
3. **Add Local SMTP** if email is really needed

This approach gives you:
- ✅ Immediate functionality
- ✅ No internet dependency
- ✅ Simple maintenance
- ✅ Secure LAN operation

Would you like me to implement any of these solutions?
